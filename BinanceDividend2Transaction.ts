import { BinanceTransaction } from "./api/binance.ts";
import { DB } from "./deps.ts";

const binanceDB = new DB("db/binance.db");
const transactionBundle = binanceDB.query(
  "SELECT dividendID, asset, amount, divTime FROM dividend",
).map((dividend) => {
  const [dividendID, asset, amount, date] = dividend;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime();
  return [
    {
      type: "dividend",
      refId: Number(dividendID),
      asset: String(asset),
      side: "IN",
      amount: Number(amount),
      price: 0,
      timestamp: createTime,
    },
  ];
});

const binanceTransaction = BinanceTransaction(binanceDB);
binanceTransaction.init();
for (const transactions of transactionBundle) {
  for (const transaction of transactions) {
    binanceTransaction.add(transaction);
  }
}
binanceDB.close();
