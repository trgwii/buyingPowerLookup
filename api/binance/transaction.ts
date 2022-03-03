import { DB, parseCsv, PQueue, Row } from "../../deps.ts";
import { Transaction } from "../db.ts";
import { fetchAssetPrice } from "./price.ts";
import { transactionBundle } from "../transaction.d.ts";

export const autoInvest = async (
  pairs: Row[],
  queue: PQueue,
): Promise<transactionBundle> => {
  const filename = "AutoInvestHistory.csv";
  return (
    (await parseCsv(
      await Deno.readTextFile(`db/${filename}`),
    )) as [string, string, string, string, string, string][]
  ).map((data, row) => {
    const [date, , fromAmountAndAsset, toAmountAndAsset, , status] = data;
    const dateUTC = new Date(date);
    dateUTC.setHours(dateUTC.getHours() + 1);
    const createTime = dateUTC.getTime();
    const fromAsset = fromAmountAndAsset.replace(/[\d .-]/g, "");
    const toAsset = toAmountAndAsset.replace(/[\d .-]/g, "");
    if (status !== "Success") return null;
    return [
      {
        type: filename,
        refId: row,
        asset: fromAsset,
        side: "OUT",
        amount: Number(fromAmountAndAsset.replace(/[^\d.-]/g, "")),
        price: fetchAssetPrice(
          fromAsset,
          createTime,
          pairs,
          queue,
        ),
        timestamp: createTime,
      },
      {
        type: filename,
        refId: row,
        asset: toAsset,
        side: "IN",
        amount: Number(toAmountAndAsset.replace(/[^\d.-]/g, "")),
        price: 0,
        timestamp: createTime,
      },
    ];
  });
};
export const buyHistory = async (): Promise<transactionBundle> => {
  const filename = "BuyHistory.csv";
  return (
    (await parseCsv(
      await Deno.readTextFile(`db/${filename}`),
    )) as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ][]
  ).map((data, row) => {
    const [date, , , priceString, , amountAndAsset] = data;
    const dateUTC = new Date(date);
    dateUTC.setHours(dateUTC.getHours() + 1);
    const createTime = dateUTC.getTime();
    const amount = amountAndAsset.replace(/[^\d.-]/g, "");
    const asset = amountAndAsset.replace(/[\d .-]/g, "");
    if (!amount.length || !priceString.length) return null;
    const price = parseFloat(priceString.replace(/[^\d.-]/g, ""));
    return [
      {
        type: filename,
        refId: row,
        asset: asset,
        side: "IN",
        amount: parseFloat(amount),
        price: price,
        timestamp: createTime,
      },
    ];
  });
};
export const commission = (db: DB): transactionBundle =>
  db.query(
    "SELECT commissionID, `time` as 'date', commission, commissionAsset FROM commission",
  ).map((conversion) => {
    const [commissionID, date, commission, commissionAsset] = conversion;
    const dateUTC = new Date(Number(date));
    const createTime = dateUTC.getTime() + 1;
    return [
      {
        type: "commission",
        refId: Number(commissionID),
        asset: String(commissionAsset),
        side: "OUT",
        amount: Number(commission),
        price: 0,
        timestamp: Number(createTime),
      },
    ];
  });
export const conversion = (
  db: DB,
  pairs: Row[],
  queue: PQueue,
): transactionBundle => {
  const type = "conversion";
  return db.query(
    "SELECT conversionID, fromAsset, toAsset, fromAmount, toAmount, createTime FROM conversion",
  ).map((conversion) => {
    const [conversionID, fromAsset, toAsset, fromAmount, toAmount, date] =
      conversion;
    console.log(`iteration pair: ${fromAsset}${toAsset}`);
    const dateUTC = new Date(Number(date));
    const createTime = dateUTC.getTime();
    return [
      {
        type: type,
        refId: Number(conversionID),
        asset: String(fromAsset),
        side: "OUT",
        amount: Number(fromAmount),
        price: fetchAssetPrice(
          String(fromAsset),
          createTime,
          pairs,
          queue,
        ),
        timestamp: createTime,
      },
      {
        type: type,
        refId: Number(conversionID),
        asset: String(toAsset),
        side: "IN",
        amount: Number(toAmount),
        price: fetchAssetPrice(
          String(toAsset),
          createTime,
          pairs,
          queue,
        ),
        timestamp: createTime,
      },
    ];
  });
};
export const dividend = (db: DB): transactionBundle =>
  db.query(
    "SELECT dividendID, asset, amount, divTime FROM dividend",
  ).map((dividend) => {
    const [dividendID, asset, amount, date] = dividend;
    const dateUTC = new Date(Number(date));
    const createTime = dateUTC.getTime();
    return [
      {
        type: "dividend",
        refId: Number(dividendID),
        asset: String(asset),
        side: "IN",
        amount: Number(amount),
        price: 0,
        timestamp: createTime,
      },
    ];
  });
export const dribblet = (
  db: DB,
  pairs: Row[],
  queue: PQueue,
): transactionBundle => {
  const type = "dribblet";
  return db.query(
    "SELECT dribbletID, fromAsset, 'BNB' AS 'toAsset', amount as 'fromAmount', (transferedAmount - serviceChargeAmount) AS 'toAmount', operateTime AS 'dateUTCplus2' FROM dribblet",
  ).map((dribblet) => {
    const [dribbletID, fromAsset, toAsset, fromAmount, toAmount, date] =
      dribblet;
    const dateUTC = new Date(Number(date));
    const createTime = dateUTC.getTime();
    console.log(`iteration pair: ${fromAsset}${toAsset}`);
    return [
      {
        type: type,
        refId: Number(dribbletID),
        asset: String(toAsset),
        side: "IN",
        amount: Number(toAmount),
        price: fetchAssetPrice(
          String(toAsset),
          createTime,
          pairs,
          queue,
        ),
        timestamp: createTime,
      },
      {
        type: type,
        refId: Number(dribbletID),
        asset: String(fromAsset),
        side: "OUT",
        amount: Number(fromAmount),
        price: 0,
        timestamp: createTime,
      },
    ];
  });
};
export const manualOrders = async (
  pairs: Row[],
  queue: PQueue,
): Promise<transactionBundle> => {
  const filename = "ManualOrders.csv";
  return (
    (
      (
        await parseCsv(
          await Deno.readTextFile(`db/${filename}`),
        )
      ) as [string, string, string, string, string, string][]
    ).map((data, row) => {
      const [date, , fromAmountAndAsset, toAmountAndAsset, , status] = data;
      const dateUTC = new Date(date);
      dateUTC.setHours(dateUTC.getHours() + 1);
      const createTime = dateUTC.getTime();
      const fromAsset = fromAmountAndAsset.replace(/[\d .-]/g, "");
      const toAsset = toAmountAndAsset.replace(/[\d .-]/g, "");
      if (status !== "Success") return null;
      return [
        {
          type: filename,
          refId: row,
          asset: fromAsset,
          side: "OUT",
          amount: Number(fromAmountAndAsset.replace(/[^\d.-]/g, "")),
          price: fetchAssetPrice(
            fromAsset,
            createTime,
            pairs,
            queue,
          ),
          timestamp: createTime,
        },
        {
          type: filename,
          refId: row,
          asset: toAsset,
          side: "IN",
          amount: Number(toAmountAndAsset.replace(/[^\d.-]/g, "")),
          price: fetchAssetPrice(
            toAsset,
            createTime,
            pairs,
            queue,
          ),
          timestamp: createTime,
        },
      ];
    })
  );
};
export const sellHistory = async (): Promise<transactionBundle> => {
  const filename = "SellHistory.csv";
  return (
    (
      (await parseCsv(
        await Deno.readTextFile(`db/${filename}`),
      )) as [string, string, string, string][]
    ).map((data, row) => {
      const [date, , amountAndAsset, priceString] = data;
      const dateUTC = new Date(date);
      dateUTC.setHours(dateUTC.getHours() + 1);
      const createTime = dateUTC.getTime();
      const amount = amountAndAsset.replace(/[^\d.-]/g, "");
      const asset = amountAndAsset.replace(/[\d .-]/g, "");
      if (!amount.length || !priceString.length) return null;
      const price = parseFloat(priceString.replace(/[^\d.-]/g, ""));
      return [
        {
          type: filename,
          refId: row,
          asset: asset,
          side: "OUT",
          amount: parseFloat(amount),
          price: price,
          timestamp: createTime,
        },
      ];
    })
  );
};
export const trade = (
  db: DB,
  pairs: Row[],
  queue: PQueue,
): transactionBundle => {
  const type = "trade";
  return db.query(
    `SELECT tradeID, symbol, executedQty, cummulativeQuoteQty, time AS 'date', side FROM trade`,
  ).map((trade) => {
    const [
      tradeID,
      symbol,
      executedQty,
      cummulativeQuoteQty,
      date,
      side,
    ] = trade;
    const dateUTC = new Date(Number(date));
    const createTime = dateUTC.getTime();
    console.log(`iteration symbol: ${symbol}`);
    const pairData = pairs.filter((pair) => pair[2] === symbol);
    if (!pairData.length) return null;
    const assetData = pairData[0];
    if (!Array.isArray(assetData) || assetData.length !== 3) return null;
    const [baseAsset, quoteAsset] = assetData;
    return [
      {
        type: type,
        refId: Number(tradeID),
        asset: String(quoteAsset),
        side: side === "SELL" ? "IN" : "OUT",
        amount: Number(cummulativeQuoteQty),
        price: fetchAssetPrice(
          String(quoteAsset),
          createTime,
          pairs,
          queue,
        ),
        timestamp: createTime,
      },
      {
        type: type,
        refId: Number(tradeID),
        asset: String(baseAsset),
        side: side === "BUY" ? "IN" : "OUT",
        amount: Number(executedQty),
        price: 0,
        timestamp: createTime,
      },
    ];
  });
};
export const transactions = async (
  db: DB,
  transactionBundle: transactionBundle | Promise<transactionBundle>,
  hasPrice = true,
): Promise<void> => {
  const binanceTransaction = Transaction(db);
  for (const transactions of (await transactionBundle)) {
    if (!transactions) continue;
    if (hasPrice && transactions[1] && transactions[1].price === 0) {
      const [quoteAssetTransaction, baseAssetTransaction] = transactions;
      const quotePrice = await quoteAssetTransaction.price;
      if (
        !quotePrice || typeof quotePrice !== "number" ||
        baseAssetTransaction.amount <= 0
      ) {
        continue;
      }
      const basePrice = quoteAssetTransaction.amount *
        quotePrice / baseAssetTransaction.amount;
      binanceTransaction.add({
        ...quoteAssetTransaction,
        price: quotePrice,
      });
      binanceTransaction.add({ ...baseAssetTransaction, price: basePrice });
      continue;
    }
    for (const transaction of transactions) {
      const price = hasPrice ? await transaction.price : 0;
      if (hasPrice && (!price || typeof price !== "number")) continue;
      binanceTransaction.add({ ...transaction, price: Number(price) });
    }
  }
};
