import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS dribblet (
    dribbletID INTEGER PRIMARY KEY AUTOINCREMENT,
    fromAsset                            CHARACTER(20),
    amount                               FLOAT,
    transferedAmount                     FLOAT,
    serviceChargeAmount                  FLOAT,
    operateTime                          INTEGER,
    transId                              INTEGER,
    UNIQUE(fromAsset, transId)
  )
`);

const binanceCacheDir = './cache/sapi/v1/asset/dribblet';
for await (const dirEntry of Deno.readDir(binanceCacheDir)) {
	const cachedDataText = await Deno.readTextFile(`${binanceCacheDir}/${dirEntry.name}`);
  const cachedDribblets = JSON.parse(cachedDataText);
  const cachedDribbletEntries = cachedDribblets.userAssetDribblets;
  if(!cachedDribbletEntries) continue;
  const successfulDribblets = cachedDribbletEntries.map((cachedDribbletEntry: any) => cachedDribbletEntry.userAssetDribbletDetails);
  if(!successfulDribblets.length) continue;
  for (const successfulDribblet of successfulDribblets[0]) {
    console.log(successfulDribblet);
    binanceDB.query(`INSERT OR IGNORE INTO dribblet (
      fromAsset,
      amount,
      transferedAmount,
      serviceChargeAmount,
      operateTime,
      transId
    ) VALUES (
      :fromAsset,
      :amount,
      :transferedAmount,
      :serviceChargeAmount,
      :operateTime,
      :transId
    )`, successfulDribblet);
  }
}