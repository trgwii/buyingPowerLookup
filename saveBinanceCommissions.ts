import { autoRetry, binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
import { scrambleArray } from "./utils.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS commission (
    commissionID INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol                CHARACTER(20),
    id                    INTEGER,
    orderId               INTEGER,
    orderListId           INTEGER,
    clientOrderId         VARCHAR(50),
    price                 FLOAT,
    qty                   FLOAT,
    quoteQty              FLOAT,
    commission            FLOAT,
    commissionAsset       CHARACTER(20),
    time                  INTEGER,
    isBuyer               BOOLEAN,
    isMaker               BOOLEAN,
    isBestMatch           BOOLEAN,
    UNIQUE(orderId)
  )
`);
const pairs = binanceDB.query<[string]>("SELECT symbol FROM pair");
const allSymbols = pairs.map(
  (pair) => pair[0],
);
console.log(allSymbols);
const allSymbolsScrambled = scrambleArray(allSymbols);

for (const symbol of allSymbolsScrambled) {
  console.log(`trying requesting data for ${symbol}`);
  const allCommissionsResponse = await autoRetry(() =>
    binance.myTrades(symbol)
  );
  if (!allCommissionsResponse) break;
  const allCommissions = allCommissionsResponse.data;
  if (!allCommissions.length) continue;
  for (const commission of allCommissions) {
    if (
      Number(commission.commission) <= 0
    ) {
      continue;
    }
    console.log(commission);
    binanceDB.query(
      `INSERT OR IGNORE INTO commission (
        symbol,
        id,
        orderId,
        orderListId,
        clientOrderId,
        price,
        qty,
        quoteQty,
        commission,
        commissionAsset,
        time,
        isBuyer,
        isMaker,
        isBestMatch
    ) VALUES (
      :symbol,
      :id,
      :orderId,
      :orderListId,
      :clientOrderId,
      :price,
      :qty,
      :quoteQty,
      :commission,
      :commissionAsset,
      :time,
      :isBuyer,
      :isMaker,
      :isBestMatch
    )`,
      commission,
    );
  }
}
binanceDB.close();
