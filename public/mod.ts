import { fiatCurrency } from "../config.ts";
import { elements, renderHTML } from "../deps.ts";
const { canvas, input, header, h1, main, div, link, script, footer, button } =
  elements;

export const renderTransactions = (
  { response, request }: { response: any; request: any },
) => {
  const requestUrl = request.url.href;
  const requestObj = Object.fromEntries(new URL(requestUrl).searchParams);
  response.status = 200;
  response.headers.set("Content-Type", "text/html"); // set to html if you want
  response.body = renderHTML(
    main(
      input({ type: "hidden", id: "fiatCurrency", value: fiatCurrency }),
      link(
        { href: "bootstrap/css/bootstrap.min.css", rel: "stylesheet" },
      ),
      header(
        { class: "text-center" },
        h1("Transactions"),
        div(
          button(
            {
              type: "button",
              name: "prev-page",
              class: "btn btn-secondary mx-1",
            },
            "previous page",
          ),
          button(
            { type: "button", name: "cur-page", class: "btn btn-primary mx-1" },
            requestObj.page ?? "1",
          ),
          button(
            {
              type: "button",
              name: "next-page",
              class: "btn btn-secondary mx-1",
            },
            "next page",
          ),
        ),
      ),
      div({ id: "root", class: "p-3" }),
      footer(
        { class: "text-center" },
        div(
          button(
            {
              type: "button",
              name: "prev-page",
              class: "btn btn-secondary mx-1",
            },
            "previous page",
          ),
          button(
            { type: "button", name: "cur-page", class: "btn btn-primary mx-1" },
            requestObj.page ?? "1",
          ),
          button(
            {
              type: "button",
              name: "next-page",
              class: "btn btn-secondary mx-1",
            },
            "next page",
          ),
        ),
      ),
      script(
        { src: "hyperactive.min.js", type: "module" }, //https://deno.land/x/hyperactive/mod.ts
      ),
      script(
        { src: "transactions.js", type: "module" },
      ),
    ),
  );
};

export const renderDashboard = (
  { response, request }: { response: any; request: any },
) => {
  response.status = 200;
  response.headers.set("Content-Type", "text/html"); // set to html if you want
  response.body = renderHTML(
    main(
      input({ type: "hidden", id: "fiatCurrency", value: fiatCurrency }),
      link(
        { href: "bootstrap/css/bootstrap.min.css", rel: "stylesheet" },
      ),
      div(
        { class: "col-4" },
        canvas({ id: "portfolioPie", width: 100, height: 100 }),
      ),
      div({ id: "root", class: "p-3" }),
      script(
        { src: "avg-color.js" }, //https://github.com/fast-average-color/fast-average-color
      ),
      script(
        { src: "chart.js" }, //https://cdn.jsdelivr.net/npm/chart.js
      ),
      script(
        { src: "hyperactive.min.js", type: "module" }, //https://deno.land/x/hyperactive/mod.ts
      ),
      script(
        { src: "dashboard.js", type: "module" },
      ),
    ),
  );
};
