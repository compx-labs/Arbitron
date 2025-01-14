
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    DEFLEX_API_KEY: process.env.DEFLEX_API_KEY as string,
    WALLET_SK: process.env.WALLET_SK as string,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS as string,
    COMPX_BACKEND_API_URL: process.env.COMPX_BACKEND_API_URL as string,
    ALGOD_API_URL: process.env.ALGOD_API_URL as string,
    INDEXER_URL: process.env.INDEXER_URL as string,
    TRADABLE_ASSET_MINIMUM_VALUE: process.env.TRADABLE_ASSET_MINIMUM_VALUE ? Number(process.env.TRADABLE_ASSET_MINIMUM_VALUE) : 100,
    TRADE_VALUE: process.env.TRADE_VALUE ? Number(process.env.TRADE_VALUE) : 1,
};
