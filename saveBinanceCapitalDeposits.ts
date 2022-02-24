import { BinanceCapitalDeposit } from "./api/api2db.ts";
import { binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");

const binanceCapitalDeposit = BinanceCapitalDeposit(binanceDB);
binanceCapitalDeposit.init();

const capitalDepositsResponse = await binance.depositHistory();
const capitalDeposits = capitalDepositsResponse.data;
if (!capitalDeposits.length) Deno.exit(1);

for (const capitalDeposit of capitalDeposits) {
  console.log(capitalDeposit);
  binanceCapitalDeposit.add(capitalDeposit);
}
binanceDB.close();
