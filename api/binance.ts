import { apiConcurrency } from "../config.ts";
import { DB, PQueue, sleep } from "../deps.ts";
import { backupPriceData } from "./binance/fetch.ts";
import { convertDataToTransactions, requestAllData } from "./binance/mod.ts";

const db = new DB("db/binance.db");

/*await requestAllData(
  db,
  new PQueue({
    concurrency: apiConcurrency / 10,
  }),
);*/
await Promise.all(
  backupPriceData(
    db.query(
      `SELECT DISTINCT symbol FROM trade`,
    ),
    new PQueue({ concurrency: 10 }),
  ),
);

await convertDataToTransactions(
  db,
  new PQueue({
    concurrency: apiConcurrency,
  }),
);

db.close();
