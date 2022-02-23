import { binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
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
    txKey                    VARCHAR(100),
    UNIQUE(txId)
  )
`);

const capitalWithdrawResponse = await binance.withdrawHistory();
if (capitalWithdrawResponse.status !== 200) {
  console.log(capitalWithdrawResponse.statusText);
  Deno.exit(1);
}
const capitalWithdraws = capitalWithdrawResponse.data;
const successfulCapitalWithdraws = capitalWithdraws.filter(
  (capitalWithdraws) => capitalWithdraws.status === 6,
);
if (!successfulCapitalWithdraws.length) Deno.exit(1);
for (const successfulCapitalWithdraw of successfulCapitalWithdraws) {
  console.log(successfulCapitalWithdraw);
  binanceDB.query(
    `INSERT OR IGNORE INTO cWithdraw (
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
    walletType,
    txKey
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
    :walletType,
    :txKey
  )`,
    successfulCapitalWithdraw,
  );
}
binanceDB.close();
