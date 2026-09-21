// Loopback-only integration check using the starter's local test account.
// Appends fixture movements, verifies persistence/concurrency and removes those exact fixtures.
import assert from "node:assert/strict";
const base = "http://localhost:5173";
const login = await fetch(base + "/signin-with-chatgpt?return_to=/", {
  redirect: "manual",
});
const cookies = login.headers
  .getSetCookie()
  .map((v) => v.split(";")[0])
  .join("; ");
assert.ok(cookies, "Local simulated sign-in must be running.");
const auth = { Cookie: cookies, "Content-Type": "application/json" };
const get = async (headers = auth) => {
  const r = await fetch(base + "/api/ledger", { headers });
  const responseBody = await r.text();
  let data = {};
  try {
    data = JSON.parse(responseBody);
  } catch {}
  return { status: r.status, ...data };
};
const post = async (body, headers = auth) => {
  const r = await fetch(base + "/api/ledger", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const responseBody = await r.text();
  let data = {};
  try {
    data = JSON.parse(responseBody);
  } catch {}
  return { status: r.status, ...data };
};
assert.equal((await get({})).status, 401);
assert.equal(
  (await post({ action: "setup" }, { "Content-Type": "application/json" }))
    .status,
  401,
);
let r = await get();
assert.equal(r.status, 200);
assert.ok(r.state?.categories.length >= 2, "Complete local onboarding first.");
for (const fixture of [...r.state.movements]
  .reverse()
  .filter((t) => t.description === "API fixture")) {
  r = await post({
    action: "deleteMovement",
    id: fixture.id,
    revision: r.revision,
  });
  assert.equal(r.status, 200);
}
const initial = r.state.movements.length;
const cat = r.state.categories[0].id,
  to = r.state.categories[1].id;
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
r = await post({
  action: "movement",
  type: "income",
  amount: 10000,
  category: cat,
  date,
  description: "API fixture",
  revision: r.revision,
});
assert.equal(r.status, 200);
const incomeId = r.state.movements.at(-1).id;
const action = {
  action: "movement",
  type: "transfer",
  amount: 100,
  category: cat,
  to,
  date,
  description: "API fixture",
  revision: r.revision,
};
const concurrent = await Promise.all([post(action), post(action)]);
assert.deepEqual(concurrent.map((x) => x.status).sort(), [200, 409]);
r = await get();
assert.equal(r.state.movements.length, initial + 2);
const transferId = r.state.movements.at(-1).id;
assert.equal(
  (await post({ ...action, revision: r.revision, amount: 100000000 })).status,
  400,
);
assert.equal(
  (
    await post(
      { ...action, revision: r.revision },
      { ...auth, Origin: "https://different.example" },
    )
  ).status,
  403,
);
r = await post({
  action: "deleteMovement",
  id: transferId,
  revision: r.revision,
});
assert.equal(r.status, 200);
r = await post({
  action: "deleteMovement",
  id: incomeId,
  revision: r.revision,
});
assert.equal(r.status, 200);
assert.equal((await get()).state.movements.length, initial);
console.log(
  "PASS: authentication, persistence, transfer atomicity, concurrency conflict, balance validation, cross-origin rejection and fixture cleanup.",
);
