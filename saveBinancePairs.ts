import { BinancePair } from "./api/api2db.ts";
import { autoRetry, binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");
const binancePair = BinancePair(binanceDB);
binancePair.init();
const exchangeInfoResponse = await autoRetry(() => binance.exchangeInfo());
if (!exchangeInfoResponse || !exchangeInfoResponse.data) {
  console.error(exchangeInfoResponse);
  Deno.exit(1);
}
const exchangeInfo = exchangeInfoResponse.data;
for (const symbol of exchangeInfo.symbols) {
  binancePair.add([symbol.symbol, symbol.baseAsset, symbol.quoteAsset]);
}
binanceDB.close();
