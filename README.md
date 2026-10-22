<div align="center">

# Keynote Anything
### 万物发布会 · Ordinary things. Extraordinary entrances.

Turn a coffee machine, a desk plant, or your next product into a cinematic launch.

**Seven scenes. Your words. One file you can take anywhere.**

[Try the studio](https://dingyucanada.github.io/keynote-anything/) · [中文说明](docs/README.zh-CN.md) · [User guide](docs/GUIDE.md) · [AI setup](docs/AI.md)

![Keynote Anything studio](docs/studio.png)

</div>

> **A plant has a product roadmap. Its next update is a leaf.**
>
> A deliberately serious stage for delightfully ordinary things—and a useful storyboard tool for actual product teams.

## Make an entrance

1. Enter an object or idea. Try **coffee machine**, **hotpot**, **desk plant**, **umbrella**, or **team knowledge base**.
2. Choose a voice: **Deadpan**, **Epic**, or **Professional**. Pick **Midnight**, **Editorial**, or **Ember**.
3. Direct the story. Edit any scene, bring your own image, and go on stage.
4. Export a standalone HTML keynote, a 1080 × 1350 poster, a Markdown speaker script, or an editable JSON project.

The studio works without an account, an API key, a build step, or third-party runtime packages. The local director uses curated templates, not a hidden model. An optional AI director creates more specific copy using your own OpenAI-compatible endpoint.

[Browse 10 editable examples](examples/README.md) · [See a generated poster](docs/poster.png)

## A small creative studio

| Capability | What you get |
|---|---|
| Seven-scene story | Opening → problem → reveal → concept architecture → benefits → one more thing → close |
| Live editing | Headline, supporting text, three points, speaker notes, and scene duration |
| Story control | Reorder, duplicate, delete, undo/redo; 3–12 scenes per project |
| Stage | Keyboard navigation, timed autoplay, speaker notes, fullscreen where supported |
| Local projects | Autosave on this browser; four pre-generation snapshots; JSON import/export |
| Own artwork | PNG/JPEG/WebP upload, resized locally; embedded in exports |
| Portable output | Offline HTML with embedded art and styles; no CDN dependencies |
| Languages | Chinese and English UI and story generation, independently selectable |
| Optional AI | Server-side credentials, validated output, preserved project on errors |

## Run locally

Node.js 20.6 or later:

```sh
git clone https://github.com/dingyucanada/keynote-anything.git
cd keynote-anything
npm start
```

Open **http://127.0.0.1:4317**. No `npm install` is required.

```sh
npm test     # unit, export, and local HTTP integration tests
npm run build # self-contained static site in dist/
```

Serve `dist/` on any static host for local-director mode. Use an HTTP server to open the studio; opening `index.html` with `file://` blocks ES modules in some browsers. **Exported keynotes** are single HTML files and do work without a server.

## What this is good for

- **Teams:** open a workshop with a one-minute launch of a mundane object.
- **Founders and PMs:** rehearse a product story before investing in a deck.
- **Developer advocates:** turn a feature or demo into a short narrative.
- **Creators:** make a deadpan product launch and a shareable poster.
- **Educators:** teach the difference between a list of features and a story.

## Honest boundaries

- Local mode includes five curated subject families plus a generic fallback. It does not research arbitrary topics. Add your own facts and edit the story, or connect the optional AI director.
- No invented benchmark scores, endorsements, or specifications are added by local mode. Supplied claims remain labeled as unverified input. AI output still needs human review.
- Output is a web presentation, **not PPTX or video**. The HTML player includes browser print-to-PDF; print output depends on browser settings.
- No voice cloning, impersonation, cloud accounts, analytics, or automatic public uploads.
- Browser storage is not a permanent backup. Export project JSON for anything important.
- This is an independent creative project, not an NVIDIA product or an official announcement from any brand. The fictional coffee-machine illustration was generated specifically for this project. No keynote PDFs or corporate assets are redistributed.

## Build with us

The app is intentionally small: native browser modules, CSS, and an optional Node HTTP server. See [architecture](docs/ARCHITECTURE.md), [testing](docs/TESTING.md), and [contributing](CONTRIBUTING.md). Good first contributions: a new original subject pack, better typography for another language, or a tested export improvement.

**License:** MIT for source and project-authored assets. See [asset provenance](docs/ASSETS.md).
