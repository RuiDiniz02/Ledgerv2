import { test } from "node:test";
import assert from "node:assert/strict";
import {
  setup,
  mutate,
  balance,
  free,
  summary,
  rollMonths,
  cents,
  suggestions,
} from "../lib/ledger.ts";
const M = "2026-09",
  DAY = "2026-09-21";
const initial = () =>
  setup({ income: 110000, categories: suggestions.slice(0, 6) }, M);
const move = (s: any, raw: any) =>
  mutate(
    s,
    { action: "movement", date: DAY, description: "Teste", ...raw },
    M,
    DAY,
  );
test("distribuição inicial soma exatamente ao rendimento", () => {
  const s = initial();
  assert.equal(free(s, M), 0);
  assert.equal(summary(s, M).available, 110000);
});
test("despesa reduz saldo e conta como gasto", () => {
  const s = initial(),
    c = s.categories[1];
  const n = move(s, { type: "expense", category: c.id, amount: 2500 });
  assert.equal(balance(n, c, M), 15000);
  assert.equal(summary(n, M).spent, 2500);
  assert.equal(balance(s, c, M), 17500);
});
test("transferência preserva total e não altera rendimento nem gasto", () => {
  const s = initial(),
    a = s.categories[2],
    b = s.categories[1];
  const n = move(s, {
    type: "transfer",
    category: a.id,
    to: b.id,
    amount: 5000,
  });
  assert.equal(balance(n, a, M), 10000);
  assert.equal(balance(n, b, M), 22500);
  assert.equal(summary(n, M).available, summary(s, M).available);
  assert.equal(summary(n, M).spent, 0);
  assert.equal(summary(n, M).income, 110000);
});
test("rejeita valores inválidos, saldo insuficiente, destino próprio e categoria inexistente", () => {
  const s = initial(),
    c = s.categories[0];
  for (const amount of [-1, 0, 0.2, Infinity, NaN, 100000001])
    assert.throws(() => move(s, { type: "expense", category: c.id, amount }));
  assert.throws(() =>
    move(s, { type: "expense", category: c.id, amount: 15001 }),
  );
  assert.throws(() =>
    move(s, { type: "transfer", category: c.id, to: c.id, amount: 100 }),
  );
  assert.throws(() =>
    move(s, { type: "income", category: "inexistente", amount: 100 }),
  );
});
test("entrada aumenta total e rendimento", () => {
  const s = initial();
  const n = move(s, {
    type: "income",
    category: s.categories[0].id,
    amount: 9000,
  });
  assert.equal(summary(n, M).available, 119000);
  assert.equal(summary(n, M).income, 119000);
});
test("distribuição usa dinheiro livre sem contar rendimento duas vezes", () => {
  const s = setup({ income: 120000, categories: suggestions.slice(0, 6) }, M);
  const n = move(s, {
    type: "allocation",
    category: s.categories[0].id,
    amount: 5000,
  });
  assert.equal(free(n, M), 5000);
  assert.equal(summary(n, M).income, 120000);
  assert.equal(summary(n, M).available, 120000);
  assert.throws(() =>
    move(n, { type: "allocation", category: s.categories[0].id, amount: 5001 }),
  );
});
test("renovação mensal preserva dinheiro, mantém acumulativas e liberta sobras", () => {
  const s = initial();
  const n = move(s, {
    type: "expense",
    category: s.categories[1].id,
    amount: 2500,
  });
  rollMonths(n, "2026-10");
  assert.equal(balance(n, n.categories[1], "2026-10"), 17500);
  assert.equal(balance(n, n.categories[2], "2026-10"), 30000);
  assert.equal(free(n, "2026-10"), 30000);
  assert.equal(summary(n, "2026-10").available, 217500);
  const before = JSON.stringify(n);
  rollMonths(n, "2026-10");
  assert.equal(JSON.stringify(n), before);
  rollMonths(n, "2026-12");
  assert.equal(summary(n, "2026-12").available, 437500);
});
test("histórico fechado e datas futuras/inválidas são rejeitados", () => {
  const s = initial();
  for (const date of ["2026-08-21", "2026-09-31", "2026-09-22", "not-a-date"])
    assert.throws(() =>
      move(s, {
        type: "expense",
        category: s.categories[0].id,
        amount: 100,
        date,
      }),
    );
});
test("eliminar movimento não pode criar saldo negativo", () => {
  const s = initial(),
    c = s.categories[0];
  const n = move(s, { type: "income", category: c.id, amount: 20000 });
  const p = move(n, { type: "expense", category: c.id, amount: 30000 });
  assert.throws(() =>
    mutate(p, { action: "deleteMovement", id: n.movements[0].id }, M, DAY),
  );
  const r = mutate(
    p,
    { action: "deleteMovement", id: p.movements[1].id },
    M,
    DAY,
  );
  assert.equal(balance(r, c, M), 35000);
});
test("valores monetários aceitam vírgula e rejeitam precisão inválida", () => {
  assert.equal(cents("25,35"), 2535);
  assert.equal(cents("0.01"), 1);
  for (const v of ["-1", "1.001", "abc", "", "1e3"])
    assert.throws(() => cents(v));
});
test("orçamento não pode gastar rendimento inexistente nem reinterpretar categoria", () => {
  const s = initial();
  assert.throws(() => mutate(s, { action: "income", income: 1000 }, M, DAY));
  assert.throws(() =>
    mutate(
      s,
      { action: "category", ...s.categories[0], kind: "saving" },
      M,
      DAY,
    ),
  );
  assert.throws(() =>
    setup({ income: 100, categories: suggestions.slice(0, 2) }, M),
  );
});
