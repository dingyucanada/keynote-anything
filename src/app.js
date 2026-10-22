import {
  EXAMPLES,
  generateLocal,
  normalizeBrief,
  validateDeck,
  parseProject,
  toMarkdown,
  VERSION,
} from "./director.js";
import { slideHTML, escapeHTML } from "./stage.js";
import { fitText, makeHTML, inlineArtwork, filename } from "./export.js";
const $ = (s) => document.querySelector(s),
  e = escapeHTML;
const KEY = "keynote-anything.project.v1",
  LIBRARY = "keynote-anything.library.v1";
let ui = "zh",
  deck,
  selected = 2,
  briefForm = {
    topic: "咖啡机",
    name: "",
    description: "",
    facts: "",
    audience: "",
    language: "zh",
    tone: "playful",
    theme: "noir",
    variant: 0,
  },
  history = [],
  future = [],
  saved = true,
  saveError = false,
  busy = false,
  aiAvailable = false,
  engine = "local",
  notesOpen = false,
  editorOpen = false,
  playing = false,
  autoplay = false,
  presentNotes = false,
  timer = null,
  progressFrame = null,
  toastTimer,
  saveTimer,
  editSnapshot = null,
  priorFocus = null;
const t = (zh, en) => (ui === "zh" ? zh : en);
const labels = {
  hook: ["开场", "Opening"],
  problem: ["问题", "The friction"],
  reveal: ["产品揭幕", "The reveal"],
  architecture: ["概念架构", "How it works"],
  benefits: ["体验与价值", "The experience"],
  twist: ["还有一件事", "One more thing"],
  closing: ["收尾", "Closing"],
};
const label = (type) => labels[type][ui === "zh" ? 0 : 1];
try {
  ui = localStorage.getItem("keynote-anything.ui") === "en" ? "en" : "zh";
  const data = localStorage.getItem(KEY);
  if (data) {
    deck = parseProject(data);
    briefForm = { ...deck.brief };
  }
} catch {
  saveError = true;
}
if (!deck) deck = generateLocal(briefForm);
const clone = (x) => JSON.parse(JSON.stringify(x));
function toast(message, error = false) {
  const el = $("#toast");
  el.textContent = message;
  el.className = (error ? "error " : "") + "show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = ""), error ? 6000 : 3200);
}
function pushHistory(snapshot = deck) {
  history.push(clone(snapshot));
  if (history.length > 25) history.shift();
  future = [];
}
function persist() {
  saved = false;
  updateSave();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(deck));
      saved = true;
      saveError = false;
    } catch {
      saveError = true;
      saved = false;
      toast(
        t(
          "本地存储不可用，请导出项目 JSON 保存。",
          "Local storage is unavailable. Export project JSON to save.",
        ),
        true,
      );
    }
    updateSave();
  }, 250);
}
function updateSave() {
  const el = $("#save-status");
  if (el)
    el.textContent = saveError
      ? t("请导出备份", "Export a backup")
      : saved
        ? t("已保存到本机", "Saved on this device")
        : t("正在保存…", "Saving…");
}
function archiveProject() {
  try {
    let all = JSON.parse(localStorage.getItem(LIBRARY) || "[]");
    if (!Array.isArray(all)) all = [];
    all = [
      { title: deck.title, date: new Date().toISOString(), deck: clone(deck) },
      ...all,
    ].slice(0, 4);
    localStorage.setItem(LIBRARY, JSON.stringify(all));
  } catch {
    toast(
      t(
        "历史项目未保存，请及时导出备份。",
        "Project history could not be saved. Export a backup.",
      ),
      true,
    );
  }
}
function applyDeck(next, { remember = true } = {}) {
  if (remember) pushHistory();
  deck = validateDeck(next);
  briefForm = { ...deck.brief };
  selected = Math.min(selected, deck.slides.length - 1);
  persist();
  render();
}
function scaleStages() {
  document.querySelectorAll(".stage-frame").forEach((frame) => {
    const scaler = frame.querySelector(".stage-scale");
    if (scaler) {
      scaler.style.transform = `scale(${frame.clientWidth / 1280})`;
      fitText(scaler);
    }
  });
  document.querySelectorAll(".thumb-frame").forEach((frame) => {
    const scaler = frame.querySelector(".mini-scale");
    if (scaler) {
      scaler.style.transform = `scale(${frame.clientWidth / 1280})`;
      fitText(scaler);
    }
  });
}
function render() {
  document.documentElement.lang = ui === "zh" ? "zh-CN" : "en";
  const s = deck.slides[selected],
    seconds = deck.slides.reduce((sum, x) => sum + x.duration, 0);
  $("#app").innerHTML =
    `<header class="navbar"><div class="wordmark"><img src="./favicon.svg" alt="">Keynote <em>Anything</em></div><nav class="nav-tools" aria-label="${t("项目操作", "Project actions")}"><span id="save-status" class="save-state"></span><button id="language" class="ghost" aria-label="${t("切换为英文界面", "Switch interface to Chinese")}">${t("EN", "中文")}</button><button id="project-menu" class="ghost">${t("我的项目", "Projects")}</button><button id="export">${t("导出", "Export")} ↗</button><button id="present" class="primary">▶ ${t("上台", "Present")}</button></nav></header>
 <section class="intro"><div><h1>${t("平凡事物，<em>盛大登场。</em>", 'Ordinary things.<br class="sr-only"><em> Extraordinary entrances.</em>')}</h1><p>${t("从一台咖啡机，到你的下一个大点子。把它变成一场值得看的发布会。", "From a coffee machine to your next big idea. Give it a keynote worth watching.")}</p></div><div class="intro-side"><span class="star">✳</span><span>${t("每个好点子，都值得一个舞台", "EVERY IDEA DESERVES A STAGE")}</span></div></section>
 <main class="studio" id="studio"><aside class="brief" aria-label="${t("创作简报", "Creative brief")}"><div class="section-eyebrow"><span>${t("创作简报", "CREATIVE BRIEF")}</span><span>01 / INPUT</span></div>
 <div class="field"><label for="topic">${t("今天，发布什么？", "What are we launching?")}</label><textarea class="topic" id="topic" maxlength="60" rows="2">${e(briefForm.topic)}</textarea><div class="examples">${EXAMPLES.map((x) => `<button data-example="${x.id}">${e(t(x.zh, x.en))}</button>`).join("")}</div></div>
 <div class="field"><label for="product-name">${t("产品名", "Product name")}<small>${t("可选，留空交给导演", "Optional")}</small></label><input id="product-name" type="text" maxlength="32" value="${e(briefForm.name)}" placeholder="${t("比如：BREW CORE", "e.g. BREW CORE")}"></div>
 <div class="field"><div class="label">${t("这场发布会的气质", "Set the tone")}</div><div class="tone-options" role="group" aria-label="${t("语气", "Tone")}">${[
   ["playful", "一本正经", "Deadpan"],
   ["epic", "史诗登场", "Epic"],
   ["professional", "认真发布", "Professional"],
 ]
   .map(
     ([k, zh, en]) =>
       `<button data-tone="${k}" class="${briefForm.tone === k ? "active" : ""}" aria-pressed="${briefForm.tone === k}">${t(zh, en)}</button>`,
   )
   .join("")}</div></div>
 <div class="field"><div class="label">${t("舞台风格", "Choose a stage")}</div><div class="theme-options" role="group" aria-label="${t("舞台风格", "Stage theme")}">${[
   ["noir", "午夜绿", "Midnight"],
   ["paper", "纸上展览", "Editorial"],
   ["ember", "落日剧场", "Ember"],
 ]
   .map(
     ([k, zh, en]) =>
       `<button class="theme-option ${deck.theme === k ? "active" : ""}" data-theme="${k}" aria-pressed="${deck.theme === k}"><i class="${k}"></i>${t(zh, en)}</button>`,
   )
   .join("")}</div></div>
 <div class="field"><label for="content-language">${t("内容语言", "Story language")}</label><select id="content-language"><option value="zh" ${briefForm.language === "zh" ? "selected" : ""}>简体中文</option><option value="en" ${briefForm.language === "en" ? "selected" : ""}>English</option></select></div>
 <details id="more-brief"><summary>${t("补充卖点、听众与产品图", "Details, audience & product image")}</summary><div class="field"><label for="description">${t("一句话描述", "One-line description")}</label><textarea id="description" rows="3" maxlength="500" placeholder="${t("它解决什么问题？有什么特别之处？", "What does it do differently?")}">${e(briefForm.description)}</textarea></div><div class="field"><label for="audience">${t("讲给谁听", "Audience")}</label><input id="audience" type="text" maxlength="120" value="${e(briefForm.audience)}" placeholder="${t("比如：客户、团队或朋友", "Customers, teammates, friends…")}"></div><div class="field"><label for="facts">${t("你提供的卖点 / 事实", "Your features / facts")}<small>${t("每行一项", "One per line")}</small></label><textarea id="facts" rows="4" maxlength="1200" placeholder="${t("只填你有依据的信息，最多使用前三项", "Use supported information; first three items are used")}">${e(briefForm.facts)}</textarea></div><div class="image-row"><button id="upload-image">＋ ${t("上传产品图", "Upload image")}</button><button id="clear-image" ${!deck.image ? "disabled" : ""}>${t("移除", "Remove")}</button></div><div class="image-status">${deck.image ? t("已使用你的图片，仅保存在本机。", "Your image is stored on this device.") : deck.art === "builtin:coffee" ? t("当前：原创咖啡机概念图，非真实产品。", "Original fictional coffee-machine artwork.") : t("当前：抽象视觉，可换成真实产品图。", "Abstract artwork. Upload a real product image.")}</div></details>
 <div class="director-line"><span>${t("创作引擎", "Director")}</span><select id="engine" aria-label="${t("创作引擎", "Director engine")}"><option value="local" ${engine === "local" ? "selected" : ""}>${t("本地导演", "Local director")}</option><option value="ai" ${!aiAvailable ? "disabled" : ""} ${engine === "ai" ? "selected" : ""}>${t("AI 导演", "AI director")}${aiAvailable ? "" : t(" · 未配置", " · setup needed")}</option></select></div><button id="generate" class="generate primary" ${busy ? "disabled" : ""}><span>${busy ? t("导演正在创作…", "Directing…") : t("导演，开拍。", "Let’s make an entrance.")}</span><span>↗</span></button><p class="fine-print">${engine === "local" ? t("本地叙事模板，无需 API。重新生成可撤销。", "Local story templates. No API needed. Regeneration can be undone.") : t("将简报发送给你配置的模型服务，产品图不发送。", "Sends the brief to your configured model. Your image stays local.")}</p></aside>
 <section class="canvas-area" aria-label="${t("发布会预览", "Keynote preview")}"><div class="stage-top"><div class="stage-title"><strong>${String(selected + 1).padStart(2, "0")} / ${String(deck.slides.length).padStart(2, "0")}</strong><span>${label(s.type)}</span></div><div class="stage-controls"><button id="undo" ${!history.length ? "disabled" : ""} title="${t("撤销", "Undo")}">↶</button><button id="redo" ${!future.length ? "disabled" : ""} title="${t("重做", "Redo")}">↷</button><button id="toggle-notes">${t("讲者备注", "Speaker notes")}</button><button id="edit-scene">✎ ${t("编辑本幕", "Edit scene")}</button></div></div><div class="stage-frame" id="main-stage"><div class="stage-scale">${slideHTML(deck, s, selected)}</div>${busy ? `<div class="busy-overlay"><i class="loading-dot"></i><span>${t("正在编排你的故事", "Directing your story")}</span><small>${t("当前项目会保留，完成后再替换。", "Your current project stays safe until the new one is ready.")}</small></div>` : ""}</div>
 <div class="scene-nav"><div class="nav-arrows"><button id="previous" ${selected === 0 ? "disabled" : ""} aria-label="${t("上一幕", "Previous scene")}">←</button><span>${String(selected + 1).padStart(2, "0")} / ${String(deck.slides.length).padStart(2, "0")}</span><button id="next" ${selected === deck.slides.length - 1 ? "disabled" : ""} aria-label="${t("下一幕", "Next scene")}">→</button></div><div class="scene-duration">${t("总时长", "RUNTIME")} <strong>${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}</strong> · ${deck.engine === "ai" ? "AI DIRECTOR" : "LOCAL DIRECTOR"}</div></div>
 <div class="notes-panel ${notesOpen ? "open" : ""}">${e(s.notes)}</div><div class="filmstrip-label"><span>${t("故事线", "THE STORYBOARD")}</span><span>${t("点击预览 · ← → 翻幕", "Click to preview · ← → to navigate")}</span></div><div class="filmstrip">${deck.slides.map((x, i) => `<button class="thumb ${i === selected ? "active" : ""}" data-scene="${i}" aria-label="${t("第", "Scene ")}${i + 1}${t("幕：", ": ")}${label(x.type)}" aria-pressed="${i === selected}"><div class="thumb-frame" aria-hidden="true"><div class="mini-scale">${slideHTML(deck, x, i, { mini: true })}</div></div><span class="thumb-label"><b>${String(i + 1).padStart(2, "0")}</b>${label(x.type)}</span></button>`).join("")}</div><div class="under-stage"><p><strong>${t("从故事，到舞台。", "From a story to a stage.")}</strong> ${t("每一幕都可以改。上台后支持键盘翻页、自动播放和讲者备注。", "Every scene is editable. Present with keyboard controls, autoplay and speaker notes.")}</p><button id="remix">↻ ${t("换个开场", "Remix opening")}</button></div></section></main>
 <footer class="footer"><span>KEYNOTE ANYTHING · ${t("独立创意工具。非官方发布，不代表任何品牌背书。", "Independent creative tool. Not an official announcement or brand endorsement.")}</span><span><a href="./docs/GUIDE.md" target="_blank" rel="noopener">${t("使用说明", "Guide")} ↗</a> · <a href="./README.md" target="_blank" rel="noopener">${t("关于这个项目", "About the project")} ↗</a></span></footer>`;
  bind();
  scaleStages();
  updateSave();
}
function readBrief() {
  for (const [id, key] of [
    ["topic", "topic"],
    ["product-name", "name"],
    ["description", "description"],
    ["audience", "audience"],
    ["facts", "facts"],
    ["content-language", "language"],
  ]) {
    const el = $("#" + id);
    if (el) briefForm[key] = el.value;
  }
  return { ...briefForm };
}
function navigate(i) {
  readBrief();
  selected = Math.max(0, Math.min(deck.slides.length - 1, i));
  if (playing) renderPresentation();
  else {
    render();
    const film = $(".filmstrip"),
      thumb = $(`[data-scene="${selected}"]`);
    if (film && thumb) {
      const x = thumb.offsetLeft - film.offsetLeft;
      if (
        x < film.scrollLeft ||
        x + thumb.offsetWidth > film.scrollLeft + film.clientWidth
      )
        film.scrollTo({ left: Math.max(0, x - 30), behavior: "smooth" });
    }
  }
}
async function generate() {
  if (busy) return;
  let b;
  try {
    b = normalizeBrief(readBrief());
  } catch (err) {
    toast(err.message, true);
    $("#topic").focus();
    return;
  }
  busy = true;
  render();
  try {
    let next;
    if (engine === "ai") {
      const response = await fetch("./api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
        signal: AbortSignal.timeout(65000),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(
          t(
            "AI 服务不可用，请使用本地导演。",
            "AI service unavailable. Use the local director.",
          ),
        );
      }
      if (!response.ok) throw new Error(result.error || "AI request failed");
      next = validateDeck(result.deck);
    } else next = generateLocal(b);
    // Keep an explicitly uploaded image, but never carry a built-in coffee image to another topic.
    if (deck.image) next.image = deck.image;
    archiveProject();
    pushHistory();
    deck = next;
    briefForm = { ...deck.brief };
    selected = 0;
    persist();
    toast(
      t("故事已就位。轮到它登场了。", "Your story is ready for its entrance."),
    );
  } catch (err) {
    toast(
      err.name === "TimeoutError"
        ? t(
            "AI 请求超时，当前项目未改变。",
            "AI timed out. Your current project is unchanged.",
          )
        : err.message,
      true,
    );
  } finally {
    busy = false;
    render();
  }
}
function undo() {
  if (!history.length) return;
  future.push(clone(deck));
  deck = history.pop();
  briefForm = { ...deck.brief };
  selected = Math.min(selected, deck.slides.length - 1);
  persist();
  render();
}
function redo() {
  if (!future.length) return;
  history.push(clone(deck));
  deck = future.pop();
  briefForm = { ...deck.brief };
  selected = Math.min(selected, deck.slides.length - 1);
  persist();
  render();
}
function bind() {
  $("#language").onclick = () => {
    readBrief();
    ui = ui === "zh" ? "en" : "zh";
    try {
      localStorage.setItem("keynote-anything.ui", ui);
    } catch {}
    render();
  };
  for (const id of [
    "topic",
    "product-name",
    "description",
    "audience",
    "facts",
    "content-language",
  ])
    $("#" + id).oninput = readBrief;
  document.querySelectorAll("[data-example]").forEach(
    (el) =>
      (el.onclick = () => {
        readBrief();
        const x = EXAMPLES.find((x) => x.id === el.dataset.example);
        briefForm = {
          ...briefForm,
          topic: briefForm.language === "zh" ? x.zh : x.en,
          name: "",
          description: "",
          facts: "",
          variant: 0,
        };
        render();
      }),
  );
  document.querySelectorAll("[data-tone]").forEach(
    (el) =>
      (el.onclick = () => {
        readBrief();
        briefForm.tone = el.dataset.tone;
        render();
      }),
  );
  document.querySelectorAll("[data-theme]").forEach(
    (el) =>
      (el.onclick = () => {
        readBrief();
        pushHistory();
        deck.theme = el.dataset.theme;
        deck.brief.theme = el.dataset.theme;
        briefForm.theme = el.dataset.theme;
        persist();
        render();
      }),
  );
  $("#engine").onchange = (el) => {
    readBrief();
    engine = el.target.value;
    render();
  };
  $("#generate").onclick = generate;
  document
    .querySelectorAll("[data-scene]")
    .forEach((el) => (el.onclick = () => navigate(Number(el.dataset.scene))));
  $("#previous").onclick = () => navigate(selected - 1);
  $("#next").onclick = () => navigate(selected + 1);
  $("#undo").onclick = undo;
  $("#redo").onclick = redo;
  $("#toggle-notes").onclick = () => {
    readBrief();
    notesOpen = !notesOpen;
    render();
  };
  $("#edit-scene").onclick = openEditor;
  $("#present").onclick = startPresentation;
  $("#export").onclick = openExport;
  $("#project-menu").onclick = openLibrary;
  $("#remix").onclick = () => {
    readBrief();
    pushHistory();
    const draft = generateLocal({
      ...deck.brief,
      variant: deck.brief.variant + 1,
    });
    deck.slides[0] = draft.slides[0];
    deck.brief.variant = draft.brief.variant;
    briefForm.variant = deck.brief.variant;
    selected = 0;
    persist();
    render();
    toast(
      t(
        "换了一个开场，其他内容保持原样。",
        "A fresh opening. The rest of your story is unchanged.",
      ),
    );
  };
  $("#upload-image").onclick = () => $("#image-file").click();
  $("#clear-image").onclick = () => {
    readBrief();
    pushHistory();
    deck.image = "";
    persist();
    render();
  };
}
function openEditor() {
  readBrief();
  editorOpen = true;
  editSnapshot = clone(deck);
  priorFocus = document.activeElement;
  const s = deck.slides[selected];
  $("#modal-root").innerHTML =
    `<div class="editor-backdrop" id="editor-backdrop"><section class="editor" role="dialog" aria-modal="true" aria-labelledby="editor-heading"><div class="editor-head"><h2 id="editor-heading">${t("编辑第", "Edit scene ")} ${selected + 1} ${t("幕", "")}</h2><button id="close-editor" class="ghost" aria-label="${t("关闭编辑器", "Close editor")}">✕</button></div>
 <div class="field"><label for="edit-kicker">${t("引导语", "Eyebrow")}<small>100</small></label><input id="edit-kicker" type="text" maxlength="100" value="${e(s.kicker)}"></div><div class="field"><label for="edit-title">${t("主标题", "Headline")}<small>${t("换行决定节奏", "Line breaks set the rhythm")}</small></label><textarea class="editor-title" id="edit-title" rows="3" maxlength="100">${e(s.title)}</textarea></div><div class="field"><label for="edit-body">${t("辅助文案", "Supporting copy")}<small>300</small></label><textarea id="edit-body" rows="3" maxlength="300">${e(s.body)}</textarea></div>
 ${["architecture", "benefits"].includes(s.type) ? `<div class="field"><label for="edit-items">${t("三个要点，每行一个", "Three items, one per line")}</label><textarea id="edit-items" rows="4" maxlength="302">${e(s.items.join("\n"))}</textarea></div>` : ""}
 <div class="field"><label for="edit-notes">${t("讲者备注", "Speaker notes")}</label><textarea id="edit-notes" rows="5" maxlength="1600">${e(s.notes)}</textarea></div><div class="field"><label for="edit-duration">${t("播放时长（秒）", "Duration (seconds)")}</label><input id="edit-duration" type="range" min="4" max="25" value="${s.duration}"><span id="duration-label" class="editor-note">${s.duration}s</span></div>
 <p class="editor-note">${t("修改会实时预览并自动保存。标题不能为空。", "Changes preview live and save automatically. A headline is required.")}</p><div class="editor-tools"><button id="move-left" ${selected === 0 ? "disabled" : ""}>← ${t("前移", "Earlier")}</button><button id="move-right" ${selected === deck.slides.length - 1 ? "disabled" : ""}>${t("后移", "Later")} →</button><button id="duplicate" ${deck.slides.length >= 12 ? "disabled" : ""}>${t("复制", "Duplicate")}</button><button id="delete-scene" class="danger" ${deck.slides.length <= 3 ? "disabled" : ""}>${t("删除", "Delete")}</button></div></section></div>`;
  const edit = () => {
    const title = $("#edit-title").value.trim();
    if (!title) {
      $("#edit-title").setAttribute("aria-invalid", "true");
      return;
    }
    $("#edit-title").removeAttribute("aria-invalid");
    s.title = title;
    s.kicker = $("#edit-kicker").value;
    s.body = $("#edit-body").value;
    s.notes = $("#edit-notes").value;
    s.duration = Number($("#edit-duration").value);
    if ($("#edit-items"))
      s.items = $("#edit-items")
        .value.split("\n")
        .map((x) => x.trim().slice(0, 100))
        .filter(Boolean)
        .slice(0, 3);
    $("#duration-label").textContent = s.duration + "s";
    const preview = $("#main-stage .stage-scale");
    preview.innerHTML = slideHTML(deck, s, selected);
    scaleStages();
    persist();
  };
  [
    "edit-title",
    "edit-kicker",
    "edit-body",
    "edit-notes",
    "edit-duration",
    "edit-items",
  ].forEach((id) => {
    const el = $("#" + id);
    if (el) el.oninput = edit;
  });
  $("#close-editor").onclick = closeEditor;
  $("#editor-backdrop").onclick = (event) => {
    if (event.target.id === "editor-backdrop") closeEditor();
  };
  const transform = (fn) => {
    closeEditor();
    pushHistory();
    fn();
    persist();
    render();
    openEditor();
  };
  $("#move-left").onclick = () =>
    transform(() => {
      [deck.slides[selected - 1], deck.slides[selected]] = [
        deck.slides[selected],
        deck.slides[selected - 1],
      ];
      selected--;
    });
  $("#move-right").onclick = () =>
    transform(() => {
      [deck.slides[selected + 1], deck.slides[selected]] = [
        deck.slides[selected],
        deck.slides[selected + 1],
      ];
      selected++;
    });
  $("#duplicate").onclick = () =>
    transform(() => {
      const copy = clone(deck.slides[selected]);
      copy.id = "scene-" + Date.now();
      deck.slides.splice(selected + 1, 0, copy);
      selected++;
    });
  $("#delete-scene").onclick = () => {
    closeEditor();
    pushHistory();
    deck.slides.splice(selected, 1);
    selected = Math.min(selected, deck.slides.length - 1);
    persist();
    render();
  };
  $("#edit-title").focus();
}
function closeEditor() {
  if (!editorOpen) return;
  if (JSON.stringify(deck) !== JSON.stringify(editSnapshot))
    pushHistory(editSnapshot);
  editorOpen = false;
  editSnapshot = null;
  $("#modal-root").innerHTML = "";
  render();
  $("#edit-scene")?.focus();
}
function modal(title, body) {
  priorFocus = document.activeElement;
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><div class="modal-head"><h2 id="modal-heading">${e(title)}</h2><button id="close-modal" class="ghost" aria-label="${t("关闭", "Close")}">✕</button></div>${body}</section></div>`;
  $("#close-modal").onclick = closeModal;
  $("#modal-backdrop").onclick = (event) => {
    if (event.target.id === "modal-backdrop") closeModal();
  };
  $("#close-modal").focus();
}
function closeModal() {
  $("#modal-root").innerHTML = "";
  priorFocus?.focus();
}
function download(data, name, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function openExport() {
  readBrief();
  modal(
    t("把故事带走。", "Take your story with you."),
    `<p>${t("可播放的发布会、可编辑的项目、可分享的海报。", "A playable keynote, an editable project, a shareable poster.")}</p><div class="export-options"><button class="export-option" id="export-html"><span class="tag">OFFLINE / RECOMMENDED</span><strong>${t("独立发布会 HTML", "Standalone HTML")}</strong><small>${t("一个文件，图片内嵌。离线播放、备注、打印 PDF。", "One file, embedded images. Offline playback, notes and print to PDF.")}</small></button><button class="export-option" id="export-poster"><span class="tag">1080 × 1350</span><strong>${t("发布海报 PNG", "Launch poster PNG")}</strong><small>${t("为这场发布会生成一张可分享的竖版海报。", "A portrait poster for your main-character moment.")}</small></button><button class="export-option" id="export-json"><span class="tag">EDITABLE PROJECT</span><strong>${t("项目文件 JSON", "Project JSON")}</strong><small>${t("保存所有场景、备注和图片，随时导入继续编辑。", "Keep scenes, notes and images. Import later to keep editing.")}</small></button><button class="export-option" id="export-notes"><span class="tag">SPEAKER SCRIPT</span><strong>${t("讲稿 Markdown", "Script Markdown")}</strong><small>${t("完整故事线与讲者备注，用于排练或协作。", "Your story and speaker notes, ready for rehearsal.")}</small></button></div><div class="modal-foot">${t("导出保留“创意演绎”标记。HTML 可通过邮件或静态网站分享，无需登录。", "Exports retain the creative-concept label. Share HTML as a file or on a static host. No account needed.")}</div>`,
  );
  $("#export-html").onclick = async () => {
    const b = $("#export-html");
    b.disabled = true;
    try {
      const css = await fetch("./src/stage.css");
      if (!css.ok) throw new Error("Styles unavailable");
      const art = await inlineArtwork(deck);
      download(
        makeHTML(deck, await css.text(), art.image),
        filename(deck.title, ".html"),
        "text/html",
      );
      toast(
        t(
          "发布会已导出，离线也能播放。",
          "Keynote exported. It plays offline, too.",
        ),
      );
    } catch (err) {
      toast(err.message, true);
    } finally {
      if (b.isConnected) b.disabled = false;
    }
  };
  $("#export-json").onclick = () => {
    download(
      JSON.stringify(validateDeck(deck), null, 2),
      filename(deck.title, ".keynote.json"),
      "application/json",
    );
    toast(t("项目已导出。", "Project exported."));
  };
  $("#export-notes").onclick = () =>
    download(toMarkdown(deck), filename(deck.title, ".md"), "text/markdown");
  $("#export-poster").onclick = exportPoster;
}
function openLibrary() {
  readBrief();
  let all = [];
  try {
    all = JSON.parse(localStorage.getItem(LIBRARY) || "[]");
    if (!Array.isArray(all)) all = [];
  } catch {}
  modal(
    t("你的故事，还在这里。", "Your stories are still here."),
    `<p>${t("当前项目自动保存在这台设备。下面保留最近四次生成前的项目。", "Your current project saves on this device. Here are the last four pre-generation snapshots.")}</p><div class="project-list">${all.length ? all.map((x, i) => `<button data-restore="${i}"><strong>${e(x.title)}</strong><small>${e(String(x.date).slice(0, 10))} ↗</small></button>`).join("") : `<p>${t("还没有历史项目。先创作你的第一场发布会。", "No previous projects yet. Make your first keynote.")}</p>`}</div><div class="project-actions"><button id="import-project">↑ ${t("导入项目 JSON", "Import project JSON")}</button><button id="save-project">↓ ${t("备份当前项目", "Back up current project")}</button></div>`,
  );
  document.querySelectorAll("[data-restore]").forEach(
    (b) =>
      (b.onclick = () => {
        try {
          const next = validateDeck(all[Number(b.dataset.restore)].deck);
          closeModal();
          applyDeck(next);
          toast(
            t("项目已恢复，可撤销。", "Project restored. You can undo this."),
          );
        } catch (err) {
          toast(err.message, true);
        }
      }),
  );
  $("#import-project").onclick = () => $("#project-file").click();
  $("#save-project").onclick = () =>
    download(
      JSON.stringify(validateDeck(deck), null, 2),
      filename(deck.title, ".keynote.json"),
      "application/json",
    );
}
async function exportPoster() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    const theme = deck.theme,
      paper = theme === "paper",
      bg = paper ? "#f3f0e8" : theme === "ember" ? "#21120e" : "#0d0f0e",
      ink = paper ? "#242823" : "#f5f4ee",
      accent = paper ? "#446743" : theme === "ember" ? "#ff9a63" : "#c9f5a3";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1350);
    const txt = (str, x, y, size, color, weight = "500") => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px "Avenir Next","PingFang SC",sans-serif`;
      ctx.fillText(str, x, y);
    };
    txt("KEYNOTE ANYTHING / A CREATIVE CONCEPT", 65, 65, 14, accent);
    ctx.strokeStyle = paper ? "#24282322" : "#ffffff22";
    ctx.beginPath();
    ctx.moveTo(65, 90);
    ctx.lineTo(1015, 90);
    ctx.stroke();
    const hook = deck.slides[0].title;
    let size = 80;
    const wrap = (text, width) => {
      const lines = [];
      for (const para of text.split("\n")) {
        let row = "";
        for (const ch of para) {
          if (ctx.measureText(row + ch).width > width && row) {
            lines.push(row);
            row = ch;
          } else row += ch;
        }
        lines.push(row);
      }
      return lines;
    };
    ctx.font = `600 ${size}px "Avenir Next","PingFang SC",sans-serif`;
    let rows = wrap(hook, 950);
    while (rows.length > 4 && size > 40) {
      size -= 2;
      ctx.font = `600 ${size}px "Avenir Next","PingFang SC",sans-serif`;
      rows = wrap(hook, 950);
    }
    rows.forEach((r, i) => txt(r, 65, 190 + i * size * 1.2, size, ink, "600"));
    const art = await inlineArtwork(deck);
    if (art.image) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = art.image;
      });
      const area = { x: 100, y: 430, w: 880, h: 620 },
        scale = Math.min(area.w / img.width, area.h / img.height);
      ctx.drawImage(
        img,
        area.x + (area.w - img.width * scale) / 2,
        area.y + (area.h - img.height * scale) / 2,
        img.width * scale,
        img.height * scale,
      );
    } else {
      ctx.save();
      ctx.translate(540, 750);
      ctx.strokeStyle = accent;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          130 + i * 19,
          210,
          (Math.PI * i) / 20,
          0,
          Math.PI * 2,
        );
        ctx.globalAlpha = 0.12 + i * 0.07;
        ctx.stroke();
      }
      ctx.restore();
    }
    let nameSize = 60;
    ctx.font = `600 ${nameSize}px sans-serif`;
    while (ctx.measureText(deck.title).width > 950 && nameSize > 24) {
      nameSize--;
      ctx.font = `600 ${nameSize}px sans-serif`;
    }
    txt(deck.title, 65, 1150, nameSize, accent, "600");
    txt(
      t("平凡事物，盛大登场。", "Ordinary things. Extraordinary entrances."),
      65,
      1200,
      24,
      ink,
    );
    txt(
      t(
        "创意演绎 · 非官方发布 · 非真实产品规格",
        "CREATIVE CONCEPT · NOT AN OFFICIAL PRODUCT ANNOUNCEMENT",
      ),
      65,
      1293,
      13,
      paper ? "#74786f" : "#979c97",
    );
    const data = canvas.toDataURL("image/png");
    modal(
      t("这一刻，值得分享。", "A moment worth sharing."),
      `<img class="poster-preview" src="${data}" alt="${e(deck.title)}"><div class="poster-actions"><span class="editor-note">1080 × 1350 · PNG</span><button class="primary" id="save-poster">↓ ${t("下载海报", "Download poster")}</button></div>`,
    );
    $("#save-poster").onclick = () =>
      canvas.toBlob((blob) => {
        if (blob)
          download(blob, filename(deck.title, "-poster.png"), "image/png");
      }, "image/png");
  } catch {
    toast(
      t(
        "海报生成失败，请检查产品图后重试。",
        "Poster generation failed. Check your image and try again.",
      ),
      true,
    );
  }
}
function startPresentation() {
  readBrief();
  playing = true;
  autoplay = false;
  presentNotes = false;
  renderPresentation();
}
function renderPresentation() {
  clearTimeout(timer);
  cancelAnimationFrame(progressFrame);
  const s = deck.slides[selected];
  $("#modal-root").innerHTML =
    `<div class="presentation" role="dialog" aria-modal="true" aria-label="${t("发布会播放", "Keynote player")}"><div class="stage-frame" id="presentation-frame"><div class="stage-scale">${slideHTML(deck, s, selected).replace("keynote-slide ", "keynote-slide animate ")}</div></div>${presentNotes ? `<aside class="present-notes">${e(s.notes)}</aside>` : ""}<div class="present-toolbar"><button id="p-prev" ${selected === 0 ? "disabled" : ""} aria-label="${t("上一幕", "Previous scene")}">←</button><span>${selected + 1} / ${deck.slides.length}</span><button id="p-next" ${selected === deck.slides.length - 1 ? "disabled" : ""} aria-label="${t("下一幕", "Next scene")}">→</button><button id="p-auto">${autoplay ? "Ⅱ " + t("暂停", "Pause") : "▶ " + t("自动播放", "Auto play")}</button><button id="p-notes">${t("备注", "Notes")}</button><button id="p-full">${t("全屏", "Fullscreen")}</button><button id="p-exit">✕ ${t("退出", "Exit")}</button></div><div class="present-progress"><i></i></div></div>`;
  scalePresentation();
  $("#p-prev").onclick = () => navigate(selected - 1);
  $("#p-next").onclick = () => navigate(selected + 1);
  $("#p-auto").onclick = () => {
    autoplay = !autoplay;
    if (autoplay && selected === deck.slides.length - 1) selected = 0;
    renderPresentation();
  };
  $("#p-notes").onclick = () => {
    presentNotes = !presentNotes;
    renderPresentation();
  };
  $("#p-full").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast(
        t(
          "浏览器未允许全屏，当前播放模式仍可使用。",
          "Fullscreen was not allowed. Presentation mode still works.",
        ),
      );
    }
  };
  $("#p-exit").onclick = exitPresentation;
  if (autoplay) {
    const start = performance.now(),
      length = s.duration * 1000;
    const tick = (now) => {
      const p = $(".present-progress i");
      if (p)
        p.style.width = Math.min(100, ((now - start) / length) * 100) + "%";
      if (playing && autoplay) progressFrame = requestAnimationFrame(tick);
    };
    progressFrame = requestAnimationFrame(tick);
    timer = setTimeout(() => {
      if (selected < deck.slides.length - 1) {
        selected++;
        renderPresentation();
      } else {
        autoplay = false;
        renderPresentation();
        toast(
          t("谢幕。你的故事讲完了。", "Curtain call. Your story is complete."),
        );
      }
    }, length);
  }
  $("#p-auto").focus();
}
function scalePresentation() {
  const frame = $("#presentation-frame");
  if (!frame) return;
  const w = Math.min(innerWidth, ((innerHeight - 65) * 16) / 9);
  frame.style.width = w + "px";
  frame.style.height = (w * 9) / 16 + "px";
  scaleStages();
}
function exitPresentation() {
  clearTimeout(timer);
  cancelAnimationFrame(progressFrame);
  playing = false;
  autoplay = false;
  $("#modal-root").innerHTML = "";
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  render();
  $("#present")?.focus();
}
$("#project-file").onchange = async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 4_000_000)
      throw new Error(t("文件超过 4 MB。", "File exceeds 4 MB."));
    const next = parseProject(await file.text());
    closeModal();
    archiveProject();
    applyDeck(next);
    toast(t("项目已导入。", "Project imported."));
  } catch (err) {
    toast(err.message, true);
  }
};
$("#image-file").onchange = async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 12_000_000
    )
      throw new Error(
        t(
          "请选择 12 MB 以内的 PNG、JPEG 或 WebP。",
          "Choose a PNG, JPEG or WebP under 12 MB.",
        ),
      );
    const bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 40_000_000) {
      bitmap.close();
      throw new Error(
        t(
          "图片尺寸过大，请先缩小。",
          "Image dimensions are too large. Resize it first.",
        ),
      );
    }
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const data = canvas.toDataURL("image/webp", 0.9);
    if (data.length > 3_000_000)
      throw new Error(
        t(
          "压缩后图片仍过大，请选择更小图片。",
          "Compressed image is still too large. Choose a smaller file.",
        ),
      );
    readBrief();
    pushHistory();
    deck.image = data;
    selected = deck.slides.findIndex((s) => s.type === "reveal");
    if (selected < 0) selected = 0;
    persist();
    render();
    toast(
      t(
        "图片已更新，只保存在本机。",
        "Image updated. It stays on this device.",
      ),
    );
  } catch (err) {
    toast(err.message || t("无法读取图片。", "Could not read image."), true);
  }
};
window.addEventListener("resize", () => {
  scaleStages();
  if (playing) scalePresentation();
});
document.addEventListener("keydown", (event) => {
  const dialog = $('#modal-root [role="dialog"]');
  if (event.key === "Tab" && dialog) {
    const focusable = [
        ...dialog.querySelectorAll(
          "button:not([disabled]),input:not([disabled]),textarea,select,a[href]",
        ),
      ].filter((x) => x.offsetParent !== null),
      first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  if (event.key === "Escape") {
    if (playing) exitPresentation();
    else if (editorOpen) closeEditor();
    else if (dialog) closeModal();
    return;
  }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName))
    return;
  if (dialog && !playing) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (!playing) event.shiftKey ? redo() : undo();
    return;
  }
  if (event.key === "ArrowRight" || (playing && event.key === " ")) {
    event.preventDefault();
    navigate(selected + 1);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigate(selected - 1);
  }
  if (playing && event.key === "Home") {
    event.preventDefault();
    navigate(0);
  }
  if (playing && event.key === "End") {
    event.preventDefault();
    navigate(deck.slides.length - 1);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing && autoplay) {
    autoplay = false;
    renderPresentation();
  }
});
window.addEventListener("pagehide", () => {
  if (!saved) {
    try {
      localStorage.setItem(KEY, JSON.stringify(deck));
    } catch {}
  }
});
render();
if (saveError)
  toast(
    t(
      "无法恢复本地项目，已打开示例。可导入备份继续。",
      "Could not restore local project. Import a backup to continue.",
    ),
    true,
  );
fetch("./api/status")
  .then((r) => (r.ok ? r.json() : { available: false }))
  .then((s) => {
    aiAvailable = s.available === true;
    const option = $("#engine option[value=ai]");
    if (option) {
      option.disabled = !aiAvailable;
      option.textContent = aiAvailable
        ? t("AI 导演", "AI director")
        : t("AI 导演 · 未配置", "AI director · setup needed");
    }
  })
  .catch(() => {});
