import { BinanceCommission } from "./api/api2db.ts";
import { autoRetry, binance } from "./api/binance.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";
import { scrambleArray } from "./utils.ts";

const queue = new PQueue({
  concurrency: apiConcurrency / 10,
});

const binanceDB = new DB("db/binance.db");

const binanceCommission = BinanceCommission(binanceDB);
binanceCommission.init();

const pairs = binanceDB.query<[string]>("SELECT symbol FROM pair");
const symbols = pairs.map(
  (pair) => pair[0],
);

const allAssetCommissionsRequests = scrambleArray(symbols).map((symbol) =>
  queue.add(() => autoRetry(() => binance.myTrades(symbol)))
);

for (const assetCommissionsRequests of allAssetCommissionsRequests) {
  const assetCommissionsResponse = await assetCommissionsRequests;
  if (!assetCommissionsResponse) break;
  const assetCommissions = assetCommissionsResponse.data;
  if (!assetCommissions.length) continue;
  for (const assetCommission of assetCommissions) {
    if (
      Number(assetCommission.commission) <= 0
    ) {
      continue;
    }
    console.log(assetCommission);
    binanceCommission.add(assetCommission);
  }
}
binanceDB.close();
