import { DB, PQueue, Spot } from "../../deps.ts";
import { binanceAPIaccess } from "./credentials.ts";
import { Transaction } from "../db.ts";
const { apiKey, secretKey } = binanceAPIaccess;
import {
  backupPricePairs,
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
  cWithdraw,
  dividend,
  dribblet,
  manualCommissions,
  manualDividends,
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
  const newPairs = db.query(
    `SELECT baseAsset, quoteAsset, symbol
    FROM pair`,
  );
  const backedUpPairs = await backupPricePairs();
  const pairs = [
    ...newPairs,
    ...backedUpPairs.filter((pair) => newPairs.indexOf(pair) < 0),
  ];
  await Promise.all([
    transactions(db, commission(db, pairs, queue)),
    transactions(db, dividend(db, pairs, queue)),
    transactions(db, autoInvest(pairs, queue)),
    transactions(db, buyHistory()),
    transactions(db, cWithdraw(db, pairs, queue)),
    transactions(db, manualOrders(pairs, queue)),
    transactions(db, manualDividends(pairs, queue)),
    transactions(db, manualCommissions(pairs, queue)),
    transactions(db, sellHistory()),
    transactions(db, conversion(db, pairs, queue)),
    transactions(db, dribblet(db, pairs, queue)),
    transactions(db, trade(db, pairs, queue)),
  ]);
};
export const binance = new Spot(apiKey, secretKey);
