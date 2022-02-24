import { fiatCurrency } from "../config.ts";
import { Row } from "../deps.ts";
import { autoRetry, binance } from "./binance.ts";

export const getAvgPrice = async (
  pair: string,
  timestamp: number,
): Promise<number | boolean> => {
  const candlesResponse = await autoRetry(
    () =>
      binance.klines(
        pair,
        "1m",
        { limit: 1, startTime: new Date(timestamp).setSeconds(0, 0) },
      ),
  );
  if (!(candlesResponse && "data" in candlesResponse)) return false;
  const candlesData = candlesResponse.data;
  if (!candlesData.length) {
    console.log("no candle found");
    return false;
  }
  const firstCandle = candlesData[0];
  const candleOpenPrice = Number(firstCandle[1]);
  const candleClosePrice = Number(firstCandle[4]);
  return (candleOpenPrice + candleClosePrice) / 2;
};

export const fetchAssetPrice = async (
  asset: string,
  timestamp: number,
  pairs: Row[],
): Promise<number | boolean> => {
  if (asset === fiatCurrency) {
    console.log(asset, " is fiat, returning 1");
    return 1;
  }
  console.log();
  console.log();
  console.log("fetching price for: ", asset);
  const fiatPairsData = pairs.filter((pair: Row) =>
    pair[0] === fiatCurrency || pair[1] === fiatCurrency
  );
  const fiatPairs = fiatPairsData.map((fiatPair) => ({
    baseAsset: String(fiatPair[0]),
    quoteAsset: String(fiatPair[1]),
  }));
  console.log("checking if asset is a fiat pair");
  for (const fiatPair of fiatPairs) {
    if (asset === fiatPair.baseAsset) {
      console.log("requesting pair: ", `${asset}${fiatCurrency}`);
      const avgPrice = await getAvgPrice(
        `${asset}${fiatCurrency}`,
        timestamp,
      );
      if (!(avgPrice && typeof avgPrice === "number")) continue;
      console.log("result: ", avgPrice);
      return avgPrice;
    } else if (asset === fiatPair.quoteAsset) {
      console.log("requesting pair: ", `${fiatCurrency}${asset}`);
      const avgInvertedPrice = await getAvgPrice(
        `${fiatCurrency}${asset}`,
        timestamp,
      );
      console.log("result: ", avgInvertedPrice);
      if (!(avgInvertedPrice && typeof avgInvertedPrice === "number")) continue;
      return 1 / avgInvertedPrice;
    }
    console.log(`${asset} not in ${fiatPair.baseAsset}${fiatPair.quoteAsset}`);
  }
  console.log("iterating asset over fiat pairs");
  for (const fiatPair of fiatPairs) {
    const transitoryPairsData = pairs.filter((pair: Row) =>
      (
        pair[0] === asset && pair[1] === fiatPair.quoteAsset
      ) ||
      (
        pair[0] === fiatPair.quoteAsset && pair[1] === asset
      )
    );
    if (!transitoryPairsData || !transitoryPairsData.length) continue;
    const [baseTransitoryAsset, quoteTransitoryAsset] = transitoryPairsData[0]
      .map((result) => String(result));
    let avgTransitoryPrice;
    let transitoryAsset;
    if (asset === baseTransitoryAsset) {
      console.log("requesting pair", `${asset}${quoteTransitoryAsset}`);
      transitoryAsset = quoteTransitoryAsset;
      avgTransitoryPrice = await getAvgPrice(
        `${asset}${quoteTransitoryAsset}`,
        timestamp,
      );
      if (!(avgTransitoryPrice && typeof avgTransitoryPrice === "number")) {
        continue;
      }
    } else if (asset === quoteTransitoryAsset) {
      console.log("requesting pair", `${baseTransitoryAsset}${asset}`);
      transitoryAsset = baseTransitoryAsset;
      const avgInvertedTransitoryPrice = await getAvgPrice(
        `${baseTransitoryAsset}${asset}`,
        timestamp,
      );
      if (
        !(avgInvertedTransitoryPrice &&
          typeof avgInvertedTransitoryPrice === "number")
      ) {
        continue;
      }
      avgTransitoryPrice = 1 / avgInvertedTransitoryPrice;
    }
    console.log("result: ", avgTransitoryPrice);
    if (
      !(
        avgTransitoryPrice &&
        typeof avgTransitoryPrice === "number" &&
        (
          transitoryAsset === baseTransitoryAsset ||
          transitoryAsset === quoteTransitoryAsset
        )
      )
    ) {
      console.log(
        `${asset} not in ${baseTransitoryAsset}${quoteTransitoryAsset}`,
      );
      continue;
    }
    for (const fiatPair of fiatPairs) {
      if (transitoryAsset === fiatPair.quoteAsset) {
        console.log("requesting pair", `${fiatCurrency}${transitoryAsset}`);
        const avgPrice = await getAvgPrice(
          `${fiatCurrency}${transitoryAsset}`,
          timestamp,
        );
        console.log("result: ", avgPrice);
        if (!(avgPrice && typeof avgPrice === "number")) {
          continue;
        }
        return avgTransitoryPrice / avgPrice;
      } else if (transitoryAsset === fiatPair.baseAsset) {
        console.log("requesting pair", `${transitoryAsset}${fiatCurrency}`);
        const avgInvertedPrice = await getAvgPrice(
          `${transitoryAsset}${fiatCurrency}`,
          timestamp,
        );
        console.log("result: ", avgInvertedPrice);
        if (!(avgInvertedPrice && typeof avgInvertedPrice === "number")) {
          continue;
        }
        return avgInvertedPrice * avgTransitoryPrice;
      }
    }
  }
  console.log(`no price found for ${asset}`);
  return false;
};
