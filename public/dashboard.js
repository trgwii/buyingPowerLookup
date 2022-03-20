import { elements, renderHTML } from "./hyperactive.min.js";
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
  document.getElementById("root").innerHTML = renderHTML(
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
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const labels = dashboardData.map((dashboardEntry) =>
        dashboardEntry.asset
      );

      const data = {
        labels: labels,
        datasets: [{
          label: "Portfolio",
          backgroundColor: dashboardData.map((dashboardEntry) =>
            document.querySelector(`#asset${dashboardEntry.asset}`)
              ? new FastAverageColor().getColor(
                document.querySelector(`#asset${dashboardEntry.asset}`),
              ).rgb
              : "rgb(0, 0, 0)"
          ),
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
    })
  );
})();
