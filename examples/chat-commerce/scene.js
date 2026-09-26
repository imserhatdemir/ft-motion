// examples/chat-commerce · ported from the ft-studio template of the same name. project.json plays the 15 s
// choreography at speed 0.75 (= 20 s); set "speed": 1 for the original tempo or 0.6 for 25 s. Copy, colours,
// font and logo live in COPY / BRAND below; engine/brand.js turns them into a palette, a safe area and a logo.
// chat-commerce · a 15 s choreography at 160 BPM (bar = 1.5 s). The project speed (project.json, 0.75 = 20 s)
// plays the same choreography slower, sound included (sound.py stretches its clock the same way).
//   bar 0      the old funnel: steps get clicked one by one and collapse into a dot
//   bars 1–3   the dot becomes a chat input: shopper asks, the assistant types and streams a reply with
//              product cards; a follow-up swaps the variant live and adds it to the cart
//   bar 4      manifesto: struck lines, the punchline in a gradient; the text shatters into the dot grid
//   bar 5      channel chips ripple through the grid and feed one inbox
//   bar 6      the grid tilts into a wave landscape and flies into the logo
//   bar 7      a formula stacks under the logo; the camera dives into it
//   bars 8–9   glass end card: logo badge, name, tagline, headline, a hovered and clicked CTA, URL
// Drawn in design units (1 = 1 px of a 1080-px short side): ctx is scaled by api.u.
import { TAU, clamp, lerp, prog, rgba, E, EASE, spring, setFont, rrect, pill, withScale, arrow, check, pointer, wrap, project3D, sampleDrawing, glassSlats, radialBlob, vignette, hash } from '../../engine/core.js';
import { brandApi, fit, fitLines, samplePoints, drawAsset, assetBox, mixRgb, contrast, onColor, DARK } from '../../engine/brand.js';

const BASE = 15;                                   // choreography length in scene seconds
const SEG = [0, 1.5, 6, 7.5, 9, 10.5, 12];         // funnel · chat · statement · channels · logo · formula · end
const GS = 60;                                     // dot grid spacing, shared by statement → channels → logo
const PAPER = [244, 245, 241], PAPER_INK = [15, 23, 42];
const CHANNEL_COLORS = [[/whats/i, [37, 211, 102]], [/insta/i, [225, 48, 108]], [/messenger|facebook/i, [8, 102, 255]], [/telegram/i, [34, 158, 217]], [/mail|posta/i, [148, 163, 184]]];
const list = (s, n = 99) => String(s ?? '').split(',').map(x => x.trim()).filter(Boolean).slice(0, n);
let L = null;

// ───────────────────────────── copy & brand: edit these (or add a language)
const COPY = {
  "tr": {
    "stepsTitle": "Bugün online alışveriş:",
    "steps": "Kategori, Filtre, Ürün, Varyasyon, Sepet, Ödeme",
    "line1": "Kategori yok.",
    "line2": "Filtre yok.",
    "line3": "Konuşma,",
    "line4": "yeni arayüz.",
    "channelsTitle": "6 kanal. Tek inbox.",
    "channels": "WhatsApp, Instagram, Messenger, Telegram, E-posta, Web Chat",
    "inbox": "Tek inbox",
    "formula": "Ticaret, Sohbet, Yapay zekâ, Otomasyon",
    "agentName": "Alışveriş Asistanı",
    "status": "çevrimiçi · katalog bağlı",
    "placeholder": "Ne arıyorsun?",
    "msg1": "1.500 TL altında siyah bir çanta arıyorum.",
    "reply1": "Bütçene uygun 3 siyah çanta buldum:",
    "msg2": "İkincisinin taba rengi var mı?",
    "reply2": "Var, taba rengi stokta:",
    "productStyle": "bag",
    "p1": "Mini Tote",
    "p1price": "1.249 TL",
    "p2": "Crossbody",
    "p2price": "1.390 TL",
    "p3": "Shopper",
    "p3price": "1.475 TL",
    "detail": "Crossbody Çanta",
    "variantA": "Siyah",
    "swatchA": "#1F2126",
    "variantB": "Taba",
    "swatchB": "#A06238",
    "stock": "stokta",
    "add": "Sepete ekle",
    "added": "Sepete eklendi",
    "title": "Nova Shop",
    "tagline": "Sohbetle alışveriş",
    "headline": "Her konuşmayı satışa dönüştürün.",
    "cta": "Ücretsiz dene",
    "url": "novashop.app"
  },
  "en": {
    "stepsTitle": "Shopping online today:",
    "steps": "Category, Filters, Product, Variant, Cart, Checkout",
    "line1": "No categories.",
    "line2": "No filters.",
    "line3": "Conversation",
    "line4": "is the new UI.",
    "channelsTitle": "6 channels. One inbox.",
    "channels": "WhatsApp, Instagram, Messenger, Telegram, Email, Web Chat",
    "inbox": "One inbox",
    "formula": "Commerce, Conversations, AI Agents, Automation",
    "agentName": "Shopping Assistant",
    "status": "online · catalog connected",
    "placeholder": "What are you looking for?",
    "msg1": "Looking for a black bag under $80.",
    "reply1": "Found 3 black bags in your budget:",
    "msg2": "Does the second one come in tan?",
    "reply2": "Yes, tan is in stock:",
    "productStyle": "bag",
    "p1": "Mini Tote",
    "p1price": "$59",
    "p2": "Crossbody",
    "p2price": "$69",
    "p3": "Shopper",
    "p3price": "$76",
    "detail": "Crossbody Bag",
    "variantA": "Black",
    "swatchA": "#1F2126",
    "variantB": "Tan",
    "swatchB": "#A06238",
    "stock": "in stock",
    "add": "Add to cart",
    "added": "Added to cart",
    "title": "Nova Shop",
    "tagline": "Conversational commerce",
    "headline": "Turn every conversation into a sale.",
    "cta": "Try it free",
    "url": "novashop.app"
  }
};
// logo: a file next to this scene, e.g. new URL('logo.png', import.meta.url).href — null draws a monogram
const BRAND = { bg: '#0C0E14', main: '#16A34A', accent: '#D9EB49', font: 'Inter', weight: 700, logo: null };

let A = null;   // the brand api (engine/brand.js): palette, safe area, copy, logo
export default {
  async setup(api) {
    const copy = COPY[api.lang] ?? COPY.tr;
    A = await brandApi(api, { brand: { ...BRAND, name: copy.title }, copy, base: BASE });
    setupScene(A);
  },
  draw(ctx, t) { drawScene(ctx, t, A); },
  post(ctx, t, api) { vignette(ctx, api.W, api.H, A.colors.dark ? 0.22 : 0.08); },
};

function setupScene(api) {
    const { u, W, H, fmt, colors: C, P, assets } = api, s = fmt.safe;
    L = { Wd: W / u, Hd: H / u, sx: s.x / u, sy: s.y / u, sb: s.b / u, scx: s.cx / u, scy: s.cy / u, sw: s.w / u, sh: s.h / u };
    const hi = contrast(C.accent, C.bg) >= 1.6 ? C.accent : C.pop;
    L.c = {
      panel: mixRgb(C.bg, C.text, 0.03), surface: C.card, line: C.line, ink: C.text, muted: C.sub, faint: mixRgb(C.text, C.bg, 0.58),
      main: C.main, onMain: C.onMain, hi, gradB: mixRgb(hi, C.main, 0.55), dim: mixRgb(C.text, C.bg, 0.55),
      price: contrast(C.main, PAPER) >= 2.4 ? C.main : PAPER_INK,
    };
    const base = mixRgb([246, 249, 246], hi, 0.05);
    L.glass = { base, ink: PAPER_INK, muted: [71, 85, 105], cta: contrast(C.main, base) >= 2 ? C.main : DARK, glows: [mixRgb(hi, [255, 255, 255], 0.35), C.main, hi] };
    L.glass.onCta = onColor(L.glass.cta);
    L.grid = fieldGrid(L.Wd, L.Hd);
    L.chat = schedule(P);
    L.swatches = [P.swatchA, P.swatchB].map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    L.swatches.push(mixRgb(L.swatches[1], [255, 255, 255], 0.45));
    L.lines = [['line1', 'strike'], ['line2', 'strike'], ['line3', 'accent'], ['line4', 'plain']].filter(([k]) => P[k]).map(([k, style]) => ({ text: api.text(k), style }));
    layoutStatement(api);
    L.parts = sampleDrawing(Math.ceil(L.Wd), Math.ceil(L.Hd), c => paintStatement(c, api, 0, true), 9).map(q => ({ ...q, ...snap(q.x, q.y) }));
    // logo: sampled into about as many points as the grid has dots
    const square = assets.logo.w / assets.logo.h < 1.35;           // monograms and app icons read big: keep them smaller
    const box = Math.min(640, 0.62 * Math.min(L.sw, L.sh)) * (square ? 0.62 : 1), lb = assetBox(assets.logo, box, box);
    const N = L.grid.pts.length, probe = samplePoints(assets.logo, lb.w, 8);
    const step = clamp(8 * Math.sqrt(Math.max(1, probe.length) / N), 3, 60);
    const pts = samplePoints(assets.logo, lb.w, step).sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
    L.logo = { w: lb.w, h: lb.h, pts, r: Math.max(2.5, step * 0.42) };
    L.order = L.grid.pts.map((d, i) => i).sort((a, b) => Math.atan2(L.grid.pts[a].y, L.grid.pts[a].x) - Math.atan2(L.grid.pts[b].y, L.grid.pts[b].x));
    L.rank = new Array(N); L.order.forEach((gi, r) => { L.rank[gi] = r; });
}
function drawScene(ctx, t, api) {
    const ts = t * (BASE / api.duration);
    ctx.save(); ctx.scale(api.u, api.u);
    ctx.fillStyle = rgba(api.colors.bg); ctx.fillRect(0, 0, L.Wd, L.Hd);
    let i = SEG.length - 1;
    while (i > 0 && ts < SEG[i]) i--;
    [funnel, chat, statement, channels, logoFromDots, formula, endCard][i](ctx, ts - SEG[i], api);
    ctx.restore();
}

// ───────────────────────────── shared grid
function fieldGrid(W, H) {
  const nx = Math.floor((W / 2 - GS / 2) / GS), ny = Math.floor((H / 2 - GS / 2) / GS), pts = [];
  for (let r = -ny; r <= ny; r++) for (let c = -nx; c <= nx; c++) pts.push({ x: c * GS, y: r * GS, d: Math.hypot(c * GS, r * GS) });
  return { pts, nx, ny, dmax: Math.hypot(nx * GS, ny * GS) };
}
const snap = (x, y) => ({ gx: clamp(Math.round((x - L.Wd / 2) / GS), -L.grid.nx, L.grid.nx) * GS + L.Wd / 2, gy: clamp(Math.round((y - L.Hd / 2) / GS), -L.grid.ny, L.grid.ny) * GS + L.Hd / 2 });
const dot = (ctx, x, y, r, col, a = 1) => { ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); };

// ───────────────────────────── bar 0 · the old funnel
function funnel(ctx, u, api) {
  const { P, font } = api, c = L.c, cy = L.scy + 20;
  const steps = list(P.steps, 7);
  if (!steps.length) steps.push('…');
  const N = steps.length, every = Math.min(0.1875, 0.95 / N), at = i => 0.12 + i * every;
  setFont(ctx, 500, 44, 'Inter', -0.8);
  const ws = steps.map(x => ctx.measureText(x).width + 70), gap = 62, xs = [];
  let acc = 0;
  for (let i = 0; i < N; i++) { xs.push(acc + ws[i] / 2); acc += ws[i] + gap; }
  let cur = -1;
  for (let i = 0; i < N; i++) if (u >= at(i)) cur = i;
  let off = 0;
  for (let i = 0; i < N; i++) off += (i === 0 ? xs[0] : xs[i] - xs[i - 1]) * EASE.expo(prog(u, at(i) - 0.02, at(i) + 0.2));
  const cp = E.inExpo(prog(u, 1.16, 1.46)), cap = prog(u, 0, 0.15) * (1 - prog(u, 1.1, 1.25));
  const title = api.text('stepsTitle'), tsz = fit(ctx, title, { family: font.display, weight: font.weight, max: 50, min: 24, width: L.sw * 0.92 });
  setFont(ctx, font.weight, tsz, font.display, -0.035 * tsz); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(c.ink, cap); ctx.fillText(title, L.scx, cy - 160);
  setFont(ctx, 500, 24, 'Inter', 0.5); ctx.fillStyle = rgba(c.faint, cap);
  ctx.fillText(`${api.lang === 'en' ? 'STEP' : 'ADIM'} ${Math.max(1, cur + 1)} / ${N}`, L.scx, cy + 140);
  for (let i = 0; i <= cur; i++) {
    const x0 = L.scx + xs[i] - off, x = lerp(x0, L.scx, cp);
    const a = clamp(1 - Math.abs(x0 - L.scx) / (L.sw * 0.62)) * (1 - prog(cp, 0.6, 1));
    if (a <= 0.01) continue;
    const s = spring(u - at(i), 20, 9) * (1 - cp), flash = Math.exp(-(u - at(i)) * 9);
    ctx.save(); ctx.translate(x, cy); ctx.scale(s, s);
    pill(ctx, 0, 0, ws[i], 92);
    ctx.fillStyle = rgba(mixRgb(c.surface, c.main, flash * 0.6), a); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(i === cur ? c.hi : c.line, a); ctx.stroke();
    setFont(ctx, 500, 44, 'Inter', -0.8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(c.ink, a); ctx.fillText(steps[i], 0, 2);
    ctx.restore();
    if (i < cur) {
      setFont(ctx, 500, 40, 'Inter'); ctx.fillStyle = rgba(c.faint, a * (1 - cp)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('›', lerp(L.scx + xs[i] - off + ws[i] / 2 + gap / 2, L.scx, cp), cy);
    }
  }
  if (cur >= 0 && cp < 0.5) { const dt = u - at(cur); pointer(ctx, L.scx + 34, cy + 16, 1, dt < 0.09 ? 1 - dt / 0.09 : 0); }
  if (cp > 0.4) {
    ctx.save(); ctx.shadowColor = rgba(c.hi); ctx.shadowBlur = 30;
    dot(ctx, L.scx, cy, 14 * E.outBack(prog(cp, 0.4, 1)), c.hi); ctx.restore();
  }
}

// ───────────────────────────── bars 1–3 · the conversation
function schedule(P) {
  const ev = [];
  let c = 0.36;
  const user = text => { if (!text) return; const td = clamp(text.length * 0.016, 0.3, 0.9), send = c + td + 0.1; ev.push({ type: 'user', text, typeStart: c, typeEnd: c + td, ta: send }); c = send + 0.15; };
  const agent = text => { if (!text) return; ev.push({ type: 'agent', text, ta: c, text0: c + 0.3 }); c += 0.55; };
  user(P.msg1); agent(P.reply1);
  ev.push({ type: 'products', ta: c }); c += 0.5;
  user(P.msg2); agent(P.reply2);
  ev.push({ type: 'detail', ta: c, swap: c + 0.16, press: c + 0.42 }); c += 0.67;
  const k = c > 4.4 ? 4.4 / c : 1;                      // long copy: compress so the chat still fits its three bars
  for (const e of ev) for (const key of ['ta', 'typeStart', 'typeEnd', 'text0', 'swap', 'press']) if (e[key] != null) e[key] *= k;
  return ev;
}
function drawProduct(ctx, type, cx, cy, s, col) {
  const dark = mixRgb(col, [0, 0, 0], 0.35), lite = mixRgb(col, [255, 255, 255], 0.14);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.ellipse(0, 62, 74, 9, 0, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  const body = path => { const g = ctx.createLinearGradient(0, -60, 0, 60); g.addColorStop(0, rgba(lite)); g.addColorStop(1, rgba(col)); path(); ctx.fillStyle = g; ctx.fill(); };
  if (type === 'tote') {
    ctx.strokeStyle = rgba(dark); ctx.lineWidth = 8;
    for (const hx of [-26, 26]) { ctx.beginPath(); ctx.moveTo(hx - 14, -38); ctx.bezierCurveTo(hx - 14, -92, hx + 14, -92, hx + 14, -38); ctx.stroke(); }
    body(() => { ctx.beginPath(); ctx.moveTo(-58, -40); ctx.lineTo(58, -40); ctx.lineTo(68, 58); ctx.lineTo(-68, 58); ctx.closePath(); });
    ctx.fillStyle = rgba(dark, 0.5); ctx.fillRect(-58, -40, 116, 7);
  } else if (type === 'cross') {
    ctx.strokeStyle = rgba(dark); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-60, -10); ctx.bezierCurveTo(-60, -110, 60, -110, 60, -10); ctx.stroke();
    body(() => rrect(ctx, -68, -26, 136, 86, 24));
    ctx.fillStyle = rgba(dark, 0.55); ctx.beginPath(); ctx.moveTo(-68, -2); ctx.arcTo(-68, -26, -44, -26, 24); ctx.lineTo(44, -26); ctx.arcTo(68, -26, 68, -2, 24);
    ctx.lineTo(68, 6); ctx.quadraticCurveTo(0, 36, -68, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9b45a'; ctx.beginPath(); ctx.arc(0, 20, 6, 0, TAU); ctx.fill();
  } else if (type === 'shop') {
    ctx.strokeStyle = rgba(dark); ctx.lineWidth = 7;
    for (const hx of [-22, 22]) { ctx.beginPath(); ctx.moveTo(hx - 12, -52); ctx.bezierCurveTo(hx - 12, -118, hx + 12, -118, hx + 12, -52); ctx.stroke(); }
    body(() => { ctx.beginPath(); ctx.moveTo(-50, -54); ctx.lineTo(50, -54); ctx.lineTo(56, 58); ctx.lineTo(-56, 58); ctx.closePath(); });
  } else {
    body(() => rrect(ctx, -60, -46, 120, 104, 14));
    ctx.fillStyle = rgba(dark, 0.45); ctx.fillRect(-60, -18, 120, 10);
    ctx.fillStyle = rgba(lite, 0.5); ctx.fillRect(-8, -46, 16, 104);
  }
  ctx.restore();
}
const artFor = (P, i) => (P.productStyle === 'box' ? 'box' : ['tote', 'cross', 'shop'][i]);

function chat(ctx, u, api) {
  const { P, assets } = api, c = L.c, ev = L.chat;
  const PW = Math.min(900, L.sw), PX = L.scx - PW / 2, PY = L.sy, PH = L.sh;
  const INPUT_Y = PY + PH - 78, AREA_T = PY + 120, AREA_B = INPUT_Y - 76;
  const fr = EASE.expo(prog(u, 0.08, 0.5));
  ctx.save(); ctx.globalAlpha = fr;
  withScale(ctx, L.scx, PY + PH / 2, 0.97 + 0.03 * fr, () => { rrect(ctx, PX, PY, PW, PH, 40); ctx.fillStyle = rgba(c.panel); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(c.line); ctx.stroke(); });
  ctx.restore();
  // header
  const det = ev.find(e => e.type === 'detail'), badgeAt = det.press + 0.08;
  ctx.save(); ctx.globalAlpha = prog(u, 0.2, 0.45);
  ctx.fillStyle = rgba(mixRgb(api.colors.bg, [0, 0, 0], 0.35)); ctx.beginPath(); ctx.arc(PX + 68, PY + 60, 32, 0, TAU); ctx.fill();
  drawAsset(ctx, assets.logo, PX + 68, PY + 60, 42, 42);
  setFont(ctx, 600, 29, 'Inter', -0.6); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(c.ink); ctx.fillText(P.agentName, PX + 118, PY + (P.status ? 54 : 70));
  if (P.status) {
    dot(ctx, PX + 125, PY + 80, 6, c.hi);
    setFont(ctx, 500, 20, 'Inter', -0.1); ctx.fillStyle = rgba(c.muted); ctx.fillText(P.status, PX + 140, PY + 87);
  }
  const bx = PX + PW - 70, by = PY + 62;
  ctx.strokeStyle = rgba(c.ink); ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
  rrect(ctx, bx - 17, by - 10, 34, 30, 5); ctx.stroke(); ctx.beginPath(); ctx.arc(bx, by - 10, 9, Math.PI, 0); ctx.stroke();
  if (u >= badgeAt) {
    const s = spring(u - badgeAt, 20, 8);
    ctx.save(); ctx.translate(bx + 17, by - 15); ctx.scale(s, s); dot(ctx, 0, 0, 14, c.hi);
    setFont(ctx, 700, 18, 'Inter'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(onColor(c.hi)); ctx.fillText('1', 0, 1);
    ctx.restore();
  }
  ctx.fillStyle = rgba(c.line); ctx.fillRect(PX, PY + 120, PW, 2);
  ctx.restore();
  // messages
  setFont(ctx, 500, 30, 'Inter', -0.4);
  const bubbleMax = Math.min(560, PW - 200);
  const bubbleH = text => wrap(ctx, text, bubbleMax).length * 40 + 30;
  const cw = Math.min(258, (PW - 120) / 3);
  for (const e of ev) e.h = e.type === 'products' ? cw * (318 / 258) : e.type === 'detail' ? 212 : bubbleH(e.text);
  let content = 0;
  for (const e of ev) content += (e.h + 18) * EASE.expo(prog(u, e.ta, e.ta + 0.35));
  const scroll = Math.max(0, AREA_T + 12 + content - AREA_B);
  ctx.save(); ctx.beginPath(); ctx.rect(PX, AREA_T, PW, AREA_B - AREA_T + 10); ctx.clip();
  let y = AREA_T + 12 - scroll;
  for (const e of ev) {
    const ey = y;
    y += (e.h + 18) * EASE.expo(prog(u, e.ta, e.ta + 0.35));
    if (u < e.ta) continue;
    if (e.type === 'user') bubble(e.text, true, e.ta, ey);
    else if (e.type === 'agent') { if (u < e.text0) typing(e.ta, ey); else bubble(e.text, false, e.ta, ey, Math.ceil(prog(u, e.text0, e.text0 + 0.22) * e.text.split(' ').length)); }
    else if (e.type === 'products') [0, 1, 2].forEach(i => card(i, e.ta + i * 0.09, PX + 40 + i * (cw + 20), ey, cw));
    else detail(e, ey);
  }
  ctx.restore();
  const g = ctx.createLinearGradient(0, AREA_T, 0, AREA_T + 40);
  g.addColorStop(0, rgba(c.panel, fr)); g.addColorStop(1, rgba(c.panel, 0));
  ctx.fillStyle = g; ctx.fillRect(PX + 2, AREA_T, PW - 4, 40);
  // input: grows out of the funnel's dot
  const m = EASE.expo(prog(u, 0, 0.42));
  const iw = lerp(28, PW - 80, EASE.expo(prog(u, 0.1, 0.5))), ih = lerp(28, 84, EASE.expo(prog(u, 0.1, 0.4)));
  pill(ctx, L.scx, lerp(L.scy + 20, INPUT_Y, m), iw, ih);
  ctx.fillStyle = rgba(mixRgb(c.hi, c.surface, prog(u, 0.12, 0.4))); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = rgba(c.line, prog(u, 0.2, 0.45)); ctx.stroke();
  const ia = prog(u, 0.35, 0.5);
  if (ia > 0) {
    const sx = L.scx - (PW - 80) / 2 + 36, sbx = L.scx + (PW - 80) / 2 - 44;
    const now = ev.find(e => e.type === 'user' && u >= e.typeStart && u < e.ta);
    const txt = now ? now.text.slice(0, Math.floor(prog(u, now.typeStart, now.typeEnd) * now.text.length)) : '';
    ctx.save(); ctx.globalAlpha = ia;
    ctx.beginPath(); ctx.rect(sx - 4, INPUT_Y - 40, sbx - 40 - sx, 80); ctx.clip();
    setFont(ctx, 500, 29, 'Inter', -0.4); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(txt).width, shift = Math.max(0, tw - (sbx - 60 - sx));
    ctx.fillStyle = rgba(txt ? c.ink : c.faint); ctx.fillText(txt || P.placeholder, sx - shift, INPUT_Y + 1);
    if (now || u % (api.beat * 2) < api.beat) { ctx.fillStyle = rgba(c.hi); ctx.fillRect(sx - shift + (txt ? tw : 0) + 3, INPUT_Y - 17, 3, 34); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = ia;
    const pulse = Math.max(0, ...ev.filter(e => e.type === 'user' && u >= e.ta).map(e => Math.exp(-(u - e.ta) * 12)));
    dot(ctx, sbx, INPUT_Y, 29 * (1 - 0.12 * pulse), mixRgb(c.main, c.hi, pulse));
    ctx.translate(sbx, INPUT_Y); ctx.rotate(-Math.PI / 2); arrow(ctx, 0, 0, 10, c.onMain, 3);
    ctx.restore();
  }

  function bubble(text, user, ta, yy, words = Infinity) {
    setFont(ctx, 500, 30, 'Inter', -0.4);
    const ls = wrap(ctx, text, bubbleMax), tw = Math.max(...ls.map(l => ctx.measureText(l).width));
    const bw = tw + 56, bh = ls.length * 40 + 30, x = user ? PX + PW - 40 - bw : PX + 40;
    const s = spring(u - ta, 16, 9);
    withScale(ctx, user ? x + bw : x, yy + bh, 0.55 + 0.45 * s, () => {
      ctx.globalAlpha = prog(u, ta, ta + 0.08);
      rrect(ctx, x, yy, bw, bh, [28, 28, user ? 8 : 28, user ? 28 : 8]); ctx.fillStyle = rgba(user ? c.main : c.surface); ctx.fill();
      ctx.fillStyle = rgba(user ? c.onMain : c.ink); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      let wc = 0;
      ls.forEach((l, i) => { let xx = x + 28; for (const w of l.split(' ')) { if (wc < words) ctx.fillText(w, xx, yy + 5 + 40 * (i + 1)); xx += ctx.measureText(w + ' ').width; wc++; } });
      ctx.globalAlpha = 1;
    });
  }
  function typing(ta, yy) {
    const s = spring(u - ta, 16, 9), x = PX + 40;
    withScale(ctx, x, yy + 70, 0.55 + 0.45 * s, () => {
      ctx.globalAlpha = prog(u, ta, ta + 0.08); rrect(ctx, x, yy, 118, 70, [28, 28, 28, 8]); ctx.fillStyle = rgba(c.surface); ctx.fill();
      for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin((u - ta) * 14 - i * 0.9)); dot(ctx, x + 36 + i * 22, yy + 35 - 6 * b, 6.5, mixRgb(c.faint, c.hi, b)); }
      ctx.globalAlpha = 1;
    });
  }
  function card(i, ta, x, yy, w) {
    const e = EASE.expo(prog(u, ta, ta + 0.45)), k = w / 258, h = 318 * k;
    ctx.save(); ctx.globalAlpha = prog(u, ta, ta + 0.1); ctx.translate(0, (1 - e) * 60);
    rrect(ctx, x, yy, w, h, 22); ctx.fillStyle = rgba(PAPER); ctx.fill();
    ctx.save(); rrect(ctx, x, yy, w, h, 22); ctx.clip(); ctx.fillStyle = rgba(mixRgb(PAPER, [0, 0, 0], 0.045)); ctx.fillRect(x, yy, w, 200 * k); ctx.restore();
    drawProduct(ctx, artFor(P, i), x + w / 2, yy + 108 * k, 0.95 * k, L.swatches[0]);
    const name = P[`p${i + 1}`], price = P[`p${i + 1}price`];
    setFont(ctx, 600, 23 * Math.max(0.8, k), 'Inter', -0.4); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(PAPER_INK); ctx.fillText(name, x + 20 * k, yy + 240 * k);
    setFont(ctx, 700, 25 * Math.max(0.8, k), 'Inter', -0.4); ctx.fillStyle = rgba(c.price); ctx.fillText(price, x + 20 * k, yy + 282 * k);
    dot(ctx, x + w - 38 * k, yy + 272 * k, 19 * k, PAPER_INK);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 * k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + w - 45 * k, yy + 272 * k); ctx.lineTo(x + w - 31 * k, yy + 272 * k); ctx.moveTo(x + w - 38 * k, yy + 265 * k); ctx.lineTo(x + w - 38 * k, yy + 279 * k); ctx.stroke();
    ctx.restore();
  }
  function detail(e, yy) {
    const x = PX + 40, w = Math.min(640, PW - 80), h = 212, ee = EASE.expo(prog(u, e.ta, e.ta + 0.45)), sw = L.swatches;
    ctx.save(); ctx.globalAlpha = prog(u, e.ta, e.ta + 0.1); ctx.translate(0, (1 - ee) * 50);
    rrect(ctx, x, yy, w, h, 24); ctx.fillStyle = rgba(PAPER); ctx.fill();
    rrect(ctx, x + 11, yy + 11, 190, 190, 16); ctx.fillStyle = rgba(mixRgb(PAPER, [0, 0, 0], 0.045)); ctx.fill();
    const cm = EASE.css(prog(u, e.swap, e.swap + 0.28));
    drawProduct(ctx, artFor(P, 1), x + 106, yy + 116, 0.98, mixRgb(sw[0], sw[1], cm));
    const ix = x + 228, iw = w - 228 - 20;
    const title = P.detail || P.p2, tsz = fit(ctx, title, { family: 'Inter', weight: 600, max: 26, min: 16, width: iw });
    setFont(ctx, 600, tsz, 'Inter', -0.5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(PAPER_INK); ctx.fillText(title, ix, yy + 50);
    setFont(ctx, 700, 26, 'Inter', -0.4); ctx.fillStyle = rgba(c.price); ctx.fillText(P.p2price, ix, yy + 86);
    sw.forEach((col, i) => dot(ctx, ix + 16 + i * 44, yy + 124, 14, col));
    ctx.strokeStyle = rgba(c.price); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ix + 16 + 44 * EASE.expo(prog(u, e.swap, e.swap + 0.25)), yy + 124, 20, 0, TAU); ctx.stroke();
    const lab = cm > 0.5 ? `${P.variantB}${P.stock ? ' · ' + P.stock : ''}` : P.variantA;
    const lsz = fit(ctx, lab, { family: 'Inter', weight: 500, max: 21, min: 13, width: iw - 150 });
    setFont(ctx, 500, lsz, 'Inter', -0.2); ctx.fillStyle = rgba(mixRgb(PAPER_INK, PAPER, 0.35)); ctx.fillText(lab, ix + 144, yy + 131);
    const done = u >= e.press + 0.06, bs = u >= e.press ? 0.94 + 0.06 * spring(u - e.press, 24, 10) : 1, bw = Math.min(260, iw);
    withScale(ctx, ix + bw / 2, yy + 176, bs, () => {
      pill(ctx, ix + bw / 2, yy + 176, bw, 50); ctx.fillStyle = rgba(done ? mixRgb(c.price, [255, 255, 255], 0.12) : c.price); ctx.fill();
      const label = done ? P.added : P.add, fsz = fit(ctx, label, { family: 'Inter', weight: 600, max: 22, min: 13, width: bw - (done ? 70 : 36) });
      setFont(ctx, 600, fsz, 'Inter', -0.3); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(onColor(c.price));
      if (done) { const dw = ctx.measureText(label).width; ctx.fillText(label, ix + bw / 2 - 12, yy + 177); check(ctx, ix + bw / 2 - 12 + dw / 2 + 18, yy + 176, 8, onColor(c.price), 3); }
      else ctx.fillText(label, ix + bw / 2, yy + 177);
    });
    ctx.restore();
  }
}

// ───────────────────────────── bar 4 · manifesto → particles
function layoutStatement(api) {
  const { font } = api, g = document.createElement('canvas').getContext('2d');
  const longest = L.lines.reduce((a, l) => (l.text.length > a.length ? l.text : a), '');
  const size = fit(g, longest, { family: font.display, weight: font.weight, max: 112, min: 44, width: L.sw - 80, tracking: -0.045 });
  let y = 0, beat = 0, lastT = null, prevStrike = false;
  L.lines.forEach((l, i) => {
    const strike = l.style === 'strike';
    if (i > 0) y += size * 1.18 + (prevStrike && !strike ? size * 0.59 : 0);
    if (strike) { l.t = beat * 0.375; beat++; lastT = null; } else { l.t = lastT == null ? beat * 0.375 : lastT + 0.15; lastT = l.t; }
    l.y = y; prevStrike = strike;
  });
  const span = L.lines.length ? L.lines[L.lines.length - 1].y : 0;
  for (const l of L.lines) l.y += L.scy + 21 - span / 2;
  L.stSize = size; L.stX = L.sx + 40;
}
function paintStatement(ctx, api, u, final) {
  const { font } = api, c = L.c, size = L.stSize, X = L.stX;
  for (const l of L.lines) {
    const q = final ? 1 : EASE.expo(prog(u, l.t, l.t + 0.5));
    if (q <= 0) continue;
    setFont(ctx, font.weight, size, font.display, -0.045 * size); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(l.text).width;
    ctx.save(); ctx.beginPath(); ctx.rect(0, l.y - size * 1.1, L.Wd, size * 1.5); ctx.clip();
    ctx.translate(0, (1 - q) * size * 1.16);
    const sk = l.style === 'strike' ? (final ? 1 : EASE.expo(prog(u, l.t + 0.2, l.t + 0.34))) : 0;
    if (l.style === 'accent') { const g = ctx.createLinearGradient(X, 0, X + w, 0); g.addColorStop(0, rgba(c.hi)); g.addColorStop(1, rgba(c.gradB)); ctx.fillStyle = g; }
    else ctx.fillStyle = rgba(mixRgb(c.ink, c.dim, sk));
    ctx.fillText(l.text, X, l.y);
    if (sk > 0) { ctx.fillStyle = rgba(c.muted); ctx.fillRect(X - 6, l.y - size * 0.36, (w + 12) * sk, Math.max(4, size * 0.0625)); }
    ctx.restore();
  }
}
function statement(ctx, u, api) {
  if (u < 1.1) paintStatement(ctx, api, u, false);
  const x = prog(u, 1.04, 1.12);
  if (x <= 0) return;
  for (const q of L.parts) {
    const s0 = 1.1 + (q.x / L.Wd) * 0.12, e = E.inOutCubic(prog(u, s0, s0 + 0.26));
    dot(ctx, lerp(q.x, q.gx, e), lerp(q.y, q.gy, e), lerp(5.4, 3.4, e), mixRgb(q.c, L.c.ink, e), x);
  }
  const ga = prog(u, 1.28, 1.5);
  if (ga > 0) for (const g of L.grid.pts) dot(ctx, L.Wd / 2 + g.x, L.Hd / 2 + g.y, 3.4, L.c.ink, ga);
}

// ───────────────────────────── bar 5 · channels → one inbox
function channels(ctx, u, api) {
  const { P, font } = api, c = L.c;
  const chans = list(P.channels, 8), N = Math.max(1, chans.length);
  const CY = L.scy + 50, RX = Math.min(336, L.sw / 2 - 130), RY = Math.min(304, L.sh / 2 - 170);
  const chipAt = k => 0.1 + k * Math.min(0.1875, 0.95 / N);
  const pos = k => { const a = (-90 + (360 / N) * k) * Math.PI / 180; return [L.scx + Math.cos(a) * RX, CY + Math.sin(a) * RY]; };
  const colOf = n => (CHANNEL_COLORS.find(([re]) => re.test(n))?.[1] ?? c.hi);
  const packets = [];
  for (let k = 0; k < chans.length; k++) for (let j = 0; j < 3; j++) packets.push({ k, t: chipAt(k) + 0.12 + j * 0.13, w: 4 + Math.floor(hash(k * 7 + j) * 9) });
  for (const d of L.grid.pts) {
    let x = d.x, y = d.y, r = 3.4, col = c.ink;
    for (let k = 0; k < chans.length; k++) {
      const ur = u - chipAt(k);
      if (ur < 0 || ur > 1) continue;
      const [cx, cy] = pos(k), dx = L.Wd / 2 + d.x - cx, dy = L.Hd / 2 + d.y - cy, dd = Math.hypot(dx, dy) + 1e-3;
      const w = Math.exp(-Math.pow((dd - ur * 1100) / 60, 2)) * (1 - ur);
      if (w < 0.002) continue;
      r += 4 * w; x += (dx / dd) * 12 * w; y += (dy / dd) * 12 * w; col = mixRgb(col, k % 2 ? c.gradB : c.hi, clamp(w * 1.5));
    }
    dot(ctx, L.Wd / 2 + x, L.Hd / 2 + y, r, col);
  }
  const oa = 1 - prog(u, 1.3, 1.5);
  if (oa <= 0) return;
  ctx.save(); ctx.globalAlpha = oa;
  const cp = EASE.expo(prog(u, 0.02, 0.5)), title = api.text('channelsTitle');
  const tsz = fit(ctx, title, { family: font.display, weight: font.weight, max: 58, min: 26, width: L.sw * 0.94, tracking: -0.04 });
  ctx.save(); ctx.beginPath(); ctx.rect(0, L.sy, L.Wd, 110); ctx.clip();
  setFont(ctx, font.weight, tsz, font.display, -0.04 * tsz); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(c.ink); ctx.fillText(title, L.scx, L.sy + 80 + (1 - cp) * 90);
  ctx.restore();
  for (const p of packets) {
    const e = E.inOutCubic(prog(u, p.t, p.t + 0.42));
    if (e <= 0 || e >= 1) continue;
    const [sx, sy] = pos(p.k);
    for (let g = 0; g < 5; g++) { const eg = E.inOutCubic(prog(u - g * 0.018, p.t, p.t + 0.42)); dot(ctx, lerp(sx, L.scx, eg), lerp(sy, CY, eg), 7 - g, c.hi, (1 - g / 5) * 0.9); }
  }
  chans.forEach((name, k) => {
    const s = spring(u - chipAt(k), 18, 8);
    if (s <= 0) return;
    const [x, y] = pos(k);
    setFont(ctx, 500, 28, 'Inter', -0.4);
    const w = ctx.measureText(name).width + 74;
    const hit = packets.filter(p => p.k === k && u >= p.t).reduce((m, p) => Math.max(m, Math.exp(-(u - p.t) * 14)), 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + 0.06 * hit), s * (1 + 0.06 * hit));
    pill(ctx, 0, 0, w, 64); ctx.fillStyle = rgba(c.surface, 0.96); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(mixRgb(c.line, c.hi, hit)); ctx.stroke();
    dot(ctx, -w / 2 + 30, 0, 7, colOf(name));
    ctx.fillStyle = rgba(c.ink); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(name, -w / 2 + 48, 1);
    ctx.restore();
  });
  const ib = spring(u - 0.45, 14, 8);
  if (ib > 0) {
    let count = 0, last = -9;
    for (const p of packets) if (u >= p.t + 0.42) { count += p.w; last = Math.max(last, p.t + 0.42); }
    const bump = Math.exp(-(u - last) * 12);
    setFont(ctx, 600, 31, 'Inter', -0.6);
    const lw = ctx.measureText(P.inbox).width, bw = lw + 150;
    ctx.save(); ctx.translate(L.scx, CY); ctx.scale(ib * (1 + 0.05 * bump), ib * (1 + 0.05 * bump));
    pill(ctx, 0, 0, bw, 84); ctx.fillStyle = rgba(c.main); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(c.onMain); ctx.fillText(P.inbox, -bw / 2 + 34, 1);
    pill(ctx, bw / 2 - 55, 0, 72, 44); ctx.fillStyle = rgba(c.onMain); ctx.fill();
    setFont(ctx, 700, 23, 'Inter', -0.3); ctx.textAlign = 'center'; ctx.fillStyle = rgba(c.main); ctx.fillText(String(count), bw / 2 - 55, 1);
    ctx.restore();
  }
  ctx.restore();
}

// ───────────────────────────── bar 6 · the grid becomes the logo
function logoFromDots(ctx, u, api) {
  const c = L.c, G = L.grid, N = G.pts.length, LP = L.logo.pts;
  const tilt = 1.0 * E.inOutCubic(prog(u, 0, 0.65)), yaw = 0.35 * E.inOutCubic(prog(u, 0, 1.4)), amp = 70 * E.inOutCubic(prog(u, 0, 0.5));
  const items = [];
  G.pts.forEach((d, gi) => {
    let z = 0, col = c.ink;
    if (amp > 0) {
      const h = (Math.sin(d.d * 0.012 - u * 7.5) + 0.45 * Math.sin(d.x * 0.008 + d.y * 0.005 + u * 4)) * amp;
      z = -h; col = h > 0 ? mixRgb(col, c.hi, clamp(h / amp)) : mixRgb(col, c.main, clamp(-h / amp) * 0.8);
    }
    const P3 = project3D(d.x, d.y, z, { tilt, yaw, D: 1400 });
    const rank = L.rank[gi], tgt = LP.length ? LP[Math.floor((rank / N) * LP.length)] : { x: 0, y: 0, c: c.ink };
    const s0 = 0.68 + 0.28 * (rank / N), e = E.inOutCubic(prog(u, s0, s0 + 0.5));
    items.push({
      x: lerp(L.Wd / 2 + P3.x, L.scx + tgt.x, e), y: lerp(L.Hd / 2 - 30 * tilt + P3.y, L.scy + tgt.y, e),
      r: lerp(3.4 * P3.s, L.logo.r, e), col: mixRgb(col, tgt.c, e), a: lerp(clamp(0.3 + 0.7 * P3.s), 1, e) * (1 - prog(u, 1.22, 1.42)), z: P3.z * (1 - e),
    });
  });
  items.sort((a, b) => b.z - a.z);
  for (const o of items) if (o.a > 0) dot(ctx, o.x, o.y, o.r, o.col, o.a);
  const la = E.outCubic(prog(u, 1.05, 1.32));
  if (la > 0) drawAsset(ctx, api.assets.logo, L.scx, L.scy, L.logo.w * (0.96 + 0.04 * la), L.logo.h * (0.96 + 0.04 * la), { alpha: la });
}

// ───────────────────────────── bar 7 · formula + dive
function formula(ctx, u, api) {
  const { P, font, assets } = api, c = L.c;
  const items = list(P.formula, 4), n = items.length;
  const mv = EASE.expo(prog(u, 0, 0.45)), dive = E.inExpo(prog(u, 1.1, 1.5));
  const top = Math.min(L.scy + 100, L.sb - 40 - (n - 1) * 84);
  const regionTop = L.sy + 10, regionBot = top - 90, k = Math.min(0.79, ((regionBot - regionTop) * 0.92) / L.logo.h);
  const ty = (regionTop + regionBot) / 2;
  const sc = lerp(1, k, mv) * Math.exp(dive * Math.log(26));
  const y = lerp(lerp(L.scy, ty, mv), L.scy, E.outCubic(prog(u, 1.1, 1.4)));
  drawAsset(ctx, assets.logo, L.scx, y, L.logo.w * sc, L.logo.h * sc);
  const ta = 1 - prog(u, 1.08, 1.22);
  if (ta > 0) {
    const g = document.createElement('canvas').getContext('2d');
    const longest = items.reduce((a, s, i) => ((i ? '+ ' : '') + s).length > a.length ? (i ? '+ ' : '') + s : a, '');
    const size = fit(g, longest, { family: font.display, weight: font.weight, max: 64, min: 30, width: L.sw * 0.9, tracking: -0.04 });
    items.forEach((it, i) => {
      const s0 = [0.02, 0.375, 0.75, 0.9375][i], q = EASE.expo(prog(u, s0, s0 + 0.45));
      if (q <= 0) return;
      const pre = i ? '+ ' : '', yy = top + i * 84;
      setFont(ctx, font.weight, size, font.display, -0.04 * size); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const fw = ctx.measureText(pre + it).width, pw = ctx.measureText(pre).width, x = L.scx - fw / 2;
      ctx.save(); ctx.globalAlpha = ta; ctx.beginPath(); ctx.rect(0, yy - size * 1.1, L.Wd, size * 1.45); ctx.clip();
      ctx.translate(0, (1 - q) * 84);
      if (pre) { ctx.fillStyle = rgba(c.hi); ctx.fillText(pre, x, yy); }
      ctx.fillStyle = rgba(c.ink); ctx.fillText(it, x + pw, yy);
      ctx.restore();
    });
  }
  const wash = prog(dive, 0.55, 1);
  if (wash > 0) { const g = ctx.createLinearGradient(0, 0, 0, L.Hd); g.addColorStop(0, rgba(c.hi, wash)); g.addColorStop(1, rgba(c.gradB, wash)); ctx.fillStyle = g; ctx.fillRect(0, 0, L.Wd, L.Hd); }
}

// ───────────────────────────── bars 8–9 · glass end card
function endCard(ctx, u, api) {
  const { P, font, assets } = api, G = L.glass, c = L.c, dy = L.scy - 541, W = L.Wd, H = L.Hd;
  setFont(ctx, 600, 28, 'Inter', -0.5);
  const cw = Math.min(L.sw, ctx.measureText(P.cta).width + 136), ctaY = 806 + dy, ctaX = L.scx + cw / 2 - 42;
  const cp = EASE.css(prog(u, 1.2, 1.78));
  const cur = [lerp(L.sx + L.sw + 60, ctaX - 4, cp) + Math.sin(cp * Math.PI) * -60, lerp(L.sb + 80, ctaY, cp)];
  const hov = EASE.css(prog(u, 1.62, 1.95)), click = u >= 1.98 ? Math.exp(-(u - 1.98) * 10) : 0;
  glassSlats(ctx, W, H, g => {
    g.fillStyle = rgba(G.base); g.fillRect(0, 0, W, H);
    radialBlob(g, W * 0.19 + 60 * Math.sin(u * 0.9), H * 0.17, 520, G.glows[0], 0.55);
    radialBlob(g, W * 0.83, H * 0.88, 560, G.glows[1], 0.3);
    radialBlob(g, W * 0.9, H * 0.15 + 60 * Math.sin(u), 380, G.glows[2], 0.22);
    radialBlob(g, cur[0], cur[1], 330, G.cta, 0.4 * prog(u, 1.2, 1.5));
  }, { drift: u * 14, width: 150 });
  // badge
  const bs = spring(u - 0.12, 13, 7.5);
  ctx.save(); ctx.translate(L.scx, 250 + dy); ctx.scale(bs, bs);
  ctx.shadowColor = 'rgba(15,23,42,0.28)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  dot(ctx, 0, 0, 96, mixRgb(api.colors.dark ? api.colors.bg : DARK, [0, 0, 0], 0.1));
  ctx.restore();
  if (bs > 0.02) drawAsset(ctx, assets.logo, L.scx, 250 + dy, 136 * bs, 136 * bs);
  // wordmark, letter by letter out of a mask
  const word = api.text('title'), wsz = fit(ctx, word, { family: font.display, weight: font.weight, max: 132, min: 50, width: L.sw * 0.92, tracking: -0.045 });
  setFont(ctx, font.weight, wsz, font.display, -0.045 * wsz); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const chars = [...word], xs = [0];
  for (let i = 1; i <= chars.length; i++) xs.push(ctx.measureText(chars.slice(0, i).join('')).width);
  const x0 = L.scx - xs[chars.length] / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 500 + dy - wsz * 1.05, W, wsz * 1.33); ctx.clip(); ctx.fillStyle = rgba(G.ink);
  chars.forEach((ch, i) => { const q = EASE.expo(prog(u, 0.28 + i * 0.03, 0.83 + i * 0.03)); ctx.fillText(ch, x0 + xs[i], 500 + dy + (1 - q) * wsz * 1.15); });
  ctx.restore();
  if (P.tagline) {
    const ea = EASE.expo(prog(u, 0.55, 1.0));
    setFont(ctx, 500, 30, 'Inter', 1); ctx.textAlign = 'center'; ctx.fillStyle = rgba(G.muted, ea);
    ctx.fillText(P.tagline, L.scx, 558 + dy + (1 - ea) * 16);
  }
  const g2 = document.createElement('canvas').getContext('2d');
  const hl = fitLines(g2, P.headline, { family: 'Inter', weight: 500, max: 46, min: 24, width: L.sw * 0.92, lines: 2, tracking: -0.035 });
  hl.lines.slice(0, 2).forEach((l, i) => {
    const q = EASE.expo(prog(u, 0.72 + i * 0.08, 1.25 + i * 0.08)), yy = 660 + dy + i * hl.size * 1.26;
    setFont(ctx, 500, hl.size, 'Inter', -0.035 * hl.size); ctx.textAlign = 'center';
    ctx.save(); ctx.beginPath(); ctx.rect(0, yy - hl.size * 1.08, W, hl.size * 1.4); ctx.clip();
    ctx.fillStyle = rgba(G.ink); ctx.fillText(l, L.scx, yy + (1 - q) * hl.size * 1.4); ctx.restore();
  });
  const cs = spring(u - 1.0, 15, 8);
  if (cs > 0) {
    ctx.save(); ctx.translate(L.scx, ctaY); ctx.scale(cs * (1 - 0.04 * click), cs * (1 - 0.04 * click));
    ctx.shadowColor = rgba(G.cta, 0.35); ctx.shadowBlur = 30 + 20 * hov; ctx.shadowOffsetY = 10;
    pill(ctx, 0, 0, cw, 80); ctx.fillStyle = rgba(mixRgb(G.cta, [0, 0, 0], 0.14 * hov)); ctx.fill();
    ctx.shadowColor = 'transparent';
    const csz = fit(ctx, P.cta, { family: 'Inter', weight: 600, max: 28, min: 16, width: cw - 136 });
    setFont(ctx, 600, csz, 'Inter', -0.5); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(G.onCta);
    ctx.fillText(P.cta, -cw / 2 + 36, 1);
    dot(ctx, cw / 2 - 42, 0, 29, G.onCta);
    ctx.save(); ctx.beginPath(); ctx.arc(cw / 2 - 42, 0, 29, 0, TAU); ctx.clip();
    arrow(ctx, cw / 2 - 42 + hov * 40, 0, 10, G.cta, 3); arrow(ctx, cw / 2 - 82 + hov * 40, 0, 10, G.cta, 3);
    ctx.restore(); ctx.restore();
    if (click > 0.01) { ctx.strokeStyle = rgba(G.cta, click); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ctaX, ctaY, 30 + 120 * (1 - click), 0, TAU); ctx.stroke(); }
  }
  if (P.url) {
    const ua = EASE.expo(prog(u, 1.2, 1.6));
    setFont(ctx, 500, 30, 'Inter', -0.3); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(G.muted, ua); ctx.fillText(P.url, L.scx, 928 + dy + (1 - ua) * 14);
  }
  if (u > 1.2) pointer(ctx, cur[0], cur[1], 1.1, click);
  const wash = 1 - EASE.expo(prog(u, 0, 0.5));
  if (wash > 0.003) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(c.hi, wash)); g.addColorStop(1, rgba(c.gradB, wash)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}
