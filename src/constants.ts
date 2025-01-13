
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    DEFLEX_API_KEY: process.env.DEFLEX_API_KEY as string,
    WALLET_SK: process.env.WALLET_SK as string,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS as string,
    COMPX_BACKEND_API_URL: process.env.COMPX_BACKEND_API_URL as string,
    ALGOD_API_URL: process.env.ALGOD_API_URL as string,
    INDEXER_URL: 'https://mainnet-idx.algonode.cloud/v2',
    XUSD_ASSET_ID: 760037151,
    TRADABLE_ASSET_MINIMUM_VALUE: 100,
    TRADE_VALUE: 100,
};
