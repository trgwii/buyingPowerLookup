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
  "SELECT tradeID, symbol, executedQty, cummulativeQuoteQty, time AS 'dateUTCplus2', side FROM trade",
);
for (const tradeData of allTrades) {
  const [tradeID, symbol, executedQty, cummulativeQuoteQty, date, side] =
    tradeData;
  const dateUTC = new Date(Number(date));
  const createTime = dateUTC.getTime();
  console.log(`iteration symbol: ${symbol}`);
  const pairData = binanceDB.query(
    "SELECT baseAsset, quoteAsset FROM pair WHERE symbol = ?",
    [String(symbol)],
  );
  if (!pairData[0] || pairData[0].length !== 2) continue;
  const assetData = pairData[0];
  if (!Array.isArray(assetData) || assetData.length !== 2) continue;
  const [baseAsset, quoteAsset] = assetData;
  const avgPriceQuote = await fetchAssetPrice(
    String(quoteAsset),
    createTime,
  );
  if (avgPriceQuote && typeof avgPriceQuote === "number") {
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
        String(quoteAsset),
        side === "SELL" ? "IN" : "OUT",
        Number(cummulativeQuoteQty),
        Number(avgPriceQuote),
        createTime,
      ],
    );
    console.log(quoteAsset, avgPriceQuote);
  }
  const avgPriceBase = Number(cummulativeQuoteQty) * Number(avgPriceQuote) /
    Number(executedQty);
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
      String(baseAsset),
      side === "BUY" ? "IN" : "OUT",
      Number(executedQty),
      avgPriceBase,
      createTime,
    ],
  );
  console.log(baseAsset, avgPriceBase);
}
binanceDB.close();
