import { binance } from './api/binance.ts';
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

const capitalDepositsResponse = await binance.depositHistory();
const capitalDeposits = capitalDepositsResponse.data;
if(!capitalDeposits.length) Deno.exit(1);

for (const capitalDeposit of capitalDeposits) {
  console.log(capitalDeposit);
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
  )`, capitalDeposit);
}
binanceDB.close();
