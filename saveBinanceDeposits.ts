import { BinanceDeposit } from "./api/api2db.ts";
import { binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");

const binanceDeposit = BinanceDeposit(binanceDB);
binanceDeposit.init();
const fiatDepositResponse = await binance.depositWithdrawalHistory(0);
if (fiatDepositResponse.status !== 200) {
  console.log(fiatDepositResponse.statusText);
  Deno.exit(1);
}
const fiatDepositData = fiatDepositResponse.data;
const fiatDeposits = fiatDepositData.data;
const successfulFiatDeposits = fiatDeposits.filter(
  (fiatDeposit) => fiatDeposit.status === "Successful",
);
if (!successfulFiatDeposits.length) Deno.exit(1);
for (const successfulFiatDeposit of successfulFiatDeposits) {
  binanceDeposit.add(successfulFiatDeposit);
}
binanceDB.close();
