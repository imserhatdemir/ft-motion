// ft-motion fx: transitions, glitch, glow and HUD overlays.
// Same contract as core.js: every function depends only on its arguments (t included), so it is safe under motion blur.
// Import next to core:  import { transition, glitch, bloom, hud, flash } from '../../engine/fx.js';
import { TAU, clamp, lerp, prog, rgba, E, hash, setFont, rrect } from './core.js';

const inOutQuart = x => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
const cssRGB = c => (typeof c === 'string' ? c : rgba(c));
const scratch = new Map();                                   // named offscreen canvases (sized on demand, CPU-backed)
function offscreen(name, w, h) {
  let c = scratch.get(name);
  if (!c || c.width !== w || c.height !== h) {
    c = document.createElement('canvas'); c.width = w; c.height = h;
    c.ctx = c.getContext('2d', { willReadFrequently: true }); scratch.set(name, c);
  }
  return c;
}

// ───────────────────────────── transitions (coloured shapes that cover the frame, then uncover it)
/**
 * Skewed wipe. q ∈ [0,1]. mode 'cover' grows the shape from the trailing side; 'reveal' removes it.
 * axis 'x' | 'y', dir ±1 (travel direction). `stripe` adds a contrasting leading edge.
 */
export function wipe(ctx, W, H, q, { mode = 'cover', axis = 'x', dir = 1, color = [255, 106, 61], stripe = null, skew = 0.22 } = {}) {
  const L = axis === 'x' ? W : H, S = axis === 'x' ? H : W, sk = S * skew, m = sk + L * 0.06 + 20;
  ctx.save();
  if (axis === 'y') { ctx.translate(W, 0); ctx.rotate(Math.PI / 2); }
  if (dir < 0) { ctx.translate(L, 0); ctx.scale(-1, 1); }
  const a = lerp(-m, L + m, q);
  const x0 = mode === 'cover' ? -m : a, x1 = mode === 'cover' ? a : L + m;
  ctx.fillStyle = cssRGB(color);
  ctx.beginPath(); ctx.moveTo(x0 + sk, -2); ctx.lineTo(x1 + sk, -2); ctx.lineTo(x1, S + 2); ctx.lineTo(x0, S + 2); ctx.closePath(); ctx.fill();
  if (stripe) {
    const sw = S * 0.083 * clamp(q * 6) * (mode === 'reveal' ? clamp((1 - q) * 6) : 1);
    ctx.fillStyle = cssRGB(stripe); ctx.beginPath();
    if (mode === 'cover') { ctx.moveTo(x1 + sk, -2); ctx.lineTo(x1 + sk + sw, -2); ctx.lineTo(x1 + sw, S + 2); ctx.lineTo(x1, S + 2); }
    else { ctx.moveTo(x0 + sk - sw, -2); ctx.lineTo(x0 + sk, -2); ctx.lineTo(x0, S + 2); ctx.lineTo(x0 - sw, S + 2); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
/** Staggered columns that drop down (cover) or recede downwards (reveal). p ∈ [0,1]. */
export function barsWipe(ctx, W, H, p, { mode = 'cover', color = [255, 106, 61], n = 6 } = {}) {
  const w = W / n; ctx.fillStyle = cssRGB(color);
  for (let i = 0; i < n; i++) {
    const idx = mode === 'cover' ? i : n - 1 - i;
    const qi = E.inOutCubic(clamp((p - idx * 0.09) / 0.55));
    if (mode === 'cover') ctx.fillRect(i * w - 1, 0, w + 2, H * qi);
    else ctx.fillRect(i * w - 1, H * qi, w + 2, H * (1 - qi) + 1);
  }
}
/** A disc growing from (cx, cy) until it swallows the frame. Great when the disc is a shape from the previous scene (a dot). */
export function discCover(ctx, W, H, cx, cy, q, color = [255, 106, 61], r0 = 18) {
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) + 10;
  ctx.fillStyle = cssRGB(color); ctx.beginPath(); ctx.arc(cx, cy, lerp(r0, far, q), 0, TAU); ctx.fill();
}
/**
 * Draw one cover→reveal transition centred on time `mid`. Call it AFTER the scene, and switch scenes at `mid`
 * (when the frame is fully covered). Returns 'cover' | 'reveal' | null.
 *   transition(ctx, W, H, t, { mid: api.at(2), color, stripe,
 *     cover:  { kind: 'skew', dur: 0.3, axis: 'x', dir: 1 },        // kind: 'skew' | 'bars' | 'disc' (+ at: [cx, cy])
 *     reveal: { kind: 'bars', dur: 0.4 } })
 * Cover eases in-out (so it lands on `mid`), reveal eases out.
 */
export function transition(ctx, W, H, t, { mid, color = [255, 106, 61], stripe = null, cover = {}, reveal = {} }) {
  const c = { kind: 'skew', dur: 0.3, axis: 'x', dir: 1, ...cover }, r = { kind: 'skew', dur: 0.4, axis: 'x', dir: 1, ...reveal };
  if (t < mid - c.dur || t > mid + r.dur) return null;
  const mode = t < mid ? 'cover' : 'reveal', s = mode === 'cover' ? c : r;
  const p = mode === 'cover' ? (t - (mid - c.dur)) / c.dur : (t - mid) / r.dur;
  if (s.kind === 'disc') discCover(ctx, W, H, s.at?.[0] ?? W / 2, s.at?.[1] ?? H / 2, mode === 'cover' ? inOutQuart(p) : 1 - E.outExpo(p), color);
  else if (s.kind === 'bars') barsWipe(ctx, W, H, p, { mode, color });
  else wipe(ctx, W, H, mode === 'cover' ? inOutQuart(p) : E.outExpo(p) * 0.985 + p * 0.015, { mode, axis: s.axis, dir: s.dir, color, stripe });
  return mode;
}

// ───────────────────────────── impacts and glitch
/** Full-frame colour that decays after t0: flash(ctx, W, H, t, t0, peak, decay, colour). */
export function flash(ctx, W, H, t, t0, peak = 0.8, decay = 0.07, color = [242, 237, 228]) {
  const d = t - t0; if (d < 0) return;
  const a = peak * Math.exp(-d / decay); if (a < 0.01) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = cssRGB(color); ctx.fillRect(0, 0, W, H); ctx.restore();
}
/** Expanding ring that thins out as it grows (a shockwave). */
export function shockRing(ctx, cx, cy, t, t0, { color = [255, 106, 61], life = 0.6, radius = 1400, width = 50 } = {}) {
  const d = t - t0; if (d < 0 || d > life) return; const p = d / life;
  ctx.save(); ctx.strokeStyle = cssRGB(color); ctx.globalAlpha = 1 - p; ctx.lineWidth = width * (1 - p) + 2;
  ctx.beginPath(); ctx.arc(cx, cy, radius * E.outExpo(p), 0, TAU); ctx.stroke(); ctx.restore();
}
/**
 * Digital tear: displaces horizontal slices of what is already on the canvas, sprinkles hairlines. Call it last in draw().
 * Peaks at t0 + (post - pre) / 2 and is gone `width` seconds either side. Slices re-roll `rate` times per second (deterministic).
 */
export function glitch(ctx, W, H, t, t0, { pre = 0.12, post = 0.28, width = 0.3, rate = 30, seed = 13, colors = [[255, 106, 61], [242, 237, 228]] } = {}) {
  if (t < t0 - pre || t > t0 + post + 0.25) return;
  const k = clamp(1 - Math.abs(t - (t0 + (post - pre) / 2)) / width); if (k <= 0) return;
  const snap = offscreen('glitch', W, H); snap.ctx.globalCompositeOperation = 'copy'; snap.ctx.drawImage(ctx.canvas, 0, 0);
  const step = Math.floor(t * rate) * 7919 + seed, n = 8 + Math.floor(16 * k);
  for (let i = 0; i < n; i++) {
    const r = j => hash(step + i * 31.7 + j * 5.3);
    const y = r(0) * H, h = 8 + r(1) * 90 * k, dx = (r(2) - 0.5) * 320 * k;
    ctx.drawImage(snap, 0, y, W, h, dx, y, W, h);
    if (r(3) < 0.25) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = cssRGB(colors[r(4) < 0.5 ? 0 : 1]); ctx.fillRect(0, y + h * 0.3, W, 3 + r(5) * 4); ctx.restore(); }
  }
}
/**
 * Lens-like RGB split done on pixels (stronger towards the edges). Cheap enough for the ~20 frames after a hit.
 * Use it in post(); for split-drawing a single element use core's chromatic() instead.
 */
export function aberrate(ctx, W, H, amt) {
  if (amt < 0.6) return;
  const img = ctx.getImageData(0, 0, W, H), src = img.data, out = new Uint8ClampedArray(src), cx = W / 2;
  for (let y = 0; y < H; y++) {
    const row = y * W * 4;
    for (let x = 0; x < W; x++) {
      const sh = Math.round(amt * (0.25 + 0.75 * Math.abs(x - cx) / cx) * (x < cx ? -1 : 1));
      const xr = Math.min(W - 1, Math.max(0, x - sh)), xb = Math.min(W - 1, Math.max(0, x + sh)), i = row + x * 4;
      out[i] = src[row + xr * 4]; out[i + 2] = src[row + xb * 4 + 2];
    }
  }
  img.data.set(out); ctx.putImageData(img, 0, 0);
}
/** Decaying amount for aberrate(): the strongest of `hits` = [[time, strength 0..1], …], px at strength 1. */
export function aberrationAt(t, hits, { px = 16, life = 0.3 } = {}) {
  let a = 0;
  for (const [t0, s] of hits) { const d = t - t0; if (d >= 0 && d <= life) a = Math.max(a, px * s * Math.pow(1 - d / life, 2)); }
  return a;
}

// ───────────────────────────── finishing
/** Cheap bloom for post(): a blurred, downscaled copy of the frame added back with 'screen'. Keep alpha ≲ 0.2 or blacks turn milky. */
export function bloom(ctx, W, H, { alpha = 0.17, blur = 9, scale = 4 } = {}) {
  const w = Math.round(W / scale), h = Math.round(H / scale), a = offscreen('bloomA', w, h), b = offscreen('bloomB', w, h);
  a.ctx.clearRect(0, 0, w, h); a.ctx.drawImage(ctx.canvas, 0, 0, w, h);
  b.ctx.clearRect(0, 0, w, h); b.ctx.filter = `blur(${blur}px)`; b.ctx.drawImage(a, 0, 0); b.ctx.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = alpha; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
}

// ───────────────────────────── overlays
/**
 * A crisp "editor" HUD: brand mark, timecode + frame counter, progress bar, scene label, spec line.
 * Call it from post(): post gets the un-blurred frame-start time, so the digits stay sharp under motion blur.
 * opts: { theme: 'dark' | 'light', accent, brand, scene, spec, speed, font }
 */
export function hud(ctx, api, t, { theme = 'dark', accent = [255, 106, 61], brand = 'FT-MOTION', scene = '', spec = '', speed = 1, font = "'JetBrains Mono'" } = {}) {
  const { W, H } = api, M = 54, dark = theme === 'dark';
  const ink = dark ? 'rgba(242,237,228,0.72)' : 'rgba(10,10,13,0.78)', track = dark ? 'rgba(242,237,228,0.18)' : 'rgba(10,10,13,0.18)', solid = dark ? rgba(accent) : 'rgb(10,10,13)';
  const f = Math.round(t / speed * api.fps), pad = (n, l = 2) => String(n).padStart(l, '0');
  ctx.save(); ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = solid; rrect(ctx, M, M - 15, 15, 15, 4); ctx.fill();
  ctx.fillStyle = ink; setFont(ctx, 700, 18, font, 3); ctx.textAlign = 'left'; ctx.fillText(brand, M + 28, M);
  setFont(ctx, 700, 18, font, 2); ctx.textAlign = 'right'; ctx.fillText(`00:${pad(Math.floor(f / api.fps))}:${pad(f % api.fps)}  F${pad(f, 4)}`, W - M, M);
  const y = H - 50, pr = clamp(t / api.duration);
  ctx.fillStyle = track; ctx.fillRect(M, y, W - 2 * M, 3);
  ctx.fillStyle = solid; ctx.fillRect(M, y, (W - 2 * M) * pr, 3); ctx.fillRect(M + (W - 2 * M) * pr - 3, y - 6, 6, 15);
  ctx.fillStyle = ink; setFont(ctx, 700, 15, font, 2); ctx.textAlign = 'left'; ctx.fillText(scene, M, H - 22);
  ctx.textAlign = 'right'; ctx.fillText(spec, W - M, H - 22);
  ctx.restore();
}
/** A macOS-style window: soft shadow, hairline border, title bar with three dots. Draw your content inside (x, y + 46). */
export function windowFrame(ctx, x, y, w, h, title = '', { r = 22, accent = [255, 106, 61], body = '#121217', bar = '#18181E', dim = '#6A6A73', font = "'JetBrains Mono'" } = {}) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  ctx.fillStyle = body; rrect(ctx, x, y, w, h, r); ctx.fill(); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(242,237,228,0.12)'; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, r); ctx.stroke();
  rrect(ctx, x, y, w, h, r); ctx.clip(); ctx.fillStyle = bar; ctx.fillRect(x, y, w, 46); ctx.restore();
  [rgba(accent), '#FFB547', '#4A4A52'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 26 + i * 24, y + 23, 7, 0, TAU); ctx.fill(); });
  ctx.save(); ctx.fillStyle = dim; setFont(ctx, 500, 16, font, 1); ctx.textAlign = 'right'; ctx.fillText(title, x + w - 22, y + 29); ctx.restore();
}
/**
 * Typewriter for syntax-highlighted code. `lines` = [[[text, role], …], …]; n = characters typed so far (a pure function of t:
 * `Math.floor(Math.max(0, t - t0) * cps)`). Draws line numbers, the typed part and a caret where typing stops.
 * Returns { total, done }. Use codeLength(lines) to time the end.
 */
export function typeCode(ctx, x, y, lines, n, { size = 27, lh = 46, font = "'JetBrains Mono'", colors = {}, gutter = '#44444C', caret = [255, 106, 61], gutterW = 84 } = {}) {
  const col = { kw: '#FF6B3D', fn: '#F2EDE4', p: '#8F8F98', v: '#CFC8BB', n: '#FFB547', str: '#FFB547', cm: '#5F5F68', ...colors };
  let left = Math.floor(n), stopped = false;
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  lines.forEach((line, li) => {
    if (stopped) return;
    const ly = y + li * lh;
    ctx.fillStyle = gutter; setFont(ctx, 500, size * 0.74, font); ctx.textAlign = 'right'; ctx.fillText(String(li + 1), x + gutterW - 32, ly); ctx.textAlign = 'left';
    let cx = x + gutterW;
    const showCaret = () => { ctx.fillStyle = rgba(caret); ctx.fillRect(cx + 2, ly - size * 0.89, size * 0.55, size * 1.18); stopped = true; };
    if (!line.length) { if (left <= 0) showCaret(); left -= 1; return; }
    for (const [s, role] of line) {
      const take = Math.min(s.length, Math.max(0, left)); left -= s.length;
      if (take > 0) { ctx.fillStyle = col[role] ?? col.p; setFont(ctx, role === 'kw' ? 700 : 500, size, font); ctx.fillText(s.slice(0, take), cx, ly); cx += ctx.measureText(s.slice(0, take)).width; }
      if (take < s.length) { showCaret(); break; }
    }
  });
  ctx.restore();
  return { total: codeLength(lines), done: !stopped };
}
export const codeLength = lines => lines.reduce((a, l) => a + (l.length ? l.reduce((b, s) => b + s[0].length, 0) : 1), 0);
/** Largest font size (≤ maxPx) at which `text` fits `maxW`. Tracking is in em (−0.02 = −2 %), so it scales with the size: use `tracking * px` in setFont. */
export function fitFont(ctx, text, maxW, maxPx, weight, family, trackingEm = 0) {
  ctx.save(); ctx.font = `${weight} 100px ${family}`; ctx.letterSpacing = `${trackingEm * 100}px`;
  const w = ctx.measureText(text).width; ctx.restore();
  return Math.min(maxPx, 100 * maxW / Math.max(w, 1));
}
