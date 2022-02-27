import { sleep, Spot } from "../deps.ts";
import { SpotClass } from "../Spot.d.ts";
import { binanceAPIaccess } from "./credentials.ts";
const { apiKey, secretKey } = binanceAPIaccess;
export const binance = new Spot(apiKey, secretKey);

export const autoRetry = <Method extends keyof SpotClass>(
  c: SpotClass,
  m: Method,
) => {
  const run = async (
    ...args: Parameters<SpotClass[Method]>
  ): Promise<ReturnType<SpotClass[Method]>> => {
    try { //@ts-expect-error here
      return await c[m](...args);
    } catch (err) {
      const timeout = Number(err.response.headers.get("retry-after"));
      if (timeout <= 0) {
        console.error(err);
        throw new Error(err);
      }
      console.log(`waiting ${timeout} seconds`);
      await sleep(timeout);
      return run(...args);
    }
  };
  return run;
};
