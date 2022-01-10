import { binance } from "./api/binance.ts";
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
const fiatDepositResponse = await binance.depositWithdrawalHistory(0);
if (fiatDepositResponse.status !== 200) {
  console.log(fiatDepositResponse.statusText);
  Deno.exit(1);
}
const fiatDepositData = fiatDepositResponse.data;
const fiatDeposits = fiatDepositData.data;
const successfulFiatDeposits = fiatDeposits.filter(
  (fiatDeposit: any) => fiatDeposit.status === "Successful",
);
if (!successfulFiatDeposits.length) Deno.exit(1);
for (const successfulFiatDeposit of successfulFiatDeposits) {
  binanceDB.query(
    `INSERT OR IGNORE INTO deposit (
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
  )`,
    successfulFiatDeposit,
  );
}
binanceDB.close();
