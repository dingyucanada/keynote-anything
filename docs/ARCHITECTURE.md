# Architecture

Zero runtime dependencies. Native ES modules in the browser, optional Node HTTP adapter.

| File | Responsibility |
|---|---|
| `src/director.js` | Brief normalization, curated story packs, project schema, AI output validation |
| `src/stage.js` | Escaped semantic markup for seven scene compositions |
| `src/stage.css` | 1280 × 720 stage, theme tokens, responsive scaling and motion |
| `src/app.js` | Studio state, history, autosave, editor, player and exports |
| `src/app.css` | Responsive studio shell and dialogs |
| `src/export.js` | Offline HTML, inline art, text fitting, safe script serialization |
| `scripts/server.mjs` | Static allowlist and optional same-origin AI adapter |
| `scripts/build.mjs` | Copy public files to `dist/` |

## Data model

Project version `0.1.0`: title, normalized brief, theme, image/art, engine, and 3–12 scenes. A scene has a unique ID, one of seven known types, kicker, title, body, up to three items, speaker notes, and 4–25 integer seconds. Fields are bounded; imported projects are validated before replacing current state. User text is escaped before HTML rendering; notes are safely serialized into exported scripts. Custom images must be bounded PNG/JPEG/WebP data URLs.

The editor snapshots an entire project for each operation, retaining 25 undo states in memory. Autosave writes the current project; pre-generation archives retain four snapshots. These choices favor a small comprehensible app over a database or collaboration service. Large images can exhaust browser quota; export JSON is the portable backup.

## Adding a subject family

Add a matching category, an example, and Chinese/English profile text in `director.js`. Provide hooks, problem, architecture items, intended benefits, a twist and closing. Do not insert unverifiable performance numbers. Extend the example matrix tests and inspect every scene in the browser.

## Accessibility

Labeled form controls, keyboard-operated stage and editor, dialog focus management, text-based semantics, reduced-motion styles, and no essential audio. This is not a formal WCAG certification. Test actual assistive-technology workflows before making accessibility compliance claims.
