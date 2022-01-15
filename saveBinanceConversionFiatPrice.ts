import { fiatCurrency } from "./config.ts";
import { autoRetry, binance } from "./api/binance.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS conversionFiatPrice (
    tradeValueID INTEGER PRIMARY KEY AUTOINCREMENT,
    conversionID        INTEGER,
    fiatPrice           FLOAT,
    FOREIGN KEY(conversionID) REFERENCES trade(conversionID)
  )
`);

const allConversion = binanceDB.query(
  `SELECT * FROM conversion`,
);
for (const conversionData of allConversion) {
  console.log(conversionData);
}
binanceDB.close();
