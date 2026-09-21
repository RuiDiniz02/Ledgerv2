import { getChatGPTUser } from "../../chatgpt-auth";
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
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
type Row = { document: string; revision: number };
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "Entra na tua conta para continuar." }, 401);
  try {
    const row = await ledgerDb()
      .prepare(
        "SELECT document,revision FROM ledger_accounts WHERE user_id = ?",
      )
      .bind(user.userId)
      .first<Row>();
    if (!row) return reply({ state: null, revision: 0 });
    const state = rollMonths(JSON.parse(row.document), currentMonth());
    return reply({ state, revision: row.revision });
  } catch (e) {
    console.error("Ledger read failed", e);
    return reply(
      { error: "Não foi possível carregar a Ledger. Tenta novamente." },
      503,
    );
  }
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "A sessão terminou. Volta a entrar." }, 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "Pedido não autorizado." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return reply({ error: "Pedido inválido." }, 415);
  let raw: any;
  try {
    const body = await request.text();
    if (body.length > 24000)
      return reply({ error: "Pedido demasiado grande." }, 413);
    raw = JSON.parse(body);
    if (!raw || typeof raw !== "object") throw new Error();
  } catch {
    return reply({ error: "Pedido inválido." }, 400);
  }
  try {
    const db = ledgerDb();
    const row = await db
      .prepare(
        "SELECT document,revision FROM ledger_accounts WHERE user_id = ?",
      )
      .bind(user.userId)
      .first<Row>();
    let state: LedgerState;
    try {
      if (!row) {
        if (raw.action !== "setup")
          return reply({ error: "Configura primeiro a tua Ledger." }, 400);
        state = setup(raw);
      } else {
        if (raw.revision !== row.revision)
          return reply(
            {
              error:
                "Os dados mudaram noutro separador. Atualiza e tenta novamente.",
            },
            409,
          );
        state = mutate(JSON.parse(row.document), raw);
      }
    } catch (e) {
      return reply(
        { error: e instanceof Error ? e.message : "Verifica os valores." },
        400,
      );
    }
    const result = row
      ? await db
          .prepare(
            "UPDATE ledger_accounts SET document=?, revision=revision+1, updated_at=? WHERE user_id=? AND revision=?",
          )
          .bind(
            JSON.stringify(state),
            new Date().toISOString(),
            user.userId,
            row.revision,
          )
          .run()
      : await db
          .prepare(
            "INSERT OR IGNORE INTO ledger_accounts (user_id,revision,document,updated_at) VALUES (?,1,?,?)",
          )
          .bind(user.userId, JSON.stringify(state), new Date().toISOString())
          .run();
    if (result.meta.changes !== 1)
      return reply(
        {
          error:
            "Os dados mudaram noutro separador. Atualiza e tenta novamente.",
        },
        409,
      );
    return reply({ state, revision: (row?.revision || 0) + 1 });
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
