import { DB } from "./deps.ts";

const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS \`transaction\` (
    transactionID INTEGER PRIMARY KEY AUTOINCREMENT,
    type                  CHARACTER(20),
    refId                 INTEGER,
    asset                 CHARACTER(20),
    side                  BOOLEAN,
    amount                FLOAT,
    price                 FLOAT,
    timestamp             INTEGER,
    UNIQUE(type, refId, side)
  )
`);
const allCommissions = binanceDB.query(
  "SELECT commissionID, symbol AS 's', qty AS 'q1', quoteQty AS 'q2', `time` as 'date', isBuyer AS 'i', commission, commissionAsset FROM commission",
);
for (const tradeData of allCommissions) {
  const [commissionID, , , , date, , commission, commissionAsset] = tradeData;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime() + 1;
  binanceDB.query(
    `INSERT OR IGNORE INTO \`transaction\` (
          type,
          refId,
          asset,
          side,
          amount,
          price,
          timestamp
        ) VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )`,
    [
      "commission",
      Number(commissionID),
      String(commissionAsset),
      "OUT",
      Number(commission),
      0,
      Number(createTime),
    ],
  );
  console.log("adding commission for asset:", commissionAsset, commission);
}
binanceDB.close();
