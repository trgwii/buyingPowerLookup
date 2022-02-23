export { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
export * as z from "https://deno.land/x/zod@v3.11.6/mod.ts";
export { existsSync } from "https://deno.land/std/fs/mod.ts";
export { sleep } from "https://deno.land/x/sleep/mod.ts";
export { DB } from "https://deno.land/x/sqlite/mod.ts";
export {
  aggregateByYear,
  calculateFIFOCapitalGains,
} from "https://esm.sh/fifo-capital-gains-js@0.1.1";
export type { Operation } from "https://esm.sh/fifo-capital-gains-js@0.1.1";
import type { AxiosResponse } from "https://esm.sh/axios@0.21.4";
import { Spot as _Spot } from "https://esm.sh/@binance/connector@1.7.0";
declare class SpotClass {
  /**
   * Get Fiat Deposit/Withdraw History (USER_DATA)
   *
   * GET /sapi/v1/fiat/orders
   *
   * https://binance.github.io/binance-connector-node/module-Fiat.html#depositWithdrawalHistory
   */
  depositWithdrawalHistory(
    /** 0: deposit, 1: withdraw */
    transactionType: 0 | 1,
    options?: {
      /** If beginTime and endTime are not sent, the recent 30-day data will be returned. */
      beginTime?: number;
      endTime?: number;
      /** default 1 */
      page?: number;
      /** default 100, max 500 */
      rows?: number;
      recvWindow?: number;
    },
  ): Promise<AxiosResponse>;
  /**
   * Withdraw History(supporting network) (USER_DATA)
   *
   * GET /sapi/v1/capital/withdraw/history
   *
   * https://binance.github.io/binance-connector-node/module-Wallet.html#withdrawHistory
   */
  withdrawHistory(options?: {
    coin?: number;
    withdrawOrderId?: number;
    /** 0:Email Sent 1:Cancelled 2:Awaiting Approval 3:Rejected 4:Processing 5:Failure 6:Completed */
    status?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    /** Default: 90 days from current timestamp */
    startTime?: number;
    /** Default: present timestamp */
    endTime?: number;
    offset?: number;
    limit?: number;
    /** The value cannot be greater than 60000 */
    recvWindow?: number;
  }): Promise<AxiosResponse>;
}
export const Spot: typeof SpotClass = _Spot;

import {
  parse as parseCsv,
} from "https://deno.land/std@0.82.0/encoding/csv.ts";

import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";
export { parseCsv, PQueue };
