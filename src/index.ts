import 'dotenv/config';
require('dotenv').config( )

import express, { Router } from "express";
import bodyParser from "body-parser";
import { getArbitronStatus } from "./logic/setup";
import { startTradingRun } from './logic/trading';

let PORT = 8080;
const app = express();
const router = express.Router();

/* getQuotes().then(async quotes => {
    //get asset prices
    const priceRequest = await axios.get(`https://api-general.compx.io/api/prices/`);
    const finalisedQuotes = [];
    for (const quote of quotes) {
        const assetToPrice = priceRequest.data[quote.toASAID].max;
        const assetFromPrice = priceRequest.data[quote.fromASAID].max;

        finalisedQuotes.push({
            deflexQuote: quote,
            USD: (quote.quote * assetToPrice) / 10 ** 6,
            profit: quote.profitAmount,
        });
    }
    //get highest finalised quote in USD
    finalisedQuotes.sort((a, b) => b.USD - a.USD);
    console.log('finalisedQuotes: ', finalisedQuotes);
    const flatfee = 0.0283;
    for (var finalisedQuote of finalisedQuotes) {
        if ((finalisedQuote.USD - flatfee) > 100) {
            console.log('expected profit: ', finalisedQuote.USD - 100);


            const txnSigner = algosdk.makeBasicAccountTransactionSigner({
                addr: HOT_WALLET.addr,
                sk: algosdk.mnemonicToSecretKey(HOT_WALLET.sk).sk
            });
            const txnGroup = await deflexRouterClient.getSwapQuoteTransactions(
                HOT_WALLET.addr,
                finalisedQuote.deflexQuote,
                5,
            );
            const signedTxns = txnGroup.txns.map((txn) => {
                if (txn.logicSigBlob !== false) {
                    return txn.logicSigBlob;
                } else {
                    const decoded = algosdk.decodeUnsignedTransaction(
                        Uint8Array.from(atob(txn.data.toString()), (c) =>
                            c.charCodeAt(0)
                        )
                    );
                    return algosdk.signTransaction(decoded, algosdk.mnemonicToSecretKey(HOT_WALLET.sk).sk).blob;
                }
            });
            const algodClient = new Algodv2(
                '',
                'https://mainnet-api.algonode.cloud',
                ''
            );

            const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
        }
    };
});


function createSignedTransactions(txnGroup) {
    const signedTxns = txnGroup.txns.map((txn) => {
        if (txn.logicSigBlob !== false) {
            return txn.logicSigBlob;
        } else {
            const decoded = algosdk.decodeUnsignedTransaction(
                Uint8Array.from(atob(txn.data), (c) =>
                    c.charCodeAt(0)
                )
            );
            return algosdk.signTransaction(decoded, HOT_WALLET.sk).blob;
        }
    });

    return signedTxns;
} */


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

router.route("/status").get(async (req, res) => {
    res.send(await getArbitronStatus());
});
router.route("/trade").get(async (req, res) => {
    res.send(await startTradingRun());
});



app.use("/api", router);
app.listen(PORT);