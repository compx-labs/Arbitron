import { deflexRouterClient } from './client.js';
import axios from 'axios';


export async function getQuote(assetIdFrom: number, assetIdTo: number, amount: number) {
    try {
        return await deflexRouterClient.getFixedInputSwapQuote(assetIdFrom, assetIdTo, amount);
    } catch (error) {
        console.error(error);
    }
}

/* export async function getPoolsForToken(assetId: number) {
    try {
        const tinymanPoolsResponse = await axios.get(`https://api-general.compx.io/api/tinyman/pools/all/pools/${assetId}`);
        const pactPoolsResponse = await axios.get(`https://api-general.compx.io/api/pactfi/pools/all/pools/${assetId}`);
        const pools = {
            tinyman: tinymanPoolsResponse.data,
            pact: pactPoolsResponse.data
        };
        return pools;
    } catch (error) {
        console.error(error);
    }
};
 */
/* export async function getPactPoolTokenPrices(assetId: number, pools: any) {
    try {
        const formattedPools: any[]= [];
        pools.forEach((pool: any) => {
            if (Number(pool['tvl_usd']) > 500) {
                let primary = {};
                let secondary = {};
                if (Number(pool.primary_asset.on_chain_id) === assetId) {
                    primary.id = pool.primary_asset.on_chain_id;
                    primary.aggPrice = pool.primary_asset.price;
                    primary.tvl = pool.tvl_usd / 2;
                    primary.decimals = pool.primary_asset.decimals;
                    secondary.id = pool.secondary_asset.on_chain_id;
                    secondary.aggPrice = pool.secondary_asset.price;
                    secondary.tvl = pool.tvl_usd / 2;
                    secondary.decimals = pool.secondary_asset.decimals;
                } else {
                    primary.id = pool.secondary_asset.on_chain_id;
                    primary.aggPrice = pool.secondary_asset.price;
                    primary.tvl = pool.tvl_usd / 2;
                    primary.decimals = pool.secondary_asset.decimals;
                    secondary.id = pool.primary_asset.on_chain_id;
                    secondary.aggPrice = pool.primary_asset.price;
                    secondary.tvl = pool.tvl_usd / 2;
                    secondary.decimals = pool.primary_asset.decimals;
                }
                const feeBps = pool['fee_bps'];
                formattedPools.push({ primary, secondary, feeBps });
            }
        });
        const pricesResponse = await axios.get(`https://api-general.compx.io/api/prices/`);
        if (!pricesResponse.data) {
            throw new Error('Failed to fetch prices');
        }

        formattedPools.forEach((pool) => {
            pool.primary.reserve = pool.primary.tvl / pool.primary.aggPrice;
            pool.secondary.reserve = pool.secondary.tvl / pool.secondary.aggPrice;
            pool.priceInSecondary = pool.secondary.reserve / pool.primary.reserve;
            pool.readablePrice = (pool.priceInSecondary / 10 ** (pool.primary.decimals - pool.secondary.decimals)).toLocaleString();
            pool.effectivexUSDPrice = pool.priceInSecondary * (1 - pool.feeBps / 10_000);
            const secondaryAssetPrice = pricesResponse.data[pool.secondary.id].max;
            pool.normalisedXUSDPrice = pool.effectivexUSDPrice * secondaryAssetPrice;
        });

        return formattedPools;
    } catch (error) {
        console.error(error);
    }
} */