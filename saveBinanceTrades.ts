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
for ( const symbol of allSymbols) {
    try {
      const allOrdersRequest = binance.allOrders(symbol);
      allOrdersRequest.catch(console.error);
      console.log(`trying requesting data for ${symbol}`);
      const allOrdersResponse = await allOrdersRequest;
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
    } catch (error) {
      const timeout = Number(error.response.headers.get('retry-after'));
      if(timeout > 0) {
        console.log(`waiting ${timeout} seconds`);
        await sleep(timeout);
        allSymbols.unshift(symbol);
        console.log(`adding ${symbol} back to the list`);
      } else  {
        console.error(error.response.data.msg);
        break;
      }
    }
}
binanceDB.close();
