import { calculateFIFOCapitalGains, DB } from "./deps.ts";
import type { Operation } from "./deps.ts";

const binanceDB = new DB("db/binance.db");

const allTrades = binanceDB.query(
  `SELECT
    CASE WHEN side = 'BUY'
    THEN cummulativeQuoteQty
    ELSE executedQty
    END,
    datetime(time/1000, 'unixepoch') AS 'datetime',
    CASE WHEN side LIKE 'BUY'
    THEN fiatPrice
    ELSE fiatPrice
    END,
    CASE WHEN side = 'BUY'
    THEN pair.baseAsset
    ELSE pair.quoteAsset
    END,
    side
    FROM trade
    JOIN tradeFiatPrice
    ON trade.tradeID = tradeFiatPrice.tradeID
    JOIN pair
    ON trade.symbol = pair.symbol
    WHERE datetime LIKE '2021%'`,
);
const operationHistory = allTrades.map(
  (operation: any): Operation => ({
    amount: operation[0],
    date: new Date(operation[1]),
    price: operation[2],
    symbol: operation[3],
    type: operation[4],
  }),
);
const capitalGains = calculateFIFOCapitalGains(operationHistory);

console.log(capitalGains);
