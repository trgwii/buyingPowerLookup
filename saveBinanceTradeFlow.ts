import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS conversion (
    conversionID INTEGER PRIMARY KEY AUTOINCREMENT,
    quoteId                   VARCHAR(50),
    orderId                   INTEGER,
    orderStatus               CHARACTER(20),
    fromAsset                 CHARACTER(20),
    fromAmount                FLOAT,
    toAsset                   CHARACTER(20),
    toAmount                  FLOAT,
    ratio                     FLOAT,
    inverseRatio              FLOAT,
    createTime                INTEGER,
    UNIQUE(orderId)
  )
`);

import { binance } from './api/binance.ts';

for (let m = 1; m <= 12; m++) {
    const mString = m.toString().length === 1 ?`0${m}` :m.toString();
    const lastDayOfMonth = new Date(2021, m +1, 0).getDate();
    const startTime = Date.parse(`2021-${mString}-01`);
    const endTime = Date.parse(`2021-${mString}-${lastDayOfMonth}`);
    const convertTradeHistoryResponse = await binance.convertTradeHistory(startTime, endTime);
    if(convertTradeHistoryResponse.status !== 200) {
        console.error(convertTradeHistoryResponse.statusText);
        break;
    }
    const convertTradeHistoryData = convertTradeHistoryResponse.data;
    if(!convertTradeHistoryData) continue;
    const convertTradeHistory = convertTradeHistoryData.list;
    if(!convertTradeHistory.length) continue;
    for (const convertTrade of convertTradeHistory) {
      if(convertTrade.orderStatus !== 'SUCCESS') continue;
      console.log(convertTrade);
      binanceDB.query(`INSERT OR IGNORE INTO conversion (
        quoteId,
        orderId,
        orderStatus,
        fromAsset,
        fromAmount,
        toAsset,
        toAmount,
        ratio,
        inverseRatio,
        createTime
      ) VALUES (
        :quoteId,
        :orderId,
        :orderStatus,
        :fromAsset,
        :fromAmount,
        :toAsset,
        :toAmount,
        :ratio,
        :inverseRatio,
        :createTime
      )`, convertTrade);
    }
}
binanceDB.close();
