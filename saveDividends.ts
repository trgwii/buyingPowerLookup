import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS dividend (
    dividendID INTEGER PRIMARY KEY AUTOINCREMENT,
    id                     INTEGER,
    tranId                 INTEGER,
    asset                  CHARACTER(20),
    amount                 FLOAT,
    divTime                INTEGER,
    enInfo                 VARCHAR(100),
    UNIQUE(id)
  )
`);

const binanceCacheDir = './cache/sapi/v1/asset/assetDividend';
for await (const dirEntry of Deno.readDir(binanceCacheDir)) {
	const cachedDataText = await Deno.readTextFile(`${binanceCacheDir}/${dirEntry.name}`);
  const cachedDividends = JSON.parse(cachedDataText);
  const cachedDividendEntries = cachedDividends.rows;
  if(!cachedDividendEntries || !cachedDividendEntries.length) continue;
  for (const cachedDividendEntry of cachedDividendEntries) {
    console.log(cachedDividendEntry);
    binanceDB.query(`INSERT OR IGNORE INTO dividend (
      id,
      tranId,
      asset,
      amount,
      divTime,
      enInfo
    ) VALUES (
      :id,
      :tranId,
      :asset,
      :amount,
      :divTime,
      :enInfo
    )`, cachedDividendEntry);
  }
}