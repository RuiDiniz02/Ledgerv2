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
  Target,
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
  CalendarDays,
  X,
  Volume2,
  Download,
  LogOut,
  Pencil,
  Loader2,
  Trash2,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  ["dashboard", "Dashboard", LayoutDashboard],
  ["categorias", "Categorias", Layers3],
  ["movimentos", "Movimentos", ArrowLeftRight],
  ["objetivos", "Objetivos", Target],
  ["definicoes", "Definições", Settings],
] as const;
function Brand() {
  return (
    <a className="brand" href="#dashboard" aria-label="Ledger — Dashboard">
      <span className="brand-mark">
        <Layers3 size={23} />
      </span>
      ledger<span className="brand-period">.</span>
    </a>
  );
}
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
function Bar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  return (
    <Progress
      aria-label={label}
      value={Math.max(0, Math.min(100, value))}
      className="ledger-progress"
      style={{ "--cat": color } as CSSProperties}
    />
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
  signIn = "/signin-with-chatgpt?return_to=%2F",
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
      const r = await fetch("/api/ledger", { cache: "no-store" });
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
  async function save(raw: any) {
    if (offline && !demo)
      throw new Error(
        "Estás sem ligação. Os campos ficam guardados aqui até voltares a ter internet.",
      );
    if (demo) {
      const next = raw.action === "setup" ? setup(raw) : mutate(state!, raw);
      setState(next);
    } else {
      const r = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, revision }),
      });
      const data = (await r.json()) as {
        state: LedgerState | null;
        revision: number;
        error?: string;
      };
      if (!r.ok) {
        if (r.status === 409) {
          const fresh = await fetch("/api/ledger", { cache: "no-store" });
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
                Entrar com ChatGPT <ArrowRight size={18} />
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
  const sum = summary(state, month),
    current = month === currentMonth();
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
  const categoryCard = (c: Category) => {
    const b = balance(state, c, month),
      budget = state.months[month]?.allocations[c.id] || 0,
      target = c.kind === "monthly" ? budget : c.goal;
    return (
      <button
        key={c.id}
        className="envelope-card"
        onClick={() => go("categoria/" + c.id)}
        style={{ "--cat": c.color } as CSSProperties}
      >
        <div className="envelope-top">
          <CatIcon c={c} />
          <span className="badge">
            {c.kind === "monthly" ? "Mensal" : "Acumulativa"}
          </span>
          <ChevronRight className="card-arrow" size={17} />
        </div>
        <h3>{c.name}</h3>
        <div className="envelope-value">
          {money(b)}
          <span>disponíveis</span>
        </div>
        <div className="card-progress">
          {target > 0 ? (
            <>
              <Bar
                value={(b / target) * 100}
                color={c.color}
                label={c.name + " — " + money(b) + " de " + money(target)}
              />
              <div className="between">
                <span>
                  {c.kind === "monthly"
                    ? `de ${money(target)} este mês`
                    : `Objetivo: ${money(target)}`}
                </span>
                {c.kind === "saving" && (
                  <b>{Math.round((b / target) * 100)}%</b>
                )}
              </div>
            </>
          ) : (
            <div className="accumulation">
              <span className="tiny-dot" /> {money(budget)} reservados este mês
            </div>
          )}
        </div>
      </button>
    );
  };
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
          <header className="topbar">
            <div className="desktop-breadcrumb">
              O meu espaço <ChevronRight size={14} />
              <strong>{title}</strong>
            </div>
            <div className="mobile-brand">
              <Brand />
            </div>
            <div className="topbar-right">
              {demo && (
                <a className="demo-badge" href="/">
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
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  {category
                    ? "O TEU ENVELOPE"
                    : page === "dashboard"
                      ? "CADA EURO, NO SEU LUGAR"
                      : "O TEU ESPAÇO"}
                </span>
                <h1>
                  {page === "dashboard"
                    ? "O teu dinheiro, com clareza."
                    : title}
                </h1>
                <p>
                  {category
                    ? category.kind === "monthly"
                      ? "Para o dia a dia, mês após mês."
                      : "O que guardas hoje, para os planos de amanhã."
                    : page === "dashboard"
                      ? "Tudo o que tens. Tudo o que planeias."
                      : page === "categorias"
                        ? "Um envelope para cada parte da tua vida."
                        : page === "movimentos"
                          ? "Os pequenos movimentos do teu dinheiro."
                          : page === "objetivos"
                            ? "Dá espaço aos teus próximos planos."
                            : "A Ledger, à tua maneira."}
                </p>
              </div>
              {page !== "definicoes" && (
                <Button
                  className="primary new-movement"
                  onClick={() => openMove("expense", category?.id)}
                >
                  <Plus size={19} /> Movimento
                </Button>
              )}
            </div>
            {page !== "definicoes" && (
              <div className="month-row">
                <div className="month-picker">
                  <CalendarDays size={17} />
                  <Select
                    aria-label="Mês"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {Object.keys(state.months)
                      .sort()
                      .reverse()
                      .map((m) => (
                        <option key={m} value={m}>
                          {monthName(m)}
                        </option>
                      ))}
                  </Select>
                </div>
                <span className="month-status">
                  {current ? "O teu mês, num olhar" : "Histórico do mês"}
                </span>
              </div>
            )}
            {page === "dashboard" && (
              <>
                <section className="summary-grid" aria-label="Resumo do mês">
                  <div className="summary-card available">
                    <div className="between">
                      <span>Disponível no total</span>
                      <Wallet size={21} />
                    </div>
                    <strong>{money(sum.available)}</strong>
                    <span className="summary-foot">
                      Nos envelopes e por distribuir
                    </span>
                  </div>
                  <div className="summary-card">
                    <div className="between">
                      <span>Recebido este mês</span>
                      <span className="summary-symbol incoming">
                        <ArrowDownLeft size={19} />
                      </span>
                    </div>
                    <strong>{money(sum.income)}</strong>
                    <span className="summary-foot">Rendimento e entradas</span>
                  </div>
                  <div className="summary-card">
                    <div className="between">
                      <span>Gasto este mês</span>
                      <span className="summary-symbol outgoing">
                        <ArrowUpRight size={19} />
                      </span>
                    </div>
                    <strong>{money(sum.spent)}</strong>
                    <span className="summary-foot">
                      Cada despesa no seu envelope
                    </span>
                  </div>
                </section>
                <Distribution
                  state={state}
                  month={month}
                  edit={() => go("categorias")}
                />
                <div className="section-heading">
                  <div>
                    <h2>
                      Os teus envelopes{" "}
                      <span className="count">{state.categories.length}</span>
                    </h2>
                    <p>Dinheiro separado. Cabeça descansada.</p>
                  </div>
                  <Button variant="ghost" onClick={() => go("categorias")}>
                    Gerir categorias <ArrowRight size={16} />
                  </Button>
                </div>
                <section className="envelope-grid">
                  {state.categories.map(categoryCard)}
                </section>
                <section className="recent panel">
                  <div className="section-heading">
                    <h2>Últimos movimentos</h2>
                    <Button variant="ghost" onClick={() => go("movimentos")}>
                      Ver todos <ArrowRight size={16} />
                    </Button>
                  </div>
                  <MovementList state={state} movements={recent.slice(0, 4)} />
                </section>
              </>
            )}
            {page === "categorias" && (
              <>
                <Distribution
                  state={state}
                  month={month}
                  edit={() => setModal({ type: "income" })}
                />
                <div className="section-heading">
                  <h2>{state.categories.length} envelopes</h2>
                  <Button
                    variant="outline"
                    onClick={() => setModal({ type: "category" })}
                  >
                    <Plus size={17} /> Nova categoria
                  </Button>
                </div>
                <section className="envelope-grid">
                  {state.categories.map(categoryCard)}
                </section>
                <p className="helper">
                  <CircleHelp size={16} /> As categorias mensais renovam-se. Nas
                  acumulativas, o dinheiro fica.
                </p>
              </>
            )}
            {category && (
              <>
                <Button
                  variant="ghost"
                  className="back"
                  onClick={() => go("categorias")}
                >
                  <ArrowLeft size={16} /> Categorias
                </Button>
                <section className="category-detail panel">
                  <div className="detail-top">
                    <CatIcon c={category} />
                    <span className="badge">
                      {category.kind === "monthly"
                        ? "Categoria mensal"
                        : "Categoria acumulativa"}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setModal({ type: "category", id: category.id })
                      }
                    >
                      <Pencil size={16} /> Editar categoria
                    </Button>
                  </div>
                  <p>Saldo disponível</p>
                  <strong className="detail-value">
                    {money(balance(state, category, month))}
                  </strong>
                  {(category.goal || category.monthly) > 0 && (
                    <div className="detail-progress">
                      <div className="between">
                        <span>
                          {category.kind === "monthly"
                            ? `Orçamento mensal: ${money(state.months[month].allocations[category.id] || 0)}`
                            : category.goalName || "O teu objetivo"}
                        </span>
                        <strong>
                          {category.goal > 0 ? money(category.goal) : ""}
                        </strong>
                      </div>
                      <Bar
                        color={category.color}
                        value={
                          (balance(state, category, month) /
                            (category.goal ||
                              state.months[month].allocations[category.id] ||
                              1)) *
                          100
                        }
                        label="Progresso da categoria"
                      />
                      {category.goal > 0 && (
                        <p>
                          {Math.round(
                            (balance(state, category, month) / category.goal) *
                              100,
                          )}
                          % do objetivo ·{" "}
                          {money(
                            Math.max(
                              0,
                              category.goal - balance(state, category, month),
                            ),
                          )}{" "}
                          para lá chegar
                        </p>
                      )}
                    </div>
                  )}
                  <div className="detail-actions">
                    <Button
                      className="primary"
                      onClick={() => openMove("expense", category.id)}
                    >
                      <Plus size={17} /> Registar despesa
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openMove("income", category.id)}
                    >
                      <ArrowDownLeft size={17} /> Adicionar dinheiro
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openMove("transfer", category.id)}
                    >
                      <ArrowLeftRight size={17} /> Transferir
                    </Button>
                  </div>
                </section>
                <section className="recent panel">
                  <div className="section-heading">
                    <h2>Movimentos recentes</h2>
                  </div>
                  <MovementList
                    state={state}
                    movements={recent.filter(
                      (t) => t.category === category.id || t.to === category.id,
                    )}
                    remove={(id) => setModal({ type: "delete", id })}
                  />
                </section>
              </>
            )}
            {page === "movimentos" && (
              <History
                state={state}
                movements={recent}
                remove={(id) => setModal({ type: "delete", id })}
              />
            )}
            {page === "objetivos" && (
              <>
                <div className="section-heading">
                  <h2>Os teus próximos passos</h2>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setModal({ type: "category", kind: "saving" })
                    }
                  >
                    <Plus size={17} /> Novo objetivo
                  </Button>
                </div>
                <div className="goals-grid">
                  {state.categories
                    .filter((c) => c.goal > 0)
                    .map((c) => {
                      const b = balance(state, c, month),
                        pct = Math.round((b / c.goal) * 100);
                      return (
                        <button
                          className="goal-card panel"
                          key={c.id}
                          onClick={() => go("categoria/" + c.id)}
                        >
                          <div className="between">
                            <CatIcon c={c} />
                            <span className="badge">
                              {pct >= 100 ? "Concluído" : `${pct}% concluído`}
                            </span>
                          </div>
                          <h2>{c.goalName || c.name}</h2>
                          <p>{c.name}</p>
                          <div className="goal-values">
                            <strong>{money(b)}</strong>
                            <span>de {money(c.goal)}</span>
                          </div>
                          <Bar
                            value={pct}
                            color={c.color}
                            label={c.name + " " + pct + "% concluído"}
                          />
                          <div className="between goal-foot">
                            <span>
                              {pct >= 100
                                ? "Chegaste ao teu objetivo!"
                                : `Faltam ${money(c.goal - b)}`}
                            </span>
                            <ArrowUpRight size={18} />
                          </div>
                        </button>
                      );
                    })}
                </div>
                {!state.categories.some((c) => c.goal > 0) && (
                  <Empty
                    title="O próximo plano começa aqui."
                    text="Adiciona um objetivo a uma categoria acumulativa."
                  >
                    <Button
                      className="primary"
                      onClick={() =>
                        setModal({ type: "category", kind: "saving" })
                      }
                    >
                      Criar objetivo
                    </Button>
                  </Empty>
                )}
              </>
            )}
            {page === "definicoes" && (
              <div className="settings-stack">
                <section className="panel settings-panel">
                  <h2>O teu rendimento</h2>
                  <p>
                    Valor recebido este mês e usado como rendimento habitual nos
                    próximos meses.
                  </p>
                  <div className="setting-row">
                    <div>
                      <strong className="setting-money">
                        {money(state.income)}
                      </strong>
                      <span> por mês</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setModal({ type: "income" })}
                    >
                      <Pencil size={16} /> Alterar
                    </Button>
                  </div>
                  <p className="helper">
                    Confirma o valor recebido todos os meses. A Ledger não está
                    ligada ao teu banco.
                  </p>
                </section>
                <section className="panel settings-panel">
                  <h2>Ao teu gosto</h2>
                  <div className="setting-row">
                    <div>
                      <Moon size={19} />
                      <span>
                        <strong>Modo escuro</strong>
                        <small>Mais conforto, de dia ou de noite.</small>
                      </span>
                    </div>
                    <Switch
                      checked={dark}
                      onCheckedChange={toggleTheme}
                      aria-label="Modo escuro"
                    />
                  </div>
                  <div className="setting-row">
                    <div>
                      <Volume2 size={19} />
                      <span>
                        <strong>Sons subtis</strong>
                        <small>Um pequeno toque ao clicar.</small>
                      </span>
                    </div>
                    <Switch
                      checked={sound}
                      onCheckedChange={(v) => {
                        setSound(v);
                        localStorage.setItem("ledger-sound", v ? "on" : "off");
                      }}
                      aria-label="Sons subtis"
                    />
                  </div>
                </section>
                <section className="panel settings-panel">
                  <h2>Sempre à mão</h2>
                  <p>Instala a Ledger no teu telemóvel ou computador.</p>
                  {install ? (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await install.prompt();
                        await install.userChoice;
                        setInstall(null);
                      }}
                    >
                      <Download size={17} /> Instalar Ledger
                    </Button>
                  ) : (
                    <p className="helper">
                      No menu do navegador, escolhe «Instalar aplicação» ou
                      «Adicionar ao ecrã principal». É necessária ligação para
                      aceder aos dados.
                    </p>
                  )}
                </section>
                <section className="panel settings-panel">
                  <h2>A tua conta</h2>
                  <p>
                    {demo
                      ? "Estás numa demonstração. As alterações desaparecem ao recarregar."
                      : user?.email}
                  </p>
                  <Button variant="outline" asChild>
                    <a
                      href={demo ? "/" : "/signout-with-chatgpt?return_to=%2F"}
                      target="_top"
                    >
                      <LogOut size={16} />
                      {demo ? "Sair da demonstração" : "Terminar sessão"}
                    </a>
                  </Button>
                </section>
              </div>
            )}
            {!nav.some((n) => n[0] === page) && !category && (
              <Empty title="Página não encontrada" text="Volta ao teu espaço.">
                <Button onClick={() => go("dashboard")}>Dashboard</Button>
              </Empty>
            )}
            <footer className="app-footer">
              <span>Um lugar para cada euro.</span>
              <span>ledger.</span>
            </footer>
          </main>
          <nav className="mobile-nav" aria-label="Navegação principal">
            {nav.map(([id, label, Icon]) => (
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
          <DialogContent className="ledger-dialog">
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
          </DialogContent>
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
function Distribution({
  state,
  month,
  edit,
}: {
  state: LedgerState;
  month: string;
  edit: () => void;
}) {
  const s = summary(state, month),
    mm = state.months[month];
  return (
    <section className="distribution">
      <div className="distribution-main">
        <span className="distribution-icon">
          <Check size={19} />
        </span>
        <div>
          <strong>
            {s.free === 0
              ? "Cada euro tem o seu lugar."
              : s.free < 0
                ? "A distribuição precisa de um ajuste."
                : `${money(s.free)} à espera de um destino.`}
          </strong>
          <p>
            {money(mm?.income || 0)} de rendimento <span>·</span>{" "}
            {money(s.distributed)} distribuídos{" "}
            {mm?.carry > 0 && (
              <>
                <span>·</span> {money(mm.carry)} transitados
              </>
            )}
          </p>
        </div>
      </div>
      <Button variant="ghost" onClick={edit}>
        {s.free === 0 ? "Ver distribuição" : "Ajustar distribuição"}
        <ArrowRight size={16} />
      </Button>
    </section>
  );
}
function MovementList({
  state,
  movements,
  remove,
}: {
  state: LedgerState;
  movements: Movement[];
  remove?: (id: string) => void;
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
                {t.description ||
                  (t.type === "expense"
                    ? "Despesa"
                    : t.type === "transfer"
                      ? "Transferência"
                      : t.type === "allocation"
                        ? "Distribuição"
                        : "Entrada")}
              </strong>
              <span>
                {c.name}
                {dest ? " → " + dest.name : ""}
                {t.type === "allocation" ? " · Por distribuir" : ""}
              </span>
            </div>
            <time dateTime={t.date}>
              {new Intl.DateTimeFormat("pt-PT", {
                day: "numeric",
                month: "short",
              }).format(new Date(t.date + "T12:00:00"))}
            </time>
            <strong
              className={
                "movement-amount " +
                (t.type === "income" || t.type === "allocation"
                  ? "positive"
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
  const [category, setCategory] = useState("all"),
    [type, setType] = useState("all");
  const filtered = movements.filter(
    (t) =>
      (category === "all" || t.category === category || t.to === category) &&
      (type === "all" || t.type === type),
  );
  return (
    <section className="panel history-panel">
      <div className="filters">
        <Select
          aria-label="Filtrar por categoria"
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
        <Select
          aria-label="Filtrar por tipo"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">Todos os movimentos</option>
          <option value="expense">Despesas</option>
          <option value="income">Entradas</option>
          <option value="transfer">Transferências</option>
          <option value="allocation">Distribuições</option>
        </Select>
        <span>{filtered.length} movimentos</span>
      </div>
      <MovementList state={state} movements={filtered} remove={remove} />
    </section>
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
            autoFocus
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
                autoFocus
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
