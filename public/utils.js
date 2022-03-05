import { elements, renderHTML } from "./hyperactive.min.js";
const { h2, div, img, span, b, br, small } = elements;
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
  const transactions = await fetch(
    `/db/binance/transaction?limit=${transactionLimit}&offset=${offset}`,
  )
    .then((res) => res.json());
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
  document.getElementById("root").innerHTML = transactionGroups.map(
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
      const time = getTimeFromDate(timestamp);
      const date = new Date(timestamp).toLocaleDateString("en-us");
      return renderHTML(
        div(
          {
            class: "row col-lg-8 justify-content-between mb-3",
          },
          lastDate === date ? "" : h2({
            class: "col-12",
          }, date),
          div(
            { class: "col-lg-4" },
            div({}, b(type)),
            div({}, span(time)),
            (() => {
              lastDate = date;
              return "";
            })(),
          ),
          div(
            {
              class: "d-flex justify-content-between mb-3 col-lg-8",
            },
            !OUT ? div({ class: "w-100" }) : div(
              { class: "col-5 text-end" },
              span({ class: "mx-2" }, `-${OUT.amount} ${OUT.asset}`),
              !outAssetData ? "" : img({
                src: `assets/${outAssetData.id}.png`,
                alt: `${OUT.asset} logo`,
                class: "mx-2",
              }),
            ),
            div({ class: "h2" }, OUT && IN ? "→" : ""),
            !IN ? div({ class: "w-100" }) : div(
              { class: "col-5" },
              !inAssetData ? "" : img({
                src: `assets/${inAssetData.id}.png`,
                alt: `${IN.asset} logo`,
                class: "mx-2",
              }),
              span({ class: "mx-2" }, `+${IN.amount} ${IN.asset}`),
              br(),
              fiatCurrency === IN.asset ? "" : small(
                { class: "ms-5" },
                `≈ €${(IN.amount * IN.price).toFixed(2)}`,
              ),
            ),
          ),
        ),
      );
    },
  ).join("");
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
