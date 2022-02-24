import { BinanceDividend } from "./api/api2db.ts";
import { binance } from "./api/binance.ts";
import { DB } from "./deps.ts";
const binanceDB = new DB("db/binance.db");

const binanceDividend = BinanceDividend(binanceDB);
binanceDividend.init();
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
    const devidendRecordsResponse = await binance.assetDevidendRecord({
      startTime: startTime,
      endTime: endTime,
      limit: 500,
    });
    if (devidendRecordsResponse.status !== 200) {
      console.error(devidendRecordsResponse.statusText);
      break;
    }
    const devidendRecordsData = devidendRecordsResponse.data;
    if (!devidendRecordsData) continue;
    const devidendRecords = devidendRecordsData.rows;
    if (!devidendRecords.length) continue;
    console.log(devidendRecords);
    for (const devidendRecord of devidendRecords) {
      console.log(devidendRecord);
      binanceDividend.add(devidendRecord);
    }
  }
}
