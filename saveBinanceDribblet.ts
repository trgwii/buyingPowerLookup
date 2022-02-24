import { BinanceDribblet } from "./api/api2db.ts";
import { binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");

const binanceDribblet = BinanceDribblet(binanceDB);
binanceDribblet.init();
for (let m = 1; m <= 12; m++) {
  const mString = m.toString().length === 1 ? `0${m}` : m.toString();
  const lastDayOfMonth = new Date(2021, m + 1, 0).getDate();
  const startTime = Date.parse(`2021-${mString}-01`);
  const endTime = Date.parse(`2021-${mString}-${lastDayOfMonth}`);
  const dustLogResponse = await binance.dustLog({
    startTime: startTime,
    endTime: endTime,
  });
  if (dustLogResponse.status !== 200) {
    console.error(dustLogResponse.statusText);
    break;
  }
  const dustLogData = dustLogResponse.data;
  if (!dustLogData) continue;
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
binanceDB.close();
