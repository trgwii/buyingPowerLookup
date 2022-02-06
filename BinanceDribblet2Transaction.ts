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
const allDribblets = binanceDB.query(
  "SELECT dribbletID, fromAsset, 'BNB' AS 'toAsset', amount as 'fromAmount', (transferedAmount - serviceChargeAmount) AS 'toAmount', operateTime AS 'dateUTCplus2' FROM dribblet",
);
for (const dribbletData of allDribblets) {
  const [dribbletID, fromAsset, toAsset, fromAmount, toAmount, dateUTCplus2] =
    dribbletData;
  const dateUTC = new Date(Number(dateUTCplus2));
  dateUTC.setHours(dateUTC.getHours() - 2);
  const createTime = dateUTC.getTime();
  console.log(`iteration pair: ${fromAsset}${toAsset}`);

  const avgPriceFromAsset = await fetchAssetPrice(
    String(fromAsset),
    createTime,
  );
  if (avgPriceFromAsset && typeof avgPriceFromAsset === "number") {
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
        "dribblet",
        Number(dribbletID),
        String(fromAsset),
        "OUT",
        Number(fromAmount),
        Number(avgPriceFromAsset),
        createTime,
      ],
    );
    console.log(fromAsset, avgPriceFromAsset);
  }
  const avgPriceToAsset = await fetchAssetPrice(
    String(toAsset),
    createTime,
  );
  if (avgPriceToAsset && typeof avgPriceToAsset === "number") {
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
        "dribblet",
        Number(dribbletID),
        String(toAsset),
        "IN",
        Number(toAmount),
        avgPriceToAsset,
        createTime,
      ],
    );
    console.log(toAsset, avgPriceToAsset);
  }
}
binanceDB.close();
