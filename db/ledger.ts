import { env } from "cloudflare:workers";
export function ledgerDb() {
  if (!env.DB) throw new Error("Base de dados indisponível.");
  return env.DB;
}
