import {
  aggregateByYear,
  calculateFIFOCapitalGains,
  DB,
  PQueue,
} from "./deps.ts";
import type { Operation } from "./deps.ts";
import { fetchAssetPrice } from "./api/binance/price.ts";
import { apiConcurrency } from "./config.ts";

const db = new DB("db/binance.db");

const allTransaction = db.query<
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
const assets = {};
const prices = {};
const queue = new PQueue({
  concurrency: apiConcurrency,
});
const pairs = db.query(
  `SELECT baseAsset, quoteAsset, symbol
  FROM pair`,
);
for (
  const [coin, amount] of Object.entries(assetAmountCheck).sort(
    function (a, b) {
      return a[0] < b[0] ? -1 : 1;
    },
  )
) {
  const assetPrice = fetchAssetPrice(coin, 1640991600000, pairs, queue);
  assets[coin] = Number(amount);
  prices[coin] = assetPrice;
}
let smallBalancesConcat = "";
let smallBalancesCount = 0;
let smallBalancesSum = 0;
let totalBalancesSum = 0;
for (const coin in assets) {
  if (Object.prototype.hasOwnProperty.call(assets, coin)) {
    const assetPriceRequest = await prices[coin];
    const assetPrice = typeof assetPriceRequest === "number"
      ? assetPriceRequest
      : null;
    if (!assetPrice || assets[coin] * assetPrice <= 1) {
      smallBalancesConcat += `${coin}, `;
      smallBalancesCount++;
      smallBalancesSum += !assetPrice ? 0 : assets[coin] * assetPrice;
      delete assets[coin];
    } else {
      totalBalancesSum += assets[coin] * assetPrice;
    }
  }
}
console.log(assets);
console.log("smallBalancesConcat", smallBalancesConcat);
console.log("smallBalancesCount", smallBalancesCount);
console.log("smallBalancesSum", smallBalancesSum);
console.log("totalBalancesSum", totalBalancesSum);
console.log(gainsByYear);
console.log(missingCosts);
