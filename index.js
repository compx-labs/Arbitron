import { getQuotes } from './src/quotes.js';
import axios from 'axios';

getQuotes().then(async quotes => {
    //get asset prices
    const priceRequest = await axios.get(`https://api-general.compx.io/api/prices/`);
    for (const quote of quotes) {
        const assetToPrice = priceRequest.data[quote.toASAID].max;
        console.log(`Quote swap from ${quote.fromASAID} to ${quote.toASAID} - quote: ${quote.quote}, USD: ${(quote.quote * assetToPrice) / 10 ** 6}, profit: ${quote.profitAmount}, price baseline: ${quote.priceBaseline}`);
        //console.log('full quote:', quote);
    }
});