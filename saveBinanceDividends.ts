import { binance } from "./api/binance.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS dividend (
    dividendID INTEGER PRIMARY KEY AUTOINCREMENT,
    id                     INTEGER,
    tranId                 INTEGER,
    asset                  CHARACTER(20),
    amount                 FLOAT,
    divTime                INTEGER,
    enInfo                 VARCHAR(100),
    UNIQUE(id)
  )
`);

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
      binanceDB.query(
        `INSERT OR IGNORE INTO dividend (
          id,
          tranId,
          asset,
          amount,
          divTime,
          enInfo
        ) VALUES (
          :id,
          :tranId,
          :asset,
          :amount,
          :divTime,
          :enInfo
        )`,
        devidendRecord,
      );
    }
  }
}
