const scriptTimeStart = performance.now();

import { Binance2Transaction, fetchAssetPrice } from "./api/binance.ts";
import { DB } from "./deps.ts";
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";

const binanceDB = new DB("db/binance.db");

const b2t = Binance2Transaction(binanceDB);
b2t.init();
const type = "trade";

const queue = new PQueue({
  concurrency: 20,
});
const trades = binanceDB.query(
  `SELECT tradeID, symbol, executedQty, cummulativeQuoteQty, time AS 'date', side FROM trade`,
);
const transactionBundle = trades.map((trade) => {
  const [tradeID, symbol, executedQty, cummulativeQuoteQty, date, side] = trade;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime();
  console.log(`iteration symbol: ${symbol}`);
  const pairData = binanceDB.query(
    "SELECT baseAsset, quoteAsset FROM pair WHERE symbol = ?",
    [String(symbol)],
  );
  if (!pairData[0] || pairData[0].length !== 2) return null;
  const assetData = pairData[0];
  if (!Array.isArray(assetData) || assetData.length !== 2) return null;
  const [baseAsset, quoteAsset] = assetData;
  return [
    {
      type: type,
      refId: Number(tradeID),
      asset: String(quoteAsset),
      side: side === "SELL" ? "IN" : "OUT",
      amount: Number(cummulativeQuoteQty),
      price: queue.add(() =>
        fetchAssetPrice(
          String(quoteAsset),
          createTime,
        )
      ),
      timestamp: createTime,
    },
    {
      type: type,
      refId: Number(tradeID),
      asset: String(baseAsset),
      side: side === "BUY" ? "IN" : "OUT",
      amount: Number(executedQty),
      price: queue.add(() =>
        fetchAssetPrice(
          String(baseAsset),
          createTime,
        )
      ),
      timestamp: createTime,
    },
  ];
});
for (const transactions of transactionBundle) {
  if (!transactions) continue;
  for (const transaction of transactions) {
    const price = await transaction.price;
    if (!price || typeof price !== "number") continue;
    b2t.add({ ...transaction, price: price });
  }
}
b2t.close();
const scriptTimeEnd = performance.now();
console.log(`${(scriptTimeEnd - scriptTimeStart) / 1000} seconds`);
