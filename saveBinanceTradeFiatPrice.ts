import { fiatCurrency } from "./config.ts";
import {
  autoRetry,
  binance,
  fetchAssetPrice,
  getAvgPrice,
} from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS tradeFiatPrice (
    tradeValueID INTEGER PRIMARY KEY AUTOINCREMENT,
    tradeID                  INTEGER,
    fiatPrice                FLOAT,
    FOREIGN KEY(tradeID) REFERENCES trade(tradeID)
  )
`);

const allTrades = binanceDB.query(
  "SELECT tradeID, symbol, time, side FROM trade",
);
for (const tradeData of allTrades) {
  const [tradeID, symbol, time, side] = tradeData;
  console.log(`iteration symbol: ${symbol}`);
  const pairData = binanceDB.query(
    "SELECT baseAsset, quoteAsset FROM pair WHERE symbol = ?",
    [String(symbol)],
  );
  if (!pairData[0] || pairData[0].length !== 2) continue;
  const assetData = pairData[0];
  const asset = side === "SELL" ? String(assetData[1]) : String(assetData[0]);
  const avgPrice = await fetchAssetPrice(String(asset), Number(time));
  if (!avgPrice || typeof avgPrice !== "number") continue;
  binanceDB.query(
    `INSERT OR IGNORE INTO tradeFiatPrice (
        tradeID,
        fiatPrice
    ) VALUES ( ?, ?)`,
    [
      Number(tradeID),
      Number(avgPrice),
    ],
  );
  console.log(asset, avgPrice);
}
binanceDB.close();
