import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { elements, renderHTML } from "https://deno.land/x/hyperactive/mod.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";
const { main, h1, br, link, script } = elements;

const getTestResponse = ({ response }: { response: any }) => {
  response.status = 200;
  response.headers.set("Content-Type", "text/html"); // set to html if you want
  response.body = renderHTML(
    main(
      { id: "hello", class: "world" },
      link(
        { href: "bootstrap/css/bootstrap.min.css", rel: "stylesheet" },
      ),
      h1({ class: "hello" }, "hello world", br()),
      script(
        { src: "bootstrap/js/bootstrap.bundle.min.js" },
      ),
    ),
  );
};

const app = new Application();
const router = new Router();
router.get("/", getTestResponse);
app.use(staticFiles("public"));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
