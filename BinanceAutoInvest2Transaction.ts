import { BinanceTransaction, fetchAssetPrice } from "./api/binance.ts";
import { apiConcurrency } from "./config.ts";
import { DB, parseCsv, PQueue } from "./deps.ts";

const filename = "AutoInvestHistory.csv";
const queue = new PQueue({
  concurrency: apiConcurrency,
});

const binanceDB = new DB("db/binance.db");
const pairs = binanceDB.query(
  `SELECT baseAsset, quoteAsset, symbol
  FROM pair`,
);

const transactionBundle = (
  (await parseCsv(
    await Deno.readTextFile(`db/${filename}`),
  )) as [string, string, string, string, string, string][]
).map((data, row) => {
  const [date, , fromAmountAndAsset, toAmountAndAsset, , status] = data;
  const dateUTC = new Date(date);
  dateUTC.setHours(dateUTC.getHours() + 1);
  const createTime = dateUTC.getTime();
  const fromAsset = fromAmountAndAsset.replace(/[\d .-]/g, "");
  const toAsset = toAmountAndAsset.replace(/[\d .-]/g, "");
  if (status !== "Success") return null;
  return [
    {
      type: filename,
      refId: row,
      asset: fromAsset,
      side: "OUT",
      amount: Number(fromAmountAndAsset.replace(/[^\d.-]/g, "")),
      price: queue.add(() =>
        fetchAssetPrice(
          fromAsset,
          createTime,
          pairs,
        )
      ),
      timestamp: createTime,
    },
    {
      type: filename,
      refId: row,
      asset: toAsset,
      side: "IN",
      amount: Number(toAmountAndAsset.replace(/[^\d.-]/g, "")),
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
