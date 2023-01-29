import { fiatCurrency } from "../config.ts";
import { calculateCostBasis, Operation, RouterContext } from "../deps.ts";
import { Order, Query } from "../deps.ts";
import { endpoints } from "./mod.ts";

const returnAssetChange = (
  operation: Operation,
  operationHistory: Operation[],
) => ({
  asset: operation.symbol,
  amount: operation.type === "BUY" ? operation.amount : -operation.amount,
  costBasis: operation.type === "BUY"
    ? operation.amount * operation.price
    : -1 * calculateCostBasis(operationHistory, operation).costBasis,
});
const sort = (key: string, dir: "ASC" | "DESC", a: any, b: any) => {
  const first = typeof a[key] === "object" && key === "date"
    ? a[key].getTime()
    : a[key];
  const second = typeof b[key] === "object" && key === "date"
    ? b[key].getTime()
    : b[key];
  if (first < second) {
    return dir === "ASC" ? -1 : 1;
  }
  if (first > second) {
    return dir === "ASC" ? 1 : -1;
  }
  return 0;
};
const sortCostBasis = (a: any, b: any) => sort("costBasis", "DESC", a, b);
const sortTimestamp = (a: any, b: any) => sort("timestamp", "ASC", a, b);
const sortDate = (a: any, b: any) => sort("date", "ASC", a, b);

export const dashboard = (
  ctx: RouterContext<
    "/db/dashboard",
    Record<string | number, string | undefined>,
    Record<string, any>
  >,
) => {
  const query = new Query()
    .select("*")
    .table("transaction")
    .where(`asset != '${fiatCurrency}'`)
    .where("timestamp < 1672531200000")
    .order(Order.by("timestamp").asc)
    .build();

  const transactions = Object.values(endpoints)
    .map((db) => [...db.query(query).asObjects()])
    .flat(1)
    .sort(sortTimestamp);

  const operationHistory: Operation[] = [];
  for (const transaction of transactions) {
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
  for (const operationEntry of operationHistory) {
    if (!(operationEntry.symbol in assetAmountCheck)) {
      assetAmountCheck[operationEntry.symbol] = 0;
    }
    assetAmountCheck[operationEntry.symbol] += operationEntry.type === "BUY"
      ? operationEntry.amount
      : -operationEntry.amount;
    if (
      operationEntry.type === "SELL" &&
      assetAmountCheck[operationEntry.symbol] < 0
    ) {
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
  const operations = operationHistory.sort(sortDate);
  const assetAmountList: Array<any> = [];
  for (const operation of operations) {
    const assetAmountIndex = assetAmountList.findIndex(
      (assetAmout) => assetAmout.asset === operation.symbol,
    );
    const assetChange = returnAssetChange(operation, operations);
    if (assetAmountIndex >= 0) {
      assetAmountList[assetAmountIndex].asset = assetChange.asset;
      assetAmountList[assetAmountIndex].amount += assetChange.amount;
      assetAmountList[assetAmountIndex].costBasis += assetChange.costBasis;
    } else {
      assetAmountList.push(assetChange);
    }
  }
  ctx.response.status = 200;
  ctx.response.headers.set("Content-Type", "text/json");
  ctx.response.body = JSON.stringify(
    assetAmountList.map(
      (assetAmount) => ({
        ...assetAmount,
        costBasis: Number(assetAmount.costBasis.toFixed(2)),
      }),
    )
      .filter((assetAmount) => assetAmount.costBasis > 1)
      .sort(sortCostBasis),
  );
  return;
};
