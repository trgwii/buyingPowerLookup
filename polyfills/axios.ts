import axios from "https://deno.land/x/axiod@0.24/mod.ts";
export default axios;
export const create = axios.create.bind(axios);
