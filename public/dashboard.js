import { elements, renderDOM } from "./hyperactive.min.js";
const { ol, li, img, span, br, hr } = elements;
(async () => {
  const assetListData = await fetch("cryptoCurrencyList.json").then((res) =>
    res.json()
  );
  const dashboardData = await fetch(
    `/db/dashboard`,
  ).then((res) => res.json());
  const dashboardList = dashboardData.map(
    (dashboardEntry) => ({
      ...dashboardEntry,
      logo: `assets/${
        assetListData.find((data) => data.symbol === dashboardEntry.asset).id ??
          0
      }.png`,
    }),
  );
  const totalPortfolio = dashboardData.reduce(
    (initial, dashboardEntry) => {
      return initial + dashboardEntry.costBasis;
    },
    0,
  );
  console.log(totalPortfolio);
  const root = document.getElementById("root");
  renderDOM(
    root,
    ol(
      ...dashboardList.map((dashboardEntry) =>
        li(
          img({ id: `asset${dashboardEntry.asset}`, src: dashboardEntry.logo }),
          span(`${dashboardEntry.amount} ${dashboardEntry.asset}`),
          br(),
          span(
            `${
              parseInt(dashboardEntry.costBasis / totalPortfolio * 100)
            }% ${dashboardEntry.costBasis} €`,
          ),
          hr(),
        )
      ),
    ),
  );
  await Promise.all(
    [...root.querySelectorAll("img")].map(
      (img) =>
        new Promise((res, rej) => {
          img.addEventListener("load", res, { once: true });
          img.addEventListener("error", res, { once: true });
        }),
    ),
  );
  const labels = dashboardData.map((dashboardEntry) => dashboardEntry.asset);

  const data = {
    labels: labels,
    datasets: [{
      label: "Portfolio",
      backgroundColor: dashboardData.map((dashboardEntry) => {
        const img = document.querySelector(`#asset${dashboardEntry.asset}`);
        if (!img) return "rgb(0, 0, 0)";
        const {
          VibrantSwatch,
          LightVibrantSwatch,
          DarkVibrantSwatch,
        } = new Vibrant(img, 64, 5);
        if (!(VibrantSwatch || LightVibrantSwatch || DarkVibrantSwatch)) {
          return "rgb(0, 0, 0)";
        }
        const bg =
          (VibrantSwatch ?? LightVibrantSwatch ?? DarkVibrantSwatch).rgb;
        return `rgb(${bg.join(", ")})`;
      }),
      data: dashboardData.map((dashboardEntry) =>
        parseInt(dashboardEntry.costBasis / totalPortfolio * 100)
      ),
    }],
  };

  const config = {
    type: "doughnut",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: "Portfolio Allocation",
        },
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            return dataset.data[tooltipItem.index] + "%";
          },
        },
      },
    },
  };

  new Chart(
    document.getElementById("portfolioPie"),
    config,
  );
})();
