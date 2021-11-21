import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
import { FIAT_CURRENCY } from '../config.ts';
import { binanceAPIaccess, coinapiKey } from '../credentials.ts';
import { balance, myCoin, coingeckoInfo, coinapiQuote } from '../types.ts';
import { getCoinIndex, isSavingTicker, convertSavingTicker } from '../functions.ts';

const coinapiUrl = `https://rest.coinapi.io/v1/quotes/current`;
const coinapiReq = await fetch(coinapiUrl,{
    headers: {
        'X-CoinAPI-Key': coinapiKey
    }
});
const coinapiData: coinapiQuote[] = await coinapiReq.json();
const binanceData = coinapiData.filter(d=>d.symbol_id.includes('BINANCE_SPOT_'));




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
const balances: balance[] = data.balances;
const allTickers = balances.map(balance=>balance.asset);
const nonEmptyBalances = balances.filter(
    balance=>Number(balance.free) > 0 || Number(balance.locked) > 0
);

const myCoins: myCoin[] = [];
nonEmptyBalances.forEach(nonEmptyBalance => {
    const ticker = nonEmptyBalance.asset;
    const amount = Number(nonEmptyBalance.free) + Number(nonEmptyBalance.locked);
        if(isSavingTicker(allTickers, ticker)){
            const baseTicker = convertSavingTicker(ticker);
            const indexOfCoin = getCoinIndex(allTickers, myCoins, baseTicker);
            if(indexOfCoin === -1){
                myCoins.push({ticker:baseTicker,amount:0});
            }   else    {
                myCoins[indexOfCoin] = {
                    ticker:baseTicker,
                    amount: myCoins[indexOfCoin].amount + amount
                };
            }
        }   else    {
            myCoins.push({ticker:ticker,amount:amount});
        }
});

const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${FIAT_CURRENCY}`;
const coingeckoReq = await fetch(coingeckoUrl);
const coingeckoData: coingeckoInfo[] = await coingeckoReq.json();


let totalBalance = 0;
myCoins.forEach(myCoin => {
    const avPairs = binanceData.filter(
        binancePair=>binancePair.symbol_id.includes(`_${myCoin.ticker}_`)
    );
    for (const avPair of avPairs) {
        if(avPair.symbol_id.endsWith(FIAT_CURRENCY)){
            totalBalance += myCoin.amount * avPair.ask_price;
            break;
        }
        const targetSearch = avPair.symbol_id.match(/BINANCE_SPOT_[A-Z0-9]+_([A-Z0-9]+)/);
        if(targetSearch){
            const targetTicker = targetSearch[1];
            const fiatRate = coingeckoData.find(coin => coin.symbol.toUpperCase() === targetTicker);
            if(!fiatRate) continue;
            totalBalance += myCoin.amount * avPair.ask_price * fiatRate.current_price;
            break;
        }
    }
});
console.log(totalBalance);