import { getArbitronStatus } from "./setup";
import { deflexRouterClient } from "../deflex/client";
import { ENV } from "../constants";
import axios from "axios";
import { AssetHolding, FavourableTrade, TradeOutput } from "../interfaces";
import { DeflexQuote } from "@deflex/deflex-sdk-js";
import algosdk from "algosdk";
import { algodClient } from "../algorand/config";
import { get } from "http";
import { sendAuditTransaction } from "../algorand/txns";

export async function startTradingRun() {
    try {
        //update Prices and get

        //get arbitron status
        const arbitronStatus = await getArbitronStatus();
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
                    const startingValue = await getWalletValue(priceMap, assetInfo);

                    //confirm assets with greater than $100
                    const MBR = arbitronStatus.assetBalances.length * 100000 + 1000000;
                    const tradableAssets = arbitronStatus.assetBalances.filter((asset) => {
                        const assetPrice = priceMap[asset.assetId].max || 0;
                        const decimals = assetInfo[asset.assetId]?.params.decimals || 6;
                        let assetAmount = asset.amount;
                        const currentValue = assetAmount * assetPrice / 10 ** decimals;
                        return currentValue > ENV.TRADABLE_ASSET_MINIMUM_VALUE;
                    });
                    if (((arbitronStatus.algoBalance * priceMap[0].max) - MBR) / 10 ** 6 > ENV.TRADABLE_ASSET_MINIMUM_VALUE) {
                        tradableAssets.push({
                            assetId: 0,
                            amount: arbitronStatus.algoBalance
                        });

                    }
                    arbitronStatus.assetBalances.push({
                        assetId: 0,
                        amount: arbitronStatus.algoBalance
                    });
                    //check each tradable asset agains tthe other for a favourable trade and execute if profitable
                    const tradingResult = await getQuotesForTradableAssets(tradableAssets, priceMap, assetInfo, arbitronStatus.assetBalances);
                    if (tradingResult.tradeComplete) {
                        const endingValue = await getWalletValue(priceMap, assetInfo);
                        const profit = endingValue - startingValue;
                        console.log('Profit: ', profit);
                        sendAuditTransaction(tradingResult.trade);
                    } else {
                        console.log('No profitable trades found');
                    }
                }
            }


        }
    } catch (error) {
        console.error('Failed to start trading run', error);
    }
}


async function getQuotesForTradableAssets(tradableAssets: AssetHolding[], priceMap: any, assetInfo: any, allAssets: AssetHolding[]): Promise<TradeOutput> {
    let tradeCompleted = false;
    try {
        const assetPairs = tradableAssets.flatMap(assetIn =>
            allAssets
                .filter(assetOut => assetIn.assetId !== assetOut.assetId)
                .map(assetOut => ({ assetIn, assetOut }))
        );
        for (const { assetIn, assetOut } of assetPairs) {
            const tradeValue = Math.floor((ENV.TRADE_VALUE / priceMap[assetIn.assetId].max) * 10 ** (assetInfo[assetIn.assetId]?.params.decimals || 6));
            const quote = await deflexRouterClient.getFixedInputSwapQuote(assetIn.assetId, assetOut.assetId, tradeValue);
            console.log(`Got quote for ${assetIn.assetId} -> ${assetOut.assetId}`);
            if (quote) {
                const profitableResult = await isQuoteProfitable(quote, priceMap, assetInfo);
                if (profitableResult?.profitable) {
                    const success = await executeTrade(profitableResult, priceMap, assetInfo);
                    tradeCompleted = true;
                    return {
                        trade: profitableResult,
                        tradeComplete: success
                    };
                }
            }
        }
    } catch (error) {
        console.error('Failed to check favourable trades', error);

    }
    return {
        trade: {} as FavourableTrade,
        tradeComplete: false
    };
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

            if (USDValue > ENV.TRADE_VALUE && USDValue - ENV.TRADE_VALUE > ENV.MINIMUM_PROFIT) {
                favourableTrades.push({
                    assetIn,
                    assetOut,
                    profit: USDValue - ENV.TRADE_VALUE,
                    quote,
                    totalFeeUSD: feeAmount,
                    profitable: true,
                });

            }
        }
        return favourableTrades;
    } catch (error) {
        console.error('Failed to find profitable trades', error);
        return [];
    }
}

async function isQuoteProfitable(quote: DeflexQuote, priceMap: any, assetInfo: any): Promise<FavourableTrade | null> {
    try {
        const assetIn = Number(quote.fromASAID);
        const assetOut = Number(quote.toASAID);
        const assetOutPrice = priceMap[assetOut].max || 0;
        const assetOutDecimals = assetInfo[assetOut]?.params.decimals || 6;
        const totalFees = Object.values(quote.protocolFees).map((fee) => Number(fee)).reduce((a, b) => a + b, 0);
        let feeAmount = totalFees * assetOutPrice / 10 ** assetOutDecimals;
        feeAmount += 0.048 * priceMap[0].max;
        const USDValue = ((Number(quote.quote) * assetOutPrice) / 10 ** assetOutDecimals) - feeAmount;
        if (USDValue > ENV.TRADE_VALUE && USDValue - ENV.TRADE_VALUE > ENV.MINIMUM_PROFIT) {
            return {
                assetIn,
                assetOut,
                profit: USDValue - ENV.TRADE_VALUE,
                quote,
                totalFeeUSD: feeAmount,
                profitable: true,
            };
        }
    } catch (error) {
        console.error('Failed to check if quote is profitable', error);
        return null;
    }
    return null;
}

export async function executeTrade(trade: FavourableTrade, priceMap: any, assetInfo: any,): Promise<boolean> {
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
        return true;

    } catch (error) {
        console.error('Failed to execute trade', error);
        return false;
    }
}

export async function getWalletValue(priceMap: any, assetInfo: any): Promise<number> {
    try {
        const walletInfo = await getArbitronStatus();
        let totalValue = 0;
        for (const asset of walletInfo.assetBalances) {
            const price = priceMap[asset.assetId].max || 0;
            const decimals = assetInfo[asset.assetId].params.decimals || 6;
            totalValue += asset.amount * price / 10 ** decimals;
        }
        totalValue += walletInfo.algoBalance * priceMap[0].max / 10 ** 6;
        console.log('Total wallet value: ', totalValue);
        return totalValue;


    } catch (error) {
        console.error('Failed to get wallet value', error);
        return 0;
    }
}