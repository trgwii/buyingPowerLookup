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
const filename = "SellHistory.csv";
import { parseCsv } from "./deps.ts";
const sellCryptoSpreadSheet = await parseCsv(
  await Deno.readTextFile(`db/${filename}`),
);
let row = 1;
for (const sellCryptoEntry of sellCryptoSpreadSheet) {
  const [dateUTCplus1, c2, amountAndAsset, priceString, c5, c6, c7, c8] =
    sellCryptoEntry;
  const dateUTC = new Date(dateUTCplus1);
  dateUTC.setHours(dateUTC.getHours() - 1);
  const amount = amountAndAsset.replace(/[^\d.-]/g, "");
  const asset = amountAndAsset.replace(/[\d .-]/g, "");
  if (!amount.length || !priceString.length) continue;
  const price = parseFloat(priceString.replace(/[^\d.-]/g, ""));
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
      filename,
      row,
      asset,
      "OUT",
      parseFloat(amount),
      price,
      dateUTC.getTime(),
    ],
  );
  console.log(asset, price);
  row++;
}
binanceDB.close();
