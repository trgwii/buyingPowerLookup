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
const allTrades = binanceDB.query(
  "SELECT conversionID, fromAsset, toAsset, fromAmount, toAmount, createTime FROM conversion",
);
for (const tradeData of allTrades) {
  const [conversionID, fromAsset, toAsset, fromAmount, toAmount, createTime] =
    tradeData;
  console.log(`iteration pair: ${fromAsset}${toAsset}`);

  const avgPriceFromAmount = await fetchAssetPrice(
    String(fromAsset),
    Number(createTime),
  );
  if (avgPriceFromAmount && typeof avgPriceFromAmount === "number") {
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
        "conversion",
        Number(conversionID),
        String(fromAsset),
        "OUT",
        Number(fromAmount),
        Number(avgPriceFromAmount),
        Number(createTime),
      ],
    );
    console.log(fromAsset, avgPriceFromAmount);
  }
  const avgPriceToAsset = await fetchAssetPrice(
    String(toAsset),
    Number(createTime),
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
        "conversion",
        Number(conversionID),
        String(toAsset),
        "IN",
        Number(toAmount),
        avgPriceToAsset,
        Number(createTime),
      ],
    );
    console.log(toAsset, avgPriceToAsset);
  }
}
binanceDB.close();
