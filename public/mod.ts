import { fiatCurrency } from "../config.ts";
import { elements, renderHTML } from "../deps.ts";
const { input, header, h1, main, div, link, script, footer, button } = elements;

export const transactions = (
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
        h1("Transactions"),
        button(
          { type: "button", name: "prev-page", class: "btn btn-secondary" },
          "previous page",
        ),
        button(
          { type: "button", name: "cur-page", class: "btn btn-primary" },
          requestObj.page ?? "1",
        ),
        button(
          { type: "button", name: "next-page", class: "btn btn-secondary" },
          "next page",
        ),
      ),
      div({ id: "root", class: "p-3" }),
      footer(
        button(
          { type: "button", name: "prev-page", class: "btn btn-secondary" },
          "previous page",
        ),
        button(
          { type: "button", name: "cur-page", class: "btn btn-primary" },
          requestObj.page ?? "1",
        ),
        button(
          { type: "button", name: "next-page", class: "btn btn-secondary" },
          "next page",
        ),
      ),
      script(
        { src: "hyperactive.min.js", type: "module" },
      ),
      script(
        { src: "main.js", type: "module" },
      ),
    ),
  );
};
