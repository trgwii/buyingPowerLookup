SELECT
datetime(`time`/1000, 'unixepoch'),
symbol,
CASE WHEN side LIKE "BUY"
THEN cummulativeQuoteQty
ELSE executedQty
END AS 'qty',
CASE WHEN side LIKE "BUY"
THEN ROUND(
    cummulativeQuoteQty * value, 2
)
ELSE ROUND(
    executedQty * value, 2
)
END AS "amount"
FROM trade
JOIN tradeValue
ON trade.tradeID = tradeValue.id