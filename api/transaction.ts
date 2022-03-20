import { fiatCurrency } from "../config.ts";
import {
  aggregateByYear,
  apiDB,
  calculateCostBasis,
  calculateFIFOCapitalGains,
  Operation,
  Order,
  Query,
} from "../deps.ts";

export const transaction = (
  requestedData: Record<string, any>[],
  db: apiDB,
  table: string,
) => {
  const timestamps = requestedData.map((transaction) => transaction.timestamp);
  const queryAll = new Query()
    .select("*")
    .table(table)
    .where(`asset != '${fiatCurrency}'`)
    .where(`timestamp <= '${Math.max(...timestamps)}'`)
    .order(Order.by("timestamp").asc)
    .build();
  const allTransactions = [...db.query(queryAll).asObjects()];

  const operationHistory: Operation[] = [];
  for (const transaction of allTransactions) {
    operationHistory.push({
      amount: transaction.amount,
      date: new Date(transaction.timestamp),
      price: ["commission", "dividend"].includes(transaction.type)
        ? 0
        : transaction.price,
      symbol: transaction.asset,
      type: transaction.side === "IN" ? "BUY" : "SELL",
    } as Operation);
    if (transaction.feeAmount > 0) {
      operationHistory.push({
        amount: transaction.feeAmount,
        date: new Date(Number(transaction.timestamp) + 1),
        price: 0,
        symbol: transaction.asset,
        type: "SELL",
      } as Operation);
    }
  }
  const assetAmountCheck: Record<string, number> = {};
  let missingCosts = 0;
  for (const operationEntry of operationHistory) {
    if (!(operationEntry.symbol in assetAmountCheck)) {
      assetAmountCheck[operationEntry.symbol] = 0;
    }
    assetAmountCheck[operationEntry.symbol] += operationEntry.type === "BUY"
      ? operationEntry.amount
      : -operationEntry.amount;
    console.log(
      operationEntry.symbol,
      operationEntry.type,
      assetAmountCheck[operationEntry.symbol],
      "missing amount",
      operationEntry.type === "SELL" &&
        assetAmountCheck[operationEntry.symbol] < 0 && 1.00000000001 *
          Math.abs(assetAmountCheck[operationEntry.symbol]),
    );
    if (
      operationEntry.type === "SELL" &&
      assetAmountCheck[operationEntry.symbol] < 0
    ) {
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
  const gains = [...calculateFIFOCapitalGains(operationHistory)];
  console.log(aggregateByYear(gains));
  console.log(missingCosts);

  const relevantGains = gains.filter((gain) =>
    timestamps.includes(gain.sale.date.getTime())
  );
  const relevantCostBasis = operationHistory.filter(
    (operationEntry) =>
      timestamps.includes(operationEntry.date.getTime()) &&
      operationEntry.type === "SELL",
  ).map((operationEntry) =>
    calculateCostBasis(operationHistory, operationEntry)
  );
  const data = {
    transactions: requestedData,
    gains: relevantGains,
    costs: relevantCostBasis,
  };

  return JSON.stringify(data);
};
