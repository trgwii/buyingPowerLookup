const scriptTimeStart = performance.now();
import { BinanceTransaction, fetchAssetPrice } from "./api/binance.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";

const type = "trade";
const queue = new PQueue({
  concurrency: apiConcurrency,
});

const binanceDB = new DB("db/binance.db");
const pairs = binanceDB.query(
  `SELECT baseAsset, quoteAsset, symbol
  FROM pair`,
);
const transactionBundle = binanceDB.query(
  `SELECT tradeID, symbol, executedQty, cummulativeQuoteQty, time AS 'date', side FROM trade`,
).map((trade) => {
  const [tradeID, symbol, executedQty, cummulativeQuoteQty, date, side] = trade;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime();
  console.log(`iteration symbol: ${symbol}`);
  const pairData = pairs.filter((pair) => pair[2] === symbol);
  if (!pairData.length) return null;
  const assetData = pairData[0];
  if (!Array.isArray(assetData) || assetData.length !== 3) return null;
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
          pairs,
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
      price: null,
      timestamp: createTime,
    },
  ];
});
const binanceTransaction = BinanceTransaction(binanceDB);
binanceTransaction.init();
for (const transactions of transactionBundle) {
  if (!transactions) continue;
  const [quoteAssetTransaction, baseAssetTransaction] = transactions;
  const quotePrice = await quoteAssetTransaction.price;
  if (
    !quotePrice || typeof quotePrice !== "number" ||
    baseAssetTransaction.amount <= 0
  ) {
    continue;
  }
  const basePrice = quoteAssetTransaction.amount *
    quotePrice / baseAssetTransaction.amount;
  binanceTransaction.add({ ...quoteAssetTransaction, price: quotePrice });
  binanceTransaction.add({ ...baseAssetTransaction, price: basePrice });
}
binanceDB.close();
const scriptTimeEnd = performance.now();
console.log(`${(scriptTimeEnd - scriptTimeStart) / 1000} seconds`);
