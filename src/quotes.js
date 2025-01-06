import { deflexRouterClient } from './utils/deflex.js';
import { xUSDAssetId, assets } from './utils/assets.js';

export async function getQuotes() {
    try {
        const promises = [];
        for (const assetId of assets) {
            promises.push(deflexRouterClient.getFixedOutputSwapQuote(xUSDAssetId, assetId, 500_000));
        }
        const quotes = await Promise.all(promises);
        return quotes;
    } catch (error) {
        console.error(error);
    }
}