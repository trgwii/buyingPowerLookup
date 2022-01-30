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
  "SELECT tradeID, symbol, origQty, cummulativeQuoteQty, time, side FROM trade",
);
for (const tradeData of allTrades) {
  const [tradeID, symbol, origQty, cummulativeQuoteQty, time, side] = tradeData;
  console.log(`iteration symbol: ${symbol}`);
  const pairData = binanceDB.query(
    "SELECT baseAsset, quoteAsset FROM pair WHERE symbol = ?",
    [String(symbol)],
  );
  if (!pairData[0] || pairData[0].length !== 2) continue;
  const assetData = pairData[0];
  if (!Array.isArray(assetData) || assetData.length !== 2) continue;
  const [assetIn, assetOut] = assetData;
  const avgPriceIn = await fetchAssetPrice(String(assetIn), Number(time));
  if (avgPriceIn && typeof avgPriceIn === "number") {
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
        "trade",
        Number(tradeID),
        String(assetIn),
        side === "BUY" ? "IN" : "OUT",
        Number(origQty),
        Number(avgPriceIn),
        Number(time),
      ],
    );
    console.log(assetOut, avgPriceIn);
  }
  const avgPriceOut = await fetchAssetPrice(String(assetOut), Number(time));
  if (avgPriceOut && typeof avgPriceOut === "number") {
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
        "trade",
        Number(tradeID),
        String(assetOut),
        side === "SELL" ? "IN" : "OUT",
        Number(cummulativeQuoteQty),
        Number(avgPriceOut),
        Number(time),
      ],
    );
    console.log(assetOut, avgPriceOut);
  }
}
binanceDB.close();
