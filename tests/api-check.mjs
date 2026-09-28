// Optional real-account smoke test. Use a dedicated test account, never a personal account.
// Secrets are supplied via environment variables and are never printed.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const base = process.env.LEDGER_TEST_BASE_URL || "http://localhost:5173";
const anonymous = await fetch(base + "/api/ledger");
assert.equal(anonymous.status, 401);
const invalid = await fetch(base + "/api/ledger", {
  headers: { Authorization: "Bearer invalid-test-token" },
});
assert.equal(invalid.status, 401);
console.log("PASS: anonymous and invalid-token requests rejected.");
if (!process.env.LEDGER_TEST_EMAIL || !process.env.LEDGER_TEST_PASSWORD) {
  console.log(
    "Authenticated smoke test not run: set LEDGER_TEST_EMAIL and LEDGER_TEST_PASSWORD for a dedicated confirmed test account.",
  );
  process.exit(0);
}
const client = createClient(
  "https://aplqlcbbgxnqeqvurpuf.supabase.co",
  "sb_publishable_CfHKQ_BM7lIMiKLlcSDJow_CFiAL57S",
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const { data, error } = await client.auth.signInWithPassword({
  email: process.env.LEDGER_TEST_EMAIL,
  password: process.env.LEDGER_TEST_PASSWORD,
});
assert.ifError(error);
const headers = {
  Authorization: `Bearer ${data.session.access_token}`,
  "Content-Type": "application/json",
};
const get = async () => {
  const r = await fetch(base + "/api/ledger", { headers });
  assert.equal(r.status, 200);
  return r.json();
};
const post = async (body) => {
  const r = await fetch(base + "/api/ledger", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: r.status, ...(await r.json()) };
};
let r = await get();
assert.ok(
  r.state?.categories.length >= 2,
  "Complete onboarding in the dedicated test account first.",
);
const category = r.state.categories[0].id,
  to = r.state.categories[1].id,
  description = "Smoke test " + crypto.randomUUID(),
  initial = r.state.movements.length;
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
try {
  r = await post({
    action: "movement",
    type: "income",
    amount: 100,
    category,
    date,
    description,
    revision: r.revision,
  });
  assert.equal(r.status, 200);
  const action = {
    action: "movement",
    type: "transfer",
    amount: 50,
    category,
    to,
    date,
    description,
    revision: r.revision,
  };
  const simultaneous = await Promise.all([post(action), post(action)]);
  assert.deepEqual(simultaneous.map((x) => x.status).sort(), [200, 409]);
  r = await get();
  assert.equal(r.state.movements.length, initial + 2);
  console.log(
    "PASS: login, persistent records, atomic transfer and concurrent-write protection.",
  );
} finally {
  r = await get();
  for (const t of [...r.state.movements]
    .reverse()
    .filter((t) => t.description === description)) {
    r = await post({
      action: "deleteMovement",
      id: t.id,
      revision: r.revision,
    });
    assert.equal(r.status, 200);
  }
  await client.auth.signOut();
}
