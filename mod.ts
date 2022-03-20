import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";
import { dashboard } from "./api/dashboard.ts";
import { dbFetch } from "./api/mod.ts";
import { renderDashboard, renderTransactions } from "./public/mod.ts";

const app = new Application();
const router = new Router();

router.get("/transactions", renderTransactions);
router.get("/dashboard", renderDashboard);
router.get("/db/:endpoint/:table", dbFetch);
router.get("/db/dashboard", dashboard);

app.use(staticFiles("public"));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
