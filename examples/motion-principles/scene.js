// examples/motion-principles · ported from the ft-studio template of the same name. project.json plays the 15 s
// choreography at speed 0.75 (= 20 s); set "speed": 1 for the original tempo or 0.6 for 25 s. Copy, colours,
// font and logo live in COPY / BRAND below; engine/brand.js turns them into a palette, a safe area and a logo.
// motion-principles · a 15 s choreography at 160 BPM (bar = 1.5 s). The project speed (project.json, 0.75 = 20 s)
// plays it slower, sound included. Every word acts out what it names.
//   bar 0      a line of code types itself (syntax-coloured) and collapses into a dot
//   bars 1–2   the dot pops, a shockwave births a grid, coloured ripples cross it; it tilts into a
//              3D wave landscape and spirals into a vortex
//   bar 3      TIMING: letters rise on a precise stagger over a keyframe timeline and the easing curve
//   bar 4      RHYTHM: letters hop on the beat (anticipation, flight, squash) over a 16-step sequencer
//   bar 5      CONTRAST: hard cut to the light field, halves slide in, a divider inverts the frame
//   bar 6      SQUASH: a ball bounces across the letters, ball and letters squash on impact
//   bar 7      MORPH: circle → square → triangle → star with onion skins, then an implosion
//   bars 8–9   flash, shockwave, chromatic slam title, rolling counters, typed signature; optionally
//              everything folds back into the opening cursor so the video loops
import { TAU, clamp, lerp, prog, rgba, E, EASE, spring, setFont, layout, glyph, grid, project3D, SHAPES, morphPath, vignette, hash } from '../../engine/core.js';
import { brandApi, fit, mixRgb, contrast, lum } from '../../engine/brand.js';

const BASE = 15, SEG = [0, 1.5, 4.5, 6, 7.5, 9, 10.5, 12];
const MONO = '"JetBrains Mono"';
const EASE_T = t => EASE.expo(t);
const list = (s, n = 99) => String(s ?? '').split(',').map(x => x.trim()).filter(Boolean).slice(0, n);
let L = null;

async function loadMono() {
  // document.fonts.check() is also true when no @font-face matches, so look for the loaded face itself
  if ([...document.fonts].some(f => f.family.replace(/"/g, '') === 'JetBrains Mono' && f.status === 'loaded')) return;
  await new Promise(ok => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/node_modules/@fontsource/jetbrains-mono/500.css'; l.onload = l.onerror = ok; document.head.append(l); });
  await document.fonts.load(`500 40px ${MONO}`, 'AaÇçĞğİıÖöŞşÜü0123456789=()+·—%');
}
function hueShift([r, g, b], deg) {           // a cool third colour from the brand's main colour
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  h = (h + deg + 360) % 360;
  const L2 = clamp(l, 0.55, 0.72), S2 = clamp(s, 0.55, 0.9), c = (1 - Math.abs(2 * L2 - 1)) * S2, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = L2 - c / 2;
  const [a, b2, c2] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(a + m) * 255, (b2 + m) * 255, (c2 + m) * 255];
}

// ───────────────────────────── copy & brand: edit these (or add a language)
const COPY = {
  "tr": {
    "code": "hareket = f(t)",
    "w1": "ZAMANLAMA",
    "w2": "RİTİM",
    "w3": "KONTRAST",
    "w4": "ESNEME",
    "w5": "DÖNÜŞÜM",
    "shapes": "daire, kare, üçgen, yıldız",
    "title": "Hepsi kod.",
    "stats": "0 keyframe, 0 eklenti, 1 fonksiyon",
    "signature": "görüntü + ses: %100 kod — Nova Stüdyo",
    "hud": true,
    "hudLabel": "NOVA  ·  f(t)",
    "loop": true
  },
  "en": {
    "code": "motion = f(t)",
    "w1": "TIMING",
    "w2": "RHYTHM",
    "w3": "CONTRAST",
    "w4": "SQUASH",
    "w5": "MORPH",
    "shapes": "circle, square, triangle, star",
    "title": "It's all code.",
    "stats": "0 keyframes, 0 plugins, 1 function",
    "signature": "picture + sound: 100% code — Nova Studio",
    "hud": true,
    "hudLabel": "NOVA  ·  f(t)",
    "loop": true
  }
};
// logo: a file next to this scene, e.g. new URL('logo.png', import.meta.url).href — null draws a monogram
const BRAND = { bg: '#0E0D0B', main: '#E8704A', accent: '#F2B84B', font: 'Archivo Black', weight: 400, logo: null };

let A = null;   // the brand api (engine/brand.js): palette, safe area, copy, logo
export default {
  async setup(api) {
    const copy = COPY[api.lang] ?? COPY.tr;
    A = await brandApi(api, { brand: { ...BRAND, name: copy.title }, copy, base: BASE });
    await setupScene(A);
  },
  draw(ctx, t) { drawScene(ctx, t, A); },
  post(ctx, t, api) { vignette(ctx, api.W, api.H, A.colors.dark ? 0.3 : 0.08); },
};

async function setupScene(api) {
    await loadMono();
    const { W, H, u, fmt, colors: C } = api, s = fmt.safe;
    const a1 = C.pop, a2 = contrast(C.accent, C.bg) >= 1.5 ? C.accent : mixRgb(C.pop, C.text, 0.5);
    L = { cx: s.cx, cy: s.cy, sw: s.w, sh: s.h, s, a1, a2, a3: hueShift(a1, 205), ink: C.text, dim: mixRgb(C.text, C.bg, 0.5), faint: mixRgb(C.text, C.bg, 0.62) };
    // 'difference' blends need the lighter of the two base colours to flip text correctly on any theme
    [L.lightC, L.darkC] = lum(C.text) >= lum(C.bg) ? [C.text, C.bg] : [C.bg, C.text];
    L.code = codeMetrics(api);
}
function drawScene(ctx, t, api) {
    const ts = t * (BASE / api.duration), C = api.colors;
    ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, api.W, api.H);
    let i = SEG.length - 1;
    while (i > 0 && ts < SEG[i]) i--;
    const u = ts - SEG[i];
    const shake = [[1.5, 5], [4.5, 7], [7.5, 9], [12, 24]].reduce((a, [t0, amp]) => a + (ts >= t0 ? amp * Math.exp(-(ts - t0) * 9) : 0), 0) * api.u;
    ctx.save(); ctx.translate(Math.sin(ts * 97) * shake, Math.cos(ts * 83) * shake);
    [codeTyping, dotField, wordTiming, wordRhythm, wordContrast, wordSquash, shapeMorph, slamEnd][i](ctx, u, api);
    ctx.restore();
    if (api.P.hud) hud(ctx, t, ts, api);
}

// ───────────────────────────── bar 0 · code typing → dot
const OPS = new Set('=+-*/<>(),;:{}[]'.split(''));
function codeMetrics(api) {
  const { u } = api, text = api.P.code || 'f(t)';
  const g = document.createElement('canvas').getContext('2d');
  const px = fit(g, text, { family: MONO, weight: 500, max: 76 * u, min: 30 * u, width: L.sw * 0.82 });
  setFont(g, 500, px, MONO); const cw = g.measureText('m').width;
  const roles = []; let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') { roles.push('op'); depth++; continue; }
    if (ch === ')') { roles.push('op'); depth = Math.max(0, depth - 1); continue; }
    if (OPS.has(ch) || ch === ' ') { roles.push('op'); continue; }
    if (depth > 0) { roles.push('arg'); continue; }
    let j = i; while (j < text.length && /[\p{L}\p{N}_$]/u.test(text[j])) j++;
    roles.push(text[j] === '(' ? 'fn' : 'ident');
  }
  return { text, px, cw, x0: L.cx - (cw * text.length) / 2, y: L.cy, roles };
}
function caret(ctx, x, y, h, col, u) {
  ctx.save(); ctx.shadowColor = rgba(col, 0.8); ctx.shadowBlur = h * 0.28; ctx.fillStyle = rgba(col); ctx.fillRect(x, y - h / 2, Math.max(3, 8 * u), h); ctx.restore();
}
function codeTyping(ctx, u, api) {
  const M = L.code, n = M.text.length, beat = api.beat;
  const col = { op: L.faint, fn: L.a1, arg: L.a2, ident: L.ink };
  const per = Math.min(0.05, 0.7 / Math.max(1, n)), at = i => 0.3 + i * per + (hash(i + 3) - 0.5) * per * 0.44;
  const push = 1 + 0.045 * E.inOutCubic(prog(u, 0.2, 1.2));
  ctx.save(); ctx.translate(L.cx, L.cy); ctx.scale(push, push); ctx.translate(-L.cx, -L.cy);
  let typed = 0; for (let i = 0; i < n; i++) if (u >= at(i)) typed = i + 1;
  const cp = E.inExpo(prog(u, 1.08, 1.46));
  setFont(ctx, 500, M.px, MONO); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  for (let i = 0; i < typed; i++) {
    if (M.text[i] === ' ') continue;
    const a = prog(u, at(i), at(i) + 0.07);
    ctx.globalAlpha = a * (1 - prog(cp, 0.75, 1));
    ctx.fillStyle = rgba(mixRgb(col[M.roles[i]], L.a1, cp));
    ctx.save(); ctx.translate(lerp(M.x0 + (i + 0.5) * M.cw, L.cx, cp), M.y + (1 - E.outCubic(a)) * 16 * api.u); ctx.scale(1 - 0.85 * cp, 1 - 0.6 * cp); ctx.fillText(M.text[i], 0, 0); ctx.restore();
  }
  ctx.globalAlpha = 1;
  const on = u < 0.3 ? u % beat < beat * 0.66 : u > 1.0 && u < 1.08 ? u % (beat / 2) < beat * 0.35 : true;
  if (on && cp < 0.9) caret(ctx, lerp(M.x0 + typed * M.cw + 6 * api.u, L.cx, cp), M.y, M.px * 1.16 * (1 - cp), L.a1, api.u);
  if (cp > 0.55) { ctx.save(); ctx.shadowColor = rgba(L.a1); ctx.shadowBlur = 30 * api.u; ctx.fillStyle = rgba(L.a1); ctx.beginPath(); ctx.arc(L.cx, L.cy, 12 * api.u * E.outBack(prog(cp, 0.55, 1)), 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

// ───────────────────────────── bars 1–2 · dot field → landscape → vortex
function dotField(ctx, u, api) {
  const { W, H, u: S } = api, t = u, gs = 64 * S;
  const nx = Math.ceil(W / 2 / gs), ny = Math.ceil(H / 2 / gs), G = grid(nx * 2 + 1, ny * 2 + 1, gs), DMAX = Math.hypot(nx * gs, ny * gs), RMAX = 1300 * S;
  const tilt = 1.02 * E.inOutCubic(prog(t, 1.5, 2.25)), yaw = 0.38 * E.inOutCubic(prog(t, 1.5, 3.0)), amp = 85 * S * E.inOutCubic(prog(t, 1.45, 2.1));
  const camY = -60 * S * E.inOutCubic(prog(t, 1.5, 2.25));
  const rip = [[0, 0, 0.75, L.a1], [-0.47, 0.24, 1.125, L.a2], [0.47, -0.24, 1.3125, L.a3], [0, 0, 1.5, L.a1]].map(([x, y, t0, c]) => ({ o: [x * L.sw / 2, y * L.sh / 2], t: t0, c }));
  const out = [];
  for (const d of G) {
    const ua = 0.9 * (1 - Math.cbrt(Math.max(0, 1 - d.d / RMAX))), s = spring(u - ua, 22, 7.5);
    if (s <= 0.001) continue;
    let x = d.x, y = d.y, z = 0, r = 3.6 * S * s, col = L.ink, al = 1;
    for (const q of rip) {
      const ur = t - q.t;
      if (ur < 0 || ur > 1.1) continue;
      const dx = d.x - q.o[0], dy = d.y - q.o[1], dd = Math.hypot(dx, dy) + 1e-3, w = Math.exp(-Math.pow((dd - ur * 1400 * S) / (75 * S), 2)) * (1 - ur / 1.1);
      if (w < 0.002) continue;
      r += 5.5 * S * w; x += (dx / dd) * 18 * S * w; y += (dy / dd) * 18 * S * w; col = mixRgb(col, q.c, clamp(w * 1.4));
    }
    if (amp > 0) {
      const h = (Math.sin((d.d / S) * 0.0105 - t * 7.5) + 0.45 * Math.sin((d.x / S) * 0.0065 + (d.y / S) * 0.004 + t * 4)) * amp;
      z = -h; col = h > 0 ? mixRgb(col, L.a1, clamp(h / amp)) : mixRgb(col, L.a3, clamp(-h / amp) * 0.7);
    }
    const vs = 2.2 + 0.32 * (d.d / DMAX), v = E.inCubic(prog(t, vs, Math.min(vs + 0.42, 2.98)));
    if (v > 0) {
      const a = v * (3.2 + 2 * (1 - d.d / DMAX)), ca = Math.cos(a), sa = Math.sin(a), k = 1 - v;
      [x, y] = [(x * ca - y * sa) * k, (x * sa + y * ca) * k]; z *= k; r *= 1 - 0.6 * v; col = mixRgb(col, L.a1, v); al = 1 - prog(v, 0.8, 1);
    }
    const P3 = project3D(x, y, z, { tilt, yaw, D: 1500 * S });
    out.push({ x: L.cx + P3.x, y: L.cy + camY + P3.y, r: r * P3.s, z: P3.z, col, al: al * clamp(0.25 + 0.75 * P3.s) });
  }
  out.sort((a, b) => b.z - a.z);
  for (const o of out) { ctx.fillStyle = rgba(o.col, o.al); ctx.beginPath(); ctx.arc(o.x, o.y, Math.max(0.1, o.r), 0, TAU); ctx.fill(); }
  const rp = prog(u, 0, 0.9);
  if (rp < 1) {
    ctx.strokeStyle = rgba(L.a1, (1 - rp) * 0.9); ctx.lineWidth = (2 + 6 * (1 - rp)) * S; ctx.beginPath(); ctx.arc(L.cx, L.cy, RMAX * E.outCubic(rp), 0, TAU); ctx.stroke();
    const rp2 = prog(u, 0.06, 1.0);
    ctx.strokeStyle = rgba(L.ink, (1 - rp2) * 0.35); ctx.lineWidth = 1.5 * S; ctx.beginPath(); ctx.arc(L.cx, L.cy, RMAX * E.outCubic(rp2) * 0.82, 0, TAU); ctx.stroke();
  }
  if (u < 0.35) { ctx.save(); ctx.shadowColor = rgba(L.a1); ctx.shadowBlur = 40 * S; ctx.fillStyle = rgba(L.a1); ctx.beginPath(); ctx.arc(L.cx, L.cy, (12 * (1 - prog(u, 0, 0.3)) + 30 * Math.sin(Math.PI * prog(u, 0, 0.18))) * S, 0, TAU); ctx.fill(); ctx.restore(); }
  if (t > 2.4) { ctx.save(); ctx.shadowColor = rgba(L.a1); ctx.shadowBlur = 50 * S; ctx.fillStyle = rgba(mixRgb(L.a1, L.ink, E.inExpo(prog(t, 2.7, 3.0)))); ctx.beginPath(); ctx.arc(L.cx, L.cy + camY, (3 + 22 * E.inExpo(prog(t, 2.4, 3.0))) * S, 0, TAU); ctx.fill(); ctx.restore(); }
}

// ───────────────────────────── words: shared fitting
function wordFont(ctx, api, text, max) {
  const { font, u } = api;
  const px = fit(ctx, text, { family: font.display, weight: font.weight, max: max * u, min: 60 * u, width: L.sw * 0.92 });
  const f = `${font.weight} ${px}px ${font.display}`;
  return { px, f, Lw: layout(ctx, text, f) };
}

// ───────────────────────────── bar 3 · TIMING
function wordTiming(ctx, u, api) {
  const S = api.u, word = api.text('w1') || 'TIMING';
  const { f, Lw } = wordFont(ctx, api, word, 220), n = word.length;
  const x0 = L.cx - Lw.total / 2, base = L.cy + 40 * S, st = 0.045 * Math.min(1, 0.36 / Math.max(0.36, (n - 1) * 0.045));
  ctx.font = f; ctx.letterSpacing = '0px'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - Lw.cap - 50 * S, api.W, Lw.cap + 72 * S); ctx.clip();
  ctx.fillStyle = rgba(L.ink);
  for (let i = 0; i < n; i++) {
    const s0 = 0.04 + i * st, pin = EASE_T(prog(u, s0, s0 + 0.55)), e0 = 1.02 + i * (0.2 / Math.max(1, n - 1)), pout = E.inExpo(prog(u, e0, e0 + 0.26));
    ctx.fillText(word[i], x0 + Lw.xs[i], base + (1 - pin) * (Lw.cap + 70 * S) - pout * (Lw.cap + 80 * S));
  }
  ctx.restore();
  const wa = prog(u, 0.1, 0.3) * (1 - prog(u, 1.0, 1.2));
  if (wa <= 0) return;
  ctx.save(); ctx.globalAlpha = wa;
  const ty = base + 70 * S, x1 = x0 + Lw.total, act = i => 0.04 + i * st + 0.22;
  let px2;
  if (u <= act(0)) px2 = lerp(x0, Lw.cx(x0, 0), prog(u, 0.1, act(0)));
  else if (u >= act(n - 1)) px2 = lerp(Lw.cx(x0, n - 1), x1, prog(u, act(n - 1), act(n - 1) + 0.2));
  else { let i = 0; while (u > act(i + 1)) i++; px2 = lerp(Lw.cx(x0, i), Lw.cx(x0, i + 1), prog(u, act(i), act(i + 1))); }
  ctx.lineWidth = 2 * S;
  ctx.strokeStyle = rgba(L.ink, 0.2); ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(x1, ty); ctx.stroke();
  ctx.strokeStyle = rgba(L.a1, 0.9); ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(px2, ty); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const on = u >= act(i), sz = 7 * S * (on ? 1 + 0.7 * Math.exp(-(u - act(i)) * 14) : 1);
    ctx.save(); ctx.translate(Lw.cx(x0, i), ty); ctx.rotate(Math.PI / 4);
    if (on) { ctx.fillStyle = rgba(L.a1); ctx.fillRect(-sz, -sz, sz * 2, sz * 2); }
    else { ctx.fillStyle = rgba(api.colors.bg); ctx.fillRect(-sz, -sz, sz * 2, sz * 2); ctx.strokeStyle = rgba(L.ink, 0.45); ctx.lineWidth = 1.5 * S; ctx.strokeRect(-sz, -sz, sz * 2, sz * 2); }
    ctx.restore();
  }
  ctx.fillStyle = rgba(L.a1); ctx.fillRect(px2 - S, ty - 18 * S, 2 * S, 36 * S);
  setFont(ctx, 500, 16 * S, MONO); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = rgba(L.ink, 0.55); ctx.textAlign = 'left';
  const ms = Math.round(st * 1000 * api.duration / BASE), dur = Math.round(550 * api.duration / BASE);
  ctx.fillText(api.lang === 'en' ? `${n} keyframes  ·  ${ms} ms stagger  ·  ${dur} ms` : `${n} anahtar kare  ·  ${ms} ms kaydırma  ·  ${dur} ms`, x0, ty + 46 * S);
  const gsz = 118 * S, gx = x1 - gsz, gy = ty + 40 * S, q = prog(u, 0.04, 0.59);
  ctx.strokeStyle = rgba(L.ink, 0.18); ctx.lineWidth = 1.5 * S; ctx.strokeRect(gx, gy, gsz, gsz);
  ctx.strokeStyle = rgba(L.a1); ctx.lineWidth = 2.5 * S; ctx.beginPath();
  for (let k = 0; k <= 60; k++) { const x = (k / 60) * q, X = gx + x * gsz, Y = gy + gsz - EASE_T(x) * gsz; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke();
  const dX = gx + q * gsz, dY = gy + gsz - EASE_T(q) * gsz;
  ctx.setLineDash([3 * S, 4 * S]); ctx.strokeStyle = rgba(L.ink, 0.3); ctx.lineWidth = S; ctx.beginPath(); ctx.moveTo(dX, gy + gsz); ctx.lineTo(dX, dY); ctx.lineTo(gx, dY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = rgba(L.a1); ctx.beginPath(); ctx.arc(dX, dY, 5 * S, 0, TAU); ctx.fill();
  if (gx - 18 * S - 240 * S > x0) { ctx.fillStyle = rgba(L.ink, 0.55); ctx.textAlign = 'right'; ctx.fillText('cubic-bezier(.16, 1, .3, 1)', gx - 18 * S, gy + gsz); }
  ctx.restore();
}

// ───────────────────────────── bar 4 · RHYTHM
function wordRhythm(ctx, u, api) {
  const S = api.u, B = 0.375, word = api.text('w2') || 'RHYTHM';
  for (let b = 0; b < 4; b++) {
    const x = u - b * B;
    if (x < 0 || x > 0.7) continue;
    const q = x / 0.7;
    ctx.strokeStyle = rgba(L.ink, 0.13 * (1 - q)); ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.arc(L.cx, L.cy - 40 * S, (180 + 900 * E.outCubic(q)) * S, 0, TAU); ctx.stroke();
  }
  const { f, Lw } = wordFont(ctx, api, word, 270), n = word.length, x0 = L.cx - Lw.total / 2, base = L.cy + 50 * S;
  ctx.font = f; ctx.letterSpacing = '0px'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  for (let j = 0; j < n; j++) {
    const lag = 0.03 * j, ent = E.outBack(prog(u, lag, lag + 0.3), 2.2);
    let yo = 0, sx = 1, sy = 1, air = 0;
    for (let b = 1; b <= 3; b++) {
      const land = b * B + lag, take = land - 0.24;
      if (u >= take - 0.06 && u < take) { const q = Math.sin(Math.PI * prog(u, take - 0.06, take)); sy *= 1 - 0.12 * q; sx *= 1 + 0.06 * q; }
      if (u >= take && u < land) { const s = (u - take) / 0.24; yo = -95 * S * 4 * s * (1 - s); air = Math.sin(Math.PI * s); sy *= 1 + 0.08 * air; sx *= 1 - 0.04 * air; }
      if (u >= land && u < land + 0.35) { const x = u - land, k = Math.exp(-11 * x) * Math.cos(24 * x); sy *= 1 - 0.2 * k; sx *= 1 + 0.1 * k; }
    }
    ctx.fillStyle = rgba(mixRgb(L.ink, j % 2 ? L.a2 : L.a1, air));
    glyph(ctx, word[j], Lw.cx(x0, j), base + yo, Lw.w(j), ent * sx, ent * sy);
  }
  const K = [0, 6, 10], SN = [4, 12], cw = 34 * S * Math.min(1, L.sw / (900 * S)), gap = cw * 0.29, tot = 16 * cw + 15 * gap + 3 * cw * 0.41, sx0 = L.cx - tot / 2, sy0 = base + 84 * S;
  const step = Math.floor(u / (B / 4));
  ctx.save(); ctx.globalAlpha = prog(u, 0.05, 0.25);
  for (let i = 0; i < 16; i++) {
    const x = sx0 + i * (cw + gap) + Math.floor(i / 4) * cw * 0.41, kind = K.includes(i) ? L.a1 : SN.includes(i) ? L.ink : null, played = i <= step, cur = i === step;
    const fl = cur ? 1 - prog(u - i * (B / 4), 0, (B / 4) * 1.5) : 0, k = 1 + 0.18 * fl * (kind ? 1 : 0.4), hh = cw * 0.88;
    ctx.save(); ctx.translate(x + cw / 2, sy0 + hh / 2); ctx.scale(k, k);
    if (kind) { ctx.fillStyle = rgba(kind, played ? 1 : 0.28); ctx.fillRect(-cw / 2, -hh / 2, cw, hh); }
    else { ctx.strokeStyle = rgba(L.ink, cur ? 0.7 : 0.2); ctx.lineWidth = 1.5 * S; ctx.strokeRect(-cw / 2 + S, -hh / 2 + S, cw - 2 * S, hh - 2 * S); }
    if (fl > 0) { ctx.fillStyle = rgba(L.ink, 0.5 * fl); ctx.fillRect(-cw / 2, -hh / 2, cw, hh); }
    ctx.restore();
  }
  if (L.sw > 800 * S) {
    setFont(ctx, 500, 16 * S, MONO); ctx.fillStyle = rgba(L.ink, 0.55); ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; ctx.fillText(`${Math.round(api.bpm * BASE / api.duration)} BPM`, sx0 - 24 * S, sy0 + cw * 0.44);
    ctx.textAlign = 'left'; ctx.fillText('4/4', sx0 + tot + 24 * S, sy0 + cw * 0.44);
  }
  ctx.restore();
}

// ───────────────────────────── bar 5 · CONTRAST
function wordContrast(ctx, u, api) {
  const { W, H, u: S } = api, word = api.text('w3') || 'CONTRAST', C = api.colors;
  const dx = u < 0.75 ? W : u < 1.125 ? lerp(W, L.cx, E.outExpo(prog(u, 0.75, 1.0))) : lerp(L.cx, 0, E.inOutExpo(prog(u, 1.125, 1.45)));
  ctx.fillStyle = rgba(L.darkC); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rgba(L.lightC); ctx.fillRect(0, 0, dx, H);
  const { f, Lw } = wordFont(ctx, api, word, 250), n = word.length, x0 = L.cx - Lw.total / 2, base = L.cy + 60 * S, mid = base - Lw.cap / 2;
  ctx.font = f; ctx.letterSpacing = '0px'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = rgba(L.lightC);
  for (const top of [true, false]) {
    const d = top ? 0.05 : 0, q = EASE_T(prog(u, d, d + 0.6)), off = (1 - q) * W * 0.8 * (top ? 1 : -1);
    ctx.save(); ctx.beginPath();
    top ? ctx.rect(0, base - Lw.cap - 50 * S, W, Lw.cap / 2 + 50 * S) : ctx.rect(0, mid, W, Lw.cap / 2 + 50 * S);
    ctx.clip();
    for (let i = 0; i < n; i++) ctx.fillText(word[i], x0 + Lw.xs[i] + off + (1 - q) * (i - (n - 1) / 2) * 30 * S, base);
    ctx.restore();
  }
  const hex = c => '#' + c.map(v => (v | 0).toString(16).padStart(2, '0')).join('').toUpperCase();
  const cap = `${hex(L.darkC)}  ×  ${hex(L.lightC)}`, cn = Math.floor(prog(u, 0.35, 0.7) * cap.length);
  setFont(ctx, 500, 22 * S, MONO); ctx.textAlign = 'center'; ctx.fillText(cap.slice(0, cn), L.cx, base + 86 * S);
  ctx.globalCompositeOperation = 'source-over';
  if (dx > 0 && dx < W) { ctx.fillStyle = rgba(L.a1); ctx.fillRect(dx - 3 * S, 0, 6 * S, H); }
}

// ───────────────────────────── bar 6 · SQUASH & STRETCH
function wordSquash(ctx, u, api) {
  const { W, u: S } = api, word = api.text('w4') || 'SQUASH';
  const { px, f, Lw } = wordFont(ctx, api, word, 230), n = word.length, x0 = L.cx - Lw.total / 2, base = L.cy + 190 * S, top = base - Lw.cap, R = 36 * S * clamp(px / (230 * S), 0.5, 1);
  const hits = Math.min(6, n), hit = i => 0.1875 * (i + 1) * (6 / hits), P = i => [Lw.cx(x0, i), top - R];
  const ball = t => {
    if (t < hit(0)) { const s = t / hit(0), [a, b] = P(0); return [lerp(a - 260 * S, a, s), lerp(L.s.y - 120 * S, b, s * s)]; }
    if (t < hit(hits - 1)) { let i = 0; while (t >= hit(i + 1)) i++; const s = (t - hit(i)) / (hit(i + 1) - hit(i)), [ax, ay] = P(i), [bx, by] = P(i + 1); return [lerp(ax, bx, s), lerp(ay, by, s) - 190 * S * 4 * s * (1 - s)]; }
    const s = (t - hit(hits - 1)) / 0.4, [a, b] = P(hits - 1); return [lerp(a, W + 160 * S, s), b - 700 * S * s + 380 * S * s * s];
  };
  const gl = E.outExpo(prog(u, 0, 0.45)) * (1 - prog(u, 1.3, 1.45));
  ctx.strokeStyle = rgba(L.ink, 0.2); ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.moveTo(L.cx - (Lw.total / 2 + 40 * S) * gl, base + 18 * S); ctx.lineTo(L.cx + (Lw.total / 2 + 40 * S) * gl, base + 18 * S); ctx.stroke();
  ctx.font = f; ctx.letterSpacing = '0px'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  for (let i = 0; i < n; i++) {
    const rise = E.outExpo(prog(u, i * 0.02, i * 0.02 + 0.35)), x = i < hits ? u - hit(i) : -1, k = x >= 0 ? Math.exp(-7 * x) * Math.cos(19 * x) : 0;
    const q = E.inBack(prog(u, 1.3 + i * 0.015, 1.42 + i * 0.015), 2);
    ctx.globalAlpha = rise; ctx.fillStyle = rgba(mixRgb(L.ink, L.a2, x >= 0 ? Math.exp(-5 * x) * 0.85 : 0));
    glyph(ctx, word[i], Lw.cx(x0, i), base + (1 - rise) * 40 * S, Lw.w(i), (1 + 0.15 * k) * (1 + 0.3 * q), (1 - 0.3 * k) * (1 - q));
  }
  ctx.globalAlpha = 1;
  const [bx, by] = ball(u), [ax, ay] = ball(u - 0.004), [cx, cy] = ball(u + 0.004), vx = (cx - ax) / 0.008, vy = (cy - ay) / 0.008, speed = Math.hypot(vx, vy) / S;
  let best = 1e9; for (let i = 0; i < hits; i++) best = Math.min(best, Math.abs(u - hit(i)));
  const q = Math.max(0, 1 - best / 0.04), st = 1 + clamp(speed / 9000, 0, 0.4), along = lerp(st, 0.58, q), perp = lerp(1 / st, 1.38, q), ang = q > 0 ? Math.PI / 2 : Math.atan2(vy, vx);
  ctx.save(); ctx.translate(bx, q > 0 ? lerp(by, top - R * along, q) : by); ctx.rotate(ang); ctx.scale(along, perp);
  ctx.fillStyle = rgba(L.a1); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.restore();
}

// ───────────────────────────── bar 7 · MORPH (onion skin)
function shapeMorph(ctx, u, api) {
  const S = api.u, names = list(api.P.shapes, 4), cols = [L.a1, L.a2, L.a3, L.a1];
  const sh = [SHAPES.circle, SHAPES.square, SHAPES.triangle, SHAPES.star], MT = [0.28, 0.56, 0.84], MROT = [0, Math.PI / 2, (4 * Math.PI) / 3, 2 * Math.PI];
  const at = uu => {
    let a = 0, b = 0, e = 0;
    for (let k = 0; k < 3; k++) if (uu >= MT[k]) { a = k; b = k + 1; e = prog(uu, MT[k], MT[k] + 0.24); }
    return { A: sh[a], B: sh[b], e: E.outBack(e, 1.6), rot: lerp(MROT[a], MROT[b], E.inOutCubic(e)) + 5 * Math.PI * E.inCubic(prog(uu, 1.08, 1.5)), sc: spring(uu, 14, 6) * (1 - E.inBack(prog(uu, 1.18, 1.5), 2.4)), col: mixRgb(cols[a], cols[b], clamp(e * 1.4)), idx: e > 0.5 ? b : a };
  };
  const cx = L.cx, cy = L.cy - 20 * S, R = 200 * S * Math.min(1, L.sw / (720 * S));
  const bg = api.text('w5');
  if (bg) {
    const wa = prog(u, 0, 0.2) * (1 - prog(u, 1.2, 1.45)), px = fit(ctx, bg, { family: api.font.display, weight: api.font.weight, max: 270 * S, min: 60 * S, width: api.W * 0.95 });
    setFont(ctx, api.font.weight, px, api.font.display); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = rgba(L.ink, 0.13 * wa); ctx.lineWidth = 2 * S; ctx.strokeText(bg, cx + 40 * S - 70 * S * u, cy + 10 * S);
  }
  for (let k = 6; k >= 1; k--) {
    const tu = u - k * 0.032;
    if (tu < 0) continue;
    const m = at(tu); morphPath(ctx, cx, cy, R * m.sc, m.A, m.B, m.e, m.rot); ctx.strokeStyle = rgba(m.col, 0.45 * (1 - k / 7)); ctx.lineWidth = 2 * S; ctx.stroke();
  }
  const m = at(u); morphPath(ctx, cx, cy, R * m.sc, m.A, m.B, m.e, m.rot); ctx.fillStyle = rgba(m.col); ctx.fill();
  if (u > 1.4) { ctx.save(); ctx.shadowColor = rgba(L.ink); ctx.shadowBlur = 40 * S; ctx.fillStyle = rgba(L.ink); ctx.beginPath(); ctx.arc(cx, cy, 10 * S * prog(u, 1.4, 1.5), 0, TAU); ctx.fill(); ctx.restore(); }
  if (names.length !== 4) return;
  const sep = '  ›  ', la = prog(u, 0.05, 0.25) * (1 - prog(u, 1.15, 1.35));
  const sz = fit(ctx, names.join(sep), { family: MONO, weight: 500, max: 22 * S, min: 12 * S, width: L.sw * 0.9 });
  setFont(ctx, 500, sz, MONO); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  let x = cx - ctx.measureText(names.join(sep)).width / 2;
  names.forEach((nm, i) => {
    ctx.fillStyle = i === m.idx ? rgba(cols[i], la) : rgba(L.ink, 0.3 * la); ctx.fillText(nm, x, cy + R * 1.4 + 60 * S); x += ctx.measureText(nm).width;
    if (i < 3) { ctx.fillStyle = rgba(L.ink, 0.25 * la); ctx.fillText(sep, x, cy + R * 1.4 + 60 * S); x += ctx.measureText(sep).width; }
  });
}

// ───────────────────────────── bars 8–9 · slam end card (+ loop back into the cursor)
function slamEnd(ctx, u, api) {
  const { W, H, u: S, P, font } = api, M = L.code;
  const cur = P.loop ? [M.x0 + 6 * S, M.y] : [L.cx, L.cy];
  const ga = prog(u, 0, 0.5) * (1 - prog(u, 2.2, 2.6)), gs = 64 * S;
  if (ga > 0) for (let yy = L.cy % gs; yy < H; yy += gs) for (let xx = L.cx % gs; xx < W; xx += gs) {
    const d = Math.hypot(xx - L.cx, yy - L.cy) / S;
    ctx.fillStyle = rgba(L.ink, (0.07 + 0.07 * Math.sin(d * 0.012 - u * 4)) * ga); ctx.beginPath(); ctx.arc(xx, yy, 2.2 * S, 0, TAU); ctx.fill();
  }
  const rp = prog(u, 0, 0.8);
  if (rp < 1) { ctx.strokeStyle = rgba(L.a1, 1 - rp); ctx.lineWidth = (2 + 8 * (1 - rp)) * S; ctx.beginPath(); ctx.arc(L.cx, L.cy, (60 + 1400 * E.outExpo(rp)) * S, 0, TAU); ctx.stroke(); }
  const title = api.text('title') || '·', px = fit(ctx, title, { family: font.display, weight: font.weight, max: 250 * S, min: 60 * S, width: L.sw * 0.92 });
  const f = `${font.weight} ${px}px ${font.display}`, Lw = layout(ctx, title, f), n = title.length, x0 = L.cx - Lw.total / 2, base = L.cy + 50 * S * (px / (250 * S));
  const o = P.loop ? E.inExpo(prog(u, 2.35, 2.72)) : 0, slam = 1 + 0.45 * (1 - E.outExpo(prog(u, 0, 0.5))), ta = prog(u, 0, 0.035) * (1 - prog(o, 0.6, 1)), ca = 11 * S * Math.exp(-u * 7);
  const endsWithDot = /[.!?]$/.test(title);
  if (ta > 0) {
    ctx.save(); ctx.translate(L.cx, base - Lw.cap / 2); ctx.scale(slam, slam); ctx.translate(-L.cx, -(base - Lw.cap / 2));
    ctx.font = f; ctx.letterSpacing = '0px'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.globalAlpha = ta;
    const light = !api.colors.dark, passes = ca > 0.4 ? [[0, -ca], [1, 0], [2, ca]] : [[-1, 0]];
    if (ca > 0.4) ctx.globalCompositeOperation = light ? 'multiply' : 'lighter';
    for (const [ch, off] of passes) for (let i = 0; i < n; i++) {
      if (title[i] === ' ') continue;
      const bc = endsWithDot && i === n - 1 ? L.a1 : L.ink, full = light ? 255 : 0;
      ctx.fillStyle = rgba(ch < 0 ? bc : [ch === 0 ? bc[0] : full, ch === 1 ? bc[1] : full, ch === 2 ? bc[2] : full]);
      glyph(ctx, title[i], lerp(Lw.cx(x0, i), cur[0], o) + off, lerp(base, cur[1] + Lw.cap * 0.2, o), Lw.w(i), 1 - o, 1 - o);
    }
    ctx.restore();
  }
  const ly = base + 112 * S, fade = 1 - prog(u, 2.25, 2.5), sep = '   ·   ', items = list(P.stats, 3).map(s => { const m = /^(\S+)\s*(.*)$/.exec(s); return [m[1], m[2] ? ' ' + m[2] : '']; });
  if (items.length) {
    const sz = fit(ctx, items.map(a => a.join('')).join(sep), { family: MONO, weight: 500, max: 32 * S, min: 14 * S, width: L.sw * 0.94 });
    setFont(ctx, 500, sz, MONO); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    let x = L.cx - ctx.measureText(items.map(a => a.join('')).join(sep)).width / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, ly - sz * 1.15, W, sz * 1.6); ctx.clip();
    items.forEach(([v, l], i) => {
      const s0 = 0.42 + i * 0.1, q = EASE.expo(prog(u, s0, s0 + 0.5)), yo = (1 - q) * sz * 1.4;
      const shown = u < s0 + 0.38 ? v.replace(/\d/g, (d, k) => String(Math.floor(u * 38 + i * 3 + k * 7) % 10)) : v;
      ctx.fillStyle = rgba(L.a1, fade); ctx.fillText(shown, x, ly + yo); x += ctx.measureText(v).width;
      ctx.fillStyle = rgba(L.ink, 0.8 * fade); ctx.fillText(l, x, ly + yo); x += ctx.measureText(l).width;
      if (i < items.length - 1) { ctx.fillStyle = rgba(L.ink, 0.3 * fade * q); ctx.fillText(sep, x, ly + yo); x += ctx.measureText(sep).width; }
    });
    ctx.restore();
  }
  const sig = P.signature || '', sn = Math.floor(prog(u, 1.15, 1.6) * sig.length);
  if (sig && sn > 0 && fade > 0) {
    const sz = fit(ctx, sig, { family: MONO, weight: 500, max: 22 * S, min: 12 * S, width: L.sw * 0.92 });
    setFont(ctx, 500, sz, MONO);
    const sx = L.cx - ctx.measureText(sig).width / 2, sy = ly + 62 * S, cut = sig.lastIndexOf('—'), hl = cut < 0 ? sig.length : cut + 1;
    ctx.fillStyle = rgba(L.ink, 0.5 * fade); ctx.fillText(sig.slice(0, Math.min(sn, hl)), sx, sy);
    if (sn > hl) { ctx.fillStyle = rgba(L.a1, fade); ctx.fillText(sig.slice(hl, sn), sx + ctx.measureText(sig.slice(0, hl)).width, sy); }
    if (sn < sig.length || u % api.beat < api.beat * 0.66) { ctx.fillStyle = rgba(L.a1, fade); ctx.fillRect(sx + ctx.measureText(sig.slice(0, sn)).width + 4 * S, sy - sz * 0.82, 3 * S, sz); }
  }
  if (P.loop && u >= 2.72) caret(ctx, cur[0], cur[1], M.px * 1.16 * E.outBack(prog(u, 2.72, 2.8)), L.a1, S);
  const fl = 0.85 * Math.exp(-u * 16);
  if (fl > 0.01) { ctx.fillStyle = rgba(L.ink, fl); ctx.fillRect(-50, -50, W + 100, H + 100); }
}

// ───────────────────────────── overlay · studio HUD
function hud(ctx, t, ts, api) {
  const { W, H, u: S, fps, P } = api, s = L.s, f = Math.floor(t * fps + 1e-6), total = Math.round(api.duration * fps), Lm = 22 * S;
  ctx.save(); ctx.globalCompositeOperation = 'difference';
  const col = rgba(L.lightC, 0.5);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2 * S;
  for (const [x, y, sx, sy] of [[s.x, s.y, 1, 1], [s.r, s.y, -1, 1], [s.x, s.b, 1, -1], [s.r, s.b, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * Lm); ctx.lineTo(x, y); ctx.lineTo(x + sx * Lm, y); ctx.stroke(); }
  setFont(ctx, 500, 17 * S, MONO); ctx.textBaseline = 'middle';
  const pad2 = n => String(n).padStart(2, '0');
  if (P.hudLabel) { ctx.textAlign = 'left'; ctx.fillText(P.hudLabel, s.x + 36 * S, s.y); }
  ctx.textAlign = 'right'; ctx.fillText(`TC 00:${pad2(Math.floor(f / fps))}:${pad2(f % fps)}`, s.r - 36 * S, s.y);
  ctx.fillText(`${String(f).padStart(4, '0')} / ${String(total).padStart(4, '0')}`, s.r - 36 * S, s.b);
  const words = ['w1', 'w2', 'w3', 'w4', 'w5'].map(k => api.text(k));
  const labels = [[0, api.lang === 'en' ? '00  ORIGIN' : '00  BAŞLANGIÇ'], ...words.map((w, i) => [SEG[i + 2], `0${i + 1}  ${w}`]), [12, api.lang === 'en' ? '06  OUTPUT' : '06  SONUÇ']];
  let lab = labels[0];
  for (const l of labels) if (ts >= l[0]) lab = l;
  const n = lab[0] === 0 ? lab[1].length : Math.floor(prog(ts, lab[0], lab[0] + 0.2) * lab[1].length);
  ctx.textAlign = 'left'; ctx.fillText(lab[1].slice(0, n), s.x + 36 * S, s.b);
  if (s.w > 900 * S) {
    const x1 = s.x + s.w * 0.29, x2 = s.x + s.w * 0.71, y = s.b;
    ctx.fillStyle = rgba(L.lightC, 0.2); ctx.fillRect(x1, y - S, x2 - x1, 2 * S);
    for (let b = 0; b <= 10; b++) ctx.fillRect(lerp(x1, x2, b / 10) - S, y - 6 * S, 2 * S, 12 * S);
    const px = lerp(x1, x2, ts / BASE);
    ctx.fillStyle = col; ctx.fillRect(x1, y - S, px - x1, 2 * S); ctx.fillRect(px - 4 * S, y - 4 * S, 8 * S, 8 * S);
  }
  ctx.restore();
}
