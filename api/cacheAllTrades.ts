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
const exchangeInfoText = await Deno.readTextFile("./cache/api/v3/exchangeInfo.json");
const exchangeInfo = JSON.parse(exchangeInfoText);
const allSymbols = exchangeInfo.symbols.map(
    (symbolObject: any) => symbolObject.symbol
);
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
for ( const symbol of allSymbols) {
    const reqEndpoint = '/api/v3/allOrders';
    const cacheFile = `./cache${reqEndpoint}/${symbol}.json`;
    if(existsSync(cacheFile)){
        continue;
    }
    i++;
    console.log(symbol);
    const now = Date.now();
    const query = `timestamp=${now.toString()}&symbol=${symbol}`
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
        cacheFile,
        JSON.stringify(data)
    );
}

