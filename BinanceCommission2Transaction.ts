import { BinanceTransaction } from "./api/binance.ts";
import { DB } from "./deps.ts";

const binanceDB = new DB("db/binance.db");
const transactionBundle = binanceDB.query(
  "SELECT commissionID, `time` as 'date', commission, commissionAsset FROM commission",
).map((conversion) => {
  const [commissionID, date, commission, commissionAsset] = conversion;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime() + 1;
  return [
    {
      type: "commission",
      refId: Number(commissionID),
      asset: String(commissionAsset),
      side: "OUT",
      amount: Number(commission),
      price: 0,
      timestamp: Number(createTime),
    },
  ];
});
const binanceTransaction = BinanceTransaction(binanceDB);
binanceTransaction.init();
for (const transactions of transactionBundle) {
  if (!transactions) continue;
  for (const transaction of transactions) {
    binanceTransaction.add(transaction);
  }
}
binanceDB.close();
