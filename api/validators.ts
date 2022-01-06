import { z } from "../deps.ts";

export const balance = z.object({
  asset: z.string(),
  free: z.string(),
  locked: z.string()
});