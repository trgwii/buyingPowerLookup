import { fetchAssetPrice } from "./api/binance.ts";
import { DB } from "./deps.ts";

const binanceDB = new DB("db/binance.db");

binanceDB.query(`
  CREATE TABLE IF NOT EXISTS \`transaction\` (
    transactionID INTEGER PRIMARY KEY AUTOINCREMENT,
    type                  CHARACTER(20),
    refId                 INTEGER,
    asset                 CHARACTER(20),
    side                  BOOLEAN,
    amount                FLOAT,
    price                 FLOAT,
    timestamp             INTEGER,
    UNIQUE(type, refId, side)
  )
`);
const filename = "AutoInvestHistory.csv";
import { parseCsv } from "./deps.ts";
const autoInvestSpreadSheet = await parseCsv(
  await Deno.readTextFile(`db/${filename}`),
);
let row = 1;
for (const autoInvestEntry of autoInvestSpreadSheet) {
  const [date, c2, fromAmountAndAsset, toAmountAndAsset, c5, status] =
    autoInvestEntry;
  const createTime = Date.parse(date);
  const fromAsset = fromAmountAndAsset.replace(/[\d .-]/g, "");
  const fromAmount = fromAmountAndAsset.replace(/[^\d.-]/g, "");
  const toAsset = toAmountAndAsset.replace(/[\d .-]/g, "");
  const toAmount = toAmountAndAsset.replace(/[^\d.-]/g, "");
  const refId = row;
  const type = filename;
  if (status !== "Success") continue;
  const avgPriceFromAsset = await fetchAssetPrice(
    fromAsset,
    createTime,
  );
  if (avgPriceFromAsset && typeof avgPriceFromAsset === "number") {
    binanceDB.query(
      `INSERT OR IGNORE INTO \`transaction\` (
            type,
            refId,
            asset,
            side,
            amount,
            price,
            timestamp
          ) VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )`,
      [
        type,
        refId,
        fromAsset,
        "OUT",
        fromAmount,
        avgPriceFromAsset,
        createTime,
      ],
    );
  }
  const avgPriceToAsset = await fetchAssetPrice(
    toAsset,
    createTime,
  );
  if (avgPriceToAsset && typeof avgPriceToAsset === "number") {
    binanceDB.query(
      `INSERT OR IGNORE INTO \`transaction\` (
            type,
            refId,
            asset,
            side,
            amount,
            price,
            timestamp
          ) VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )`,
      [
        type,
        refId,
        toAsset,
        "IN",
        toAmount,
        avgPriceToAsset,
        createTime,
      ],
    );
  }
  row++;
}
binanceDB.close();
