import { fiatCurrency } from "../../config.ts";
import { binanceAPIaccess, coinapiKey } from "../credentials.ts";
import { coinapiQuote, coingeckoInfo } from "../types.ts";
import { fetchMyCoins } from "./functions.ts";

const coinapiUrl = `https://rest.coinapi.io/v1/quotes/current`;
const coinapiReq = await fetch(coinapiUrl, {
  headers: { "X-CoinAPI-Key": coinapiKey },
});
const coinapiData: coinapiQuote[] = await coinapiReq.json();
const binanceData = coinapiData.filter((d) =>
  d.symbol_id.includes("BINANCE_SPOT_")
);

const { apiKey, secretKey } = binanceAPIaccess;
const myCoins = await fetchMyCoins(apiKey, secretKey);

const coingeckoUrl =
  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${fiatCurrency}`;
const coingeckoReq = await fetch(coingeckoUrl);
const coingeckoData: coingeckoInfo[] = await coingeckoReq.json();

let totalBalance = 0;
myCoins.forEach((myCoin) => {
  const avPairs = binanceData.filter(
    (binancePair) => binancePair.symbol_id.includes(`_${myCoin.ticker}_`),
  );
  for (const avPair of avPairs) {
    if (avPair.symbol_id.endsWith(fiatCurrency)) {
      totalBalance += myCoin.amount * avPair.ask_price;
      break;
    }
    const targetSearch = avPair.symbol_id.match(
      /BINANCE_SPOT_[A-Z0-9]+_([A-Z0-9]+)/,
    );
    if (targetSearch) {
      const targetTicker = targetSearch[1];
      const fiatRate = coingeckoData.find((coin) =>
        coin.symbol.toUpperCase() === targetTicker
      );
      if (!fiatRate) continue;
      totalBalance += myCoin.amount * avPair.ask_price * fiatRate.current_price;
      break;
    }
  }
});
console.log(totalBalance);
