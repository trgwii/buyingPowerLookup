const scriptTimeStart = performance.now();
import { BinanceTransaction } from "./api/api2db.ts";
import {
  prepareAutoInvest,
  prepareBuyHistory,
  prepareCommission,
  prepareConversion,
  prepareDividend,
  prepareDribblet,
  prepareManualOrders,
  prepareSellHistory,
  prepareTrade,
  saveTransactions,
} from "./api/transactionFunctions.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";

const binanceDB = new DB("db/binance.db");
const binanceTransaction = BinanceTransaction(binanceDB);
binanceTransaction.init();
const pairs = binanceDB.query(
  `SELECT baseAsset, quoteAsset, symbol
    FROM pair`,
);
const queue = new PQueue({
  concurrency: apiConcurrency,
});
Promise.all([
  saveTransactions(binanceDB, prepareCommission(binanceDB), false),
  saveTransactions(binanceDB, prepareDividend(binanceDB), false),
  saveTransactions(binanceDB, prepareAutoInvest(pairs, queue)),
  saveTransactions(binanceDB, prepareBuyHistory()),
  saveTransactions(binanceDB, prepareManualOrders(pairs, queue)),
  saveTransactions(binanceDB, prepareSellHistory()),
  saveTransactions(binanceDB, prepareConversion(binanceDB, pairs, queue)),
  saveTransactions(binanceDB, prepareDribblet(binanceDB, pairs, queue)),
  saveTransactions(binanceDB, prepareTrade(binanceDB, pairs, queue)),
]).then(
  () => {
    binanceDB.close();
    const scriptTimeEnd = performance.now();
    console.log(`${(scriptTimeEnd - scriptTimeStart) / 1000} seconds`);
  },
);
