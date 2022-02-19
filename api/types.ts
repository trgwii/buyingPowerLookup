import { z } from "../deps.ts";
import { balance } from "./validators.ts";
export type balanceType = z.infer<typeof balance>;
export type transaction = {
  type: string;
  refId: number;
  asset: string;
  side: string;
  amount: number;
  price: number;
  timestamp: number;
};
export type coingeckoInfo = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: { times: number; currency: string; percentage: number };
  last_updated: string;
};

export type coinapiQuote = {
  symbol_id: string;
  time_exchange: string;
  time_coinapi: string;
  ask_price: number;
  ask_size: number;
  bid_price: number;
  bid_size: number;
  last_trade: {
    time_exchange: string;
    time_coinapi: string;
    uuid: string;
    price: number;
    size: number;
    taker_side: string;
  };
};

export type myCoin = {
  ticker: string;
  amount: number;
};
