import { fetchAssetPrice } from "./api/binance.ts";
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
const allDividends = binanceDB.query(
  "SELECT dividendID, asset, amount, divTime FROM dividend",
);
for (const dividendData of allDividends) {
  const [dividendID, asset, amount, date] = dividendData;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime();
  console.log(`iteration asset: ${asset}`);
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
      "dividend",
      Number(dividendID),
      String(asset),
      "IN",
      Number(amount),
      0,
      createTime,
    ],
  );
}
binanceDB.close();
