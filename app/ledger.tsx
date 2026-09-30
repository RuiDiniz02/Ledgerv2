"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Plus,
  LayoutDashboard,
  Layers3,
  List,
  Settings,
  Moon,
  Sun,
  Wallet,
  Receipt,
  Coffee,
  Plane,
  TrendingUp,
  ShieldCheck,
  Camera,
  House,
  Utensils,
  Car,
  ChevronRight,
  Check,
  CheckCheck,
  X,
  Volume2,
  Download,
  LogOut,
  Pencil,
  Loader2,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/ledger/form-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { createSupabaseClient, authHeaders } from "@/lib/supabase";
import { Brand as SharedBrand } from "@/components/ledger/brand";
function Brand() {
  return <SharedBrand href="#dashboard" />;
}
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  balance,
  cents,
  colors,
  currentMonth,
  demoState,
  free,
  icons,
  money,
  monthName,
  mutate,
  setup,
  suggestions,
  summary,
  today,
  type Category,
  type LedgerState,
  type Movement,
} from "@/lib/ledger";
const iconMap: Record<string, typeof Wallet> = {
  receipt: Receipt,
  coffee: Coffee,
  plane: Plane,
  trending: TrendingUp,
  shield: ShieldCheck,
  camera: Camera,
  home: House,
  food: Utensils,
  car: Car,
  wallet: Wallet,
};
const iconNames = [
  "Despesas",
  "Lazer",
  "Viagens",
  "Investimentos",
  "Proteção",
  "Equipamento",
  "Casa",
  "Alimentação",
  "Transporte",
  "Carteira",
];
const nav = [
  ["dashboard", "Início", LayoutDashboard],
  ["movimentos", "Movimentos", ArrowLeftRight],
  ["categorias", "Envelopes", Layers3],
  ["definicoes", "Definições", Settings],
] as const;
function CatIcon({
  c,
  small = false,
}: {
  c: Pick<Category, "color" | "icon">;
  small?: boolean;
}) {
  const Icon = iconMap[c.icon] || Wallet;
  return (
    <span
      className={"cat-icon" + (small ? " small" : "")}
      style={{ "--cat": c.color } as CSSProperties}
    >
      <Icon size={small ? 18 : 22} />
    </span>
  );
}
function ErrorText({ error }: { error: string }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
function Empty({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Layers3 size={25} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
function Submit({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button type="submit" className="primary wide" disabled={busy}>
      {busy ? <Loader2 className="spin" size={18} /> : null}
      {busy ? "A guardar…" : children}
    </Button>
  );
}
type Props = {
  user?: { name: string; email: string } | null;
  signIn?: string;
  demo?: boolean;
};
export default function Ledger({
  user = null,
  signIn = "/login",
  demo = false,
}: Props) {
  const [state, setState] = useState<LedgerState | null>(null),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(!!user || demo),
    [loadError, setLoadError] = useState(""),
    [page, setPage] = useState("dashboard"),
    [month, setMonth] = useState(currentMonth()),
    [modal, setModal] = useState<{
      type: string;
      id?: string;
      kind?: string;
    } | null>(null),
    [notice, setNotice] = useState(""),
    [dark, setDark] = useState(false),
    [sound, setSound] = useState(false),
    [install, setInstall] = useState<any>(null),
    [offline, setOffline] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const sessionHeaders = await authHeaders();
      const r = await fetch("/api/ledger", {
        cache: "no-store",
        headers: sessionHeaders,
      });
      const data = (await r.json()) as {
        state: LedgerState | null;
        revision: number;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error);
      setState(data.state);
      setRevision(data.revision);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Não foi possível carregar.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (demo) {
      setState(demoState());
      setLoading(false);
    } else if (user) void load();
  }, []);
  useEffect(() => {
    const sync = () => setPage(location.hash.slice(1) || "dashboard");
    sync();
    window.addEventListener("hashchange", sync);
    const saved = localStorage.getItem("ledger-theme");
    setDark(
      saved
        ? saved === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches,
    );
    setSound(localStorage.getItem("ledger-sound") === "on");
    const ready = (e: Event) => {
      e.preventDefault();
      setInstall(e);
    };
    const online = () => setOffline(!navigator.onLine);
    online();
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    window.addEventListener("beforeinstallprompt", ready);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  function toggleTheme() {
    setDark(!dark);
    localStorage.setItem("ledger-theme", !dark ? "dark" : "light");
  }
  function clickSound() {
    if (!sound) return;
    try {
      const ctx = audio.current || (audio.current = new AudioContext());
      void ctx.resume();
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.055);
      g.gain.setValueAtTime(0.025, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.08);
    } catch {}
  }
  function go(p: string) {
    location.hash = p;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function signOut() {
    try {
      const { error } = await createSupabaseClient().auth.signOut();
      if (error) throw error;
      window.location.replace("/login");
    } catch {
      setNotice("Não foi possível terminar a sessão. Tenta novamente.");
    }
  }
  async function save(raw: any) {
    if (offline && !demo)
      throw new Error(
        "Estás sem ligação. Os campos ficam guardados aqui até voltares a ter internet.",
      );
    if (demo) {
      const next = raw.action === "setup" ? setup(raw) : mutate(state!, raw);
      setState(next);
    } else {
      const sessionHeaders = await authHeaders();
      const r = await fetch("/api/ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...sessionHeaders,
        },
        body: JSON.stringify({ ...raw, revision }),
      });
      const data = (await r.json()) as {
        state: LedgerState | null;
        revision: number;
        error?: string;
      };
      if (!r.ok) {
        if (r.status === 409) {
          const fresh = await fetch("/api/ledger", {
            cache: "no-store",
            headers: sessionHeaders,
          });
          if (fresh.ok) {
            const d = (await fresh.json()) as {
              state: LedgerState;
              revision: number;
            };
            setState(d.state);
            setRevision(d.revision);
          }
        }
        throw new Error(data.error || "Não foi possível guardar.");
      }
      setState(data.state);
      setRevision(data.revision);
    }
    setMonth(currentMonth());
    setNotice(
      raw.action === "setup"
        ? "A tua Ledger está pronta."
        : raw.action === "deleteMovement"
          ? "Movimento eliminado."
          : "Guardado. Tudo em dia.",
    );
  }
  const noticeView = (
    <>
      {notice && (
        <div className="toast" role="status">
          <CheckCheck size={18} />
          {notice}
        </div>
      )}
      {offline && (
        <div className="offline" role="status">
          Estás sem ligação. Volta a ligar-te para guardar movimentos.
        </div>
      )}
    </>
  );
  if (!user && !demo)
    return (
      <div className="welcome" onClick={clickSound}>
        <header>
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mudar tema"
            onClick={toggleTheme}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </header>
        <main className="welcome-grid">
          <div className="welcome-copy">
            <span className="eyebrow">MENOS CONTAS. MAIS CLAREZA.</span>
            <h1>
              O teu dinheiro.
              <br />
              Cada coisa
              <br />
              <em>no seu lugar.</em>
            </h1>
            <p>
              Um envelope para o dia a dia. Outro para os teus planos. Sabe
              sempre quanto podes gastar.
            </p>
            <Button asChild className="primary">
              <a href={signIn} target="_top">
                Entrar na Ledger <ArrowRight size={18} />
              </a>
            </Button>
            <a className="demo-link" href="/demo">
              Explorar uma demonstração <ArrowUpRight size={16} />
            </a>
            <span className="welcome-foot">
              <ShieldCheck size={16} /> O teu espaço. Os teus dados.
            </span>
          </div>
          <div className="welcome-envelopes">
            <div className="preview-total">
              <span>O TEU DINHEIRO, ORGANIZADO</span>
              <strong>
                1.100 <small>€</small>
              </strong>
              <span>Um destino para cada euro.</span>
            </div>
            {suggestions.slice(0, 6).map((c) => (
              <div className="preview-envelope" key={c.name}>
                <CatIcon c={c} />
                <div>
                  <strong>{c.name}</strong>
                  <span>
                    {c.kind === "monthly"
                      ? "Para este mês"
                      : "Para os teus planos"}
                  </span>
                </div>
                <b>{money(c.monthly)}</b>
              </div>
            ))}
            <div className="preview-note">
              <Check size={16} /> Tudo distribuído. Tudo tranquilo.
            </div>
          </div>
        </main>
        <footer>
          ledger. <span>Finanças pessoais, sem complicar.</span>
        </footer>
      </div>
    );
  if (loading || loadError)
    return (
      <div className="load-screen">
        <Brand />
        {loading ? (
          <>
            <Loader2 className="spin" />
            <p>A preparar os teus envelopes…</p>
          </>
        ) : (
          <>
            <ErrorText error={loadError} />
            <Button className="primary" onClick={load}>
              Tentar novamente
            </Button>
            <a href={signIn} target="_top">
              Voltar a entrar
            </a>
          </>
        )}
      </div>
    );
  if (!state)
    return (
      <div className="onboarding-page" onClick={clickSound}>
        <header>
          <Brand />
          <span>Um lugar para cada euro.</span>
        </header>
        <Onboarding save={save} />
        {noticeView}
      </div>
    );
  const sum = summary(state, month);
  const category = page.startsWith("categoria/")
    ? state.categories.find((c) => c.id === page.split("/")[1])
    : null;
  const title =
    category?.name || nav.find((n) => n[0] === page)?.[1] || "Dashboard";
  const openMove = (kind = "expense", id?: string) => {
    setMonth(currentMonth());
    setModal({ type: "movement", kind, id });
  };
  const recent = state.movements
    .filter((t) => t.date.startsWith(month))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        state.movements.indexOf(b) - state.movements.indexOf(a),
    );
  const historyMovements = [...state.movements].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      state.movements.indexOf(b) - state.movements.indexOf(a),
  );
  return (
    <SidebarProvider style={{ "--sidebar-width": "238px" } as CSSProperties}>
      <div
        className="app-shell"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button,a")) clickSound();
        }}
      >
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            mainRef.current?.focus();
            mainRef.current?.scrollIntoView();
          }}
          className="skip-link"
        >
          Saltar para o conteúdo
        </a>
        <Sidebar className="ledger-sidebar">
          <SidebarHeader>
            <Brand />
            <span className="sidebar-caption">
              O teu dinheiro, com destino.
            </span>
          </SidebarHeader>
          <SidebarContent>
            <span className="nav-label">O TEU ESPAÇO</span>
            <SidebarMenu>
              {nav.map(([id, label, Icon]) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={
                      page === id || (id === "categorias" && !!category)
                    }
                    onClick={() => go(id)}
                  >
                    <Icon size={19} />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="sidebar-note">
              <Layers3 size={22} />
              <p>
                Pequenos passos.
                <br />
                <strong>Grandes planos.</strong>
              </p>
            </div>
            <button className="user-block" onClick={() => go("definicoes")}>
              <span className="avatar">
                {demo ? "D" : user?.name.charAt(0).toUpperCase()}
              </span>
              <span>
                <b>{demo ? "Conta de exemplo" : user?.name}</b>
                <small>{demo ? "Modo demonstração" : "Espaço pessoal"}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          </SidebarFooter>
        </Sidebar>
        <div className="workspace">
          {demo && (
            <div className="demo-banner">
              <span>
                Estás a explorar dados de exemplo. As alterações não são
                guardadas.
              </span>
              <a href="/login?modo=criar">Criar conta →</a>
            </div>
          )}
          <header className="topbar">
            <div className="desktop-breadcrumb">
              O meu espaço <ChevronRight size={14} />
              <strong>{title}</strong>
            </div>
            <div className="mobile-brand">
              <Brand />
            </div>
            <div className="topbar-right">
              <Button
                className="primary topbar-action"
                onClick={() => openMove("expense")}
              >
                <Plus size={17} />
                Nova despesa
              </Button>
              {demo && (
                <a className="demo-badge" href="/login">
                  Demonstração <ArrowUpRight size={12} />
                </a>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
                onClick={toggleTheme}
              >
                {dark ? <Sun size={19} /> : <Moon size={19} />}
              </Button>
              <span className="top-avatar">
                {demo ? "D" : user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </header>
          <main id="main" tabIndex={-1} ref={mainRef} className="main-content">
            {page === "dashboard" && (
              <MonthSwitch state={state} month={month} setMonth={setMonth} />
            )}
            {(page === "categorias" ||
              page === "movimentos" ||
              page === "definicoes") && (
              <div className="app-head">
                <h1>{title}</h1>
                {page === "categorias" && (
                  <MonthSwitch
                    state={state}
                    month={month}
                    setMonth={setMonth}
                    compact
                  />
                )}
              </div>
            )}
            {page === "dashboard" && (
              <HomeView
                state={state}
                month={month}
                available={sum.available}
                unassigned={sum.free}
                recent={recent.slice(0, 4)}
                go={go}
                distribute={() => setModal({ type: "income" })}
              />
            )}
            {page === "categorias" && (
              <EnvelopesView
                state={state}
                month={month}
                unassigned={sum.free}
                go={go}
                distribute={() => setModal({ type: "income" })}
                create={() => setModal({ type: "category" })}
              />
            )}
            {category && (
              <CategoryView
                state={state}
                c={category}
                month={month}
                setMonth={setMonth}
                movements={recent.filter(
                  (t) => t.category === category.id || t.to === category.id,
                )}
                back={() => go("categorias")}
                edit={() => setModal({ type: "category", id: category.id })}
                move={(k) => openMove(k, category.id)}
                remove={(id) => setModal({ type: "delete", id })}
              />
            )}
            {page === "movimentos" && (
              <History
                state={state}
                movements={historyMovements}
                remove={(id) => setModal({ type: "delete", id })}
              />
            )}
            {page === "definicoes" && (
              <div className="home">
                <section className="home-group">
                  <div className="home-group-head"><h2>Orçamento</h2></div>
                  <div className="home-list">
                    <button className="set-row" onClick={() => setModal({ type: "income" })}>
                      <span className="set-icon"><Wallet size={16} /></span>
                      <span className="set-label">Rendimento mensal</span>
                      <span className="set-value">{money(state.income)}</span>
                      <ChevronRight size={16} className="set-chev" />
                    </button>
                    <button className="set-row" onClick={() => go("categorias")}>
                      <span className="set-icon"><Layers3 size={16} /></span>
                      <span className="set-label">Envelopes</span>
                      <span className="set-value">{state.categories.length}</span>
                      <ChevronRight size={16} className="set-chev" />
                    </button>
                  </div>
                </section>
                <section className="home-group">
                  <div className="home-group-head"><h2>Preferências</h2></div>
                  <div className="home-list">
                    <div className="set-row">
                      <span className="set-icon"><Moon size={16} /></span>
                      <span className="set-label">Modo escuro</span>
                      <Switch checked={dark} onCheckedChange={toggleTheme} aria-label="Modo escuro" />
                    </div>
                    <div className="set-row">
                      <span className="set-icon"><Volume2 size={16} /></span>
                      <span className="set-label">Sons</span>
                      <Switch
                        checked={sound}
                        onCheckedChange={(v) => {
                          setSound(v);
                          localStorage.setItem("ledger-sound", v ? "on" : "off");
                        }}
                        aria-label="Sons"
                      />
                    </div>
                    {install && (
                      <button
                        className="set-row"
                        onClick={async () => {
                          await install.prompt();
                          await install.userChoice;
                          setInstall(null);
                        }}
                      >
                        <span className="set-icon"><Download size={16} /></span>
                        <span className="set-label">Instalar app</span>
                        <ChevronRight size={16} className="set-chev" />
                      </button>
                    )}
                  </div>
                </section>
                <section className="home-group">
                  <div className="home-group-head"><h2>Conta</h2></div>
                  <div className="home-list">
                    {demo ? (
                      <a className="set-row" href="/login?modo=criar">
                        <span className="set-icon"><LogOut size={16} /></span>
                        <span className="set-label">Criar conta</span>
                        <ChevronRight size={16} className="set-chev" />
                      </a>
                    ) : (
                      <>
                        <div className="set-row">
                          <span className="set-label muted">{user?.email}</span>
                        </div>
                        <button className="set-row danger" onClick={signOut}>
                          <span className="set-icon"><LogOut size={16} /></span>
                          <span className="set-label">Terminar sessão</span>
                        </button>
                      </>
                    )}
                  </div>
                </section>
              </div>
            )}
            {!nav.some((n) => n[0] === page) && !category && (
              <Empty title="Página não encontrada" text="Volta ao teu espaço.">
                <Button onClick={() => go("dashboard")}>Dashboard</Button>
              </Empty>
            )}
          </main>
          <nav
            className={"mobile-nav" + (modal ? " modal-open" : "")}
            aria-label="Navegação principal"
          >
            {nav.slice(0, 2).map(([id, label, Icon]) => (
              <button
                key={id}
                aria-current={page === id ? "page" : undefined}
                onClick={() => go(id)}
                className={page === id ? "active" : ""}
              >
                <Icon size={21} />
                <span>{label}</span>
              </button>
            ))}
            <button
              className="mobile-nav-fab"
              aria-label="Novo movimento"
              onClick={() => openMove("expense")}
            >
              <Plus size={22} />
            </button>
            {nav.slice(2).map(([id, label, Icon]) => (
              <button
                key={id}
                aria-current={page === id ? "page" : undefined}
                onClick={() => go(id)}
                className={page === id ? "active" : ""}
              >
                <Icon size={21} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      <Dialog
        open={!!modal && modal.type !== "delete"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        {modal && modal.type !== "delete" && (
          <FormDialogContent>
            <DialogClose asChild>
              <button
                type="button"
                className="ledger-dialog-close"
                aria-label="Fechar janela"
              >
                <X size={18} />
              </button>
            </DialogClose>
            <DialogTitle>
              {modal?.type === "movement"
                ? "Novo movimento"
                : modal?.type === "income"
                  ? "O teu rendimento"
                  : modal?.id
                    ? "Editar categoria"
                    : "Novo envelope"}
            </DialogTitle>
            <DialogDescription>
              {modal?.type === "movement"
                ? "Um pequeno registo. Tudo no lugar."
                : modal?.type === "income"
                  ? "Define quanto recebeste este mês."
                  : "Dá um destino ao teu dinheiro."}
            </DialogDescription>
            {modal?.type === "movement" && (
              <MovementForm
                key={modal.id + String(modal.kind)}
                state={state}
                kind={modal.kind || "expense"}
                categoryId={modal.id}
                save={save}
                done={() => setModal(null)}
              />
            )}
            {modal?.type === "category" && (
              <CategoryForm
                key={modal.id || "new"}
                category={state.categories.find((c) => c.id === modal.id)}
                kind={modal.kind}
                save={save}
                done={() => setModal(null)}
              />
            )}
            {modal?.type === "income" && (
              <IncomeForm
                income={state.income}
                save={save}
                done={() => setModal(null)}
              />
            )}
          </FormDialogContent>
        )}
      </Dialog>
      <AlertDialog
        open={modal?.type === "delete"}
        onOpenChange={(o) => {
          if (!o) setModal(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Eliminar este movimento?</AlertDialogTitle>
          <AlertDialogDescription>
            O saldo será recalculado. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await save({ action: "deleteMovement", id: modal?.id });
                  setModal(null);
                } catch (e) {
                  setNotice(
                    e instanceof Error
                      ? e.message
                      : "Não foi possível eliminar.",
                  );
                }
              }}
            >
              Eliminar movimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {noticeView}
    </SidebarProvider>
  );
}
function spentIn(s: LedgerState, c: Category, m: string) {
  return s.movements
    .filter(
      (t) =>
        t.category === c.id && t.type === "expense" && t.date.startsWith(m),
    )
    .reduce((a, t) => a + t.amount, 0);
}
function MonthSwitch({
  state,
  month,
  setMonth,
  compact = false,
}: {
  state: LedgerState;
  month: string;
  setMonth: (m: string) => void;
  compact?: boolean;
}) {
  const ms = Object.keys(state.months).sort();
  const i = ms.indexOf(month);
  const full = monthName(month);
  const label = compact
    ? full.charAt(0).toUpperCase() + full.slice(1, 3) + " " + month.slice(0, 4)
    : full;
  return (
    <div className={"home-month" + (compact ? " compact" : "")}>
      <button
        aria-label="Mês anterior"
        disabled={i <= 0}
        onClick={() => setMonth(ms[i - 1])}
      >
        <ArrowLeft size={compact ? 14 : 16} />
      </button>
      <span>{label}</span>
      <button
        aria-label="Mês seguinte"
        disabled={i >= ms.length - 1}
        onClick={() => setMonth(ms[i + 1])}
      >
        <ArrowRight size={compact ? 14 : 16} />
      </button>
    </div>
  );
}
function UnassignedAlert({
  amount,
  onClick,
}: {
  amount: number;
  onClick: () => void;
}) {
  if (amount === 0) return null;
  return (
    <button
      className={"home-alert" + (amount < 0 ? " over" : "")}
      onClick={onClick}
    >
      <span>
        <strong>{money(Math.abs(amount))}</strong>
        {amount > 0 ? " por distribuir" : " distribuídos a mais"}
      </span>
      <ChevronRight size={18} />
    </button>
  );
}
function EnvelopesView({
  state,
  month,
  unassigned,
  go,
  distribute,
  create,
}: {
  state: LedgerState;
  month: string;
  unassigned: number;
  go: (p: string) => void;
  distribute: () => void;
  create: () => void;
}) {
  const monthly = state.categories.filter((c) => c.kind === "monthly");
  const savings = state.categories.filter((c) => c.kind === "saving");
  const budget = monthly.reduce(
    (a, c) => a + (state.months[month]?.allocations[c.id] || 0),
    0,
  );
  const spent = monthly.reduce((a, c) => a + spentIn(state, c, month), 0);
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  return (
    <div className="home">
      <section className="home-hero">
        <div className="env-summary-top">
          <span className="home-label">Orçamento mensal</span>
          {budget > 0 && (
            <span className={"env-summary-pct" + (pct > 100 ? " neg" : "")}>
              {pct}% usado
            </span>
          )}
        </div>
        <div className="env-summary-amount">
          <strong>{money(Math.max(0, budget - spent))}</strong>
          <span>restam de {money(budget)}</span>
        </div>
        {budget > 0 && (
          <div className="home-mini-bar big">
            <i
              className={pct > 100 ? "over" : ""}
              style={{ width: Math.min(100, pct) + "%" }}
            />
          </div>
        )}
      </section>
      <UnassignedAlert amount={unassigned} onClick={distribute} />
      {monthly.length > 0 && (
        <EnvelopeGroup title="Mensal" cats={monthly} state={state} month={month} go={go} />
      )}
      {savings.length > 0 && (
        <EnvelopeGroup title="Poupanças" cats={savings} state={state} month={month} go={go} />
      )}
      <button className="env-new" onClick={create}>
        <Plus size={16} /> Novo envelope
      </button>
    </div>
  );
}
function CategoryView({
  state,
  c,
  month,
  setMonth,
  movements,
  back,
  edit,
  move,
  remove,
}: {
  state: LedgerState;
  c: Category;
  month: string;
  setMonth: (m: string) => void;
  movements: Movement[];
  back: () => void;
  edit: () => void;
  move: (kind: string) => void;
  remove: (id: string) => void;
}) {
  const b = balance(state, c, month);
  const alloc = state.months[month]?.allocations[c.id] || 0;
  const spent = spentIn(state, c, month);
  const monthly = c.kind === "monthly";
  const target = monthly ? alloc : c.goal;
  const pct = target > 0 ? ((monthly ? spent : b) / target) * 100 : 0;
  return (
    <div className="home" style={{ "--cat": c.color } as CSSProperties}>
      <div className="cat-head">
        <button className="icon-btn" aria-label="Voltar" onClick={back}>
          <ArrowLeft size={18} />
        </button>
        <MonthSwitch state={state} month={month} setMonth={setMonth} compact />
        <button className="icon-btn" aria-label="Editar envelope" onClick={edit}>
          <Pencil size={16} />
        </button>
      </div>
      <section className="home-hero cat-hero">
        <CatIcon c={c} />
        <span className="home-label">{c.name}</span>
        <strong className={"home-total" + (b < 0 ? " neg" : "")}>{money(b)}</strong>
        {target > 0 && (
          <>
            <div className="home-mini-bar big cat-bar">
              <i
                className={pct > 100 || b < 0 ? "over" : ""}
                style={{ width: Math.min(100, Math.max(2, pct)) + "%" }}
              />
            </div>
            <span className="home-label">
              {monthly
                ? "Gasto " + money(spent) + " de " + money(alloc)
                : Math.round(pct) +
                  "% de " +
                  money(c.goal) +
                  (c.goalName ? " · " + c.goalName : "")}
            </span>
          </>
        )}
      </section>
      <div className="cat-actions">
        <button onClick={() => move("expense")}>
          <ArrowUpRight size={18} />
          Despesa
        </button>
        <button onClick={() => move("income")}>
          <ArrowDownLeft size={18} />
          Adicionar
        </button>
        <button onClick={() => move("transfer")}>
          <ArrowLeftRight size={18} />
          Transferir
        </button>
      </div>
      <section className="home-group">
        <div className="home-group-head"><h2>Movimentos</h2></div>
        <div className="home-list">
          <MovementList state={state} movements={movements} remove={remove} />
        </div>
      </section>
    </div>
  );
}
function HomeView({
  state,
  month,
  available,
  unassigned,
  recent,
  go,
  distribute,
}: {
  state: LedgerState;
  month: string;
  available: number;
  unassigned: number;
  recent: Movement[];
  go: (p: string) => void;
  distribute: () => void;
}) {
  const monthly = state.categories.filter((c) => c.kind === "monthly");
  const savings = state.categories.filter((c) => c.kind === "saving");
  const sumBal = (cs: Category[]) =>
    cs.reduce((a, c) => a + balance(state, c, month), 0);
  const spendable = sumBal(monthly);
  const saved = sumBal(savings);
  const budget = monthly.reduce(
    (a, c) => a + (state.months[month]?.allocations[c.id] || 0),
    0,
  );
  const spent = monthly.reduce((a, c) => a + spentIn(state, c, month), 0);
  const spentPct = budget > 0 ? (spent / budget) * 100 : 0;
  return (
    <div className="home">
      <section className="home-hero">
        <span className="home-label">Saldo total</span>
        <strong className="home-total">{money(available)}</strong>
        <div className="home-split">
          <div>
            <span className="home-label">Para gastar</span>
            <strong className={spendable < 0 ? "neg" : ""}>
              {money(spendable)}
            </strong>
            {budget > 0 && (
              <div className="home-mini-bar">
                <i style={{ width: Math.min(100, Math.max(0, spentPct)) + "%" }} />
              </div>
            )}
          </div>
          <div>
            <span className="home-label">Poupado</span>
            <strong className="pos">{money(saved)}</strong>
          </div>
        </div>
      </section>
      <UnassignedAlert amount={unassigned} onClick={distribute} />
      {monthly.length > 0 && (
        <EnvelopeGroup title="Mensal" cats={monthly} state={state} month={month} go={go} />
      )}
      {savings.length > 0 && (
        <EnvelopeGroup title="Poupanças" cats={savings} state={state} month={month} go={go} />
      )}
      <section className="home-group">
        <div className="home-group-head">
          <h2>Recentes</h2>
          <button onClick={() => go("movimentos")}>Ver tudo</button>
        </div>
        <div className="home-list">
          <MovementList state={state} movements={recent} />
        </div>
      </section>
    </div>
  );
}
function EnvelopeGroup({
  title,
  cats,
  state,
  month,
  go,
}: {
  title: string;
  cats: Category[];
  state: LedgerState;
  month: string;
  go: (p: string) => void;
}) {
  return (
    <section className="home-group">
      <div className="home-group-head">
        <h2>{title}</h2>
      </div>
      <div className="home-list">
        {cats.map((c) => {
          const b = balance(state, c, month);
          const alloc = state.months[month]?.allocations[c.id] || 0;
          const spent = spentIn(state, c, month);
          const monthly = c.kind === "monthly";
          const pct = monthly
            ? alloc > 0
              ? (spent / alloc) * 100
              : 0
            : c.goal > 0
              ? (b / c.goal) * 100
              : 0;
          const showBar = monthly ? alloc > 0 : c.goal > 0;
          const sub = monthly
            ? b < 0
              ? "Excedido em " + money(-b)
              : alloc > 0
                ? "Gasto " + money(spent) + " de " + money(alloc)
                : "Gasto " + money(spent)
            : c.goal > 0
              ? Math.round((b / c.goal) * 100) +
                "% de " +
                money(c.goal) +
                (c.goalName ? " · " + c.goalName : "")
              : "Sem meta";
          return (
            <button
              key={c.id}
              className="env-row"
              onClick={() => go("categoria/" + c.id)}
              style={{ "--cat": c.color } as CSSProperties}
            >
              <CatIcon c={c} small />
              <div className="env-row-body">
                <div className="env-row-top">
                  <span className="env-row-name">{c.name}</span>
                  <strong className={b < 0 ? "neg" : ""}>{money(b)}</strong>
                </div>
                {showBar && (
                  <div className="env-row-bar">
                    <i
                      className={b < 0 || pct > 100 ? "over" : ""}
                      style={{ width: Math.min(100, Math.max(2, pct)) + "%" }}
                    />
                  </div>
                )}
                <span className={"env-row-sub" + (b < 0 ? " neg" : "")}>{sub}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
function MovementList({
  state,
  movements,
  remove,
  hideDate = false,
}: {
  state: LedgerState;
  movements: Movement[];
  remove?: (id: string) => void;
  hideDate?: boolean;
}) {
  if (!movements.length)
    return (
      <Empty
        title="Ainda está tudo tranquilo."
        text="Os teus movimentos vão aparecer aqui."
      />
    );
  return (
    <div className="movement-list">
      {movements.map((t) => {
        const c = state.categories.find((c) => c.id === t.category)!;
        const dest = state.categories.find((c) => c.id === t.to);
        return (
          <div className="movement-row" key={t.id}>
            <CatIcon c={c} small />
            <div className="movement-name">
              <strong>
                {t.description || c.name + (dest ? " → " + dest.name : "")}
              </strong>
              <span>
                {[
                  hideDate
                    ? ""
                    : new Intl.DateTimeFormat("pt-PT", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(t.date + "T12:00:00")),
                  t.description ? c.name + (dest ? " → " + dest.name : "") : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <strong
              className={
                "movement-amount " +
                (t.type === "income" || t.type === "allocation"
                  ? "positive"
                  : t.type === "expense"
                    ? "negative"
                    : "")
              }
            >
              {t.type === "transfer"
                ? "↔ "
                : t.type === "expense"
                  ? "− "
                  : "+ "}
              {money(t.amount)}
            </strong>
            {remove && t.date.startsWith(currentMonth()) && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={"Eliminar " + (t.description || "movimento")}
                onClick={() => remove(t.id)}
              >
                <Trash2 size={15} />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
function History({
  state,
  movements,
  remove,
}: {
  state: LedgerState;
  movements: Movement[];
  remove: (id: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [category, setCategory] = useState("all"),
    [dateFrom, setDateFrom] = useState(""),
    [dateTo, setDateTo] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = movements.filter((t) => {
    if (type !== "all" && t.type !== type) return false;
    if (category !== "all" && t.category !== category && t.to !== category)
      return false;
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo && t.date > dateTo) return false;
    if (!q) return true;
    const c = state.categories.find((c) => c.id === t.category);
    const destination = state.categories.find((c) => c.id === t.to);
    return (
      t.description.toLowerCase().includes(q) ||
      !!c?.name.toLowerCase().includes(q) ||
      !!destination?.name.toLowerCase().includes(q)
    );
  });
  const hasFilters =
    !!q || type !== "all" || category !== "all" || !!dateFrom || !!dateTo;
  function clearFilters() {
    setQuery("");
    setType("all");
    setCategory("all");
    setDateFrom("");
    setDateTo("");
  }
  const days = filtered.reduce<{ date: string; items: Movement[] }[]>(
    (acc, t) => {
      const last = acc.at(-1);
      return last && last.date === t.date
        ? [...acc.slice(0, -1), { date: last.date, items: [...last.items, t] }]
        : [...acc, { date: t.date, items: [t] }];
    },
    [],
  );
  const types: [string, string][] = [
    ["all", "Todos"],
    ["expense", "Despesas"],
    ["income", "Entradas"],
    ["transfer", "Transferências"],
  ];
  return (
    <div className="home">
      <label className="rec-search">
        <Search size={16} />
        <input
          placeholder="Pesquisar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="rec-chips">
        {types.map(([id, label]) => (
          <button
            key={id}
            className={type === id ? "active" : ""}
            aria-pressed={type === id}
            onClick={() => setType(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="history-filters">
        <label>
          Categoria
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Todas as categorias</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Desde
          <Input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label>
          Até
          <Input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
      </div>
      {days.length === 0 ? (
        hasFilters ? (
          <div className="home-list">
            <Empty
              title="Sem resultados para estes filtros."
              text="Altera os critérios ou limpa a pesquisa."
            >
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="home-list">
            <MovementList state={state} movements={[]} />
          </div>
        )
      ) : (
        days.map((d) => (
          <section className="home-group" key={d.date}>
            <div className="home-group-head">
              <h2>
                {new Intl.DateTimeFormat("pt-PT", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                }).format(new Date(d.date + "T12:00:00"))}
              </h2>
            </div>
            <div className="home-list">
              <MovementList state={state} movements={d.items} remove={remove} hideDate />
            </div>
          </section>
        ))
      )}
    </div>
  );
}
type Save = (data: any) => Promise<void>;
function MovementForm({
  state,
  kind,
  categoryId,
  save,
  done,
}: {
  state: LedgerState;
  kind: string;
  categoryId?: string;
  save: Save;
  done: () => void;
}) {
  const [type, setType] = useState(kind),
    [cat, setCat] = useState(categoryId || state.categories[0].id),
    [to, setTo] = useState(
      state.categories.find(
        (c) => c.id !== (categoryId || state.categories[0].id),
      )?.id || "",
    ),
    [value, setValue] = useState(""),
    [description, setDescription] = useState(""),
    [date, setDate] = useState(today()),
    [source, setSource] = useState("new"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const c = state.categories.find((c) => c.id === cat)!;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await save({
        action: "movement",
        type: type === "income" && source === "free" ? "allocation" : type,
        amount: cents(value),
        category: cat,
        to,
        description,
        date,
      });
      done();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="ledger-form" onSubmit={submit}>
      <Tabs
        value={type}
        onValueChange={(v) => {
          setType(v);
          setError("");
        }}
      >
        <TabsList className="movement-tabs">
          <TabsTrigger value="expense">Despesa</TabsTrigger>
          <TabsTrigger value="income">Entrada</TabsTrigger>
          <TabsTrigger value="transfer">Transferência</TabsTrigger>
        </TabsList>
      </Tabs>
      <label className="amount-label">
        Valor
        <div className="amount-input">
          <Input
            required
            inputMode="decimal"
            placeholder="0,00"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Valor em euros"
          />
          <span>€</span>
        </div>
      </label>
      <label>
        {type === "transfer" ? "De" : "Categoria"}
        <Select
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            if (to === e.target.value)
              setTo(
                state.categories.find((c) => c.id !== e.target.value)?.id || "",
              );
          }}
        >
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <small>
          {money(balance(state, c, currentMonth()))} disponíveis neste envelope
        </small>
      </label>
      {type === "transfer" && (
        <label>
          Para
          <Select required value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="" disabled>
              Escolhe o destino
            </option>
            {state.categories
              .filter((c) => c.id !== cat)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </label>
      )}
      {type === "income" && (
        <label>
          De onde vem este dinheiro?
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="new">Dinheiro novo recebido</option>
            <option value="free">
              Por distribuir · {money(free(state, currentMonth()))}
            </option>
          </Select>
        </label>
      )}
      <label>
        Descrição <span className="optional">opcional</span>
        <Input
          maxLength={140}
          placeholder={
            type === "expense" ? "Por exemplo, restaurante" : "Uma pequena nota"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label>
        Data
        <Input
          type="date"
          required
          min={currentMonth() + "-01"}
          max={today()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <ErrorText error={error} />
      <Submit busy={busy}>
        Guardar {type === "transfer" ? "transferência" : "movimento"}{" "}
        <Check size={17} />
      </Submit>
    </form>
  );
}
function CategoryForm({
  category,
  kind,
  save,
  done,
}: {
  category?: Category;
  kind?: string;
  save: Save;
  done: () => void;
}) {
  const [name, setName] = useState(category?.name || ""),
    [type, setType] = useState(category?.kind || kind || "monthly"),
    [monthly, setMonthly] = useState(String((category?.monthly || 0) / 100)),
    [goal, setGoal] = useState(
      category?.goal ? String(category.goal / 100) : "",
    ),
    [goalName, setGoalName] = useState(category?.goalName || ""),
    [color, setColor] = useState(category?.color || colors[0]),
    [icon, setIcon] = useState(category?.icon || "wallet"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await save({
        action: "category",
        id: category?.id,
        name,
        kind: type,
        monthly: cents(monthly),
        goal: goal ? cents(goal) : 0,
        goalName,
        color,
        icon,
      });
      done();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verifica os valores.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="ledger-form" onSubmit={submit}>
      <label>
        Nome
        <Input
          autoFocus
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Por exemplo, Viagens"
        />
      </label>
      <div className="form-columns">
        <label>
          Tipo
          <Select
            disabled={!!category}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="monthly">Mensal</option>
            <option value="saving">Acumulativa</option>
          </Select>
        </label>
        <label>
          Valor mensal (€)
          <Input
            inputMode="decimal"
            required
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </label>
      </div>
      <p className="helper">
        {type === "monthly"
          ? "Renova todos os meses. A sobra volta a ficar por distribuir."
          : "O saldo acumula de mês para mês."}{" "}
        O valor mensal ajusta a distribuição deste mês.
      </p>
      {type === "saving" && (
        <div className="form-columns">
          <label>
            Objetivo (€) <span className="optional">opcional</span>
            <Input
              inputMode="decimal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="2000"
            />
          </label>
          <label>
            Nome do objetivo
            <Input
              maxLength={80}
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Por exemplo, Nova câmara"
            />
          </label>
        </div>
      )}
      <fieldset>
        <legend>Cor</legend>
        <div className="color-options">
          {colors.map((c, i) => (
            <button
              type="button"
              key={c}
              aria-label={
                [
                  "Vermelho",
                  "Roxo",
                  "Azul",
                  "Verde",
                  "Laranja",
                  "Azul-petróleo",
                  "Cinzento",
                ][i]
              }
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              style={{ background: c }}
            >
              {color === c && <Check size={18} />}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Ícone</legend>
        <div className="icon-options">
          {icons.map((i, n) => {
            const Icon = iconMap[i];
            return (
              <button
                key={i}
                type="button"
                className={icon === i ? "selected" : ""}
                aria-label={iconNames[n]}
                aria-pressed={icon === i}
                onClick={() => setIcon(i)}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      </fieldset>
      <ErrorText error={error} />
      <Submit busy={busy}>
        {category ? "Guardar alterações" : "Criar envelope"}
      </Submit>
    </form>
  );
}
function IncomeForm({
  income,
  save,
  done,
}: {
  income: number;
  save: Save;
  done: () => void;
}) {
  const [value, setValue] = useState(String(income / 100)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="ledger-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          await save({ action: "income", income: cents(value) });
          done();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Verifica o valor.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Rendimento mensal (€)
        <Input
          autoFocus
          inputMode="decimal"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <p className="helper">
        Atualiza o rendimento deste mês e o valor habitual para os próximos. Os
        meses anteriores mantêm-se.
      </p>
      <ErrorText error={error} />
      <Submit busy={busy}>Guardar rendimento</Submit>
    </form>
  );
}
function Onboarding({ save }: { save: Save }) {
  const [step, setStep] = useState(1),
    [income, setIncome] = useState(""),
    [selected, setSelected] = useState<number[]>([0, 1, 2, 3, 4, 5]),
    [cats, setCats] = useState(
      suggestions.map((c) => ({ ...c, amount: String(c.monthly / 100) })),
    ),
    [custom, setCustom] = useState(""),
    [customKind, setCustomKind] = useState<"monthly" | "saving">("monthly"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  let total = 0,
    received = 0;
  try {
    total = selected.reduce((n, i) => n + cents(cats[i].amount || "0"), 0);
    received = cents(income || "0");
  } catch {}
  const difference = received - total;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      cents(income);
      if (step === 1) {
        setStep(2);
        return;
      }
      if (!selected.length)
        throw new Error("Escolhe pelo menos uma categoria.");
      const categories = selected.map((i) => ({
        ...cats[i],
        monthly: cents(cats[i].amount),
      }));
      if (categories.reduce((a, c) => a + c.monthly, 0) > cents(income))
        throw new Error(
          "Estás a distribuir mais do que recebes. Ajusta os valores.",
        );
      if (step === 2) {
        setStep(3);
        return;
      }
      if (busy) return;
      setBusy(true);
      await save({ action: "setup", income: cents(income), categories });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verifica os valores.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="onboarding-card panel">
      <div className="onboarding-steps">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= step ? "active" : ""}>
            {n < step ? <Check size={15} /> : n}
          </span>
        ))}
        <small>Passo {step} de 3</small>
      </div>
      <h1>
        {step === 1
          ? "Vamos dar um lugar ao teu dinheiro."
          : step === 2
            ? "Os teus envelopes. À tua medida."
            : "Tudo pronto para começar."}
      </h1>
      <p>
        {step === 1
          ? "Quanto recebes por mês? Podes alterar este valor mais tarde."
          : step === 2
            ? "Escolhe as categorias e quanto queres reservar em cada uma."
            : "Confirma a tua distribuição. O resto é viver."}
      </p>
      <form className="ledger-form" onSubmit={submit}>
        {step === 1 && (
          <label>
            Rendimento mensal (€)
            <div className="amount-input">
              <Input
                    inputMode="decimal"
                required
                placeholder="1100"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                aria-label="Rendimento mensal"
              />
              <span>€</span>
            </div>
            <small>O valor que recebeste este mês, depois dos descontos.</small>
          </label>
        )}
        {step === 2 && (
          <>
            <div className="onboarding-categories">
              {cats.map((c, i) => (
                <div
                  className={
                    "onboarding-category " +
                    (selected.includes(i) ? "chosen" : "")
                  }
                  key={i}
                >
                  <button
                    type="button"
                    aria-label={
                      (selected.includes(i) ? "Remover " : "Escolher ") + c.name
                    }
                    aria-pressed={selected.includes(i)}
                    onClick={() =>
                      setSelected(
                        selected.includes(i)
                          ? selected.filter((n) => n !== i)
                          : [...selected, i],
                      )
                    }
                  >
                    <span className="check-box">
                      {selected.includes(i) && <Check size={13} />}
                    </span>
                    <CatIcon c={c} small />
                    <span>
                      <strong>{c.name}</strong>
                      <small>
                        {c.kind === "monthly" ? "Mensal" : "Acumulativa"}
                      </small>
                    </span>
                  </button>
                  {selected.includes(i) && (
                    <div className="onboarding-amount">
                      <Input
                        aria-label={"Valor mensal de " + c.name}
                        inputMode="decimal"
                        value={c.amount}
                        onChange={(e) =>
                          setCats(
                            cats.map((x, n) =>
                              n === i ? { ...x, amount: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <span>€</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="custom-category">
              <Input
                value={custom}
                maxLength={60}
                aria-label="Nome da nova categoria"
                placeholder="Ou cria a tua categoria"
                onChange={(e) => setCustom(e.target.value)}
              />
              <Select
                aria-label="Tipo da nova categoria"
                value={customKind}
                onChange={(e) =>
                  setCustomKind(e.target.value as "monthly" | "saving")
                }
              >
                <option value="monthly">Mensal</option>
                <option value="saving">Acumulativa</option>
              </Select>
              <Button
                type="button"
                variant="outline"
                disabled={!custom.trim()}
                onClick={() => {
                  const i = cats.length;
                  setCats([
                    ...cats,
                    {
                      name: custom.trim(),
                      kind: customKind,
                      monthly: 0,
                      color: colors[i % colors.length],
                      icon: "wallet",
                      goal: 0,
                      goalName: "",
                      amount: "0",
                    },
                  ]);
                  setSelected([...selected, i]);
                  setCustom("");
                }}
                aria-label="Adicionar categoria"
              >
                <Plus size={18} />
              </Button>
            </div>
            <p className={"budget-check " + (difference < 0 ? "negative" : "")}>
              {difference < 0
                ? `${money(-difference)} acima do rendimento`
                : `${money(total)} distribuídos · ${money(difference)} por distribuir`}
            </p>
          </>
        )}
        {step === 3 && (
          <div className="onboarding-review">
            <span className="review-check">
              <CheckCheck size={29} />
            </span>
            <div className="between">
              <span>Rendimento</span>
              <strong>{money(received)}</strong>
            </div>
            <div className="between">
              <span>Distribuição</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="between">
              <span>Por distribuir</span>
              <strong>{money(difference)}</strong>
            </div>
            <p>
              {difference === 0
                ? "Tudo certo. Cada euro tem um destino."
                : "O dinheiro livre fica disponível para distribuíres depois."}
            </p>
          </div>
        )}
        <ErrorText error={error} />
        <Submit busy={busy}>
          {step === 3 ? "Entrar na Ledger" : "Continuar"}{" "}
          <ArrowRight size={17} />
        </Submit>
        {step > 1 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep(step - 1);
              setError("");
            }}
          >
            Voltar
          </Button>
        )}
      </form>
    </main>
  );
}
