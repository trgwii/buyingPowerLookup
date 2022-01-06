import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS conversion (
    conversionID INTEGER PRIMARY KEY AUTOINCREMENT,
    quoteId                   VARCHAR(50),
    orderId                   INTEGER,
    orderStatus               CHARACTER(20),
    fromAsset                 CHARACTER(20),
    fromAmount                FLOAT,
    toAsset                   CHARACTER(20),
    toAmount                  FLOAT,
    ratio                     FLOAT,
    inverseRatio              FLOAT,
    createTime                INTEGER,
    UNIQUE(orderId)
  )
`);

const binanceCacheDir = './cache/sapi/v1/convert/tradeFlow';
for await (const dirEntry of Deno.readDir(binanceCacheDir)) {
	const cachedDataText = await Deno.readTextFile(`${binanceCacheDir}/${dirEntry.name}`);
  const cachedConversions = JSON.parse(cachedDataText);
  if(!cachedConversions.list) continue;
  const successfulConversions = cachedConversions.list.filter((cachedConversion: any) => cachedConversion.orderStatus === 'SUCCESS');
  if(!successfulConversions.length) continue;
  for (const successfulConversion of successfulConversions) {
    binanceDB.query(`INSERT OR IGNORE INTO conversion (
      quoteId,
      orderId,
      orderStatus,
      fromAsset,
      fromAmount,
      toAsset,
      toAmount,
      ratio,
      inverseRatio,
      createTime
    ) VALUES (
      :quoteId,
      :orderId,
      :orderStatus,
      :fromAsset,
      :fromAmount,
      :toAsset,
      :toAmount,
      :ratio,
      :inverseRatio,
      :createTime
    )`, successfulConversion);
  }
}