export type Category = {
  id: string;
  name: string;
  kind: "monthly" | "saving";
  monthly: number;
  color: string;
  icon: string;
  goal: number;
  goalName: string;
};
export type Movement = {
  id: string;
  type: "expense" | "income" | "transfer" | "allocation";
  amount: number;
  category: string;
  to?: string;
  description: string;
  date: string;
};
export type Month = {
  income: number;
  carry: number;
  allocations: Record<string, number>;
};
export type LedgerState = {
  income: number;
  categories: Category[];
  months: Record<string, Month>;
  movements: Movement[];
  started: string;
};
export const colors = [
  "#ce6265",
  "#8b65cf",
  "#4a83cc",
  "#348569",
  "#cc8535",
  "#387f8b",
  "#727886",
];
export const icons = [
  "receipt",
  "coffee",
  "plane",
  "trending",
  "shield",
  "camera",
  "home",
  "food",
  "car",
  "wallet",
];
export const suggestions: Omit<Category, "id">[] = [
  {
    name: "Despesas Mensais",
    kind: "monthly",
    monthly: 15000,
    color: colors[0],
    icon: "receipt",
    goal: 0,
    goalName: "",
  },
  {
    name: "Lazer",
    kind: "monthly",
    monthly: 17500,
    color: colors[1],
    icon: "coffee",
    goal: 0,
    goalName: "",
  },
  {
    name: "Viagens",
    kind: "saving",
    monthly: 15000,
    color: colors[2],
    icon: "plane",
    goal: 0,
    goalName: "",
  },
  {
    name: "Investimentos",
    kind: "saving",
    monthly: 17500,
    color: colors[3],
    icon: "trending",
    goal: 0,
    goalName: "",
  },
  {
    name: "Emergência",
    kind: "saving",
    monthly: 20000,
    color: colors[4],
    icon: "shield",
    goal: 200000,
    goalName: "Fundo de emergência",
  },
  {
    name: "Equipamento",
    kind: "saving",
    monthly: 25000,
    color: colors[5],
    icon: "camera",
    goal: 150000,
    goalName: "Nova câmara",
  },
  {
    name: "Casa",
    kind: "monthly",
    monthly: 0,
    color: colors[0],
    icon: "home",
    goal: 0,
    goalName: "",
  },
  {
    name: "Alimentação",
    kind: "monthly",
    monthly: 0,
    color: colors[3],
    icon: "food",
    goal: 0,
    goalName: "",
  },
  {
    name: "Transporte",
    kind: "monthly",
    monthly: 0,
    color: colors[2],
    icon: "car",
    goal: 0,
    goalName: "",
  },
  {
    name: "Outros",
    kind: "monthly",
    monthly: 0,
    color: colors[6],
    icon: "wallet",
    goal: 0,
    goalName: "",
  },
];
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function currentMonth() {
  return today().slice(0, 7);
}
export function money(n: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    useGrouping: "always",
    maximumFractionDigits: n % 100 === 0 ? 0 : 2,
  }).format(n / 100);
}
export function cents(s: string) {
  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(s.trim()))
    throw new Error("Indica um valor válido, com até duas casas decimais.");
  return Math.round(Number(s.replace(",", ".")) * 100);
}
export function monthName(m: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    year: "numeric",
  }).format(new Date(m + "-15T12:00:00"));
}
export function balance(s: LedgerState, c: Category, m: string) {
  let total = 0;
  for (const [key, month] of Object.entries(s.months))
    if (key <= m && (c.kind === "saving" || key === m))
      total += month.allocations[c.id] || 0;
  for (const t of s.movements)
    if (
      t.date.slice(0, 7) <= m &&
      (c.kind === "saving" || t.date.startsWith(m))
    ) {
      if (t.category === c.id)
        total +=
          t.type === "expense" || t.type === "transfer" ? -t.amount : t.amount;
      if (t.type === "transfer" && t.to === c.id) total += t.amount;
    }
  return total;
}
export function free(s: LedgerState, m: string) {
  const month = s.months[m];
  if (!month) return 0;
  return (
    month.income +
    month.carry -
    Object.values(month.allocations).reduce((a, b) => a + b, 0) -
    s.movements
      .filter((t) => t.type === "allocation" && t.date.startsWith(m))
      .reduce((a, t) => a + t.amount, 0)
  );
}
export function summary(s: LedgerState, m: string) {
  const mm = s.months[m];
  const ts = s.movements.filter((t) => t.date.startsWith(m));
  return {
    income:
      (mm?.income || 0) +
      ts.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0),
    spent: ts
      .filter((t) => t.type === "expense")
      .reduce((a, t) => a + t.amount, 0),
    available:
      s.categories.reduce((a, c) => a + balance(s, c, m), 0) + free(s, m),
    distributed:
      Object.values(mm?.allocations || {}).reduce((a, b) => a + b, 0) +
      ts
        .filter((t) => t.type === "allocation")
        .reduce((a, t) => a + t.amount, 0),
    free: free(s, m),
  };
}
function nextMonth(m: string) {
  const d = new Date(m + "-15T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 7);
}
export function rollMonths(s: LedgerState, to: string) {
  let last = Object.keys(s.months).sort().at(-1)!;
  while (last < to) {
    const m = nextMonth(last);
    const carry =
      free(s, last) +
      s.categories
        .filter((c) => c.kind === "monthly")
        .reduce((a, c) => a + balance(s, c, last), 0);
    s.months[m] = {
      income: s.income,
      carry,
      allocations: Object.fromEntries(
        s.categories.map((c) => [c.id, c.monthly]),
      ),
    };
    last = m;
  }
  return s;
}
function amount(n: unknown, zero = false) {
  if (
    typeof n !== "number" ||
    !Number.isSafeInteger(n) ||
    n < (zero ? 0 : 1) ||
    n > 100000000
  )
    throw new Error(
      "O valor deve ser entre " + (zero ? "0" : "0,01") + " € e 1.000.000 €.",
    );
  return n;
}
function text(v: unknown, max = 80) {
  if (typeof v !== "string" || v.length > max)
    throw new Error("Texto demasiado longo ou inválido.");
  return v.trim();
}
function category(raw: any, id: string): Category {
  const name = text(raw.name);
  if (!name) throw new Error("Dá um nome à categoria.");
  if (
    !["monthly", "saving"].includes(raw.kind) ||
    !colors.includes(raw.color) ||
    !icons.includes(raw.icon)
  )
    throw new Error("Categoria inválida.");
  return {
    id,
    name,
    kind: raw.kind,
    monthly: amount(raw.monthly, true),
    color: raw.color,
    icon: raw.icon,
    goal: raw.kind === "saving" ? amount(raw.goal || 0, true) : 0,
    goalName: raw.kind === "saving" ? text(raw.goalName || "") : "",
  };
}
export function setup(raw: any, m = currentMonth()): LedgerState {
  const income = amount(raw.income, true);
  if (
    !Array.isArray(raw.categories) ||
    raw.categories.length < 1 ||
    raw.categories.length > 30
  )
    throw new Error("Escolhe entre 1 e 30 categorias.");
  const categories = raw.categories.map((c: any) =>
    category(c, crypto.randomUUID()),
  );
  if (
    new Set(categories.map((c: Category) => c.name.toLowerCase())).size !==
    categories.length
  )
    throw new Error("Usa nomes diferentes para as categorias.");
  if (categories.reduce((a: number, c: Category) => a + c.monthly, 0) > income)
    throw new Error(
      "Estás a distribuir mais do que recebes. Ajusta os valores.",
    );
  return {
    income,
    categories,
    months: {
      [m]: {
        income,
        carry: 0,
        allocations: Object.fromEntries(
          categories.map((c: Category) => [c.id, c.monthly]),
        ),
      },
    },
    movements: [],
    started: m,
  };
}
export function mutate(
  original: LedgerState,
  raw: any,
  m = currentMonth(),
  day = today(),
): LedgerState {
  const s = rollMonths(structuredClone(original), m);
  const mm = s.months[m];
  if (raw.action === "movement") {
    if (!["expense", "income", "transfer", "allocation"].includes(raw.type))
      throw new Error("Tipo de movimento inválido.");
    const value = amount(raw.amount);
    const c = s.categories.find((c) => c.id === raw.category);
    if (!c) throw new Error("Escolhe uma categoria.");
    if (
      typeof raw.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) ||
      Number.isNaN(Date.parse(raw.date)) ||
      new Date(raw.date).toISOString().slice(0, 10) !== raw.date ||
      !raw.date.startsWith(m) ||
      raw.date > day
    )
      throw new Error("Escolhe uma data válida do mês atual, até hoje.");
    if (["expense", "transfer"].includes(raw.type) && value > balance(s, c, m))
      throw new Error("Este envelope não tem dinheiro suficiente.");
    if (raw.type === "allocation" && value > free(s, m))
      throw new Error("Não tens esse valor por distribuir.");
    if (
      raw.type === "transfer" &&
      (!s.categories.some((c) => c.id === raw.to) || raw.to === c.id)
    )
      throw new Error("Escolhe uma categoria de destino diferente.");
    s.movements.push({
      id: crypto.randomUUID(),
      type: raw.type,
      amount: value,
      category: c.id,
      ...(raw.type === "transfer" ? { to: raw.to } : {}),
      description: text(raw.description || "", 140),
      date: raw.date,
    });
  } else if (raw.action === "income") {
    s.income = amount(raw.income, true);
    mm.income = s.income;
  } else if (raw.action === "category") {
    const existing = s.categories.find((c) => c.id === raw.id);
    if (raw.id && !existing) throw new Error("Categoria não encontrada.");
    if (!existing && s.categories.length >= 30)
      throw new Error("Podes criar até 30 categorias.");
    const c = category(raw, existing?.id || crypto.randomUUID());
    if (existing && existing.kind !== c.kind)
      throw new Error("O tipo mantém-se para preservar o histórico.");
    if (
      s.categories.some(
        (x) => x.id !== c.id && x.name.toLowerCase() === c.name.toLowerCase(),
      )
    )
      throw new Error("Já existe uma categoria com esse nome.");
    s.categories = existing
      ? s.categories.map((x) => (x.id === c.id ? c : x))
      : [...s.categories, c];
    mm.allocations[c.id] = c.monthly;
  } else if (raw.action === "deleteMovement") {
    const t = s.movements.find((t) => t.id === raw.id);
    if (!t || !t.date.startsWith(m))
      throw new Error("Só podes corrigir movimentos do mês atual.");
    s.movements = s.movements.filter((t) => t.id !== raw.id);
  } else throw new Error("Ação inválida.");
  if (
    s.categories.reduce((a, c) => a + c.monthly, 0) > s.income &&
    ["income", "category"].includes(raw.action)
  )
    throw new Error(
      "Os valores mensais ultrapassam o rendimento habitual. Usa uma entrada de dinheiro por distribuir para valores extra.",
    );
  if (free(s, m) < 0)
    throw new Error(
      "Estás a distribuir mais dinheiro do que tens. Ajusta os valores.",
    );
  if (s.categories.some((c) => balance(s, c, m) < 0))
    throw new Error("Esta alteração deixaria um envelope com saldo negativo.");
  if (JSON.stringify(s).length > 800000)
    throw new Error("A conta atingiu o limite de histórico deste MVP.");
  return s;
}
export function demoState(): LedgerState {
  const m = currentMonth();
  const s = setup({ income: 110000, categories: suggestions.slice(0, 6) }, m);
  const by = (name: string) => s.categories.find((c) => c.name === name)!.id;
  s.months[m].carry = 0;
  // Opening balances are explicit demo income records, dated in the preceding month.
  const prev = new Date(m + "-15T12:00:00Z");
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const pm = prev.toISOString().slice(0, 7);
  s.months[pm] = { income: 0, carry: 0, allocations: {} };
  s.started = pm;
  for (const [name, value] of [
    ["Viagens", 30000],
    ["Emergência", 120000],
    ["Equipamento", 50000],
  ] as const)
    s.movements.push({
      id: crypto.randomUUID(),
      type: "income",
      amount: value,
      category: by(name),
      description: "Poupança anterior",
      date: pm + "-01",
    });
  for (const [name, value, description, day] of [
    ["Lazer", 2500, "Restaurante", 21],
    ["Despesas Mensais", 5700, "Supermercado", 20],
    ["Lazer", 1700, "Cinema", 18],
  ] as const)
    s.movements.push({
      id: crypto.randomUUID(),
      type: "expense",
      amount: value,
      category: by(name),
      description,
      date:
        m +
        "-" +
        String(Math.min(day, Number(today().slice(-2)))).padStart(2, "0"),
    });
  return s;
}
