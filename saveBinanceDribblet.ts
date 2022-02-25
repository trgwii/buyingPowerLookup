import { BinanceDribblet } from "./api/api2db.ts";
import { autoRetry, binance } from "./api/binance.ts";
import { apiConcurrency } from "./config.ts";
import { DB, PQueue } from "./deps.ts";
const binanceDB = new DB("db/binance.db");
const queue = new PQueue({
  concurrency: apiConcurrency / 10,
});
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
    break;
  }
  const dustLogData = dustLogResponse.data;
  if (!dustLogData) continue;
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
binanceDB.close();
