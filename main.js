const {getFundingRate} = require("./binance_module/public_api");
const {getPositions, getBalance, createMarketOrder} = require("./okx_module/private_api");
const {getTickerList, getTickerPrice} = require("./okx_module/public_api");

require('dotenv').config();
let fundingInfo = {timestamp: new Date().getTime()};
let btcPosition = {};
let balanceInfo = {};
let FUNDING_PARAM = process.env.FUNDING_PARAM;
let PORTION = process.env.PORTION;
let tickerList;
let tradingInfo;



async function main() {
    let tickerInfo = await getTickerList();
    tickerList = tickerInfo[0];
    tradingInfo = tickerInfo[1];

    while (true) {
        try {
            let hour = new Date().getUTCHours();
            if (![0, 8, 16].includes(hour)) {
                continue;
            }

            let tempFunding = await getFundingRate("BTC");
            if (!tempFunding) {
                continue;
            } else {
                fundingInfo = tempFunding;
            }

            let lastFundingHour = new Date(fundingInfo.timestamp).getHours();
            if (hour !== lastFundingHour) {
                 continue;
            }

            let tempPosition = await getPositions({info: tradingInfo});
            let tempBalance = await getBalance();
            let curPrice = await getTickerPrice("BTC");

            if (!tempPosition || !tempBalance || !curPrice) {
                continue;
            } else {
                btcPosition = tempPosition['BTC'].balance;
                balanceInfo = tempBalance;
            }

            if (fundingInfo.fundingRate <= FUNDING_PARAM) {
                if (btcPosition > 0) {
                    continue;
                } else if (btcPosition === 0) {
                    let balance = balanceInfo['totalBalance'];
                    let amount = balance / curPrice * PORTION;
                    let result = await createMarketOrder("BTC", "bid", amount, new Date().getTime(), {info: tradingInfo});
                }
            } else {
                if (btcPosition > 0) {
                    let result = await createMarketOrder("BTC", "ask", btcPosition, new Date().getTime(), {info: tradingInfo});
                } else if (btcPosition === 0) {
                    continue;
                }
            }
        } catch {}
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

main();