import { getArbitronStatus } from "./setup";
import { deflexRouterClient } from "../deflex/client";
import { ENV } from "../constants";
import axios from "axios";
import { AssetHolding, FavourableTrade } from "../interfaces";
import { DeflexQuote } from "@deflex/deflex-sdk-js";
import algosdk from "algosdk";
import { algodClient } from "../algorand/config";
import { get } from "http";

export async function startTradingRun() {
    try {
        //get arbitron status
        const arbitronStatus = await getArbitronStatus();
        const startingValue = await getWalletValue();
        if (arbitronStatus) {
            //get prices
            const priceMapResponse = await axios.get(`${ENV.COMPX_BACKEND_API_URL}/prices`);
            if (!priceMapResponse.data) {
                throw new Error('Failed to fetch prices');
            } else {
                const priceMap = priceMapResponse.data;
                const assetInfoResponse = await axios.post(`${ENV.COMPX_BACKEND_API_URL}/assets`, {
                    assetIds: arbitronStatus.assetBalances.map((asset) => asset.assetId)
                });
                if (!assetInfoResponse.data) {
                    throw new Error('Failed to fetch asset info');
                } else {
                    const assetInfo = assetInfoResponse.data;
                    //confirm assets with greater than $100
                    const tradableAssets = arbitronStatus.assetBalances.filter((asset) => {
                        const assetPrice = priceMap[asset.assetId].max || 0;
                        const decimals = assetInfo[asset.assetId].params.decimals || 6;
                        let assetAmount = asset.amount;
                        if (asset.assetId === 0) {
                            //deduct MBR from the amount
                            const MBR = arbitronStatus.assetBalances.length * 100000 + 1000000;
                            assetAmount -= MBR;
                        }
                        const currentValue = assetAmount * assetPrice / 10 ** decimals;
                        return currentValue > ENV.TRADABLE_ASSET_MINIMUM_VALUE;
                    });
                    //check each tradable asset agains tthe other for a favourable trade
                    const quotes = await getQuotesForTradableAssets(tradableAssets, priceMap, assetInfo, arbitronStatus.assetBalances);
                    const favourableTrades = await findProfitableTrades(quotes, priceMap, assetInfo, arbitronStatus.assetBalances);
                    if (favourableTrades.length > 0) {
                        const bestTrade = favourableTrades.reduce((prev, current) => {
                            return (prev.profit > current.profit) ? prev : current;
                        });
                        console.log('Best trade', bestTrade);
                        await executeTrade(bestTrade);
                        const newWalletValue = await getWalletValue();
                        console.log('Profit: ', newWalletValue - startingValue);
                    } else {
                        console.log('No favourable trades found');
                    }
                }
            }


        }
    } catch (error) {
        console.error('Failed to start trading run', error);
    }
}


async function getQuotesForTradableAssets(tradableAssets: AssetHolding[], priceMap: any, assetInfo: any, allAssets: AssetHolding[]): Promise<DeflexQuote[]> {
    try {
        const favourableTrades: FavourableTrade[] = [];
        const quotePromises = [];
        const quotes = [];
        const assetPairs = tradableAssets.flatMap(assetIn =>
            allAssets
                .filter(assetOut => assetIn.assetId !== assetOut.assetId)
                .map(assetOut => ({ assetIn, assetOut }))
        );


        for (const { assetIn, assetOut } of assetPairs) {
            const tradeValue = Math.floor((ENV.TRADE_VALUE / priceMap[assetIn.assetId].max) * 10 ** (assetInfo[assetIn.assetId].params.decimals || 6));
            const quote = await deflexRouterClient.getFixedInputSwapQuote(assetIn.assetId, assetOut.assetId, tradeValue);
            console.log(`Got quote for ${assetIn.assetId} -> ${assetOut.assetId}`);
            quotes.push(quote);
        }

        return quotes;
    } catch (error) {
        console.error('Failed to check favourable trades', error);
        return [];
    }
}

async function findProfitableTrades(quotes: DeflexQuote[], priceMap: any, assetInfo: any, allAssets: AssetHolding[]): Promise<FavourableTrade[]> {
    try {
        const favourableTrades: FavourableTrade[] = [];
        for (const quote of quotes) {

            const assetIn = Number(quote.fromASAID);
            const assetOut = Number(quote.toASAID);
            const assetOutPrice = priceMap[assetOut].max || 0;
            const assetOutDecimals = assetInfo[assetOut].params.decimals || 6;
            const totalFees = Object.values(quote.protocolFees).map((fee) => Number(fee)).reduce((a, b) => a + b, 0);
            const feeAmount = totalFees * assetOutPrice / 10 ** assetOutDecimals;
            const USDValue = ((Number(quote.quote) * assetOutPrice) / 10 ** assetOutDecimals) - feeAmount;

            if (USDValue > ENV.TRADE_VALUE) {
                favourableTrades.push({
                    assetIn,
                    assetOut,
                    profit: USDValue - ENV.TRADE_VALUE,
                    quote,
                    totalFeeUSD: feeAmount,
                });

            }
        }
        return favourableTrades;
    } catch (error) {
        console.error('Failed to find profitable trades', error);
        return [];
    }
}

export async function executeTrade(trade: FavourableTrade) {
    try {
        console.log(`Excetuing trade ${trade.assetIn} -> ${trade.assetOut}`);
        const txnGroup = await deflexRouterClient.getSwapQuoteTransactions(
            ENV.WALLET_ADDRESS,
            trade.quote,
            5,
        );
        const signedTxns = txnGroup.txns.map((txn) => {
            if (txn.logicSigBlob !== false) {
                return txn.logicSigBlob as Uint8Array;
            } else {
                const decoded = algosdk.decodeUnsignedTransaction(
                    Uint8Array.from(atob(txn.data as string), (c) =>
                        c.charCodeAt(0)
                    )
                );
                return algosdk.signTransaction(decoded, algosdk.mnemonicToSecretKey(ENV.WALLET_SK).sk).blob;
            }
        });

        const { txid } = await algodClient.sendRawTransaction(signedTxns).do();

        console.log('Trade executed', txid);
    } catch (error) {
        console.error('Failed to execute trade', error);
    }

}

export async function getWalletValue(): Promise<number> {
    try {
        const priceMapResponse = await axios.get(`${ENV.COMPX_BACKEND_API_URL}/prices`);
        if (!priceMapResponse.data) {
            throw new Error('Failed to fetch prices');
        } else {
            const walletInfo = await getArbitronStatus();
            let totalValue = 0;
            for (const asset of walletInfo.assetBalances) {
                const price = priceMapResponse.data[asset.assetId].max || 0;
                const decimals = priceMapResponse.data[asset.assetId].decimals || 6;
                totalValue += asset.amount * price / 10 ** decimals;
            }
            console.log('Total wallet value: ', totalValue);
            return totalValue;
        }
        return 0;

    } catch (error) {
        console.error('Failed to get wallet value', error);
        return 0;
    }
}