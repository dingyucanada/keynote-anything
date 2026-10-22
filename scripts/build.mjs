import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
// dist/ is exclusively generated output; rebuild the public-file allowlist.
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
for (const file of [
  "index.html",
  "favicon.svg",
  "src",
  "assets",
  "docs",
  "examples",
  "README.md",
  "CONTRIBUTING.md",
  "LICENSE",
])
  await fs.cp(path.join(root, file), path.join(out, file), { recursive: true });
// Static hosts expose local mode without a noisy, expected API 404.
await fs.mkdir(path.join(out, "api"), { recursive: true });
await fs.writeFile(
  path.join(out, "api", "status"),
  JSON.stringify({ available: false, model: null }),
);
await fs.writeFile(path.join(out, ".nojekyll"), "");
console.log(
  "Built dist/. Local director runs on any static host. AI director requires the optional Node server.",
);
