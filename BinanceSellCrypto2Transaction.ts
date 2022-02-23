import { BinanceTransaction } from "./api/binance.ts";
import { DB, parseCsv } from "./deps.ts";

const filename = "SellHistory.csv";
const transactionBundle = (
  (await parseCsv(
    await Deno.readTextFile(`db/${filename}`),
  )) as [string, string, string, string][]
).map((data, row) => {
  const [date, , amountAndAsset, priceString] = data;
  const dateUTC = new Date(date);
  dateUTC.setHours(dateUTC.getHours() + 1);
  const createTime = dateUTC.getTime();
  const amount = amountAndAsset.replace(/[^\d.-]/g, "");
  const asset = amountAndAsset.replace(/[\d .-]/g, "");
  if (!amount.length || !priceString.length) return null;
  const price = parseFloat(priceString.replace(/[^\d.-]/g, ""));
  return [
    {
      type: filename,
      refId: row,
      asset: asset,
      side: "OUT",
      amount: parseFloat(amount),
      price: price,
      timestamp: createTime,
    },
  ];
});
const binanceDB = new DB("db/binance.db");
const binanceTransaction = BinanceTransaction(binanceDB);
binanceTransaction.init();
for (const transactions of transactionBundle) {
  if (!transactions) continue;
  for (const transaction of transactions) {
    binanceTransaction.add(transaction);
  }
}
binanceDB.close();
