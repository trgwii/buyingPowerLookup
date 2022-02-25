const scriptTimeStart = performance.now();
import {
  saveCapitalDeposits,
  saveCapitalWithdrawals,
  saveCommissions,
  saveConversions,
  saveDeposits,
  saveDividends,
  saveDribblets,
  savePairs,
  saveTrades,
} from "./api/api2db.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";

const binanceDB = new DB("db/binance.db");
const queue = new PQueue({
  concurrency: apiConcurrency / 10,
});
await savePairs(binanceDB, queue);
Promise.all([
  saveCapitalDeposits(binanceDB, queue),
  saveCapitalWithdrawals(binanceDB, queue),
  saveCommissions(binanceDB, queue),
  saveConversions(binanceDB, queue),
  saveDeposits(binanceDB, queue),
  saveDividends(binanceDB, queue),
  saveDribblets(binanceDB, queue),
  saveTrades(binanceDB, queue),
]).then(
  () => {
    binanceDB.close();
    const scriptTimeEnd = performance.now();
    console.log(`${(scriptTimeEnd - scriptTimeStart) / 1000} seconds`);
  },
);
