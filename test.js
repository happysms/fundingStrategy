const {getAccounts, createMarketOrder} = require("./binance_module/private_api");


(async () => {
   // let res = await getAccounts()
   //  console.log(res)
    let res = await createMarketOrder("BTCUSDT", "buy", 0.001, new Date().getTime(), false);
    console.log(res);
})()