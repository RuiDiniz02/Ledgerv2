"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  completeAuthRedirect,
  createSupabaseClient,
  authError,
} from "@/lib/supabase";
import { AuthShell } from "@/components/ledger/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, CheckCheck } from "lucide-react";
export default function Recover() {
  const task = useRef<Promise<unknown> | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    task.current ??= completeAuthRedirect();
    task.current
      .then(() => {
        if (active) setReady(true);
      })
      .catch((e) => {
        if (active) setError(authError(e));
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (password !== confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const client = createSupabaseClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      await client.auth.signOut({ scope: "global" });
      setPassword("");
      setConfirm("");
      setDone(true);
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell>
      {done ? (
        <div className="auth-result">
          <span className="auth-result-icon">
            <CheckCheck size={29} />
          </span>
          <h1>Acesso recuperado.</h1>
          <p>
            A tua palavra-passe foi alterada. Entra com a nova palavra-passe.
          </p>
          <Button asChild className="primary wide">
            <a href="/login">Entrar na Ledger</a>
          </Button>
        </div>
      ) : (
        <>
          <span className="eyebrow">UM NOVO COMEÇO</span>
          <h1>Escolhe uma nova palavra-passe.</h1>
          <p className="auth-intro">
            Os teus envelopes continuam no mesmo lugar.
          </p>
          {!ready ? (
            error ? (
              <>
                <p className="error" role="alert">
                  {error}
                </p>
                <Button asChild className="primary wide">
                  <a href="/login">Pedir um novo link</a>
                </Button>
              </>
            ) : (
              <Loader2 className="spin" />
            )
          ) : (
            <form className="ledger-form auth-form" onSubmit={submit}>
              <label htmlFor="new-password">
                Nova palavra-passe
                <div className="password-field">
                  <Input
                    id="new-password"
                    type={visible ? "text" : "password"}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Pelo menos 8 caracteres"
                  />
                  <button
                    type="button"
                    aria-label={
                      visible
                        ? "Ocultar palavra-passe"
                        : "Mostrar palavra-passe"
                    }
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <label htmlFor="confirm-password">
                Repetir palavra-passe
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <Button className="primary wide" type="submit" disabled={busy}>
                {busy ? <Loader2 className="spin" size={18} /> : null}
                {busy ? "A guardar…" : "Guardar nova palavra-passe"}
              </Button>
            </form>
          )}
        </>
      )}
    </AuthShell>
  );
}
