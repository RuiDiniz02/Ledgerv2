"use client";
import { useEffect, useRef, useState } from "react";
import { completeAuthRedirect, authError } from "@/lib/supabase";
import { AuthShell } from "@/components/ledger/auth-shell";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck } from "lucide-react";
export default function Confirm() {
  const task = useRef<Promise<unknown> | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    task.current ??= completeAuthRedirect();
    task.current
      .then(() => {
        if (active) location.replace("/conta");
      })
      .catch((e) => {
        if (active) setError(authError(e));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <AuthShell>
      <div className="auth-result">
        <span className="auth-result-icon">
          {error ? (
            <MailCheck size={27} />
          ) : (
            <Loader2 className="spin" size={27} />
          )}
        </span>
        <h1>
          {error ? "Vamos tentar outra vez." : "A confirmar a tua conta…"}
        </h1>
        {error ? (
          <>
            <p className="error" role="alert">
              {error}
            </p>
            <Button asChild className="primary wide">
              <a href="/login">Voltar ao login</a>
            </Button>
            <p className="auth-fineprint">
              Podes pedir um novo email de confirmação ao tentar entrar.
            </p>
          </>
        ) : (
          <p>O teu espaço está quase pronto.</p>
        )}
      </div>
    </AuthShell>
  );
}
