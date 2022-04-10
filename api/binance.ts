import { apiConcurrency } from "../config.ts";
import { DB, PQueue } from "../deps.ts";
import { convertDataToTransactions, requestAllData } from "./binance/mod.ts";

const db = new DB("db/binance.db");

await requestAllData(
  db,
  new PQueue({
    concurrency: apiConcurrency / 10,
  }),
);
await convertDataToTransactions(
  db,
  new PQueue({
    concurrency: apiConcurrency,
  }),
);

db.close();
