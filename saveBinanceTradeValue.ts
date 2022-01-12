import { fiatCurrency } from "./config.ts";
import { autoRetry, binance } from "./api/binance.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS tradeValue (
    tradeValueID INTEGER PRIMARY KEY AUTOINCREMENT,
    id                  TEXT,
    value               FLOAT,
    UNIQUE(id)
  )
`);

const allTrades = binanceDB.query(
  "SELECT tradeID, symbol, time, side, price, 'conversion' AS 'tableName' FROM trade",
);
for (const tradeData of allTrades) {
  const [tradeID, symbol, time, side, price, tableName] = tradeData;
  console.log(`iteration symbol: ${symbol}`);
  const quoteAssetData = binanceDB.query(
    "SELECT quoteAsset FROM pair WHERE symbol = ?",
    [String(symbol)],
  );
  const quoteAsset = String(quoteAssetData[0]);
  if (quoteAsset === fiatCurrency.toUpperCase()) {
    binanceDB.query(
      `INSERT OR IGNORE INTO tradeValue (
                id,
                value
            ) VALUES ( ?, ?)`,
      [
        String(tableName) + String(tradeID),
        Number(price),
      ],
    );
    continue;
  }
  const referenceSymbolData = binanceDB.query(
    "SELECT symbol FROM pair WHERE symbol IN (?,?)",
    [`${fiatCurrency}${quoteAsset}`, `${quoteAsset}${fiatCurrency}`],
  );
  const referenceSymbol = referenceSymbolData[0];
  if (!referenceSymbol) continue;
  console.log(`trying requesting data for ${referenceSymbol}`);
  const klinesResponse = await autoRetry(
    async () =>
      await binance.klines(
        String(referenceSymbol),
        "1m",
        { limit: 1, startTime: new Date(Number(time)).setSeconds(0, 0) },
      ),
  );
  if (!klinesResponse) break;
  if (klinesResponse === true) {
    allTrades.unshift(tradeData);
    console.log(`adding ${symbol} back to the list`);
    continue;
  }
  const klinesData = klinesResponse.data;
  const firstCandle = klinesData[0];
  const candleOpenPrice = Number(firstCandle[1]);
  const candleClosePrice = Number(firstCandle[4]);
  const candleAvgPrice = (candleOpenPrice + candleClosePrice) / 2;
  const referencePrice = String(referenceSymbol).endsWith(fiatCurrency)
    ? candleAvgPrice
    : String(side) === "BUY"
    ? 1 / candleAvgPrice
    : Number(price) / candleAvgPrice;
  binanceDB.query(
    `INSERT OR IGNORE INTO tradeValue (
        id,
        value
    ) VALUES ( ?, ?)`,
    [
      String(tableName) + String(tradeID),
      Number(referencePrice),
    ],
  );
  console.log(quoteAsset, candleAvgPrice);
}
binanceDB.close();
