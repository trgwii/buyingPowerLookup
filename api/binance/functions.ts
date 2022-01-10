import { hmac, z } from "../../deps.ts";
import type { balanceType, myCoin } from "../types.ts";
import { balance } from "../validators.ts";
export const convertSavingTicker = (ticker: string) => ticker.substr(2);
export const isSavingTicker = (allTickers: string[], ticker: string) =>
  ticker.startsWith("LD") && allTickers.includes(ticker.substr(2));
export const getCoinIndex = (
  allTickers: string[],
  coinList: myCoin[],
  ticker: string,
) =>
  coinList.findIndex(
    (coin) =>
      coin.ticker ===
        (isSavingTicker(allTickers, coin.ticker)
          ? convertSavingTicker(coin.ticker)
          : ticker),
  );

export const fetchMyCoins = async (apiKey: string, secretKey: string) => {
  const now = Date.now();
  const query = `timestamp=${now.toString()}`;
  const signature = hmac("sha256", secretKey, query, "utf8", "hex");

  const url =
    `https://api.binance.com/api/v3/account?${query}&signature=${signature}`;
  const req = await fetch(url, { headers: { "X-MBX-APIKEY": apiKey } });

  const data = await req.json();
  console.log(data);
  try {
    const balances: balanceType[] = z.array(balance).parse(data.balances);
    const allTickers = balances.map((balance) => balance.asset);
    const nonEmptyBalances = balances.filter((balance) =>
      Number(balance.free) > 0 || Number(balance.locked) > 0
    );
    const myCoins: myCoin[] = [];
    nonEmptyBalances.forEach((nonEmptyBalance) => {
      const ticker = nonEmptyBalance.asset;
      const amount = Number(nonEmptyBalance.free) +
        Number(nonEmptyBalance.locked);
      if (!isSavingTicker(allTickers, ticker)) {
        return myCoins.push({ ticker: ticker, amount: amount });
      }
      const baseTicker = convertSavingTicker(ticker);
      const indexOfCoin = getCoinIndex(allTickers, myCoins, baseTicker);
      if (indexOfCoin === -1) {
        return myCoins.push({ ticker: baseTicker, amount: 0 });
      }
      myCoins[indexOfCoin] = {
        ticker: baseTicker,
        amount: myCoins[indexOfCoin].amount + amount,
      };
    });
    return myCoins;
  } catch (err) {
    throw new Error(err);
  }
};
