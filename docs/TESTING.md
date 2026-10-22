# Verification record

Release candidate 0.1.0 · 2026-10-22

## Automated

`npm test`: **29 passing tests**, including 108 local generation combinations (six subjects × two languages × three tones × three themes).

Covered: complete seven-scene stories; user-fact provenance; brief bounds; distinct openings; JSON round-trip; malformed/oversized/unsafe projects; duplicate scene IDs; duration bounds; HTML escaping; safe script serialization; embedded export art; export script syntax; speaker scripts; AI response structure and required items; static path restrictions; server-only credentials; request/response bounds; same-origin checks; provider failure/timeout handling; concurrent request limit; static build contents and disabled-AI status.

`npm run build`: static site generated successfully. CI runs these on Node 20, 22 and 24.

## Browser checks performed

In the Chromium-based in-app browser:

- Generated coffee, hotpot and desk-plant stories; checked Chinese and English.
- Edited headline and body; verified undo, redo and content after reload.
- Duplicated, moved and deleted scenes.
- Played the complete timed story through its end; checked keyboard Home/End/arrows, notes, restart from the last scene and exit.
- Downloaded HTML, JSON, Markdown and PNG. Confirmed HTML contains seven scenes, embedded image data and no external image references. Confirmed the PNG is 1080 × 1350.
- Reimported the actual downloaded JSON and verified the success state.
- Uploaded the project's own PNG, verified the image update, then removed it.
- Inspected a long Chinese architecture headline and multiline items; adjusted the scene's reserved space to keep the diagram clear.
- Checked desktop and 390-pixel mobile layout; fixed mobile header wrapping. Recorded real screenshots in this directory.
- Checked the browser's error log: no app errors reported during these flows.

## Limits, stated explicitly

- AI integration is tested with simulated provider responses. No paid live endpoint was configured or called.
- Exported HTML was downloaded, inspected for self-containment, and its JavaScript syntax validated. The automation browser rejects `file://` navigation, so opening that downloaded file offline and native print-to-PDF remain manual checks.
- No claim of Safari/Firefox compatibility certification, formal accessibility conformance, or multi-user backend hardening.

## Reproduce the manual release check

1. `npm start`, open localhost, generate a new subject.
2. Edit each scene type, including a long headline; inspect all three themes.
3. Reload and confirm the content persists. Export JSON, change the project, import the JSON.
4. Upload an image and export HTML and PNG. Disconnect the network and open the exported HTML in a normal browser; navigate all seven scenes and show notes.
5. Print from the exported player to PDF with backgrounds enabled and headers/footers disabled; inspect page count and margins.
6. Use 390-pixel viewport, keyboard navigation and reduced-motion preference.
7. If deploying an AI-enabled version, run a real request with that provider and check failure behavior before relying on it.
