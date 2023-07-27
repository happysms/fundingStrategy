const axios = require('axios');

module.exports.getTickerList = async function () {
    try {
        const binanceFuturesEndpoint = 'https://fapi.binance.com/fapi/v1/exchangeInfo';
        const response = await axios.get(binanceFuturesEndpoint);
        const symbols = response.data.symbols;
        let tickerList = [];
        let info = {}

        symbols.forEach(symbol => {
            if (symbol.contractType === 'PERPETUAL' && symbol.symbol.endsWith('USDT') && symbol.status === 'TRADING') {
                tickerList.push(symbol.symbol.split('USDT')[0])
                let save = {}
                save['min_q'] = symbol['filters'][2]['minQty']
                save['max_q'] = symbol['filters'][2]['maxQty']
                info[symbol.symbol.split('USDT')[0]]=save
            }
        });
        return [tickerList,info];
    } catch(err) {
        throw new Error(err)
    }
}


module.exports.getFundingRate = async function (ticker) {
    try {
        const binanceFuturesEndpoint = `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${ticker}USDT`;
        const response = await axios.get(binanceFuturesEndpoint);
        const data = response.data;

        let fundingRate = data.interestRate;
        let timestamp = new Date().getTime();
        let nextFundingTime = data.nextFundingTime;
        return {ticker, fundingRate, timestamp, nextFundingTime}
    } catch(err) {
        throw new Error(err)
    }
}

