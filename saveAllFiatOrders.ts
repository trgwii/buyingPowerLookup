import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS deposit (
    depositID INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNo              VARCHAR(50),
    fiatCurrency         CHARACTER(3),
    indicatedAmount      FLOAT,
    amount               FLOAT,
    totalFee             FLOAT,
    method               CHARACTER(20),
    status               CHARACTER(20),
    createTime           INTEGER,
    updateTime           INTEGER,
    UNIQUE(orderNo)
  )
`);
binanceDB.query(`
  CREATE TABLE IF NOT EXISTS withdrawal (
    withdrawalID INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNo              VARCHAR(50),
    fiatCurrency         CHARACTER(3),
    indicatedAmount      FLOAT,
    amount               FLOAT,
    totalFee             FLOAT,
    method               CHARACTER(20),
    status               CHARACTER(20),
    createTime           INTEGER,
    updateTime           INTEGER,
    UNIQUE(orderNo)
  )
`);

const binanceCacheDir = './cache/sapi/v1/fiat/orders';
for await (const dirEntry of Deno.readDir(binanceCacheDir)) {
	const cachedDataText = await Deno.readTextFile(`${binanceCacheDir}/${dirEntry.name}`);
  const cachedFiatOrders = JSON.parse(cachedDataText);
  if(!cachedFiatOrders.data) continue;
  const successfulFiatOrders = cachedFiatOrders.data.filter((cachedFiatOrder: any) => cachedFiatOrder.status === 'Successful');
  if(!successfulFiatOrders.length) continue;
  for (const successfulFiatOrder of successfulFiatOrders) {
    binanceDB.query(`INSERT OR IGNORE INTO ${dirEntry.name[0] ?'deposit' :'withdrawal'} (
      orderNo,
      fiatCurrency,
      indicatedAmount,
      amount,
      totalFee,
      method,
      status,
      createTime,
      updateTime
    ) VALUES (
      :orderNo,
      :fiatCurrency,
      :indicatedAmount,
      :amount,
      :totalFee,
      :method,
      :status,
      :createTime,
      :updateTime
    )`, successfulFiatOrder);
  }
}