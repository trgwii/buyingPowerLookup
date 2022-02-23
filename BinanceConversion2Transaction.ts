import { BinanceTransaction, fetchAssetPrice } from "./api/binance.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";

const type = "conversion";
const queue = new PQueue({
  concurrency: apiConcurrency,
});

const binanceDB = new DB("db/binance.db");
const pairs = binanceDB.query(
  `SELECT baseAsset, quoteAsset, symbol
  FROM pair`,
);

const transactionBundle = binanceDB.query(
  "SELECT conversionID, fromAsset, toAsset, fromAmount, toAmount, createTime FROM conversion",
).map((conversion) => {
  const [conversionID, fromAsset, toAsset, fromAmount, toAmount, date] =
    conversion;
  console.log(`iteration pair: ${fromAsset}${toAsset}`);
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime();
  return [
    {
      type: type,
      refId: Number(conversionID),
      asset: String(fromAsset),
      side: "OUT",
      amount: Number(fromAmount),
      price: queue.add(() =>
        fetchAssetPrice(
          String(fromAsset),
          createTime,
          pairs,
        )
      ),
      timestamp: createTime,
    },
    {
      type: type,
      refId: Number(conversionID),
      asset: String(toAsset),
      side: "IN",
      amount: Number(toAmount),
      price: queue.add(() =>
        fetchAssetPrice(
          String(toAsset),
          createTime,
          pairs,
        )
      ),
      timestamp: createTime,
    },
  ];
});

const binanceTransaction = BinanceTransaction(binanceDB);
binanceTransaction.init();

for (const transactions of transactionBundle) {
  if (!transactions) continue;
  for (const transaction of transactions) {
    const price = await transaction.price;
    if (!price || typeof price !== "number") continue;
    binanceTransaction.add({ ...transaction, price: price });
  }
}
binanceDB.close();
