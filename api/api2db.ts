import { DB, PQueue, Row } from "../deps.ts";
import { autoRetry, binance } from "./binance.ts";
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
} from "./dbFunctions.ts";

export const saveTrades = async (binanceDB: DB, queue: PQueue) => {
  const symbols = binanceDB.query("SELECT symbol FROM pair").map(
    (pair: Row) => String(pair[0]),
  );
  const allAssetTradeRequests = symbols.map((symbol) =>
    queue.add(() => autoRetry(() => binance.allOrders(symbol)))
  );
  const binanceTrade = BinanceTrade(binanceDB);
  binanceTrade.init();
  for (const assetTradeRequests of allAssetTradeRequests) {
    const assetTradesResponse = await assetTradeRequests;
    if (!assetTradesResponse || !assetTradesResponse.data) continue;
    const assetTrades = assetTradesResponse.data.filter((order: any) =>
      Number(order.executedQty) > 0 && Number(order.cummulativeQuoteQty) > 0
    );
    if (!assetTrades.length) continue;
    for (const assetTrade of assetTrades) {
      console.log(assetTrade);
      binanceTrade.add(assetTrade);
    }
  }
};

export const savePairs = async (binanceDB: DB, queue: PQueue) => {
  const binancePair = BinancePair(binanceDB);
  binancePair.init();
  const exchangeInfoRequest = queue.add(() =>
    autoRetry(() => binance.exchangeInfo())
  );
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

export const saveDribblets = async (binanceDB: DB, queue: PQueue) => {
  const binanceDribblet = BinanceDribblet(binanceDB);
  binanceDribblet.init();
  const dustLogRequests = [];
  for (let m = 1; m <= 12; m++) {
    const mString = m.toString().length === 1 ? `0${m}` : m.toString();
    const lastDayOfMonth = new Date(2021, m + 1, 0).getDate();
    const startTime = Date.parse(`2021-${mString}-01`);
    const endTime = Date.parse(`2021-${mString}-${lastDayOfMonth}`);
    dustLogRequests.push(queue.add(() =>
      autoRetry(() =>
        binance.dustLog({
          startTime: startTime,
          endTime: endTime,
        })
      )
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
    const dustLog = dustLogs.map((dustEntry: any) =>
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
export const saveDividends = async (binanceDB: DB, queue: PQueue) => {
  const binanceDividend = BinanceDividend(binanceDB);
  binanceDividend.init();
  const devidendRecordsRequests = [];
  for (let m = 1; m <= 12; m++) {
    const lastDayOfMonth = new Date(2021, m + 1, 0).getDate();
    for (
      const dd of [
        ["01", "15"],
        ["15", lastDayOfMonth],
      ]
    ) {
      const mString = m.toString().length === 1 ? `0${m}` : m.toString();
      const startTime = Date.parse(`2021-${mString}-${dd[0]}`);
      const endTime = Date.parse(`2021-${mString}-${dd[1]}`);
      devidendRecordsRequests.push(
        queue.add(() =>
          autoRetry(() =>
            binance.assetDevidendRecord({
              startTime: startTime,
              endTime: endTime,
              limit: 500,
            })
          )
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
export const saveDeposits = async (binanceDB: DB, queue: PQueue) => {
  const binanceDeposit = BinanceDeposit(binanceDB);
  binanceDeposit.init();
  const fiatDepositRequest = queue.add(() =>
    autoRetry(() => binance.depositWithdrawalHistory(0))
  );
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
export const saveConversions = async (binanceDB: DB, queue: PQueue) => {
  const binanceConversion = BinanceConversion(binanceDB);
  binanceConversion.init();

  const convertTradeHistoryRequests = [];
  for (let m = 1; m <= 12; m++) {
    const mString = m.toString().length === 1 ? `0${m}` : m.toString();
    const lastDayOfMonth = new Date(2021, m + 1, 0).getDate();
    const startTime = Date.parse(`2021-${mString}-01`);
    const endTime = Date.parse(`2021-${mString}-${lastDayOfMonth}`);
    convertTradeHistoryRequests.push(
      queue.add(() =>
        autoRetry(() =>
          binance.convertTradeHistory(
            startTime,
            endTime,
          )
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
export const saveCommissions = async (binanceDB: DB, queue: PQueue) => {
  const binanceCommission = BinanceCommission(binanceDB);
  binanceCommission.init();

  const pairs = binanceDB.query<[string]>("SELECT symbol FROM pair");
  const symbols = pairs.map(
    (pair) => pair[0],
  );

  const allAssetCommissionsRequests = symbols.map((symbol) =>
    queue.add(() => autoRetry(() => binance.myTrades(symbol)))
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
export const saveCapitalWithdrawals = async (binanceDB: DB, queue: PQueue) => {
  const binanceCapitalWithdrawal = BinanceCapitalWithdrawal(binanceDB);
  binanceCapitalWithdrawal.init();
  const capitalWithdrawRequest = queue.add(() =>
    autoRetry(() => binance.withdrawHistory())
  );
  const capitalWithdrawResponse = await capitalWithdrawRequest;
  if (!capitalWithdrawResponse || !capitalWithdrawResponse.data) {
    console.log(capitalWithdrawResponse);
    return false;
  }
  const capitalWithdraws = capitalWithdrawResponse.data.filter(
    (capitalWithdraws) => capitalWithdraws.status === 6,
  );
  if (!capitalWithdraws.length) return false;
  for (const capitalWithdraw of capitalWithdraws) {
    console.log(capitalWithdraw);
    binanceCapitalWithdrawal.add(capitalWithdraw);
  }
};
export const saveCapitalDeposits = async (binanceDB: DB, queue: PQueue) => {
  const binanceCapitalDeposit = BinanceCapitalDeposit(binanceDB);
  binanceCapitalDeposit.init();
  const capitalDepositsRequest = queue.add(() =>
    autoRetry(() => binance.depositHistory())
  );
  const capitalDepositsResponse = await capitalDepositsRequest;
  if (!capitalDepositsResponse || !capitalDepositsResponse.data) {
    console.log(capitalDepositsResponse);
    return false;
  }
  const capitalDeposits = capitalDepositsResponse.data;
  if (!capitalDeposits.length) return false;

  for (const capitalDeposit of capitalDeposits) {
    console.log(capitalDeposit);
    binanceCapitalDeposit.add(capitalDeposit);
  }
};
