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
        feeAmount: 0,
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
        feeAmount: 0,
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
    const [date, , amountAndFiat, priceString, , amountAndAsset] = data;
    const dateUTC = new Date(date);
    dateUTC.setHours(dateUTC.getHours() + 1);
    const createTime = dateUTC.getTime();
    const amount = amountAndAsset.replace(/[^\d.-]/g, "");
    const asset = amountAndAsset.replace(/[\d .-]/g, "");
    const fiatAmount = amountAndFiat.replace(/[^\d.-]/g, "");
    const fiatAsset = amountAndFiat.replace(/[\d .-]/g, "");
    if (!amount.length || !priceString.length) return null;
    const price = parseFloat(priceString.replace(/[^\d.-]/g, ""));
    return [
      {
        type: filename,
        refId: row,
        asset: fiatAsset,
        side: "OUT",
        amount: parseFloat(fiatAmount),
        feeAmount: 0,
        price: 1,
        timestamp: createTime,
      },
      {
        type: filename,
        refId: row,
        asset: asset,
        side: "IN",
        amount: parseFloat(amount),
        feeAmount: 0,
        price: price,
        timestamp: createTime,
      },
    ];
  });
};
export const manualCommissions = async (
  pairs: Row[],
  queue: PQueue,
): transactionBundle =>{
  const filename = "ManualCommissions.csv";
  return (
    (
      (
        await parseCsv(
          await Deno.readTextFile(`db/${filename}`),
        )
      ) as [string, string, string, string, string][]
    ).map((data, row) => {
      const [date, , fromAmountAndAsset, , status] = data;
      const dateUTC = new Date(date);
      dateUTC.setHours(dateUTC.getHours() + 1);
      const createTime = dateUTC.getTime();
      const fromAsset = fromAmountAndAsset.replace(/[\d .-]/g, "");
      if (status !== "Success") return null;
      return [
        {
          type: filename,
          refId: row,
          asset: fromAsset,
          side: "OUT",
          amount: Number(fromAmountAndAsset.replace(/[^\d.-]/g, "")),
          feeAmount: 0,
          price: fetchAssetPrice(
            fromAsset,
            createTime,
            pairs,
            queue,
          ),
          timestamp: createTime,
        },
      ];
    })
  );
}
export const commission = (
  db: DB,
  pairs: Row[],
  queue: PQueue,
): transactionBundle =>
  db.query(
    "SELECT commissionID, symbol, `time` as 'date', SUM(commission) AS 'amount', commissionAsset FROM commission WHERE symbol NOT LIKE '%' || commissionAsset || '%' GROUP BY orderId",
  )
    .map((conversion) => {
      const [commissionID, , date, amount, commissionAsset] = conversion;
      const dateUTC = new Date(Number(date));
      const createTime = dateUTC.getTime() + 1;
      return [
        {
          type: "commission",
          refId: Number(commissionID),
          asset: String(commissionAsset),
          side: "OUT",
          amount: Number(amount),
          feeAmount: 0,
          price: fetchAssetPrice(
            String(commissionAsset),
            createTime,
            pairs,
            queue,
          ),
          timestamp: Number(createTime),
        },
      ];
    });
export const cWithdraw = (
  db: DB,
  pairs: Row[],
  queue: PQueue,
): transactionBundle =>
  db.query(
    "SELECT cWithdrawID, applyTime, transactionFee, coin FROM cWithdraw",
  )
    .map((cWithdraw) => {
      const [commissionID, applyTime, transactionFee, coin] = cWithdraw;
      const dateUTC = new Date(String(applyTime));
      const createTime = dateUTC.getTime() + 1;
      return [
        {
          type: "cWithdraw",
          refId: Number(commissionID),
          asset: String(coin),
          side: "OUT",
          amount: Number(transactionFee),
          feeAmount: 0,
          price: fetchAssetPrice(
            String(coin),
            createTime,
            pairs,
            queue,
          ),
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
        feeAmount: 0,
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
        feeAmount: 0,
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
export const manualDividends = async (
  pairs: Row[],
  queue: PQueue,
  ): transactionBundle =>{
  const filename = "ManualDividends.csv";
  return (
    (
      (
        await parseCsv(
          await Deno.readTextFile(`db/${filename}`),
        )
      ) as [string, string, string, string, string][]
    ).map((data, row) => {
      const [date, , toAmountAndAsset, , status] = data;
      const dateUTC = new Date(date);
      dateUTC.setHours(dateUTC.getHours() + 1);
      const createTime = dateUTC.getTime();
      const toAsset = toAmountAndAsset.replace(/[\d .-]/g, "");
      if (status !== "Success") return null;
      return [
        {
          type: "dividend",
          refId: row,
          asset: toAsset,
          side: "IN",
          amount: Number(toAmountAndAsset.replace(/[^\d.-]/g, "")),
          feeAmount: 0,
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
}
export const dividend = (
  db: DB,
  pairs: Row[],
  queue: PQueue,
): transactionBundle =>
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
        feeAmount: 0,
        price: fetchAssetPrice(
          String(asset),
          createTime,
          pairs,
          queue,
        ),
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
    "SELECT dribbletID, fromAsset, 'BNB' AS 'toAsset', amount as 'fromAmount', transferedAmount AS 'toAmount', serviceChargeAmount AS 'commission', operateTime AS 'dateUTCplus2' FROM dribblet",
  ).map((dribblet) => {
    const [
      dribbletID,
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      commission,
      date,
    ] = dribblet;
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
        feeAmount: Number(commission),
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
        feeAmount: 0,
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
          feeAmount: 0,
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
          feeAmount: 0,
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
      )) as [string, string, string, string, string, string][]
    ).map((data, row) => {
      const [date, , amountAndAsset, priceString, , amountAndFiat] = data;
      const dateUTC = new Date(date);
      dateUTC.setHours(dateUTC.getHours() + 1);
      const createTime = dateUTC.getTime();
      const amount = amountAndAsset.replace(/[^\d.-]/g, "");
      const asset = amountAndAsset.replace(/[\d .-]/g, "");
      const fiatAmount = amountAndFiat.replace(/[^\d.-]/g, "");
      const fiatAsset = amountAndFiat.replace(/[\d .-]/g, "");
      if (!amount.length || !priceString.length) return null;
      const price = parseFloat(priceString.replace(/[^\d.-]/g, ""));
      return [
        {
          type: filename,
          refId: row,
          asset: asset,
          side: "OUT",
          amount: parseFloat(amount),
          feeAmount: 0,
          price: price,
          timestamp: createTime,
        },
        {
          type: filename,
          refId: row,
          asset: fiatAsset,
          side: "IN",
          amount: parseFloat(fiatAmount),
          feeAmount: 0,
          price: 1,
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
    `SELECT trade.tradeID, trade.symbol, trade.executedQty, trade.cummulativeQuoteQty, trade.time AS 'date', side, (SELECT SUM(commission) FROM commission WHERE symbol LIKE '%' || commissionAsset || '%' AND orderId = trade.orderId) AS 'commission' FROM trade`,
  ).map((trade) => {
    const [
      tradeID,
      symbol,
      executedQty,
      cummulativeQuoteQty,
      date,
      side,
      commission,
      commissionAsset,
    ] = trade;
    const feeAmount = String(symbol).includes(String(commissionAsset))
      ? commission
      : 0;
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
        feeAmount: side === "SELL" ? Number(feeAmount) : 0,
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
        feeAmount: side === "BUY" ? Number(feeAmount) : 0,
        price: 0,
        timestamp: createTime,
      },
    ];
  });
};
export const transactions = async (
  db: DB,
  transactionBundle: transactionBundle | Promise<transactionBundle>,
): Promise<void> => {
  const binanceTransaction = Transaction(db);
  for (const transactions of (await transactionBundle)) {
    if (!transactions) continue;
    if (transactions[1] && transactions[1].price === 0) {
      const [quoteAssetTransaction, baseAssetTransaction] = transactions;
      const quotePrice = await quoteAssetTransaction.price;
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
      const price = await transaction.price;
      binanceTransaction.add({ ...transaction, price: Number(price) });
    }
  }
};
