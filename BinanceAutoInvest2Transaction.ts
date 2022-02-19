import { Binance2Transaction, fetchAssetPrice } from "./api/binance.ts";
import { DB, parseCsv } from "./deps.ts";

const b2t = Binance2Transaction(new DB("db/binance.db"));
b2t.init();
const filename = "AutoInvestHistory.csv";
const transactionBundle = (
  await parseCsv(
    await Deno.readTextFile(`db/${filename}`),
  )
).map((data: array, row: nunber) => {
  const [date, c2, fromAmountAndAsset, toAmountAndAsset, c5, status] = data;
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
      amount: fromAmountAndAsset.replace(/[^\d.-]/g, ""),
      price: fetchAssetPrice(
        fromAsset,
        createTime,
      ),
      timestamp: createTime,
    },
    {
      type: filename,
      refId: row,
      asset: toAsset,
      side: "IN",
      amount: toAmountAndAsset.replace(/[^\d.-]/g, ""),
      price: fetchAssetPrice(
        toAsset,
        createTime,
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
