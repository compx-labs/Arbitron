import { Algodv2 } from "algosdk";


export const algodClient = new Algodv2(
    '',
    process.env.ALGOD_API_URL as string || 'https://mainnet-api.algonode.cloud',
    ''
);