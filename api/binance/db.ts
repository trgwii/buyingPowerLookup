import { DB } from "../../deps.ts";

export const BinanceTrade = (db: DB) => ({
  init: () =>
    db.query(`
    CREATE TABLE IF NOT EXISTS trade (
      tradeID INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol                CHARACTER(20),
      orderId               INTEGER,
      orderListId           INTEGER,
      clientOrderId         VARCHAR(50),
      price                 FLOAT,
      origQty               FLOAT,
      executedQty           FLOAT,
      cummulativeQuoteQty   FLOAT,
      status                CHARACTER(20),
      timeInForce           CHARACTER(20),
      type                  CHARACTER(20),
      side                  CHARACTER(20),
      stopPrice             FLOAT,
      icebergQty            FLOAT,
      time                  INTEGER,
      updateTime            INTEGER,
      isWorking             BOOLEAN,
      origQuoteOrderQty     FLOAT,
      UNIQUE(orderId)
    )
  `),
  add: (trade: any) =>
    db.query(
      `INSERT OR IGNORE INTO trade (
        symbol,
        orderId,
        orderListId,
        clientOrderId,
        price,
        origQty,
        executedQty,
        cummulativeQuoteQty,
        status,
        timeInForce,
        type,
        side,
        stopPrice,
        icebergQty,
        time,
        updateTime,
        isWorking,
        origQuoteOrderQty
      ) VALUES (
        :symbol,
        :orderId,
        :orderListId,
        :clientOrderId,
        :price,
        :origQty,
        :executedQty,
        :cummulativeQuoteQty,
        :status,
        :timeInForce,
        :type,
        :side,
        :stopPrice,
        :icebergQty,
        :time,
        :updateTime,
        :isWorking,
        :origQuoteOrderQty
      )`,
      trade,
    ),
});

export const BinancePair = (db: DB) => ({
  init: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS pair (
        pairID INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol                CHARACTER(20),
        baseAsset             CHARACTER(20),
        quoteAsset            CHARACTER(20),
        UNIQUE(symbol)
      )
  `),
  add: (pair: string[]) =>
    db.query(
      `INSERT OR IGNORE INTO pair (
          symbol,
          baseAsset,
          quoteAsset
      ) VALUES ( ?, ?, ?)`,
      pair,
    ),
});

export const BinanceDribblet = (db: DB) => ({
  init: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS dribblet (
        dribbletID INTEGER PRIMARY KEY AUTOINCREMENT,
        fromAsset                            CHARACTER(20),
        amount                               FLOAT,
        transferedAmount                     FLOAT,
        serviceChargeAmount                  FLOAT,
        operateTime                          INTEGER,
        transId                              INTEGER,
        UNIQUE ( fromAsset, transId )
      )
  `),
  add: (dustEntry: any) =>
    db.query(
      `INSERT OR IGNORE INTO dribblet (
          fromAsset,
          amount,
          transferedAmount,
          serviceChargeAmount,
          operateTime,
          transId
        ) VALUES (
          :fromAsset,
          :amount,
          :transferedAmount,
          :serviceChargeAmount,
          :operateTime,
          :transId
        )`,
      dustEntry,
    ),
});

export const BinanceDividend = (db: DB) => ({
  init: () =>
    db.query(`
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
  `),
  add: (dividend: any) =>
    db.query(
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
      dividend,
    ),
});

export const BinanceDeposit = (db: DB) => ({
  init: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS deposit (
        depositID INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNo              VARCHAR(50),
        fiatCurrency         CHARACTER(3),
        indicatedAmount      FLOAT,
        amount               FLOAT,
        totalFee             FLOAT,
        method               CHARACTER(20),
        status               CHARACTER(20),
        createTime           INTEGER,
        updateTime           INTEGER,
        UNIQUE(orderNo)
      )
  `),
  add: (deposit: any) =>
    db.query(
      `INSERT OR IGNORE INTO deposit (
          orderNo,
          fiatCurrency,
          indicatedAmount,
          amount,
          totalFee,
          method,
          status,
          createTime,
          updateTime
        ) VALUES (
          :orderNo,
          :fiatCurrency,
          :indicatedAmount,
          :amount,
          :totalFee,
          :method,
          :status,
          :createTime,
          :updateTime
        )`,
      deposit,
    ),
});

export const BinanceConversion = (db: DB) => ({
  init: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS conversion (
        conversionID INTEGER PRIMARY KEY AUTOINCREMENT,
        quoteId                   VARCHAR(50),
        orderId                   INTEGER,
        orderStatus               CHARACTER(20),
        fromAsset                 CHARACTER(20),
        fromAmount                FLOAT,
        toAsset                   CHARACTER(20),
        toAmount                  FLOAT,
        ratio                     FLOAT,
        inverseRatio              FLOAT,
        createTime                INTEGER,
        UNIQUE(orderId)
      )
  `),
  add: (conversion: any) =>
    db.query(
      `INSERT OR IGNORE INTO conversion (
          quoteId,
          orderId,
          orderStatus,
          fromAsset,
          fromAmount,
          toAsset,
          toAmount,
          ratio,
          inverseRatio,
          createTime
        ) VALUES (
          :quoteId,
          :orderId,
          :orderStatus,
          :fromAsset,
          :fromAmount,
          :toAsset,
          :toAmount,
          :ratio,
          :inverseRatio,
          :createTime
        )`,
      conversion,
    ),
});

export const BinanceCommission = (db: DB) => ({
  init: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS commission (
        commissionID INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol                CHARACTER(20),
        id                    INTEGER,
        orderId               INTEGER,
        orderListId           INTEGER,
        clientOrderId         VARCHAR(50),
        price                 FLOAT,
        qty                   FLOAT,
        quoteQty              FLOAT,
        commission            FLOAT,
        commissionAsset       CHARACTER(20),
        time                  INTEGER,
        isBuyer               BOOLEAN,
        isMaker               BOOLEAN,
        isBestMatch           BOOLEAN,
        UNIQUE(id)
      )
  `),
  add: (commission: any) =>
    db.query(
      `INSERT OR IGNORE INTO commission (
          symbol,
          id,
          orderId,
          orderListId,
          clientOrderId,
          price,
          qty,
          quoteQty,
          commission,
          commissionAsset,
          time,
          isBuyer,
          isMaker,
          isBestMatch
      ) VALUES (
        :symbol,
        :id,
        :orderId,
        :orderListId,
        :clientOrderId,
        :price,
        :qty,
        :quoteQty,
        :commission,
        :commissionAsset,
        :time,
        :isBuyer,
        :isMaker,
        :isBestMatch
      )`,
      commission,
    ),
});

export const BinanceCapitalWithdrawal = (db: DB) => ({
  init: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS cWithdraw (
        cWithdrawID INTEGER PRIMARY KEY AUTOINCREMENT,
        id                       VARCHAR(100),
        amount                   FLOAT,
        transactionFee           FLOAT,
        coin                     CHARACTER(20),
        status                   INTEGER,
        address                  VARCHAR(100),
        txId                     VARCHAR(100),
        applyTime                VARCHAR(50),
        network                  CHARACTER(20),
        transferType             INTEGER,
        info                     VARCHAR(100),
        confirmNo                INTEGER,
        walletType               INTEGER,
        txKey                    VARCHAR(100),
        UNIQUE(txId)
      )
  `),
  add: (cWithdraw: any) =>
    db.query(
      `INSERT OR IGNORE INTO cWithdraw (
          id,
          amount,
          transactionFee,
          coin,
          status,
          address,
          txId,
          applyTime,
          network,
          transferType,
          info,
          confirmNo,
          walletType,
          txKey
        ) VALUES (
          :id,
          :amount,
          :transactionFee,
          :coin,
          :status,
          :address,
          :txId,
          :applyTime,
          :network,
          :transferType,
          :info,
          :confirmNo,
          :walletType,
          :txKey
        )`,
      cWithdraw,
    ),
});

export const BinanceCapitalDeposit = (db: DB) => ({
  init: () =>
    db.query(`
      CREATE TABLE IF NOT EXISTS cDeposit (
        cDepositID INTEGER PRIMARY KEY AUTOINCREMENT,
        amount            FLOAT,
        coin            CHARACTER(20),
        network             CHARACTER(20),
        status            INTEGER,
        address             VARCHAR(100),
        addressTag            VARCHAR(100),
        txId            VARCHAR(100),
        insertTime            INTEGER,
        transferType            INTEGER,
        confirmTimes            CHARACTER(20),
        unlockConfirm             INTEGER,
        walletType            INTEGER,
        UNIQUE(txId)
      )
  `),
  add: (cDeposit: any) =>
    db.query(
      `INSERT OR IGNORE INTO cDeposit (
          amount,
          coin,
          network,
          status,
          address,
          addressTag,
          txId,
          insertTime,
          transferType,
          confirmTimes,
          unlockConfirm,
          walletType
        ) VALUES (
          :amount,
          :coin,
          :network,
          :status,
          :address,
          :addressTag,
          :txId,
          :insertTime,
          :transferType,
          :confirmTimes,
          :unlockConfirm,
          :walletType
        )`,
      cDeposit,
    ),
});
