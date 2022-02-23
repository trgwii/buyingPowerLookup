import type { AxiosResponse } from "https://esm.sh/axios@0.21.4";

export declare class SpotClass {
  constructor(apiKey: string, secretKey: string);

  /**
   * Get Fiat Deposit/Withdraw History (USER_DATA)
   *
   * GET /sapi/v1/fiat/orders
   *
   * https://binance.github.io/binance-connector-node/module-Fiat.html#depositWithdrawalHistory
   *
   * https://binance-docs.github.io/apidocs/spot/en/#get-fiat-deposit-withdraw-history-user_data
   */
  depositWithdrawalHistory(
    /** 0: deposit, 1: withdraw */
    transactionType: 0 | 1,
    options?: {
      /** If beginTime and endTime are not sent, the recent 30-day data will be returned. */
      beginTime?: number;
      endTime?: number;
      /** default 1 */
      page?: number;
      /** default 100, max 500 */
      rows?: number;
      recvWindow?: number;
    },
  ): Promise<
    AxiosResponse<{
      code: string;
      message: string;
      data: {
        orderNo: string;
        fiatCurrency: string;
        indicatedAmount: string;
        amount: string;
        /** Trade fee */
        totalFee: string;
        /** Trade method */
        method: string;
        status:
          | "Processing"
          | "Failed"
          | "Successful"
          | "Finished"
          | "Refunding"
          | "Refunded"
          | "Refund Failed"
          | "Order Partial credit Stopped";
        createTime: number;
        updateTime: number;
      }[];
      total: number;
      success: boolean;
    }>
  >;

  /**
   * Withdraw History(supporting network) (USER_DATA)
   *
   * GET /sapi/v1/capital/withdraw/history
   *
   * https://binance.github.io/binance-connector-node/module-Wallet.html#withdrawHistory
   *
   * https://binance-docs.github.io/apidocs/spot/en/#withdraw-history-supporting-network-user_data
   */
  withdrawHistory(options?: {
    coin?: number;
    withdrawOrderId?: number;
    /** 0:Email Sent 1:Cancelled 2:Awaiting Approval 3:Rejected 4:Processing 5:Failure 6:Completed */
    status?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    /** Default: 90 days from current timestamp */
    startTime?: number;
    /** Default: present timestamp */
    endTime?: number;
    offset?: number;
    limit?: number;
    /** The value cannot be greater than 60000 */
    recvWindow?: number;
  }): Promise<
    AxiosResponse<{
      address: string;
      amount: string;
      applyTime: string;
      coin: string;
      id: string;
      /** will not be returned if there's no withdrawOrderId for this withdraw. */
      withdrawOrderId?: string;
      network: string;
      status: number;
      transactionFee: string;
      /** 1 for internal transfer, 0 for external transfer */
      transferType: number;
      /** confirm times for withdraw */
      confirmNo: number;
      /** reason for withdrawal failure */
      info: string;
      txId: string;
    }[]>
  >;

  /**
   * Deposit History(supporting network) (USER_DATA)
   *
   * GET /sapi/v1/capital/deposit/hisrec
   *
   * https://binance.github.io/binance-connector-node/module-Wallet.html#depositHistory
   *
   * https://binance-docs.github.io/apidocs/spot/en/#deposit-history-supporting-network-user_data
   */
  depositHistory(options?: {
    coin?: string;
    /** 0:pending, 6:credited but cannot withdraw, 1:success */
    status?: 0 | 6 | 1;
    /** Default: 90 days from current timestamp */
    startTime?: number;
    /** Default: present timestamp */
    endTime?: number;
    offset?: number;
    limit?: number;
    /** The value cannot be greater than 60000 */
    recvWindow?: number;
  }): Promise<AxiosResponse>;

  /**
   * Kline/Candlestick Data
   *
   * GET /api/v3/klines
   *
   * https://binance.github.io/binance-connector-node/module-Market.html#klines
   *
   * https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
   */
  klines(symbol: string, interval: string, options?: {
    startTime?: number;
    endTime?: number;
    /** Default 500; max 1000. */
    limit?: number;
  }): Promise<AxiosResponse>;

  /**
   * Account Trade List (USER_DATA)
   *
   * GET /api/v3/myTrades
   *
   * https://binance.github.io/binance-connector-node/module-Trade.html#myTrades
   *
   * https://binance-docs.github.io/apidocs/spot/en/#account-trade-list-user_data
   */
  myTrades(symbol: string, options?: {
    /** This can only be used in combination with symbol. */
    orderId?: number;
    startTime?: number;
    endTime?: number;
    fromId?: number;
    limit?: number;
    /** The value cannot be greater than 60000 */
    recvWindow?: number;
  }): Promise<AxiosResponse>;

  /**
   * Get Convert Trade History (USER_DATA)
   *
   * GET /sapi/v1/convert/tradeFlow
   *
   * https://binance.github.io/binance-connector-node/module-Convert.html#convertTradeHistory
   *
   * https://binance-docs.github.io/apidocs/spot/en/#get-convert-trade-history-user_data
   */
  convertTradeHistory(startTime?: number, endTime?: number, options?: {
    /** Default 100, Max 1000 */
    limit?: number;
    recvWindow?: number;
  }): Promise<AxiosResponse>;

  /**
   * Asset Dividend Record (USER_DATA)
   *
   * GET /sapi/v1/asset/assetDividend
   *
   * Query asset dividend record.
   *
   * https://binance.github.io/binance-connector-node/module-Wallet.html#assetDevidendRecord
   *
   * https://binance-docs.github.io/apidocs/spot/en/#asset-dividend-record-user_data
   */
  assetDevidendRecord(options?: {
    asset?: string;
    startTime?: number;
    endTime?: number;
    /** Default 20, max 500 */
    limit?: number;
    /** The value cannot be greater than 60000 */
    recvWindow?: number;
  }): Promise<AxiosResponse>;

  /**
   * DustLog (USER_DATA)
   *
   * GET /sapi/v1/asset/dribblet
   *
   * https://binance.github.io/binance-connector-node/module-Wallet.html#dustLog
   *
   * https://binance-docs.github.io/apidocs/spot/en/#dustlog-sapi-user_data
   */
  dustLog(options?: {
    startTime?: number;
    endTime?: number;
    /** The value cannot be greater than 60000 */
    recvWindow?: number;
  }): Promise<
    AxiosResponse<{
      total: number;
      userAssetDribblets: {
        operateTime: number;
        /** Total transfered BNB amount for this exchange. */
        totalTransferedAmount: string;
        /** Total service charge amount for this exchange. */
        totalServiceChargeAmount: string;
        transId: number;
        /** Details of this exchange. */
        userAssetDribbletDetails: {
          transId: number;
          serviceChargeAmount: string;
          amount: string;
          operateTime: number;
          transferedAmount: string;
          fromAsset: string;
        }[];
      }[];
    }>
  >;

  /**
   * Exchange Information
   *
   * GET /api/v3/exchangeInfo
   *
   * Current exchange trading rules and symbol information
   *
   * https://binance.github.io/binance-connector-node/module-Market.html#exchangeInfo
   *
   * https://binance-docs.github.io/apidocs/spot/en/#exchange-information
   */
  exchangeInfo(options?: {
    symbol?: string;
    symbols?: string[];
  }): Promise<AxiosResponse>;

  /**
   * All Orders (USER_DATA)
   *
   * GET /api/v3/allOrders
   *
   * https://binance.github.io/binance-connector-node/module-Trade.html#allOrders
   *
   * https://binance-docs.github.io/apidocs/spot/en/#all-orders-user_data
   */
  allOrders(symbol: string, options?: {
    orderId?: number;
    startTime?: number;
    endTime?: number;
    limit?: number;
    /** The value cannot be greater than 60000 */
    recvWindow?: number;
  }): Promise<
    AxiosResponse<{
      symbol: string;
      orderId: number;
      /** Unless OCO, the value will always be -1 */
      orderListId: number;
      clientOrderId: string;
      price: string;
      origQty: string;
      executedQty: string;
      cummulativeQuoteQty: string;
      status: string;
      timeInForce: string;
      type: string;
      side: string;
      stopPrice: string;
      icebergQty: string;
      time: number;
      updateTime: number;
      isWorking: boolean;
      origQuoteOrderQty: string;
    }[]>
  >;
}
