import { DB, PQueue, Spot } from "../../deps.ts";
import { binanceAPIaccess } from "./credentials.ts";
import { Transaction } from "../db.ts";
const { apiKey, secretKey } = binanceAPIaccess;
import {
  capitalDeposits,
  capitalWithdrawals,
  commissions,
  conversions,
  deposits,
  dividends,
  dribblets,
  pairs,
  trades,
} from "./fetch.ts";
import {
  autoInvest,
  buyHistory,
  commission,
  conversion,
  dividend,
  dribblet,
  manualOrders,
  sellHistory,
  trade,
  transactions,
} from "./transaction.ts";

export const requestAllData = async (db: DB, queue: PQueue): Promise<void> => {
  await pairs(db, queue);
  await Promise.all([
    capitalDeposits(db, queue),
    capitalWithdrawals(db, queue),
    commissions(db, queue),
    conversions(db, queue),
    deposits(db, queue),
    dividends(db, queue),
    dribblets(db, queue),
    trades(db, queue),
  ]);
};

export const convertDataToTransactions = async (
  db: DB,
  queue: PQueue,
): Promise<void> => {
  const binanceTransaction = Transaction(db);
  binanceTransaction.init();
  const pairs = db.query(
    `SELECT baseAsset, quoteAsset, symbol
    FROM pair`,
  );
  await Promise.all([
    transactions(db, commission(db), false),
    transactions(db, dividend(db), false),
    transactions(db, autoInvest(pairs, queue)),
    transactions(db, buyHistory()),
    transactions(db, manualOrders(pairs, queue)),
    transactions(db, sellHistory()),
    transactions(db, conversion(db, pairs, queue)),
    transactions(db, dribblet(db, pairs, queue)),
    transactions(db, trade(db, pairs, queue)),
  ]);
};
export const binance = new Spot(apiKey, secretKey);
