import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("static build includes linked examples and an explicit disabled-AI status, but no private server files", async () => {
  execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: root });
  const status = JSON.parse(
    await fs.readFile(path.join(root, "dist/api/status"), "utf8"),
  );
  assert.deepEqual(status, { available: false, model: null });
  for (const p of [
    "index.html",
    "src/app.js",
    "assets/brew-core.png",
    "docs/GUIDE.md",
    "examples/coffee.en.keynote.json",
    "CONTRIBUTING.md",
  ])
    assert.ok((await fs.stat(path.join(root, "dist", p))).isFile());
  for (const p of [
    ".env",
    ".git",
    "scripts/server.mjs",
    "test/server.test.mjs",
  ])
    await assert.rejects(fs.stat(path.join(root, "dist", p)), {
      code: "ENOENT",
    });
});
