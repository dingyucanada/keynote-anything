import { validateDeck, toMarkdown } from "./director.js";
import { slideHTML, escapeHTML } from "./stage.js";
export { toMarkdown };
export function safeJSON(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
export function fitText(root) {
  for (const el of root.querySelectorAll(
    "h1,.slide-body,.architecture-node h2,.benefit-item h2,.architecture-caption,.benefit-caption",
  )) {
    let style = getComputedStyle(el),
      size = parseFloat(style.fontSize),
      min =
        el.tagName === "H1"
          ? 30
          : el.classList.contains("architecture-caption") ||
              el.classList.contains("benefit-caption")
            ? 9
            : 14;
    const limit = parseFloat(style.maxHeight) || Infinity;
    for (
      let n = 0;
      n < 80 &&
      (el.scrollHeight > limit + 4 || el.scrollWidth > el.clientWidth + 4) &&
      size > min;
      n++
    ) {
      size -= 1;
      el.style.fontSize = size + "px";
    }
  }
}
export async function inlineArtwork(deck) {
  if (deck.image || deck.art !== "builtin:coffee") return deck;
  const response = await fetch("./assets/brew-core.png");
  if (!response.ok)
    throw new Error("产品图读取失败 / Could not load product artwork");
  const blob = await response.blob();
  const image = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  return { ...deck, image, art: "abstract" };
}
export function makeHTML(input, css, artData = "") {
  const deck = validateDeck(input),
    zh = deck.brief.language === "zh";
  const presentation = { ...deck, image: artData || deck.image };
  const slides = deck.slides
    .map(
      (s, i) =>
        `<div class="scene-page ${i === 0 ? "active" : ""}" data-duration="${s.duration}">${slideHTML(presentation, s, i)}</div>`,
    )
    .join("");
  const notes = safeJSON(deck.slides.map((s) => s.notes));
  return `<!doctype html><html lang="${zh ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${escapeHTML(deck.title)} · Keynote Anything</title><style>${css}\nhtml,body{margin:0;background:#090b0a;color:#eee;font-family:system-ui,sans-serif;overflow:hidden}*{box-sizing:border-box}#screen{position:fixed;inset:0 0 64px;display:flex;align-items:center;justify-content:center}.scene-page{display:none;position:absolute;width:1280px;height:720px;transform-origin:center}.scene-page.active{display:block}.controls{position:fixed;bottom:0;left:0;right:0;height:64px;background:#151916;display:flex;justify-content:center;align-items:center;gap:14px;border-top:1px solid #ffffff20}button{font:13px system-ui;color:#eee;background:#242a25;border:1px solid #495348;padding:8px 14px;border-radius:6px;cursor:pointer}button:focus-visible{outline:2px solid #c9f5a3}#counter{font:12px monospace;color:#a9b4a8}#speaker{display:none;position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#181c19f5;border:1px solid #fff3;padding:20px;max-width:700px;width:85%;max-height:35vh;overflow:auto;white-space:pre-wrap;font-size:15px;line-height:1.6;z-index:5}#speaker.open{display:block}.notice{position:fixed;top:9px;right:12px;font:10px system-ui;color:#9aa599;z-index:6}@media print{@page{size:13.333333in 7.5in;margin:0}html,body{overflow:visible;background:white}#screen{display:block;position:static}.scene-page,.scene-page.active{display:block;position:relative;transform:none!important;width:1280px;height:720px;break-after:page;page-break-after:always;overflow:hidden}.scene-page:last-child{break-after:auto;page-break-after:auto}.keynote-slide{transform:none;transform-origin:top left}.controls,#speaker,.notice{display:none}.keynote-slide{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="notice">${zh ? "创意演绎 · 非官方发布" : "Creative concept · Not an official announcement"}</div><main id="screen">${slides}</main><nav class="controls" aria-label="Presentation controls"><button id="previous" aria-label="Previous scene">←</button><span id="counter" aria-live="polite"></span><button id="next" aria-label="Next scene">→</button><button id="auto">${zh ? "自动播放" : "Auto play"}</button><button id="notes">${zh ? "讲者备注" : "Notes"}</button><button id="fullscreen">${zh ? "全屏" : "Fullscreen"}</button><button id="print">PDF</button></nav><aside id="speaker"></aside><script>
 const pages=[...document.querySelectorAll('.scene-page')],notes=${notes};let index=0,auto=false,timer;
 const fitText=${fitText.toString()};
 function scale(){let s=Math.min(innerWidth/1280,(innerHeight-64)/720);pages.forEach(p=>p.style.transform='scale('+s+')');}
 function show(n){clearTimeout(timer);index=Math.max(0,Math.min(pages.length-1,n));pages.forEach((p,i)=>{p.classList.toggle('active',i===index);p.firstElementChild.classList.toggle('animate',i===index)});document.querySelector('#counter').textContent=(index+1)+' / '+pages.length;document.querySelector('#speaker').textContent=notes[index];fitText(pages[index]);document.querySelector('#previous').disabled=index===0;document.querySelector('#next').disabled=index===pages.length-1;document.querySelector('#auto').textContent=auto?'${zh ? "暂停" : "Pause"}':'${zh ? "自动播放" : "Auto play"}';if(auto){if(index===pages.length-1){timer=setTimeout(()=>{auto=false;show(index)},Number(pages[index].dataset.duration)*1000)}else timer=setTimeout(()=>show(index+1),Number(pages[index].dataset.duration)*1000)}}
 document.querySelector('#previous').onclick=()=>show(index-1);document.querySelector('#next').onclick=()=>show(index+1);document.querySelector('#auto').onclick=()=>{auto=!auto;if(auto&&index===pages.length-1)index=0;show(index)};document.querySelector('#notes').onclick=()=>document.querySelector('#speaker').classList.toggle('open');document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{}};document.querySelector('#print').onclick=()=>{auto=false;clearTimeout(timer);pages.forEach(p=>{p.style.display='block';fitText(p);p.style.display=''});window.print();show(index)};
 addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft',' ','Home','End'].includes(e.key))e.preventDefault();if(e.key==='ArrowRight'||e.key===' ')show(index+1);if(e.key==='ArrowLeft')show(index-1);if(e.key==='Home')show(0);if(e.key==='End')show(pages.length-1);if(e.key==='Escape'){auto=false;show(index)}});addEventListener('resize',scale);document.addEventListener('visibilitychange',()=>{if(document.hidden){auto=false;show(index)}});scale();show(0);
 </script></body></html>`;
}
export function filename(title, suffix) {
  const safe =
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .trim()
      .slice(0, 50) || "keynote";
  return safe + suffix;
}
