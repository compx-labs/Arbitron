import { DeflexQuote } from "@deflex/deflex-sdk-js";



export interface ArbitronStatus {
    algoBalance: number;
    assetBalances: AssetHolding[];
    lastRunTimestamp: number;
    profit: number;
    mode: string;
};

export interface AssetHolding {
    assetId: number;
    amount: number;
};

export interface FavourableTrade {
    assetIn: number;
    assetOut: number;
    profit: number;
    quote: DeflexQuote;
    totalFeeUSD: number;
    profitable: boolean;
}

export interface TradeOutput {
    trade: FavourableTrade;
    tradeComplete: boolean;
}