import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
import { binanceAPIaccess } from './credentials.ts';
const now = Date.now();
const query = `timestamp=${now.toString()}`
const signature = hmac("sha256", binanceAPIaccess.secretKey, query, "utf8", "hex");

const url = `https://api.binance.com/api/v3/account?${query}&signature=${signature}`;
const req = await fetch(url,{
    headers: {
        'X-MBX-APIKEY': binanceAPIaccess.apiKey
    }
});
const data = await req.json();
console.log(data);