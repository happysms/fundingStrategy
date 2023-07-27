const axios = require('axios');
const crypto = require("crypto");


module.exports.getTickerList = async function () {
    try {
        const okxEndpoint = 'https://www.okx.com/api/v5/public/instruments?instType=SWAP';
        const response = await axios.get(okxEndpoint);
        const instruments = response.data.data;
        const tickerList = [];
        let info = {};

        instruments.forEach(instrument => {
            if (instrument.settleCcy === 'USDT') {
                let ticker = instrument.ctValCcy;
                tickerList.push(ticker);
                info[ticker] = {
                    min_q: parseFloat(instrument['minSz']),
                    max_q: parseFloat(instrument['maxLmtSz']),
                    cont_size: parseFloat(instrument['ctVal']),
                    price_precision: String(Math.round(1 / instrument['tickSz'])).length - 1
                }
            }
        });

        return [tickerList, info];
    } catch (err) {
        throw new Error(err);
    }
}

async function getFundingRateOKX(symbol) {
    try {
        const baseURL = 'https://www.okx.com';
        const endpoint = `/api/v5/public/funding-rate?instId=${symbol}-USDT-SWAP`;

        const response = await axios.get(baseURL + endpoint);
        const data = response.data.data;

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid API response');
        }

        return parseFloat(data[0].fundingRate);
    } catch (error) {
        console.error(`Error fetching funding rate for ${symbol}:`, error.message);
        return null;
    }
}

module.exports.getFundingRates = async function getFundingRatesOKX(tickers) {
    const fundingRates = {};

    for (const ticker of tickers) {
        const rate = await getFundingRateOKX(ticker);
        if (rate !== null) {
            fundingRates[ticker] = rate;
        }
    }

    return fundingRates;
}

module.exports.getTickerPrice = async function (ticker) {
    // /api/v5/sprd/books
    try {
        const baseURL = 'https://www.okx.com';
        const endpoint = `/api/v5/public/mark-price?instId=${ticker}-USDT-SWAP`;
        const response = await axios.get(baseURL + endpoint);
        let data = response.data.data[0];
        let price = parseFloat(data['markPx']);
        return price;
    } catch (err){
        console.log(err);
        return undefined
    }
}

