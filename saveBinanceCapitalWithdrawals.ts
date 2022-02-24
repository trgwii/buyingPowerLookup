import { BinanceCapitalWithdrawal } from "./api/api2db.ts";
import { binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");

const binanceCapitalWithdrawal = BinanceCapitalWithdrawal(binanceDB);
binanceCapitalWithdrawal.init();

const capitalWithdrawResponse = await binance.withdrawHistory();
if (capitalWithdrawResponse.status !== 200) {
  console.log(capitalWithdrawResponse.statusText);
  Deno.exit(1);
}
const capitalWithdraws = capitalWithdrawResponse.data;
const successfulCapitalWithdraws = capitalWithdraws.filter(
  (capitalWithdraws) => capitalWithdraws.status === 6,
);
if (!successfulCapitalWithdraws.length) Deno.exit(1);
for (const successfulCapitalWithdraw of successfulCapitalWithdraws) {
  console.log(successfulCapitalWithdraw);
  binanceCapitalWithdrawal.add(successfulCapitalWithdraw);
}
binanceDB.close();
