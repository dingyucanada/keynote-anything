import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../scripts/server.mjs";
import { generateLocal } from "../src/director.js";
async function fixture(t, options = {}) {
  const s = createServer(options);
  await new Promise((resolve) => s.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => s.close(resolve)));
  return `http://127.0.0.1:${s.address().port}`;
}
const config = {
  apiKey: "test-secret-do-not-leak",
  baseURL: "https://provider.invalid/v1",
  model: "test-model",
};
const post = (base, body, headers = {}) =>
  fetch(base + "/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("static app available, private and unknown paths not served", async (t) => {
  const base = await fixture(t);
  assert.equal((await fetch(base + "/")).status, 200);
  assert.match(
    (await fetch(base + "/src/app.js")).headers.get("content-type"),
    /javascript/,
  );
  for (const p of [
    "/.env",
    "/.git/config",
    "/scripts/server.mjs",
    "/package.json",
    "/missing",
  ])
    assert.ok((await fetch(base + p)).status >= 400);
  assert.equal((await fetch(base + "/src/missing.js")).status, 404);
  assert.equal((await fetch(base + "/", { method: "POST" })).status, 405);
  assert.equal(await (await fetch(base + "/", { method: "HEAD" })).text(), "");
});
test("unconfigured AI is explicit and status contains no secrets", async (t) => {
  const base = await fixture(t, { apiKey: "", baseURL: "", model: "" });
  assert.deepEqual(await (await fetch(base + "/api/status")).json(), {
    available: false,
    model: null,
  });
  assert.equal((await post(base, { topic: "coffee" })).status, 503);
});
test("AI validation, same-origin policy and size limits", async (t) => {
  let calls = 0;
  const base = await fixture(t, {
    ...config,
    fetchImpl: async () => {
      calls++;
      throw Error();
    },
  });
  assert.equal(
    (await post(base, { topic: "coffee" }, { Origin: "https://evil.invalid" }))
      .status,
    403,
  );
  assert.equal(
    (await post(base, { topic: "coffee" }, { Origin: "null" })).status,
    403,
  );
  assert.equal(
    (await post(base, { topic: "coffee" }, { "Sec-Fetch-Site": "cross-site" }))
      .status,
    403,
  );
  assert.equal((await post(base, "bad json")).status, 400);
  assert.equal((await post(base, {})).status, 400);
  assert.equal((await post(base, "x".repeat(12001))).status, 413);
  assert.equal((await fetch(base + "/api/generate")).status, 405);
  assert.equal(
    (await post(base, {}, { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal(calls, 0);
});
test("AI success uses server-only credentials and returns validated deck", async (t) => {
  let request;
  const base = await fixture(t, {
    ...config,
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify(
                generateLocal({ topic: "coffee", language: "en" }),
              ),
            },
          },
        ],
      });
    },
  });
  const r = await post(
    base,
    { topic: "coffee", language: "en" },
    { Origin: base },
  );
  assert.equal(r.status, 200);
  const result = await r.json();
  assert.equal(result.deck.engine, "ai");
  assert.equal(result.deck.slides.length, 7);
  assert.equal(request.url, "https://provider.invalid/v1/chat/completions");
  assert.equal(request.init.headers.Authorization, "Bearer " + config.apiKey);
  assert.doesNotMatch(JSON.stringify(result), /test-secret/);
  assert.doesNotMatch(
    await (await fetch(base + "/api/status")).text(),
    /test-secret/,
  );
});
for (const [name, mock] of [
  [
    "provider rejection",
    async () => new Response("private provider detail", { status: 401 }),
  ],
  ["invalid JSON", async () => new Response("broken")],
  [
    "wrong scene shape",
    async () => Response.json({ choices: [{ message: { content: "{}" } }] }),
  ],
  ["oversized response", async () => new Response("x".repeat(150001))],
  [
    "timeout",
    async () => {
      const e = new Error("test-secret");
      e.name = "TimeoutError";
      throw e;
    },
  ],
])
  test(`AI handles ${name} without leaking provider content`, async (t) => {
    const base = await fixture(t, { ...config, fetchImpl: mock });
    const r = await post(base, { topic: "coffee" });
    assert.equal(r.status, 502);
    assert.doesNotMatch(await r.text(), /test-secret|private provider detail/);
  });
test("nonlocal plaintext endpoint rejected before request", async (t) => {
  const base = await fixture(t, {
    ...config,
    baseURL: "http://provider.invalid/v1",
    fetchImpl: () => assert.fail("must not call"),
  });
  assert.equal((await post(base, { topic: "coffee" })).status, 500);
});
test("concurrency limit prevents a third upstream call", async (t) => {
  const releases = [];
  const base = await fixture(t, {
    ...config,
    fetchImpl: async () =>
      new Promise((resolve) =>
        releases.push(() => resolve(new Response("no", { status: 503 }))),
      ),
  });
  const one = post(base, { topic: "coffee" }),
    two = post(base, { topic: "plant" });
  const deadline = Date.now() + 2000;
  while (releases.length < 2 && Date.now() < deadline)
    await new Promise((r) => setTimeout(r, 5));
  try {
    assert.equal(releases.length, 2);
    assert.equal((await post(base, { topic: "umbrella" })).status, 429);
  } finally {
    releases.forEach((fn) => fn());
    await Promise.all([one, two]);
  }
});
