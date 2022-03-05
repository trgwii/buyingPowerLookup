import { elements, renderHTML } from "./hyperactive.min.js";
const { article, button, h2, div, header, footer, img, span, b, small } =
  elements;
const pad = (num) => ("0" + num).slice(-2);

const getTimeFromDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  let hours = date.getHours(),
    minutes = date.getMinutes(),
    seconds = date.getSeconds();
  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
};

const renderTransactionList = async (
  assetListData,
  fiatCurrency,
  transactionLimit,
  offset = 0,
) => {
  const endpoint = "binance";
  const transactionsData = await fetch(
    `/db/${endpoint}/transaction?limit=${transactionLimit}&offset=${offset}`,
  )
    .then((res) => res.json());
  const transactions = transactionsData.transactions;
  const gains = transactionsData.gains;
  const costs = transactionsData.costs;
  console.log(costs);
  const transactionGroups = [];
  for (const transaction of transactions) {
    const transactionGroupToAppend = transactionGroups.findIndex(
      (transactionGroup) =>
        transactionGroup.refId === transaction.refId &&
        transactionGroup.type === transaction.type,
    );
    if (transactionGroupToAppend === -1) {
      transactionGroups.push({
        refId: transaction.refId,
        type: transaction.type,
        timestamp: transaction.timestamp,
        [transaction.side]: transaction,
      });
      continue;
    }
    transactionGroups[transactionGroupToAppend][transaction.side] = transaction;
  }
  let lastDate = null;
  document.getElementById("root").innerHTML = renderHTML(
    div(
      { class: "list-group" },
      ...transactionGroups.map(
        (transactionGroup) => {
          const { refId, type, timestamp, IN, OUT } = transactionGroup;
          const outAssetData = assetListData.find((data) =>
            OUT &&
            data.symbol === OUT.asset
          );
          const inAssetData = assetListData.find((data) =>
            IN &&
            data.symbol === IN.asset
          );
          const costBasis = costs.find(
            ({ sale }) => {
              return OUT &&
                sale.symbol === OUT.asset &&
                new Date(sale.date).getTime() === new Date(timestamp).getTime();
            },
          );
          const gainOnSell = gains.find(
            ({ sale }) => {
              return OUT &&
                sale.symbol === OUT.asset &&
                new Date(sale.date).getTime() === new Date(timestamp).getTime();
            },
          );
          const time = getTimeFromDate(timestamp);
          const options = { year: "numeric", month: "long", day: "numeric" };
          const date = new Date(timestamp).toLocaleDateString("en-US", options);
          return div(
            {
              class: `col-lg-8`,
            },
            lastDate === date ? "" : header(
              { class: `d-flex justify-content-between py-3 ` },
              h2({
                class: "h3 px-3 text-secondary col-12",
              }, date),
            ),
            button(
              {
                class:
                  `d-flex justify-content-between py-3 list-group-item list-group-item-action`,
              },
              div(
                { class: "col-lg-3 d-flex flex-column justify-content-center" },
                div({}, b(type)),
                div({}, span(time)),
                (() => {
                  lastDate = date;
                  return "";
                })(),
              ),
              div(
                {
                  class: "d-flex justify-content-between col-lg-9",
                },
                !OUT ? div({ class: "w-100" }) : div(
                  {
                    class:
                      "col-5 text-end justify-content-end d-flex align-items-center",
                  },
                  article(
                    { class: "mx-2" },
                    header(
                      span(
                        { class: "text-secondary opacity-50" },
                        endpoint.toUpperCase(),
                      ),
                    ),
                    div(
                      { class: "d-flex justify-content-end" },
                      `-${OUT.amount} ${OUT.asset}`,
                    ),
                    footer(
                      { class: "d-flex justify-content-end small" },
                      !costBasis ? "" : `${(costBasis.costBasis.toFixed(
                        2,
                      ))} ${fiatCurrency} cost basis`,
                    ),
                  ),
                  img({
                    src: `assets/${
                      outAssetData
                        ? outAssetData.id
                        : fiatCurrency.toLowerCase()
                    }.png`,
                    alt: `${OUT.asset} logo`,
                    class: "mx-2",
                    width: 32,
                    height: 32,
                  }),
                ),
                div(
                  { class: "h2 d-flex align-items-center" },
                  OUT && IN ? span("→") : "",
                ),
                !IN ? div({ class: "w-100" }) : div(
                  { class: "d-flex align-items-center col-5" },
                  img({
                    src: `assets/${
                      inAssetData ? inAssetData.id : fiatCurrency.toLowerCase()
                    }.png`,
                    alt: `${IN.asset} logo`,
                    class: "mx-2",
                    width: 32,
                    height: 32,
                  }),
                  article(
                    { class: "mx-2" },
                    header(
                      span(
                        { class: "text-secondary opacity-50" },
                        endpoint.toUpperCase(),
                      ),
                    ),
                    div(
                      `+${IN.amount} ${IN.asset} `,
                    ),
                    footer(
                      { class: "d-flex small" },
                      fiatCurrency === IN.asset || IN.price === 0 ? "" : span(
                        `≈ ${
                          (IN.amount * IN.price).toFixed(2)
                        } ${fiatCurrency}`,
                      ),
                      !gainOnSell || fiatCurrency === IN.asset || IN.price === 0
                        ? ""
                        : span({ class: "mx-2" }, "•"),
                      !gainOnSell ? "" : span(
                        {
                          class: gainOnSell.capitalGains.toFixed(2) === 0
                            ? ""
                            : `text-${
                              gainOnSell.capitalGains.toFixed(2) < 0
                                ? "danger"
                                : "success"
                            }`,
                        },
                        `+${
                          gainOnSell.capitalGains.toFixed(2)
                        } ${fiatCurrency} ${
                          gainOnSell.capitalGains.toFixed(2) === 0
                            ? ""
                            : gainOnSell.capitalGains.toFixed(2) < 0
                            ? "loss"
                            : "profit"
                        }`,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    ),
  );
};
export const updatePage = (
  page,
  assetListData,
  transactionLimit,
  fiatCurrency,
) => {
  window.history.pushState(
    {},
    "",
    `/transactions?page=${page}`,
  );
  nodesWithName("cur-page").forEach(
    (nodeWithName) => {
      nodeWithName.innerText = page;
    },
  );
  renderTransactionList(
    assetListData,
    fiatCurrency,
    transactionLimit,
    (page - 1) * transactionLimit,
  );
};
export const nodesWithName = (name = "") =>
  document.querySelectorAll(`[name="${name}"]`);
