import { sleep, Spot } from "../deps.ts";
import { binanceAPIaccess } from "./credentials.ts";
const { apiKey, secretKey } = binanceAPIaccess;
export const binance = new Spot(apiKey, secretKey);
export const autoRetry = async <T>(f: () => Promise<T>): Promise<T | false> => {
  try {
    return await f();
  } catch (e) {
    console.log(e);
    const timeout = Number(e.response.headers.get("retry-after"));
    if (timeout <= 0) {
      console.error(e);
      return false;
    }
    console.log(`waiting ${timeout} seconds`);
    await sleep(timeout);
    return await f();
  }
};

/* VERSION TO IMPLEMENT
export const autoRetry = <F extends CallableFunction>(f: F) => async(...args: Parameters<F>) => {
    try {
      return await f(...args);
    } catch (err) {
        console.log(err);
        const timeout = Number(err.response.headers.get('retry-after'));
        if(timeout <= 0) {
          console.error(err.response.data.msg);
          return false;
        }
        console.log(`waiting ${timeout} seconds`);
        await sleep(timeout);
        return true;
    }
  };
*/
