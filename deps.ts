export { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
export * as z from "https://deno.land/x/zod@v3.11.6/mod.ts";
export { existsSync } from "https://deno.land/std@0.126.0/fs/mod.ts";
export { sleep } from "https://deno.land/x/sleep@v1.2.1/mod.ts";
export { DB } from "https://deno.land/x/sqlite@v3.2.1/mod.ts";
export type { Row } from "https://deno.land/x/sqlite@v3.2.1/mod.ts";
export { DB as apiDB } from "https://deno.land/x/sqlite@v2.4.1/mod.ts";
export { Order, Query } from "https://deno.land/x/sql_builder@v1.9.0/mod.ts";
import { Spot as _Spot } from "https://esm.sh/@binance/connector@1.7.0?dev";
import type { SpotClass } from "./api/binance/Spot.d.ts";
export const Spot: typeof SpotClass = _Spot;
export { elements, renderHTML } from "https://deno.land/x/hyperactive/mod.ts";

import {
  parse as parseCsv,
} from "https://deno.land/std@0.126.0/encoding/csv.ts";

import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";
import type Task from "https://deno.land/x/p_queue@1.0.1/mod.ts";
export {
  Application,
  helpers,
  Router,
} from "https://deno.land/x/oak@v10.4.0/mod.ts";
export type { RouterContext } from "https://deno.land/x/oak@v10.4.0/mod.ts";
import type {
  CapitalGains,
  Operation,
} from "https://esm.sh/fifo-capital-gains-js@0.1.1?dev";
/**
 * https://github.com/bernardobelchior/fifo-capital-gains-js/blob/9ab353d610b7c8f477dfa3241c1619f3ac799471/src/capital-gains.ts#L45
 * calculateCostBasis created from calculateCapitalGainsForSale ^
 */
export function calculateCostBasis(
  operationHistory: Operation[],
  sale: Operation,
): { costBasis: number; sale: Operation } {
  let costBasis = 0;
  const saleCopy = { ...sale };

  operationHistory
    .filter(
      ({ type, symbol, date }) =>
        type === "BUY" && symbol === sale.symbol && date < sale.date,
    )
    .forEach((buy) => {
      const amountSold = Math.min(sale.amount, buy.amount);

      buy.amount -= amountSold;
      sale.amount -= amountSold;
      costBasis += amountSold * buy.price;
    });

  if (sale.amount > 0) {
    throw Error(
      `Amount of sales for symbol ${sale.symbol} exceeds the amount of buys.`,
    );
  }

  return { costBasis: costBasis, sale: saleCopy };
}
export {
  aggregateByYear,
  calculateFIFOCapitalGains,
} from "https://esm.sh/fifo-capital-gains-js@0.1.1?dev";
export type { Operation, Task };
export { parseCsv, PQueue };
