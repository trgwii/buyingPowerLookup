import { aggregateByYear, calculateFIFOCapitalGains, DB } from "./deps.ts";
import type { Operation } from "./deps.ts";

const binanceDB = new DB("db/binance.db");

const allTransaction = binanceDB.query<
  [number, number, number, string, "IN" | "OUT"]
>( //1640991600000 <= until 2021
  `SELECT amount, timestamp, price, asset, side FROM \`transaction\` WHERE timestamp < 1640991600000 AND asset != 'EUR' ORDER BY timestamp ASC`,
);
const operationHistory = allTransaction.map(
  (operation: any): Operation => ({
    amount: operation[0],
    date: new Date(operation[1]),
    price: operation[2],
    symbol: operation[3],
    type: operation[4] === "IN" ? "BUY" : "SELL",
  }),
);
const assetAmountCheck = {};
/*
const missingAssets = {};
*/
let missingCosts = 0;
for (const operationEntry of operationHistory) {
  if (!(operationEntry.symbol in assetAmountCheck)) {
    assetAmountCheck[operationEntry.symbol] = 0;
  }
  /*
  if (!(operationEntry.symbol in missingAssets)) {
    missingAssets[operationEntry.symbol] = 0;
  }
  */
  assetAmountCheck[operationEntry.symbol] += operationEntry.type === "BUY"
    ? operationEntry.amount
    : -operationEntry.amount;
  /*
  console.log(
    operationEntry.symbol,
    operationEntry.amount,
    operationEntry.date,
    operationEntry.type,
    assetAmountCheck["ALGO"],
  );
  */
  if (
    operationEntry.type === "SELL" &&
    assetAmountCheck[operationEntry.symbol] < 0
  ) {
    /*
    missingAssets[operationEntry.symbol] += 1.00000000001 *
      Math.abs(assetAmountCheck[operationEntry.symbol]);
      */
    missingCosts += operationEntry.price * 1.00000000001 *
      Math.abs(assetAmountCheck[operationEntry.symbol]);
    operationHistory.push({
      amount: 1.00000000001 *
        Math.abs(assetAmountCheck[operationEntry.symbol]),
      date: new Date(
        operationEntry.date.getTime() - 1,
      ),
      price: 0,
      symbol: operationEntry.symbol,
      type: "BUY",
    });
    assetAmountCheck[operationEntry.symbol] = 0;
  }
}

const capitalGains = calculateFIFOCapitalGains(operationHistory);

const gainsByYear = aggregateByYear(capitalGains);

// console.log(missingAssets);
console.log(gainsByYear);
console.log(missingCosts);
