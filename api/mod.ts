import { apiDB, helpers, Order, Query, RouterContext } from "../deps.ts";
import { propIsNaN } from "../utils.ts";

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
  const data = [...db.query(query).asObjects()];
  ctx.response.body = JSON.stringify(data);
  return;
};
