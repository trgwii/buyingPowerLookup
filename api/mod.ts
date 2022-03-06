import {
  aggregateByYear,
  calculateCostBasis,
  calculateFIFOCapitalGains,
} from "../deps.ts";
import type { Operation } from "../deps.ts";
import { apiDB, helpers, Order, Query, RouterContext } from "../deps.ts";
import { propIsNaN } from "../utils.ts";
import { fiatCurrency } from "../config.ts";

const NaNError = (
  ctx: any,
  propName: string,
) => {
  ctx.response.body = JSON.stringify({
    error: `${propName} is not a number`,
  });
  ctx.response.status = 400;
  return ctx;
};

const endpoints = {
  binance: new apiDB("db/binance.db"),
};

export const db = (
  ctx: RouterContext<
    "/db/:endpoint/:table",
    {
      endpoint: string;
    } & {
      table: string;
    } & Record<string | number, string | undefined>,
    Record<string, any>
  >,
) => {
  const requestUrl = ctx.request.url.href;
  const requestObj = Object.fromEntries(new URL(requestUrl).searchParams);
  ctx.response.status = 200;
  ctx.response.headers.set("Content-Type", "text/json");
  const { endpoint, table } = helpers.getQuery(ctx, { mergeParams: true });
  if (!(endpoint in endpoints)) {
    ctx.response.body = JSON.stringify({
      error: "endpoint does not exist",
    });
    return;
  }
  const db = endpoints[endpoint as keyof typeof endpoints];
  const doesTableExist = db.query(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}';`,
  );
  if ([...doesTableExist].length < 1) {
    ctx.response.body = JSON.stringify({
      error: "table does not exist",
    });
    return;
  }
  if (propIsNaN(requestObj, "id")) return NaNError(ctx, "id");
  if (propIsNaN(requestObj, "offset")) return NaNError(ctx, "offset");
  if (propIsNaN(requestObj, "limit")) return NaNError(ctx, "limit");

  const maxRows = 1000;
  const limit = Math.min(maxRows, Number(requestObj.limit ?? Infinity));
  const offset = Number(requestObj.offset ?? 0);
  const id = requestObj.id ? `${table}ID = ${Number(requestObj.id)}` : "true";
  const query = new Query()
    .select("*")
    .table(table)
    .where(id)
    .limit(offset, limit)
    .order(Order.by("timestamp").asc)
    .build();
  const requestedData = [...db.query(query).asObjects()];
  if (table === "transaction") {
    const timestamps = requestedData.map((transaction) =>
      transaction.timestamp
    );
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
    const assetAmountCheck = {};
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
    ctx.response.body = JSON.stringify(data);
    return;
  }

  ctx.response.body = JSON.stringify(requestedData);
  return;
};
