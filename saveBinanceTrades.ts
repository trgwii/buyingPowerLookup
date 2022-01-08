import { sleep } from "./deps.ts";
import { binance } from './api/binance.ts';
import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS trade (
    tradeID INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol                CHARACTER(20),
    orderId               INTEGER,
    orderListId           INTEGER,
    clientOrderId         VARCHAR(50),
    price                 FLOAT,
    origQty               FLOAT,
    executedQty           FLOAT,
    cummulativeQuoteQty   FLOAT,
    status                CHARACTER(20),
    timeInForce           CHARACTER(20),
    type                  CHARACTER(20),
    side                  CHARACTER(20),
    stopPrice             FLOAT,
    icebergQty            FLOAT,
    time                  INTEGER,
    updateTime            INTEGER,
    isWorking             BOOLEAN,
    origQuoteOrderQty     FLOAT,
    UNIQUE(orderId)
  )
`);
const exchangeInfoResponse = await binance.exchangeInfo();
if(exchangeInfoResponse.status !== 200) {
  console.error(exchangeInfoResponse.statusText);
  Deno.exit(1);
}
const exchangeInfo = exchangeInfoResponse.data;
const allSymbols = exchangeInfo.symbols
.map(
    (symbolObject: any) => symbolObject.symbol
)
.map((value: any) => ({ value, sort: Math.random() }))
.sort((a: any, b: any) => a.sort - b.sort)
.map(({ value }: any) => value);
let ipWeight = 0;
for ( const symbol of allSymbols) {
    const allOrdersRequest = binance.allOrders(symbol);
    allOrdersRequest.catch(console.error);
    console.log(ipWeight);
    ipWeight += 10;
    if(ipWeight >= 1190){
      await sleep(60);
      ipWeight = 0;
    }
    const allOrdersResponse = await allOrdersRequest;
    if(allOrdersResponse.status !== 200) {
        console.error(allOrdersResponse.statusText);
        break;
    }
    const allOrders = allOrdersResponse.data;
    const filledOrders = allOrders.filter((order: any) => order.status === 'FILLED');
    if(!filledOrders.length) continue;
    for (const filledOrder of filledOrders) {
      console.log(filledOrder);
      binanceDB.query(`INSERT OR IGNORE INTO trade (
        symbol,
        orderId,
        orderListId,
        clientOrderId,
        price,
        origQty,
        executedQty,
        cummulativeQuoteQty,
        status,
        timeInForce,
        type,
        side,
        stopPrice,
        icebergQty,
        time,
        updateTime,
        isWorking,
        origQuoteOrderQty
      ) VALUES (
        :symbol,
        :orderId,
        :orderListId,
        :clientOrderId,
        :price,
        :origQty,
        :executedQty,
        :cummulativeQuoteQty,
        :status,
        :timeInForce,
        :type,
        :side,
        :stopPrice,
        :icebergQty,
        :time,
        :updateTime,
        :isWorking,
        :origQuoteOrderQty
      )`, filledOrder);
    }
}
binanceDB.close();
