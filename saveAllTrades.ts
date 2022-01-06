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

const binanceCacheDir = './cache/api/v3/allOrders';
for await (const dirEntry of Deno.readDir(binanceCacheDir)) {
	const cachedDataText = await Deno.readTextFile(`${binanceCacheDir}/${dirEntry.name}`);
  const cachedTrades = JSON.parse(cachedDataText);
  const filledTrades = cachedTrades.filter((cachedTrade: any) => cachedTrade.status === 'FILLED');
  if(!filledTrades.length) continue;
  for (const filledTrade of filledTrades) {
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
    )`, filledTrade);
  }
}