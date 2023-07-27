const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();
const apiKey = process.env.OKX_API_KEY;
const secretKey = process.env.OKX_SECRET_KEY;
const passphrase = process.env.OKX_PASSPHRASE;


async function getPositions(options) {
    try {
        let info = options['info'];

        const baseUrl = 'https://www.okex.com';
        const endpoint = '/api/v5/account/positions';
        const method = 'GET';
        const timestamp = new Date().toISOString();
        const contentType = 'application/json';
        const body = '';
        const prehashString = timestamp + method + endpoint + body;
        const signature = crypto.createHmac('sha256', secretKey).update(prehashString).digest('base64');

        const headers = {
            'OK-ACCESS-KEY': apiKey,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': passphrase,
            'Content-Type': contentType,
        };

        let response = await axios.get(baseUrl + endpoint, { headers })
        let accountDict = {};
        let data = response.data.data;
        for (let tickerInfo of data) {
            accountDict[tickerInfo.instId.split("-")[0]] = {
                balance: parseFloat(tickerInfo.pos) * info[tickerInfo.instId.split("-")[0]]['contSize'],
                avgPrice: parseFloat(tickerInfo.avgPx),
                updateTime: parseInt(tickerInfo.uTime),
                timestamp: new Date().getTime()
            }
        }

        return accountDict;
    } catch {
        return undefined;
    }
}

async function getBalance() {
    try {
        const baseUrl = 'https://www.okex.com';
        const endpoint = '/api/v5/account/balance';
        const method = 'GET';
        const timestamp = new Date().toISOString();
        const contentType = 'application/json';
        const body = '';
        const prehashString = timestamp + method + endpoint + body;
        const signature = crypto.createHmac('sha256', secretKey).update(prehashString).digest('base64');

        const headers = {
            'OK-ACCESS-KEY': apiKey,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': passphrase,
            'Content-Type': contentType,
        };

        let response = await axios.get(baseUrl + endpoint, { headers })
        let data = response.data.data[0].details[0];
        let resultDict = {
            leverage: parseFloat(data.notionalLever),
            totalBalance: parseFloat(data.eqUsd),
            available: parseFloat(data.availEq),
        }
        return resultDict;
    } catch {
        return undefined
    }
}


async function createMarketOrder(ticker, side, size, uuid, options) {
    try {
        let info  = options['info'];
        const baseUrl = 'https://www.okex.com';
        const endpoint = '/api/v5/trade/order';
        const method = 'POST';
        const timestamp = new Date().toISOString();
        const contentType = 'application/json';
        size = size / info[ticker.split('-')[0]]['contSize'];
        size = size.toFixed(0)

        if (side === "bid") {
            side = "buy";
        } else if (side === "ask") {
            side = "sell";
        }

        const body = JSON.stringify({
            instId: ticker,
            tdMode: 'cross', // 현금 마진 거래일 경우 'cash', 크로스 마진 거래일 경우 'cross'
            side,
            ordType: "market",
            sz: size,
            clOrdId: uuid
        });

        const prehashString = timestamp + method + endpoint + body;
        const signature = crypto.createHmac('sha256', secretKey).update(prehashString).digest('base64');

        const headers = {
            'OK-ACCESS-KEY': apiKey,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': passphrase,
            'Content-Type': contentType,
        };

        let resultDict = {uuid: uuid, status: 'fail'};
        let response = await axios.post(baseUrl + endpoint, body, { headers })
        if (response.data.data[0]?.sMsg === 'Order placed') {
            resultDict['status'] = 'success'
        }
        return resultDict

    } catch {
        return undefined
    }
}


module.exports = {
    getPositions,
    getBalance,
    createMarketOrder
}