SELECT
datetime(time/1000, 'unixepoch') AS 'datetime',
pair.quoteAsset,
CASE WHEN side = 'BUY'
THEN cummulativeQuoteQty
ELSE executedQty
END AS 'amount',
CASE WHEN side LIKE 'BUY'
THEN ROUND(
fiatPrice, 2
)
ELSE ROUND(
fiatPrice, 2
)
END AS "price"
FROM trade
JOIN tradeFiatPrice
ON trade.tradeID = tradeFiatPrice.tradeID
JOIN pair
ON trade.symbol = pair.symbol
WHERE datetime LIKE '2021%'