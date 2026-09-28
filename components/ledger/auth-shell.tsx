"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Moon,
  Sun,
  ShieldCheck,
  Wallet,
  Plane,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "./brand";
export function AuthShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("ledger-theme");
    setDark(
      saved
        ? saved === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches,
    );
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
          onClick={() => {
            setDark(!dark);
            localStorage.setItem("ledger-theme", !dark ? "dark" : "light");
          }}
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </Button>
      </header>
      <main className="auth-layout">
        <aside className="auth-story">
          <span className="eyebrow">UM LUGAR PARA CADA EURO</span>
          <h2>
            Mais clareza.
            <br />
            <em>Mais tranquilidade.</em>
          </h2>
          <p>
            As despesas de hoje e os planos de amanhã, cada um no seu envelope.
          </p>
          <div className="auth-envelope-stack" aria-hidden="true">
            <div>
              <span className="auth-envelope-icon">
                <Wallet size={21} />
              </span>
              <span>
                O dia a dia<small>Para o que precisas</small>
              </span>
              <Check size={17} />
            </div>
            <div>
              <span className="auth-envelope-icon purple">
                <Coffee size={21} />
              </span>
              <span>
                Os pequenos prazeres<small>Para o que te faz bem</small>
              </span>
              <Check size={17} />
            </div>
            <div>
              <span className="auth-envelope-icon blue">
                <Plane size={21} />
              </span>
              <span>
                Os próximos planos<small>Para o que vem a seguir</small>
              </span>
              <Check size={17} />
            </div>
          </div>
          <span className="auth-privacy">
            <ShieldCheck size={17} /> Um espaço só teu.
          </span>
        </aside>
        <section className="auth-panel">{children}</section>
      </main>
      <footer className="auth-footer">
        <a href="/demo">
          <ArrowLeft size={14} /> Explorar a demonstração
        </a>
        <span>Finanças pessoais, sem complicar.</span>
      </footer>
    </div>
  );
}
