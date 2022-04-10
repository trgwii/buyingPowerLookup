import { DB, PQueue, Row, sleep } from "../../deps.ts";
import { binance } from "./mod.ts";
import {
  BinanceCapitalDeposit,
  BinanceCapitalWithdrawal,
  BinanceCommission,
  BinanceConversion,
  BinanceDeposit,
  BinanceDividend,
  BinanceDribblet,
  BinancePair,
  BinanceTrade,
} from "./db.ts";
import { SpotClass } from "./Spot.d.ts";

export const autoRetry = <Method extends keyof SpotClass>(
  c: SpotClass,
  m: Method,
) => {
  const run = async (
    ...args: Parameters<SpotClass[Method]>
  ): Promise<ReturnType<SpotClass[Method]>> => {
    try { //@ts-expect-error here
      return await c[m](...args);
    } catch (err) {
      const timeout = Number(err.response.headers.get("retry-after"));
      if (timeout <= 0) {
        console.error(err);
        throw new Error(err);
      }
      console.log(`waiting ${timeout} seconds`);
      await sleep(timeout);
      return run(...args);
    }
  };
  return run;
};

export const trades = async (db: DB, queue: PQueue) => {
  const symbols = db.query("SELECT symbol FROM pair").map(
    (pair: Row) => String(pair[0]),
  );
  const handler = autoRetry(binance, "allOrders");
  const allAssetTradeRequests = symbols.map((symbol) =>
    queue.add(() => handler(symbol))
  );
  const binanceTrade = BinanceTrade(db);
  binanceTrade.init();
  for (const assetTradeRequests of allAssetTradeRequests) {
    const assetTradesResponse = await assetTradeRequests;
    if (!assetTradesResponse) continue;
    const assetTrades = assetTradesResponse.data.filter((order) =>
      Number(order.executedQty) > 0 && Number(order.cummulativeQuoteQty) > 0
    );
    if (!assetTrades.length) continue;
    for (const assetTrade of assetTrades) {
      console.log(assetTrade);
      binanceTrade.add(assetTrade);
    }
  }
};

export const pairs = async (db: DB, queue: PQueue) => {
  const binancePair = BinancePair(db);
  binancePair.init();
  const handler = autoRetry(binance, "exchangeInfo");
  const exchangeInfoRequest = queue.add(() => handler());
  const exchangeInfoResponse = await exchangeInfoRequest;
  if (!exchangeInfoResponse || !exchangeInfoResponse.data) {
    console.error(exchangeInfoResponse);
    return false;
  }
  const exchangeInfo = exchangeInfoResponse.data;
  for (const symbol of exchangeInfo.symbols) {
    binancePair.add([symbol.symbol, symbol.baseAsset, symbol.quoteAsset]);
  }
};

export const dribblets = async (db: DB, queue: PQueue) => {
  const binanceDribblet = BinanceDribblet(db);
  binanceDribblet.init();
  const dustLogRequests = [];
  for (let m = 1; m <= 12; m++) {
    const mString = m.toString().length === 1 ? `0${m}` : m.toString();
    const lastDayOfMonth = new Date(2021, m, 0).getDate();
    const startTime = Date.parse(`2021-${mString}-01 00:00:00:000`);
    const endTime = Date.parse(
      `2021-${mString}-${lastDayOfMonth} 23:59:59:999`,
    );
    const handler = autoRetry(binance, "dustLog");
    dustLogRequests.push(queue.add(() =>
      handler({
        startTime: startTime,
        endTime: endTime,
      })
    ));
  }
  for (const dustLogRequest of dustLogRequests) {
    const dustLogResponse = await dustLogRequest;
    if (!dustLogResponse || !dustLogResponse.data) {
      console.error(dustLogResponse);
      continue;
    }
    const dustLogData = dustLogResponse.data;
    const dustLogs = dustLogData.userAssetDribblets;
    if (!dustLogs.length) continue;
    const dustLog = dustLogs.map((dustEntry) =>
      dustEntry.userAssetDribbletDetails
    );
    if (!dustLog.length) continue;
    for (const dustEntries of dustLog) {
      for (const dustEntry of dustEntries) {
        console.log(dustEntry);
        binanceDribblet.add(dustEntry);
      }
    }
  }
};
export const dividends = async (db: DB, queue: PQueue) => {
  const binanceDividend = BinanceDividend(db);
  binanceDividend.init();
  const devidendRecordsRequests = [];
  for (let m = 1; m <= 12; m++) {
    const lastDayOfMonth = new Date(2021, m, 0).getDate();
    for (
      const dd of [
        ["01", "15"],
        ["15", lastDayOfMonth],
      ]
    ) {
      const mString = m.toString().length === 1 ? `0${m}` : m.toString();
      const startTime = Date.parse(`2021-${mString}-${dd[0]} 00:00:00:000`);
      const endTime = Date.parse(`2021-${mString}-${dd[1]} 23:59:59:999`);
      const handler = autoRetry(binance, "assetDevidendRecord");
      devidendRecordsRequests.push(
        queue.add(() =>
          handler({
            startTime: startTime,
            endTime: endTime,
            limit: 500,
          })
        ),
      );
    }
  }
  for (const devidendRecordsRequest of devidendRecordsRequests) {
    const devidendRecordsResponse = await devidendRecordsRequest;
    if (!devidendRecordsResponse || !devidendRecordsResponse.data) {
      console.error(devidendRecordsResponse);
      continue;
    }
    const devidendRecordsData = devidendRecordsResponse.data;
    const devidendRecords = devidendRecordsData.rows;
    if (!devidendRecords.length) continue;
    console.log(devidendRecords);
    for (const devidendRecord of devidendRecords) {
      console.log(devidendRecord);
      binanceDividend.add(devidendRecord);
    }
  }
};
export const deposits = async (db: DB, queue: PQueue) => {
  const binanceDeposit = BinanceDeposit(db);
  binanceDeposit.init();
  const handler = autoRetry(binance, "depositWithdrawalHistory");
  const fiatDepositRequest = queue.add(() => handler(0));
  const fiatDepositResponse = await fiatDepositRequest;
  if (!fiatDepositResponse || !fiatDepositResponse.data) {
    console.log(fiatDepositResponse);
    return false;
  }
  const fiatDepositData = fiatDepositResponse.data;
  const fiatDeposits = fiatDepositData.data;
  const successfulFiatDeposits = fiatDeposits.filter(
    (fiatDeposit) => fiatDeposit.status === "Successful",
  );
  if (!successfulFiatDeposits.length) return false;
  for (const successfulFiatDeposit of successfulFiatDeposits) {
    binanceDeposit.add(successfulFiatDeposit);
  }
};
export const conversions = async (db: DB, queue: PQueue) => {
  const binanceConversion = BinanceConversion(db);
  binanceConversion.init();

  const convertTradeHistoryRequests = [];
  for (let m = 1; m <= 12; m++) {
    const mString = m.toString().length === 1 ? `0${m}` : m.toString();
    const lastDayOfMonth = new Date(2021, m, 0).getDate();
    const startTime = Date.parse(`2021-${mString}-01 00:00:00:000`);
    const endTime = Date.parse(
      `2021-${mString}-${lastDayOfMonth} 23:59:59:999`,
    );
    const handler = autoRetry(binance, "convertTradeHistory");
    convertTradeHistoryRequests.push(
      queue.add(() =>
        handler(
          startTime,
          endTime,
        )
      ),
    );
  }
  for (const convertTradeHistoryRequest of convertTradeHistoryRequests) {
    const convertTradeHistoryResponse = await convertTradeHistoryRequest;
    if (!convertTradeHistoryResponse || !convertTradeHistoryResponse.data) {
      console.error(convertTradeHistoryResponse);
      continue;
    }
    const convertTradeHistoryData = convertTradeHistoryResponse.data;
    const convertTradeHistory = convertTradeHistoryData.list;
    if (!convertTradeHistory || !convertTradeHistory.length) continue;
    for (const convertTrade of convertTradeHistory) {
      if (convertTrade.orderStatus !== "SUCCESS") continue;
      console.log(convertTrade);
      binanceConversion.add(convertTrade);
    }
  }
};
export const commissions = async (db: DB, queue: PQueue) => {
  const binanceCommission = BinanceCommission(db);
  binanceCommission.init();

  const pairs = db.query<[string]>("SELECT symbol FROM pair");
  const symbols = pairs.map(
    (pair) => pair[0],
  );

  const handler = autoRetry(binance, "myTrades");
  const allAssetCommissionsRequests = symbols.map((symbol) =>
    queue.add(() => handler(symbol))
  );

  for (const assetCommissionsRequests of allAssetCommissionsRequests) {
    const assetCommissionsResponse = await assetCommissionsRequests;
    if (!assetCommissionsResponse) continue;
    const assetCommissions = assetCommissionsResponse.data;
    if (!assetCommissions.length) continue;
    for (const assetCommission of assetCommissions) {
      if (
        Number(assetCommission.commission) <= 0
      ) {
        continue;
      }
      console.log(assetCommission);
      binanceCommission.add(assetCommission);
    }
  }
};
export const capitalWithdrawals = async (db: DB, queue: PQueue) => {
  const binanceCapitalWithdrawal = BinanceCapitalWithdrawal(db);
  binanceCapitalWithdrawal.init();
  const handler = autoRetry(binance, "withdrawHistory");
  for (let m = 1; m <= 12; m++) {
    const lastDayOfMonth = new Date(2021, m, 0).getDate();
    for (
      const dd of [
        ["01", "15"],
        ["15", lastDayOfMonth],
      ]
    ) {
      const mString = m.toString().length === 1 ? `0${m}` : m.toString();
      const startTime = Date.parse(`2021-${mString}-${dd[0]} 00:00:00:000`);
      const endTime = Date.parse(`2021-${mString}-${dd[1]} 23:59:59:999`);
      const capitalWithdrawRequest = queue.add(() =>
        handler({ startTime: startTime, endTime: endTime })
      );
      const capitalWithdrawResponse = await capitalWithdrawRequest;
      if (!capitalWithdrawResponse || !capitalWithdrawResponse.data) {
        console.log(capitalWithdrawResponse);
        continue;
      }
      const capitalWithdraws = capitalWithdrawResponse.data.filter(
        (capitalWithdraws) => capitalWithdraws.status === 6,
      );
      if (!capitalWithdraws.length) continue;
      for (const capitalWithdraw of capitalWithdraws) {
        console.log(capitalWithdraw);
        binanceCapitalWithdrawal.add(capitalWithdraw);
      }
    }
  }
};
export const capitalDeposits = async (db: DB, queue: PQueue) => {
  const binanceCapitalDeposit = BinanceCapitalDeposit(db);
  binanceCapitalDeposit.init();
  const handler = autoRetry(binance, "depositHistory");
  for (let m = 1; m <= 12; m++) {
    const lastDayOfMonth = new Date(2021, m, 0).getDate();
    for (
      const dd of [
        ["01", "15"],
        ["15", lastDayOfMonth],
      ]
    ) {
      const mString = m.toString().length === 1 ? `0${m}` : m.toString();
      const startTime = Date.parse(`2021-${mString}-${dd[0]} 00:00:00:000`);
      const endTime = Date.parse(`2021-${mString}-${dd[1]} 23:59:59:999`);
      const capitalDepositsRequest = queue.add(() =>
        handler({ startTime: startTime, endTime: endTime })
      );
      const capitalDepositsResponse = await capitalDepositsRequest;
      if (!capitalDepositsResponse || !capitalDepositsResponse.data) {
        console.log(capitalDepositsResponse);
        continue;
      }
      const capitalDeposits = capitalDepositsResponse.data;
      if (!capitalDeposits.length) continue;

      for (const capitalDeposit of capitalDeposits) {
        console.log(capitalDeposit);
        binanceCapitalDeposit.add(capitalDeposit);
      }
    }
  }
};
