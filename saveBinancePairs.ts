import { BinancePair } from "./api/api2db.ts";
import { binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");
const binancePair = BinancePair(binanceDB);
binancePair.init();
const exchangeInfoResponse = await binance.exchangeInfo();
if (exchangeInfoResponse.status !== 200) {
  console.error(exchangeInfoResponse.statusText);
  Deno.exit(1);
}
const exchangeInfo = exchangeInfoResponse.data;
for (const symbol of exchangeInfo.symbols) {
  binancePair.add([symbol.symbol, symbol.baseAsset, symbol.quoteAsset]);
}
binanceDB.close();
