import { sleep } from '../deps.ts';
import { Spot } from 'https://esm.sh/@binance/connector';
import { binanceAPIaccess } from './credentials.ts';
const { apiKey, secretKey } = binanceAPIaccess;
export const binance = new Spot(apiKey, secretKey);
export const autoRetry = async (f: CallableFunction) => {
    try {
        return await f();
    }   catch (e){
        console.log(e);
        const timeout = Number(e.response.headers.get('retry-after'));
        if(timeout <= 0) {
          console.error(e.response.data.msg);
          return false;
        } 
        console.log(`waiting ${timeout} seconds`);
        await sleep(timeout);
        return true;
    }
}

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