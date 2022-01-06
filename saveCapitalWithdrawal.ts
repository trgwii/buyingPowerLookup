import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS cWithdraw (
    id                       VARCHAR(100),
    amount                   FLOAT,
    transactionFee           FLOAT,
    coin                     CHARACTER(20),
    status                   INTEGER,
    address                  VARCHAR(100),
    txId                     VARCHAR(100),
    applyTime                VARCHAR(50),
    network                  CHARACTER(20),
    transferType             INTEGER,
    info                     VARCHAR(100),
    confirmNo                INTEGER,
    walletType               INTEGER,
    UNIQUE(txId)
  )
`);

const binanceCacheFile = './cache/sapi/v1/capital/withdraw/history.json';
const cachedDataText = await Deno.readTextFile(binanceCacheFile);
const cachedCapitalWithdraws = JSON.parse(cachedDataText);
if(!cachedCapitalWithdraws.length) Deno.exit(1);
const cachedSuccessfulCapitalWithdraws = cachedCapitalWithdraws.filter(
  ( cachedCapitalWithdraw: any) => cachedCapitalWithdraw.status === 6
);
for (const cachedSuccessfulCapitalWithdraw of cachedSuccessfulCapitalWithdraws) {
  console.log(cachedSuccessfulCapitalWithdraw);
  binanceDB.query(`INSERT OR IGNORE INTO cWithdraw (
    id,
    amount,
    transactionFee,
    coin,
    status,
    address,
    txId,
    applyTime,
    network,
    transferType,
    info,
    confirmNo,
    walletType
  ) VALUES (
    :id,
    :amount,
    :transactionFee,
    :coin,
    :status,
    :address,
    :txId,
    :applyTime,
    :network,
    :transferType,
    :info,
    :confirmNo,
    :walletType
  )`, cachedSuccessfulCapitalWithdraw);
}