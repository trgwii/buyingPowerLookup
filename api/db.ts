import { DB } from "../deps.ts";
import type { transaction } from "./transaction.d.ts";

export const Transaction = (db: DB) => ({
  init: () =>
    db.query(`
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
      `),
  add: (transaction: transaction) =>
    db.query(
      `INSERT OR IGNORE INTO \`transaction\` (
          type, refId, asset, side, amount, price, timestamp
        ) VALUES (
          :type, :refId, :asset, :side, :amount, :price, :timestamp
        )`,
      transaction,
    ),
});
