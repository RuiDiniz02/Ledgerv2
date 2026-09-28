import { ledgerDb } from "../../../db/ledger";
import {
  currentMonth,
  mutate,
  rollMonths,
  setup,
  type LedgerState,
} from "../../../lib/ledger";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
  });
async function identify(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length > 12000)
    return null;
  const db = ledgerDb(authorization);
  const { data, error } = await db.auth.getUser(authorization.slice(7));
  if (error) {
    if (error.status && error.status >= 500) throw error;
    return null;
  }
  return data.user ? { db, user: data.user } : null;
}
export async function GET(request: Request) {
  try {
    const auth = await identify(request);
    if (!auth)
      return reply({ error: "Entra na tua conta para continuar." }, 401);
    const { data: row, error } = await auth.db
      .from("ledger_accounts")
      .select("document,revision")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return reply(
      row
        ? {
            state: rollMonths(row.document as LedgerState, currentMonth()),
            revision: row.revision,
          }
        : { state: null, revision: 0 },
    );
  } catch (e) {
    console.error("Ledger read failed", e);
    return reply(
      { error: "Não foi possível carregar a Ledger. Tenta novamente." },
      503,
    );
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "Pedido não autorizado." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return reply({ error: "Pedido inválido." }, 415);
  try {
    const auth = await identify(request);
    if (!auth)
      return reply({ error: "A sessão terminou. Volta a entrar." }, 401);
    let raw: any;
    try {
      const body = await request.text();
      if (body.length > 24000)
        return reply({ error: "Pedido demasiado grande." }, 413);
      raw = JSON.parse(body);
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        throw new Error();
    } catch {
      return reply({ error: "Pedido inválido." }, 400);
    }
    const { db, user } = auth;
    const { data: row, error: readError } = await db
      .from("ledger_accounts")
      .select("document,revision")
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError) throw readError;
    let state: LedgerState;
    const conflict = () =>
      reply(
        {
          error:
            "Os dados mudaram noutro separador. Os valores foram atualizados; revê o movimento e tenta novamente.",
        },
        409,
      );
    try {
      if (!row) {
        if (raw.action !== "setup")
          return reply({ error: "Configura primeiro a tua Ledger." }, 400);
        state = setup(raw);
      } else {
        if (raw.revision !== row.revision) return conflict();
        state = mutate(row.document as LedgerState, raw);
      }
    } catch (e) {
      return reply(
        { error: e instanceof Error ? e.message : "Verifica os valores." },
        400,
      );
    }
    const revision = (row?.revision || 0) + 1;
    const values = {
      document: state,
      revision,
      updated_at: new Date().toISOString(),
    };
    const result = row
      ? await db
          .from("ledger_accounts")
          .update(values)
          .eq("user_id", user.id)
          .eq("revision", row.revision)
          .select("revision")
          .maybeSingle()
      : await db
          .from("ledger_accounts")
          .insert({ ...values, user_id: user.id })
          .select("revision")
          .maybeSingle();
    if (result.error?.code === "23505" || (!result.error && !result.data))
      return conflict();
    if (result.error) throw result.error;
    return reply({ state, revision });
  } catch (e) {
    console.error("Ledger write failed", e);
    return reply(
      {
        error:
          "Não foi possível guardar. Os teus campos foram mantidos; tenta novamente.",
      },
      503,
    );
  }
}
