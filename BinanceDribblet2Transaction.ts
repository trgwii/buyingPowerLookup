import { BinanceTransaction, fetchAssetPrice } from "./api/binance.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";

const type = "dribblet";
const queue = new PQueue({
  concurrency: apiConcurrency,
});

const binanceDB = new DB("db/binance.db");
const pairs = binanceDB.query(
  `SELECT baseAsset, quoteAsset, symbol
  FROM pair`,
);
const transactionBundle = binanceDB.query(
  "SELECT dribbletID, fromAsset, 'BNB' AS 'toAsset', amount as 'fromAmount', (transferedAmount - serviceChargeAmount) AS 'toAmount', operateTime AS 'dateUTCplus2' FROM dribblet",
).map((dribblet) => {
  const [dribbletID, fromAsset, toAsset, fromAmount, toAmount, date] = dribblet;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime();
  console.log(`iteration pair: ${fromAsset}${toAsset}`);
  return [
    {
      type: type,
      refId: Number(dribbletID),
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
    {
      type: type,
      refId: Number(dribbletID),
      asset: String(fromAsset),
      side: "OUT",
      amount: Number(fromAmount),
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
