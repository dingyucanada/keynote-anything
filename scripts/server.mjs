import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeBrief, aiMessages, fromAI } from "../src/director.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function createServer({
  apiKey = process.env.KEYNOTE_API_KEY,
  baseURL = process.env.KEYNOTE_API_BASE,
  model = process.env.KEYNOTE_MODEL,
  fetchImpl = fetch,
} = {}) {
  const configured = !!(apiKey && baseURL && model);
  let busy = 0;
  const json = (res, status, value) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(value));
  };
  const allowed = new Set([
    "index.html",
    "favicon.svg",
    "README.md",
    "CONTRIBUTING.md",
    "LICENSE",
  ]);
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const p = decodeURIComponent(url.pathname);
      if (p === "/api/status")
        return json(res, 200, {
          available: configured,
          model: configured ? model : null,
        });
      if (p === "/api/generate") {
        if (req.method !== "POST")
          return json(res, 405, { error: "POST required" });
        const origin = req.headers.origin;
        if (origin) {
          let same = false;
          try {
            same = new URL(origin).host === req.headers.host;
          } catch {}
          if (!same)
            return json(res, 403, {
              error: "Cross-origin requests are not accepted",
            });
        }
        if (req.headers["sec-fetch-site"] === "cross-site")
          return json(res, 403, {
            error: "Cross-site requests are not accepted",
          });
        if (!req.headers["content-type"]?.startsWith("application/json"))
          return json(res, 415, { error: "JSON required" });
        if (!configured)
          return json(res, 503, {
            error:
              "AI director is not configured. Local director is available.",
          });
        if (busy >= 2)
          return json(res, 429, {
            error: "Director is busy. Please try again.",
          });
        let bytes = 0,
          chunks = [];
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 12000)
            return json(res, 413, { error: "Brief is too large" });
          chunks.push(chunk);
        }
        let input;
        try {
          input = normalizeBrief(
            JSON.parse(Buffer.concat(chunks).toString("utf8")),
          );
        } catch (e) {
          return json(res, 400, { error: e.message });
        }
        let endpoint;
        try {
          endpoint = new URL(baseURL.replace(/\/$/, "") + "/chat/completions");
          if (
            endpoint.protocol !== "https:" &&
            !(
              endpoint.protocol === "http:" &&
              ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)
            )
          )
            throw new Error();
        } catch {
          return json(res, 500, {
            error: "Server endpoint must use HTTPS or loopback HTTP.",
          });
        }
        if (busy >= 2)
          return json(res, 429, {
            error: "Director is busy. Please try again.",
          });
        busy++;
        try {
          const upstream = await fetchImpl(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + apiKey,
            },
            body: JSON.stringify({
              model,
              messages: aiMessages(input),
              temperature: 0.8,
              max_tokens: 3600,
              stream: false,
            }),
            signal: AbortSignal.timeout(60000),
          });
          if (!upstream.ok)
            return json(res, 502, {
              error: `Model provider returned HTTP ${upstream.status}. Check server configuration.`,
            });
          const reader = upstream.body.getReader();
          let size = 0,
            parts = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 150000) {
              await reader.cancel();
              throw new Error("Provider response too large");
            }
            parts.push(value);
          }
          const result = JSON.parse(Buffer.concat(parts).toString());
          const deck = fromAI(result.choices?.[0]?.message?.content, input);
          return json(res, 200, { deck });
        } catch (e) {
          return json(res, 502, {
            error:
              e.name === "TimeoutError"
                ? "AI request timed out. Try again or use the local director."
                : "AI response could not be validated. Your current project has been preserved.",
          });
        } finally {
          busy--;
        }
      }
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        return res.end("Method not allowed");
      }
      const relative = p === "/" ? "index.html" : p.replace(/^\//, "");
      if (
        relative.split("/").some((s) => s === ".." || s.startsWith(".")) ||
        !(
          allowed.has(relative) ||
          ["src/", "assets/", "docs/", "examples/"].some((prefix) =>
            relative.startsWith(prefix),
          )
        )
      ) {
        res.writeHead(403);
        return res.end("Forbidden");
      }
      const target = path.resolve(root, relative);
      if (!target.startsWith(root + path.sep)) {
        res.writeHead(403);
        return res.end("Forbidden");
      }
      const file = await fs.readFile(target);
      const mime = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".md": "text/plain; charset=utf-8",
        ".json": "application/json; charset=utf-8",
      };
      res.writeHead(200, {
        "Content-Type":
          mime[path.extname(target)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : file);
    } catch {
      if (!res.headersSent) {
        res.writeHead(404);
        res.end("Not found");
      } else res.end();
    }
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4317);
  createServer().listen(port, "127.0.0.1", () =>
    console.log(
      `Keynote Anything → http://127.0.0.1:${port}\nAI director: ${process.env.KEYNOTE_API_KEY && process.env.KEYNOTE_API_BASE && process.env.KEYNOTE_MODEL ? "configured" : "optional / not configured"}`,
    ),
  );
}
