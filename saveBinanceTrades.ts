import { autoRetry, binance } from "./api/binance.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { scrambleArray } from "./utils.ts";
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
const pairs = binanceDB.query<[string]>("SELECT symbol FROM pair");
const allSymbols = pairs.map(
  (pair) => pair[0],
);
console.log(allSymbols);
const allSymbolsScrambled = scrambleArray(allSymbols);

for (const symbol of allSymbolsScrambled) {
  console.log(`trying requesting data for ${symbol}`);
  const allOrdersResponse = await autoRetry(() => binance.allOrders(symbol));
  if (!allOrdersResponse) break;
  const allOrders = allOrdersResponse.data;
  const filledOrders = allOrders.filter((order) =>
    Number(order.executedQty) > 0 && Number(order.cummulativeQuoteQty) > 0
  );
  if (!filledOrders.length) continue;
  for (const filledOrder of filledOrders) {
    console.log(filledOrder);
    binanceDB.query(
      `INSERT OR IGNORE INTO trade (
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
    )`,
      filledOrder,
    );
  }
}
binanceDB.close();
