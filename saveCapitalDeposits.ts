import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS cDeposit (
    cDepositID INTEGER PRIMARY KEY AUTOINCREMENT,
    amount            FLOAT,
    coin            CHARACTER(20),
    network             CHARACTER(20),
    status            INTEGER,
    address             VARCHAR(100),
    addressTag            VARCHAR(100),
    txId            VARCHAR(100),
    insertTime            INTEGER,
    transferType            INTEGER,
    confirmTimes            CHARACTER(20),
    unlockConfirm             INTEGER,
    walletType            INTEGER,
    UNIQUE(txId)
  )
`);

const binanceCacheFile = './cache/sapi/v1/capital/deposit/hisrec.json';
const cachedDataText = await Deno.readTextFile(binanceCacheFile);
const cachedCapitalDeposits = JSON.parse(cachedDataText);
if(!cachedCapitalDeposits.length) Deno.exit(1);
const cachedSuccessfulCapitalDeposits = cachedCapitalDeposits.filter(
  ( cachedCapitalDeposit: any) => cachedCapitalDeposit.status === 1
);
for (const cachedSuccessfulCapitalDeposit of cachedSuccessfulCapitalDeposits) {
  console.log(cachedSuccessfulCapitalDeposit);
  binanceDB.query(`INSERT OR IGNORE INTO cDeposit (
    amount,
    coin,
    network,
    status,
    address,
    addressTag,
    txId,
    insertTime,
    transferType,
    confirmTimes,
    unlockConfirm,
    walletType
  ) VALUES (
    :amount,
    :coin,
    :network,
    :status,
    :address,
    :addressTag,
    :txId,
    :insertTime,
    :transferType,
    :confirmTimes,
    :unlockConfirm,
    :walletType
  )`, cachedSuccessfulCapitalDeposit);
}