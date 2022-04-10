import { fiatCurrency, locale } from "./config.ts";
import { Operation, writeCSV, YearlyCapitalGains } from "./deps.ts";

export interface CapitalGains {
  /**
   * Sale that triggered the capital gains
   */
  sale: Operation;

  /**
   * Capital gains triggered from the sale
   */
  capitalGains: number;
  rows: string[][];
}
export async function calculateFIFOCapitalGains(
  operationHistory: Operation[],
): Promise<CapitalGains[]> {
  const capitalGainsFile = "./db/capitalGains.csv";
  await Deno.remove(capitalGainsFile);
  const f = await Deno.open(capitalGainsFile, {
    write: true,
    create: true,
  });
  const history = operationHistory.map((obj) => ({ ...obj }));
  const sales = history.filter(({ type }) => type === "SELL");
  const csvRows: string[][] = [
    [
      "AMOUNT IN/OUT AND SYMBOL",
      "TRANSACTION DATE",
      "ASSET PRICE",
      "CAPITAL GAIN",
    ],
  ];
  const capitalGains: CapitalGains[] = sales.map((sale) => {
    const capitalGainsForSale = calculateCapitalGainsForSale(history, sale);
    csvRows.push(...capitalGainsForSale.rows);
    return capitalGainsForSale;
  });
  const capitalGainsResult = Number(
    capitalGains.reduce<number[]>(
      (capitalGainsPerYear, { capitalGains, sale: { date } }) => {
        if (typeof capitalGainsPerYear[date.getFullYear()] !== "number") {
          capitalGainsPerYear[date.getFullYear()] = 0;
        }
        capitalGainsPerYear[date.getFullYear()] += capitalGains;
        return capitalGainsPerYear;
      },
      [],
    ).filter((n) => n).shift(),
  );
  csvRows.push([
    "",
    "",
    "",
    capitalGainsResult !== 0
      ? `${Number(capitalGainsResult.toFixed(2)) > 0 ? "+" : "-"} ${
        Math.abs(capitalGainsResult).toFixed(2)
      } ${fiatCurrency}`
      : "0",
  ]);
  await writeCSV(f, csvRows);
  f.close();
  return capitalGains;
}

function calculateCapitalGainsForSale(
  operationHistory: Operation[],
  sale: Operation,
): CapitalGains {
  const csvRows = [];
  let capitalGains = 0;
  const saleCopy = { ...sale };

  const buys = operationHistory
    .filter(
      ({ type, symbol, date }) =>
        type === "BUY" && symbol === sale.symbol && date < sale.date,
    );
  for (const buy of buys) {
    const amountSold = Math.min(sale.amount, buy.amount);
    if (amountSold > 0) {
      csvRows.push([
        `+ ${amountSold} ${buy.symbol}`,
        buy.date.toLocaleDateString(locale),
        Number(buy.price.toFixed(2)) === 0
          ? "dividend"
          : `${Math.abs(buy.price).toFixed(2)} ${fiatCurrency}`,
        "",
      ]);
    }
    buy.amount -= amountSold;
    sale.amount -= amountSold;
    capitalGains += amountSold * (sale.price - buy.price);
  }

  if (sale.amount > 0) {
    throw Error(
      `Amount of sales for symbol ${sale.symbol} exceeds the amount of buys.`,
    );
  }
  csvRows.push([
    `- ${saleCopy.amount} ${saleCopy.symbol}`,
    saleCopy.date.toLocaleDateString(locale),
    saleCopy.price === 0
      ? "commission"
      : `${saleCopy.price.toFixed(2)} ${fiatCurrency}`,
    capitalGains !== 0
      ? `${Number(capitalGains.toFixed(2)) > 0 ? "+" : "-"} ${
        Math.abs(capitalGains).toFixed(2)
      } ${fiatCurrency}`
      : "0",
  ]);
  csvRows.push([
    "",
    "",
    "",
    "",
  ]);
  return {
    capitalGains,
    sale: saleCopy,
    rows: csvRows,
  };
}
/**
 * https://github.com/bernardobelchior/fifo-capital-gains-js/blob/9ab353d610b7c8f477dfa3241c1619f3ac799471/src/capital-gains.ts#L45
 * calculateCostBasis created from calculateCapitalGainsForSale ^
 */
export function calculateCostBasis(
  operationHistory: Operation[],
  sale: Operation,
): { costBasis: number; sale: Operation } {
  let costBasis = 0;
  const saleCopy = { ...sale };

  operationHistory
    .filter(
      ({ type, symbol, date }) =>
        type === "BUY" && symbol === sale.symbol && date < sale.date,
    )
    .forEach((buy) => {
      const amountSold = Math.min(sale.amount, buy.amount);

      buy.amount -= amountSold;
      sale.amount -= amountSold;
      costBasis += amountSold * buy.price;
    });

  if (sale.amount > 0) {
    throw Error(
      `Amount of sales for symbol ${sale.symbol} exceeds the amount of buys.`,
    );
  }

  return { costBasis: costBasis, sale: saleCopy };
}
