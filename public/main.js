import { nodesWithName, updatePage } from "./utils.js";

const transactionLimit = 50;
const fiatCurrency = document.getElementById("fiatCurrency").value;
const urlParams = Object.fromEntries(new URL(location.href).searchParams);

let page = Number(urlParams.page ?? 1);
nodesWithName("cur-page").forEach(
  (nodeWithName) => {
    nodeWithName.innerText = page;
  },
);

(async () => {
  const assetListData = await fetch("cryptoCurrencyList.json").then((res) =>
    res.json()
  );
  updatePage(page, assetListData, transactionLimit, fiatCurrency);
  nodesWithName("prev-page").forEach((nodeWithName) => {
    nodeWithName.addEventListener(
      "click",
      () =>
        (page > 1) &&
        updatePage(--page, assetListData, transactionLimit, fiatCurrency),
    );
  });
  nodesWithName("next-page").forEach((nodeWithName) => {
    nodeWithName.addEventListener(
      "click",
      () => updatePage(++page, assetListData, transactionLimit, fiatCurrency),
    );
  });
})();
