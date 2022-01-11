import { myCoin } from "./api/types.ts";
export const convertSavingTicker = (ticker: string) => ticker.substr(2);
export const isSavingTicker = (allTickers: string[], ticker: string) =>
  ticker.startsWith("LD") &&
  allTickers.includes(ticker.substr(2));
export const getCoinIndex = (
  allTickers: string[],
  coinList: myCoin[],
  ticker: string,
) =>
  coinList.findIndex(
    (coin) =>
      coin.ticker === (isSavingTicker(allTickers, coin.ticker)
        ? convertSavingTicker(coin.ticker)
        : ticker),
  );
