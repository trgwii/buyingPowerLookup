import { fiatCurrency } from "../../config.ts";
import { formatDate, parseCsv, PQueue, Row } from "../../deps.ts";
import { autoRetry } from "./fetch.ts";
import { binance } from "./mod.ts";
import { backupPriceDirBinance } from "./paths.ts";

export const getAvgBackupPrice = async (
  pair: string,
  timestamp: number,
): Promise<number | boolean> => {
  console.log("checking backup price data");
  try {
    const priceData = await parseCsv(
      await Deno.readTextFile(
        `${backupPriceDirBinance}/${pair}.csv`,
      ),
    );
    const date = new Date(timestamp);
    const dateFormatted = formatDate(date, "yyyy-MM-dd");
    const priceEntry = priceData.find((priceEntry) =>
      priceEntry[1] === dateFormatted
    );
    if (!priceEntry) return false;
    const [, , , Open, High, Low, Close] = priceEntry.map((p) => Number(p));
    return (Open + High + Low + Close) / 4;
  } catch (e) {
    console.log("no backup price data");
    return false;
  }
};

export const getAvgPrice = async (
  pair: string,
  timestamp: number,
  queue: PQueue,
): Promise<number | boolean> => {
  const binanceHandler = autoRetry(binance, "klines");
  const candlesRequest = queue.add(() =>
    binanceHandler(
      pair,
      "1m",
      { limit: 1, startTime: new Date(timestamp).setSeconds(0, 0) },
    )
  );
  const candlesResponse = await candlesRequest;
  if (!(candlesResponse && "data" in candlesResponse)) {
    console.log("no candle found");
    return await getAvgBackupPrice(pair, timestamp);
  }
  const candlesData = candlesResponse.data;
  if (!candlesData.length) {
    console.log("no data in candle");
    return await getAvgBackupPrice(pair, timestamp);
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
  queue: PQueue,
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
        queue,
      );
      if (!(avgPrice && typeof avgPrice === "number")) continue;
      console.log("result: ", avgPrice);
      return avgPrice;
    } else if (asset === fiatPair.quoteAsset) {
      console.log("requesting pair: ", `${fiatCurrency}${asset}`);
      const avgInvertedPrice = await getAvgPrice(
        `${fiatCurrency}${asset}`,
        timestamp,
        queue,
      );
      console.log("result: ", avgInvertedPrice);
      if (!(avgInvertedPrice && typeof avgInvertedPrice === "number")) continue;
      return 1 / avgInvertedPrice;
    }
    console.log(`${asset} not in ${fiatPair.baseAsset}${fiatPair.quoteAsset}`);
  }
  console.log("iterating asset over fiat pairs");
  const transitoryPriceResults: number[] = [];
  for (const fiatPair of fiatPairs) {
    const transitoryPairsData = pairs.filter((pair: Row) => {
      return (
        (
          asset === pair[0] &&
          fiatPair.quoteAsset === fiatCurrency &&
          pair[1] === fiatPair.baseAsset
        ) ||
        (
          asset === pair[0] &&
          fiatPair.baseAsset === fiatCurrency &&
          pair[1] === fiatPair.quoteAsset
        )
      );
    });
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
        queue,
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
        queue,
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
          queue,
        );
        console.log("result: ", avgPrice);
        if (!(avgPrice && typeof avgPrice === "number")) {
          continue;
        }
        transitoryPriceResults.push(avgTransitoryPrice / avgPrice);
      } else if (transitoryAsset === fiatPair.baseAsset) {
        console.log("requesting pair", `${transitoryAsset}${fiatCurrency}`);
        const avgInvertedPrice = await getAvgPrice(
          `${transitoryAsset}${fiatCurrency}`,
          timestamp,
          queue,
        );
        console.log("result: ", avgInvertedPrice);
        if (!(avgInvertedPrice && typeof avgInvertedPrice === "number")) {
          continue;
        }
        transitoryPriceResults.push(avgInvertedPrice * avgTransitoryPrice);
      }
    }
    console.log(
      `${asset} not in ${asset}${quoteTransitoryAsset} => ${fiatCurrency}${transitoryAsset}`,
    );
  }
  if (transitoryPriceResults.length) {
    return transitoryPriceResults.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    ) / transitoryPriceResults.length;
  }
  console.log(`no price found for ${asset}`);
  return false;
};
