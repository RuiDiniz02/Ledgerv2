"use client";
import { useEffect, useState } from "react";
import Ledger from "../ledger";
import { createSupabaseClient, authError } from "@/lib/supabase";
import { Brand } from "@/components/ledger/brand";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
export default function AccountPage() {
  const [user, setUser] = useState<{
      id: string;
      name: string;
      email: string;
    } | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const client = createSupabaseClient();
    const { data: listener } = client.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          location.replace("/login");
        } else if (session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            name: String(
              u.user_metadata?.display_name ||
                u.email?.split("@")[0] ||
                "A tua conta",
            ),
            email: u.email || "",
          });
        }
      },
    );
    void (async () => {
      try {
        const { data: sessionData, error: sessionError } =
          await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          location.replace("/login");
          return;
        }
        const { data, error } = await client.auth.getUser();
        if (error) throw error;
        if (active && data.user) {
          const u = data.user;
          setUser({
            id: u.id,
            name: String(
              u.user_metadata?.display_name ||
                u.email?.split("@")[0] ||
                "A tua conta",
            ),
            email: u.email || "",
          });
        }
      } catch (e) {
        if (active) {
          setUser(null);
          setError(authError(e));
        }
      }
    })();
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [retry]);
  if (user) return <Ledger key={user.id} user={user} />;
  return (
    <main className="load-screen">
      <Brand />
      {error ? (
        <>
          <p className="error" role="alert">
            {error}
          </p>
          <Button
            onClick={() => {
              setError("");
              setRetry(retry + 1);
            }}
          >
            Tentar novamente
          </Button>
          <a href="/login">Voltar a entrar</a>
        </>
      ) : (
        <>
          <Loader2 className="spin" />
          <p>A preparar o teu espaço…</p>
        </>
      )}
    </main>
  );
}
