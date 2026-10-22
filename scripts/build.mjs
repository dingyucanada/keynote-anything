import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  out = path.join(root, "dist");
await fs.mkdir(out, { recursive: true });
for (const file of [
  "index.html",
  "favicon.svg",
  "src",
  "assets",
  "docs",
  "README.md",
  "LICENSE",
])
  await fs.cp(path.join(root, file), path.join(out, file), { recursive: true });
console.log(
  "Built dist/. Local director runs on any static host. AI director requires the optional Node server.",
);
