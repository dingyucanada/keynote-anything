export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const e = escapeHTML;
const lines = (s) => e(s).replace(/\n/g, "<br>");
export function artHTML(deck) {
  if (deck.image)
    return `<img class="product-photo" src="${e(deck.image)}" alt="${e(deck.title)}">`;
  if (deck.art === "builtin:coffee")
    return '<img class="product-photo builtin-photo" src="./assets/brew-core.png" alt="Fictional coffee machine concept">';
  return `<div class="sculpture" aria-hidden="true"><div class="sculpture-orbit orbit-a"></div><div class="sculpture-orbit orbit-b"></div><div class="sculpture-core"></div><div class="sculpture-ring"></div></div>`;
}
export function slideHTML(deck, slide, index, { mini = false } = {}) {
  const zh = deck.brief.language === "zh",
    titleSize =
      slide.title.length > 65
        ? "title-compact"
        : slide.title.length > 42
          ? "title-medium"
          : "";
  const top = `<div class="slide-meta"><span>${e(deck.title)}</span><span>${zh ? "创意演绎 / CONCEPT" : "CREATIVE CONCEPT"}</span></div>`;
  let content = "";
  if (slide.type === "hook")
    content = `<div class="hook-orbit" aria-hidden="true"></div><div class="scene-copy"><p class="slide-kicker">${e(slide.kicker)}</p><h1 class="${titleSize}">${lines(slide.title)}</h1><p class="slide-body">${e(slide.body)}</p></div><div class="opening-line" aria-hidden="true"></div>`;
  if (slide.type === "problem")
    content = `<div class="problem-index" aria-hidden="true">?</div><div class="scene-copy"><p class="slide-kicker">${e(slide.kicker)}</p><h1 class="${titleSize}">${lines(slide.title)}</h1><p class="slide-body">${e(slide.body)}</p></div><div class="problem-caption">${zh ? "一个值得重新思考的日常" : "AN EVERYDAY THING, RECONSIDERED"}</div>`;
  if (slide.type === "reveal")
    content = `<div class="reveal-glow" aria-hidden="true"></div><div class="reveal-art">${artHTML(deck)}</div><div class="reveal-copy"><p class="slide-kicker">${e(slide.kicker)}</p><h1 class="${titleSize}">${lines(slide.title)}</h1><p class="slide-body">${e(slide.body)}</p></div>`;
  if (slide.type === "architecture")
    content = `<div class="scene-copy"><p class="slide-kicker">${e(slide.kicker)}</p><h1 class="${titleSize}">${lines(slide.title)}</h1></div><div class="architecture-flow">${slide.items.map((s, i) => `<div class="architecture-node"><span class="node-number">0${i + 1}</span><div class="node-visual node-${i}"><i></i><i></i><i></i><i></i></div><h2>${e(s)}</h2></div>${i < slide.items.length - 1 ? '<span class="flow-arrow">→</span>' : ""}`).join("")}</div><p class="architecture-caption">${e(slide.body)}</p>`;
  if (slide.type === "benefits")
    content = `<div class="scene-copy"><p class="slide-kicker">${e(slide.kicker)}</p><h1 class="${titleSize}">${lines(slide.title)}</h1></div><div class="benefit-list">${slide.items.map((s, i) => `<div class="benefit-item"><span>0${i + 1}</span><h2>${e(s)}</h2></div>`).join("")}</div><p class="benefit-caption">${e(slide.body)}</p>`;
  if (slide.type === "twist")
    content = `<div class="twist-star" aria-hidden="true">✳</div><div class="scene-copy"><p class="slide-kicker">${e(slide.kicker)}</p><h1 class="${titleSize}">${lines(slide.title)}</h1><p class="slide-body">${e(slide.body)}</p></div>`;
  if (slide.type === "closing")
    content = `<div class="closing-frame" aria-hidden="true"></div><div class="scene-copy"><p class="slide-kicker">${e(slide.kicker)}</p><h1 class="${titleSize}">${lines(slide.title)}</h1><p class="slide-body">${e(slide.body)}</p><span class="closing-mark">K<span>↗</span></span></div>`;
  return `<section class="keynote-slide scene-${slide.type} theme-${deck.theme} ${mini ? "mini" : ""}" aria-label="${e(slide.title.replace(/\n/g, " "))}" lang="${zh ? "zh-CN" : "en"}">${top}${content}<div class="slide-footer"><span>KEYNOTE ANYTHING</span><span>${String(index + 1).padStart(2, "0")} / ${String(deck.slides.length).padStart(2, "0")}</span></div></section>`;
}
