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
  "SELECT tradeID, symbol, origQty, cummulativeQuoteQty, time AS 'dateUTCplus2', side FROM trade",
);
for (const tradeData of allTrades) {
  const [tradeID, symbol, origQty, cummulativeQuoteQty, dateUTCplus2, side] =
    tradeData;
  const dateUTC = new Date(Number(dateUTCplus2));
  dateUTC.setHours(dateUTC.getHours() - 2);
  const time = dateUTC.getTime();
  console.log(`iteration symbol: ${symbol}`);
  const pairData = binanceDB.query(
    "SELECT baseAsset, quoteAsset FROM pair WHERE symbol = ?",
    [String(symbol)],
  );
  if (!pairData[0] || pairData[0].length !== 2) continue;
  const assetData = pairData[0];
  if (!Array.isArray(assetData) || assetData.length !== 2) continue;
  const [baseAsset, quoteAsset] = assetData;
  const avgPriceQuote = await fetchAssetPrice(String(quoteAsset), Number(time));
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
        Number(time),
      ],
    );
    console.log(quoteAsset, avgPriceQuote);
  }
  const avgPriceBase = Number(cummulativeQuoteQty) * Number(avgPriceQuote) /
    Number(origQty);
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
      Number(origQty),
      avgPriceBase,
      Number(time),
    ],
  );
  console.log(baseAsset, avgPriceBase);
}
binanceDB.close();