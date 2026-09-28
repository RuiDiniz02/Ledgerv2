"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { createSupabaseClient, authError } from "@/lib/supabase";
import { AuthShell } from "@/components/ledger/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Mode = "login" | "register" | "forgot";
export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login"),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState(""),
    [cooldown, setCooldown] = useState(0),
    [unconfirmed, setUnconfirmed] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("modo") === "criar")
      setMode("register");
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  function changeMode(next: Mode) {
    if (busy) return;
    setMode(next);
    setError("");
    setSent(false);
    setPassword("");
    setVisible(false);
    setUnconfirmed(false);
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setUnconfirmed(false);
    try {
      const client = createSupabaseClient();
      const address = email.trim();
      if (mode === "forgot") {
        const { error } = await client.auth.resetPasswordForEmail(address, {
          redirectTo: location.origin + "/recuperar",
        });
        if (error) throw error;
        setSent(true);
        setCooldown(60);
        return;
      }
      if (mode === "register") {
        const { data, error } = await client.auth.signUp({
          email: address,
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: location.origin + "/auth/confirm",
          },
        });
        if (error) throw error;
        if (data.session) {
          location.replace("/conta");
          return;
        }
        setSent(true);
        setPassword("");
        setCooldown(60);
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: address,
          password,
        });
        if (error) {
          if (error.code === "email_not_confirmed") setUnconfirmed(true);
          throw error;
        }
        location.replace("/conta");
      }
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (busy || cooldown) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await createSupabaseClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: location.origin + "/auth/confirm" },
      });
      if (error) throw error;
      setSent(true);
      setCooldown(60);
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell>
      {sent ? (
        <div className="auth-result">
          <span className="auth-result-icon">
            <Mail size={28} />
          </span>
          <span className="eyebrow">SÓ FALTA UM PASSO</span>
          <h1>Vê o teu email.</h1>
          <p>
            {mode === "forgot"
              ? "Se existir uma conta com este email, receberás um link para escolher uma nova palavra-passe."
              : "Se o endereço puder ser registado, receberás um link para confirmar a tua conta."}
          </p>
          <strong className="auth-address">{email}</strong>
          <p className="auth-fineprint">
            Verifica também a pasta de spam. Abre o link neste navegador.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button className="primary wide" onClick={() => changeMode("login")}>
            Voltar a entrar <ArrowRight size={17} />
          </Button>
          {mode !== "forgot" && (
            <Button
              variant="ghost"
              className="wide"
              disabled={busy || cooldown > 0}
              onClick={resend}
            >
              {cooldown > 0
                ? `Reenviar dentro de ${cooldown}s`
                : "Reenviar confirmação"}
            </Button>
          )}
          <button
            className="auth-text-button"
            onClick={() => {
              setSent(false);
              setError("");
            }}
          >
            Corrigir endereço de email
          </button>
        </div>
      ) : (
        <>
          <span className="eyebrow">O TEU ESPAÇO PESSOAL</span>
          <h1>
            {mode === "register"
              ? "Começa com clareza."
              : mode === "forgot"
                ? "Vamos recuperar o acesso."
                : "Bem-vindo de volta."}
          </h1>
          <p className="auth-intro">
            {mode === "register"
              ? "Cria a tua conta e dá um destino ao teu dinheiro."
              : mode === "forgot"
                ? "Enviamos-te um link para escolheres uma nova palavra-passe."
                : "Entra para encontrares tudo no seu lugar."}
          </p>
          <form className="ledger-form auth-form" onSubmit={submit}>
            {mode === "register" && (
              <label htmlFor="auth-name">
                Como te chamas?
                <Input
                  id="auth-name"
                  autoComplete="given-name"
                  maxLength={60}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                />
              </label>
            )}
            <label htmlFor="auth-email">
              Email
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ola@exemplo.pt"
              />
            </label>
            {mode !== "forgot" && (
              <label htmlFor="auth-password">
                <span className="between">
                  <span>Palavra-passe</span>
                  {mode === "login" && (
                    <button
                      className="auth-text-button"
                      type="button"
                      onClick={() => changeMode("forgot")}
                    >
                      Esqueceste-te?
                    </button>
                  )}
                </span>
                <div className="password-field">
                  <Input
                    id="auth-password"
                    aria-label="Palavra-passe"
                    type={visible ? "text" : "password"}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    minLength={mode === "register" ? 8 : 1}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === "register"
                        ? "Pelo menos 8 caracteres"
                        : "A tua palavra-passe"
                    }
                  />
                  <button
                    type="button"
                    aria-label={
                      visible
                        ? "Ocultar palavra-passe"
                        : "Mostrar palavra-passe"
                    }
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === "register" && (
                  <small>
                    Usa uma palavra-passe única, com pelo menos 8 caracteres.
                  </small>
                )}
              </label>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {unconfirmed && (
              <Button
                type="button"
                variant="outline"
                disabled={busy || cooldown > 0}
                onClick={resend}
              >
                Reenviar email de confirmação
              </Button>
            )}
            <Button
              className="primary wide"
              type="submit"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <ArrowRight size={18} />
              )}{" "}
              {busy
                ? "A processar…"
                : mode === "register"
                  ? "Criar conta"
                  : mode === "forgot"
                    ? "Enviar link de recuperação"
                    : "Entrar na Ledger"}
            </Button>
          </form>
          <div className="auth-switch">
            {mode === "forgot" ? (
              <button onClick={() => changeMode("login")}>
                <ArrowLeft size={14} /> Voltar ao login
              </button>
            ) : (
              <>
                <span>
                  {mode === "register"
                    ? "Já tens conta?"
                    : "Ainda não tens conta?"}
                </span>
                <button
                  onClick={() =>
                    changeMode(mode === "register" ? "login" : "register")
                  }
                >
                  {mode === "register" ? "Entrar" : "Criar conta"}
                </button>
              </>
            )}
          </div>
          {mode === "register" && (
            <p className="auth-fineprint">
              <Check size={14} /> Sem ligação a bancos. Tu controlas os teus
              dados.
            </p>
          )}
        </>
      )}
    </AuthShell>
  );
}
