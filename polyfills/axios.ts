import axios from "https://deno.land/x/axiod@0.26.2/mod.ts";
export default axios;
export const create = axios.create.bind(axios);
