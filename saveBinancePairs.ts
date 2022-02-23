import { binance } from "./api/binance.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS pair (
    pairID INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol                CHARACTER(20),
    baseAsset             CHARACTER(20),
    quoteAsset            CHARACTER(20),
    UNIQUE(symbol)
  )
`);
const exchangeInfoResponse = await binance.exchangeInfo();
if (exchangeInfoResponse.status !== 200) {
  console.error(exchangeInfoResponse.statusText);
  Deno.exit(1);
}
const exchangeInfo = exchangeInfoResponse.data;
for (const symbol of exchangeInfo.symbols) {
  binanceDB.query(
    `INSERT OR IGNORE INTO pair (
        symbol,
        baseAsset,
        quoteAsset
    ) VALUES ( ?, ?, ?)`,
    [symbol.symbol, symbol.baseAsset, symbol.quoteAsset],
  );
}
binanceDB.close();
