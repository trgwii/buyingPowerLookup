import { BinanceTrade } from "./api/api2db.ts";
import { autoRetry, binance } from "./api/binance.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";
import { scrambleArray } from "./utils.ts";

const queue = new PQueue({
  concurrency: apiConcurrency / 10,
});

const binanceDB = new DB("db/binance.db");
const symbols = binanceDB.query("SELECT symbol FROM pair").map(
  (pair: any) => pair[0],
);

const allAssetTradeRequests = scrambleArray(symbols).map((symbol) =>
  queue.add(() => autoRetry(() => binance.allOrders(symbol)))
);
const binanceTrade = BinanceTrade(binanceDB);
binanceTrade.init();
for (const assetTradeRequests of allAssetTradeRequests) {
  const assetTradesResponse = await assetTradeRequests;
  if (!assetTradesResponse) break;
  const assetTrades = assetTradesResponse.data.filter((order: any) =>
    Number(order.executedQty) > 0 && Number(order.cummulativeQuoteQty) > 0
  );
  if (!assetTrades.length) continue;
  for (const assetTrade of assetTrades) {
    console.log(assetTrade);
    binanceTrade.add(assetTrade);
  }
}
binanceDB.close();
