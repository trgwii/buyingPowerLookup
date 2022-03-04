import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";
import { db } from "./api/mod.ts";
import { transactions } from "./public/mod.ts";

const app = new Application();
const router = new Router();

router.get("/transactions", transactions);
router.get("/db/:endpoint/:table", db);

app.use(staticFiles("public"));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
