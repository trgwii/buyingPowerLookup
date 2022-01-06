/**
 * https://help.blockpit.io/hc/en-us/articles/360011889119-How-to-import-data-via-Binance-API-key-
 * Crypto Deposits                                                              /sapi/v1/capital/deposit/hisrec
 *                  & Withdrawals                                               /sapi/v1/capital/withdraw/history
 * Fiat Deposits & Withdrawals & Fee Payments                                   /sapi/v1/fiat/orders
 * Spot Trades                                                                  /api/v3/allOrders
 * PnL for Futures Trades (Profit, Loss, Fee, Funding)                          NA
 * Binance Liquid Swaps                                                         NA
 * Credit Card Purchases                                                        NA
 * Direct Converts / OTC Trades                                                 /sapi/v1/convert/tradeFlow
 * Dust to BNB Conversions                                                      /sapi/v1/asset/dribblet
 * Earning Rewards & Distributions (Staking, Lending, Airdrops, Hardforks)      /sapi/v1/asset/assetDividend
 */
import { hmac, existsSync } from "../deps.ts";
import { binanceAPIaccess } from './credentials.ts';
const { apiKey, secretKey } = binanceAPIaccess;
const now = Date.now();
const query = `timestamp=${now.toString()}`
const signature = hmac("sha256", secretKey, query, "utf8", "hex");
const url = `https://api.binance.com/sapi/v1/account/status?${query}&signature=${signature}`;
const res = await fetch(url,{
    headers: {
        'X-MBX-APIKEY': apiKey
    }
});
if(res.status > 200){
    console.error(`server responded with ${res.status}`);
    Deno.exit(1);
}
let i = 0;
for (let m = 1; m <= 12; m++) {
    const mString = m.toString().length === 1 ?`0${m}` :m.toString();
    const lastDayOfMonth = new Date(2021, m +1, 0).getDate();
    const firstDayTimestamp = Date.parse(`2021-${mString}-01`);
    const middleDayTimestamp = Date.parse(`2021-${mString}-15`);
    const lastDayTimestamp = Date.parse(`2021-${mString}-${lastDayOfMonth}`);
    const reqEndpoint = '/sapi/v1/asset/assetDividend';
    const cacheDir = `./cache${reqEndpoint}`;
    i++;
    console.log(mString);
    const now = Date.now();
    const query = `timestamp=${now.toString()}&startTime=${firstDayTimestamp}&endTime=${middleDayTimestamp}&limit=500`
    const signature = hmac("sha256", secretKey, query, "utf8", "hex");
    const url = `https://api.binance.com${reqEndpoint}?${query}&signature=${signature}`;
    const res = await fetch(url,{
        headers: {
            'X-MBX-APIKEY': apiKey
        }
    });
    if(res.status > 200){
        console.error(`server responded with ${res.status}`);
        break;
    }
    const data = await res.json();
    await Deno.writeTextFile(
        `${cacheDir}/${mString}A.json`,
        JSON.stringify(data)
    );
    
    const now2 = Date.now();
    const query2 = `timestamp=${now.toString()}&startTime=${middleDayTimestamp}&endTime=${lastDayTimestamp}&limit=500`
    const signature2 = hmac("sha256", secretKey, query2, "utf8", "hex");
    const url2 = `https://api.binance.com${reqEndpoint}?${query2}&signature=${signature2}`;
    const res2 = await fetch(url2,{
        headers: {
            'X-MBX-APIKEY': apiKey
        }
    });
    if(res2.status > 200){
        console.error(`server responded with ${res.status}`);
        break;
    }
    const data2 = await res2.json();
    await Deno.writeTextFile(
        `${cacheDir}/${mString}B.json`,
        JSON.stringify(data2)
    );
}

