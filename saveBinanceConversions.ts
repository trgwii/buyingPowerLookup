import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");

const binanceConversion = BinanceConversion(binanceDB);
binanceConversion.init();
import { binance } from "./api/binance.ts";
import { BinanceConversion } from "./api/api2db.ts";

for (let m = 1; m <= 12; m++) {
  const mString = m.toString().length === 1 ? `0${m}` : m.toString();
  const lastDayOfMonth = new Date(2021, m + 1, 0).getDate();
  const startTime = Date.parse(`2021-${mString}-01`);
  const endTime = Date.parse(`2021-${mString}-${lastDayOfMonth}`);
  const convertTradeHistoryResponse = await binance.convertTradeHistory(
    startTime,
    endTime,
  );
  if (convertTradeHistoryResponse.status !== 200) {
    console.error(convertTradeHistoryResponse.statusText);
    break;
  }
  const convertTradeHistoryData = convertTradeHistoryResponse.data;
  if (!convertTradeHistoryData) continue;
  const convertTradeHistory = convertTradeHistoryData.list;
  if (!convertTradeHistory.length) continue;
  for (const convertTrade of convertTradeHistory) {
    if (convertTrade.orderStatus !== "SUCCESS") continue;
    console.log(convertTrade);
    binanceConversion.add(convertTrade);
  }
}
binanceDB.close();
