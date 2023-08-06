const crypto = require("crypto");
const axios = require("axios");
require('dotenv').config();
const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;


function processAccountData(data) {
    let accountDict = {};
    let assets = data.assets;
    let positions = data.positions;
    let timestamp = new Date().getTime();

    for (let asset of assets) {
        if (["USDT", "BUSD", "BNB_ASSET"].includes(asset['asset'])) {
            accountDict[asset['asset']] = {
                balance: parseFloat(asset['walletBalance']),
                unrealizedProfit: parseFloat(asset['unrealizedProfit']),
                nowPrice: 1,
                locked: 0,
                avgPrice: 1,
                timestamp: timestamp
            }
        }

        if ("BNB" === asset['asset']) {
            accountDict['BNB_ASSET'] = {
                balance: parseFloat(asset['walletBalance']),
                unrealizedProfit: parseFloat(asset['unrealizedProfit']),
                nowPrice: 1,
                locked: 0,
                avgPrice: 1,
                timestamp: timestamp
            }
        }
    }

    accountDict['USD'] = {
        balance: (accountDict['BUSD']['balance'] || 0) + (accountDict['USDT']['balance'] || 0),
        unrealizedProfit: (accountDict['BUSD']['unrealizedProfit'] || 0) + (accountDict['USDT']['unrealizedProfit'] || 0),
        nowPrice: 1,
        locked: 0,
        avgPrice: 1,
        timestamp: timestamp
    }

    for (let position of positions) {
        if (position.symbol.endsWith("USDT") && !position.symbol.includes("_")) {
            let balance = parseFloat(position.positionAmt);

            if (balance !== 0){
                let code = position.symbol.replace("USDT", "");
                accountDict[code] = {
                    balance: balance,
                    nowPrice: 0,
                    locked: 0,
                    unrealizedProfit: parseFloat(position.unrealizedProfit),
                    avgPrice: parseFloat(position.entryPrice),
                    timestamp: timestamp,
                    lastOrderTime: 0,
                }
            }
        }
    }
    return accountDict;
}



function createSignature (queryString, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(queryString)
        .digest('hex');
}


module.exports.getAccounts = async function getAccounts() {
    try {
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`
        const signature = createSignature(queryString, secretKey);

        const options = {
            url: `https://fapi.binance.com/fapi/v2/account?timestamp=${timestamp}&signature=${signature}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-MBX-APIKEY': apiKey,
            },
        };

        let res = await axios(options)
        let data = processAccountData(res.data);
        return data;
    } catch (err){
        console.log(err)
        return undefined;
    }
}

module.exports.createMarketOrder = async function createMarketOrder(ticker, side, amount, uuid, reduceOnly) {
    try {
        ticker = ticker.replace("/", "");
        side = side.toUpperCase();
        const timestamp = new Date().getTime();
        let queryString = `symbol=${ticker}&side=${side}&type=MARKET&quantity=${amount}&timestamp=${timestamp}&newClientOrderId=${uuid}&reduceOnly=${reduceOnly}`;

        const signature = createSignature(queryString, secretKey);
        const headers = {
            'X-MBX-APIKEY': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const options = {
            headers: headers,
            timeout: 500
        }
        let url = `https://fapi.binance.com/fapi/v1/order?${queryString}&signature=${signature}`;
        let res = await axios.post(url, {}, options);
        let data = res.data;
        return data;
    } catch (err){
        console.log(err)
        return undefined;
    }
}
