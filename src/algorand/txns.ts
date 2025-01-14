import algosdk from "algosdk";
import { FavourableTrade } from "../interfaces";
import { algodClient } from "./config";
import { ENV } from "../constants";



export async function sendAuditTransaction(trade: FavourableTrade) {
    try {
        console.log(`Sending audit transaction for trade ${trade.assetIn} -> ${trade.assetOut}`);
        const sp = await algodClient.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: ENV.WALLET_ADDRESS,
            receiver: ENV.WALLET_ADDRESS,
            amount: 0,
            note: new Uint8Array(Buffer.from(`Trade ${trade.assetIn} -> ${trade.assetOut}, profit: ${trade.profit}`)),
            suggestedParams: sp
        });
        const signedTxn = txn.signTxn(algosdk.mnemonicToSecretKey(ENV.WALLET_SK).sk);
        const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    } catch (error) {
        console.error('Failed to send audit transaction', error);
    }
}
