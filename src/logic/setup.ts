import { getWalletInfo } from "../algorand/wallet";
import { ArbitronStatus, AssetHolding } from "../interfaces";
import { ENV } from '../constants';

let totalProfit = 0;

export async function getArbitronStatus(): Promise<ArbitronStatus> {
    try {
        //get wallet info
        const walletInfo = await getWalletInfo(ENV.WALLET_ADDRESS);
        if (walletInfo && walletInfo.assets) {
            //get asset balances
            const assetBalances: AssetHolding[] = walletInfo.assets.map((asset) => {
                return {
                    assetId: Number(asset.assetId),
                    amount: Number(asset.amount),
                }
            });
            return {
                algoBalance: Number(walletInfo.amount),
                assetBalances: assetBalances,
                lastRunTimestamp: 0,
                profit: totalProfit,
                mode: ''
            }
        }

    }
    //calculate profit
    catch (error) {
        console.error('Failed to get arbitron status', error);
    }
    return {
        algoBalance: 0,
        assetBalances: [],
        lastRunTimestamp: 0,
        profit: totalProfit,
        mode: ''
    }
}

export const updateProfit = (profit: number) => {    
    totalProfit += profit;
    console.log('Total profit: ', totalProfit.toLocaleString("en-US", { style: "currency", currency: "USD" }));
}