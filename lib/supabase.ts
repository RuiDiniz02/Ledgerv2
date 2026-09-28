import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config";
let browserClient: SupabaseClient | undefined;
export function createSupabaseClient() {
  const create = () =>
    createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  if (typeof window === "undefined") return create();
  return (browserClient ??= create());
}
export async function authHeaders(): Promise<Record<string, string>> {
  const { data, error } = await createSupabaseClient().auth.getSession();
  if (error || !data.session)
    throw new Error("A sessão terminou. Volta a entrar na tua conta.");
  return { Authorization: `Bearer ${data.session.access_token}` };
}
// Called only on dedicated auth screens. Tokens never enter the app's hash navigation.
export async function completeAuthRedirect() {
  const url = new URL(window.location.href),
    hash = new URLSearchParams(url.hash.slice(1));
  const code = url.searchParams.get("code"),
    tokenHash = url.searchParams.get("token_hash");
  const failed = url.searchParams.has("error") || hash.has("error");
  const access = hash.get("access_token"),
    refresh = hash.get("refresh_token");
  const clean = () => window.history.replaceState(null, "", url.pathname);
  if (failed) {
    clean();
    throw new Error(
      "Este link expirou ou já foi utilizado. Pede um novo email.",
    );
  }
  const client = createSupabaseClient();
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    clean();
    if (error) throw error;
  } else if (tokenHash) {
    const type = url.searchParams.get("type");
    if (type !== "email" && type !== "recovery")
      throw new Error("Link de confirmação inválido.");
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    clean();
    if (error) throw error;
  } else if (access && refresh) {
    const { error } = await client.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    clean();
    if (error) throw error;
  }
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new Error("Abre o link recebido por email para continuar.");
  return data.user;
}
export function authError(error: unknown): string {
  const e = error as { code?: string; message?: string; status?: number };
  const messages: Record<string, string> = {
    invalid_credentials: "O email ou a palavra-passe não estão corretos.",
    email_not_confirmed: "Confirma o teu email antes de entrar.",
    user_already_exists:
      "Não foi possível criar a conta. Tenta entrar ou recuperar a palavra-passe.",
    email_exists:
      "Não foi possível criar a conta. Tenta entrar ou recuperar a palavra-passe.",
    weak_password: "Escolhe uma palavra-passe com pelo menos 8 caracteres.",
    over_email_send_rate_limit:
      "Foram pedidos vários emails. Aguarda uns minutos antes de tentar novamente.",
    over_request_rate_limit:
      "Demasiadas tentativas. Aguarda um pouco e tenta novamente.",
    email_address_not_authorized:
      "O envio de emails ainda está limitado no servidor. É necessário configurar o serviço de email da Ledger.",
    email_address_invalid: "Verifica se o endereço de email está correto.",
    signup_disabled: "A criação de contas está temporariamente indisponível.",
    otp_expired: "Este link expirou ou já foi utilizado. Pede um novo email.",
    flow_state_not_found:
      "Abre o link no mesmo navegador onde fizeste o pedido, ou pede um novo email.",
    flow_state_expired: "Este link expirou. Pede um novo email.",
    same_password: "Escolhe uma palavra-passe diferente da atual.",
  };
  if (e?.code && messages[e.code]) return messages[e.code];
  if (error instanceof TypeError || e?.message?.includes("fetch"))
    return "Não foi possível estabelecer ligação. Verifica a internet e tenta novamente.";
  if (e?.code || e?.status)
    return "Não foi possível concluir o pedido. Tenta novamente dentro de momentos.";
  return e?.message || "Não foi possível concluir o pedido. Tenta novamente.";
}
