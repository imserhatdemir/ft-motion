// ft-motion core — every frame is a pure function of time.
// Scenes import what they need from here; boot() wires a scene to the page and the renderer.

export const TAU = Math.PI * 2;

// ───────────────────────────── math
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** 0→1 progress of t through [a, b], clamped. The workhorse of every timeline. */
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export const E = {
  linear: x => x,
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  inOutExpo: x => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inCubic: x => x * x * x,
  inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  /** anticipation: dips below 0 before accelerating to 1 */
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
};
/** Damped spring from 0 to 1 (overshoots). x = time since start in seconds. */
export const spring = (x, freq = 18, damp = 8) => (x <= 0 ? 0 : 1 - Math.exp(-damp * x) * Math.cos(freq * x));
/** Decaying oscillation starting at 1 — for squash/impact reactions. */
export const wobble = (x, freq = 19, damp = 7) => (x < 0 ? 0 : Math.exp(-damp * x) * Math.cos(freq * x));
/** CSS-style cubic-bezier(x1, y1, x2, y2) easing. */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 26; i++) { t = (lo + hi) / 2; if (sx(t) < x) lo = t; else hi = t; }
    return sy(t);
  };
}
export const EASE = {
  /** fast in, long silky settle — the default for reveals */
  expo: cubicBezier(0.16, 1, 0.3, 1),
  /** CSS `ease` — matches most websites' hover transitions */
  css: cubicBezier(0.25, 0.1, 0.25, 1),
  snap: cubicBezier(0.7, 0, 0.2, 1),
};
/** Deterministic pseudo-random in [0,1). Never use Math.random in a scene. */
export const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** Smooth 1D value noise in [-1,1]. */
export const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

// ───────────────────────────── type
export function setFont(ctx, weight, px, family, tracking = 0) {
  ctx.font = `${weight} ${px}px ${family}`;
  ctx.letterSpacing = `${tracking}px`;
}
const _layouts = new Map();
/** Per-letter layout that keeps kerning: xs[i] is the x offset of letter i. */
export function layout(ctx, text, font, tracking = 0) {
  const key = `${font}|${tracking}|${text}`;
  let L = _layouts.get(key);
  if (L) return L;
  ctx.font = font; ctx.letterSpacing = `${tracking}px`;
  const xs = [];
  for (let i = 0; i <= text.length; i++) xs.push(ctx.measureText(text.slice(0, i)).width);
  L = {
    xs, total: xs[text.length], cap: ctx.measureText('H').actualBoundingBoxAscent,
    cx: (x0, i) => x0 + (xs[i] + xs[i + 1]) / 2, w: i => xs[i + 1] - xs[i],
  };
  _layouts.set(key, L);
  return L;
}
/** Draw one letter scaled around its baseline centre (for squash, pop, collapse). */
export function glyph(ctx, ch, cx, base, w, sx = 1, sy = 1) {
  ctx.save(); ctx.translate(cx, base); ctx.scale(sx, sy); ctx.fillText(ch, -w / 2, 0); ctx.restore();
}
export function wrap(ctx, text, maxW) {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  lines.push(line);
  return lines;
}
/** Text rising out of a mask. Keep `pad` big enough for descenders (g, y, ş, ç). */
export function maskedText(ctx, text, x, base, p, { rise = 1.1, pad = 0.35, size } = {}) {
  const px = size ?? parseFloat(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 64);
  ctx.save();
  ctx.beginPath(); ctx.rect(-1e4, base - px * 1.05, 2e4, px * (1.05 + pad)); ctx.clip();
  ctx.fillText(text, x, base + (1 - p) * px * rise);
  ctx.restore();
}

// ───────────────────────────── shapes
export function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function pill(ctx, cx, cy, w, h) { rrect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2); }
export function withScale(ctx, ox, oy, s, fn) { ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s); ctx.translate(-ox, -oy); fn(); ctx.restore(); }
export function arrow(ctx, x, y, s, col, lw = 3) {
  ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x + s * 0.2, y - s * 0.8); ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.2, y + s * 0.8); ctx.stroke(); ctx.restore();
}
export function check(ctx, x, y, s, col, lw = 3) {
  ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.7); ctx.stroke(); ctx.restore();
}
/** Mouse pointer. press ∈ [0,1] shrinks it for a click. */
export function pointer(ctx, x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - 0.12 * press), s * (1 - 0.12 * press));
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(8, 26); ctx.lineTo(14, 40); ctx.lineTo(20, 37); ctx.lineTo(14, 24); ctx.lineTo(25, 24); ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; ctx.stroke();
  ctx.restore();
}
/** Filled ellipse centred at x,y, rotated by ang, half-axes hl × hw. */
export function ellipse(ctx, x, y, ang, hl, hw, fill) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(Math.max(hl, 0.01), Math.max(hw, 0.01));
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
}

// ───────────────────────────── camera & finishing
/** Sum of decaying impacts: events = [[time, amplitudePx], …] → [dx, dy]. */
export function shake(t, events, decay = 9) {
  let a = 0;
  for (const [t0, amp] of events) if (t >= t0) a += amp * Math.exp(-(t - t0) * decay);
  return [noise1(t * 40) * a, noise1(t * 40 + 99) * a];
}
export function vignette(ctx, W, H, strength = 0.3) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/**
 * RGB split for impacts: draw(col, dx) is called three times with one channel each.
 * Dark backgrounds add light ('lighter'); pass light:true on light backgrounds to subtract it ('multiply').
 */
export function chromatic(ctx, color, offset, draw, { light = false } = {}) {
  if (offset < 0.4) { draw(color, 0); return; }
  ctx.save();
  if (light) {
    ctx.globalCompositeOperation = 'multiply';
    draw([color[0], 255, 255], -offset); draw([255, color[1], 255], 0); draw([255, 255, color[2]], offset);
  } else {
    ctx.globalCompositeOperation = 'lighter';
    draw([color[0], 0, 0], -offset); draw([0, color[1], 0], 0); draw([0, 0, color[2]], offset);
  }
  ctx.restore();
}

// ───────────────────────────── dot fields
/** Grid of points centred on 0,0: {x, y, d (distance from centre), i}. */
export function grid(cols, rows, spacing) {
  const pts = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * spacing, y = (r - (rows - 1) / 2) * spacing;
    pts.push({ x, y, d: Math.hypot(x, y), i: pts.length });
  }
  return pts;
}
/** Weight (0..1) of a ring wave launched at t0 from origin, at point p. */
export function ripple(p, origin, t0, t, { speed = 1400, width = 75, life = 1.1 } = {}) {
  const u = t - t0;
  if (u < 0 || u > life) return 0;
  const d = Math.hypot(p.x - origin[0], p.y - origin[1]);
  return Math.exp(-Math.pow((d - u * speed) / width, 2)) * (1 - u / life);
}
/** Tilt (around X) then yaw (around Y), perspective divide. z < 0 is towards camera. */
export function project3D(x, y, z, { tilt = 0, yaw = 0, D = 1500 } = {}) {
  const ct = Math.cos(tilt), st = Math.sin(tilt), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const y1 = y * ct + z * st, z1 = -y * st + z * ct;
  const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
  const s = D / (D + z2);
  return { x: x2 * s, y: y1 * s, s, z: z2 };
}

// ───────────────────────────── morphing
/** Radius of a shape at angle th. shape = {circle:true} | {n, inner, rot, scale}. inner = cos(π/n) gives a regular polygon. */
export function shapeRadius(sh, th) {
  if (sh.circle) return sh.scale ?? 1;
  const a = Math.PI / sh.n;
  let ph = (((th - (sh.rot ?? 0)) % (2 * a)) + 2 * a) % (2 * a);
  if (ph > a) ph = 2 * a - ph;
  const Bx = sh.inner * Math.cos(a), By = sh.inner * Math.sin(a), c = Math.cos(ph), s = Math.sin(ph);
  const k = s / (c * By - s * (Bx - 1));
  return Math.hypot(1 + k * (Bx - 1), k * By) * (sh.scale ?? 1);
}
export const SHAPES = {
  circle: { circle: true },
  square: { n: 4, inner: Math.cos(Math.PI / 4), rot: Math.PI / 4, scale: 1.12 },
  triangle: { n: 3, inner: 0.5, rot: -Math.PI / 2, scale: 1.32 },
  star: { n: 5, inner: 0.45, rot: -Math.PI / 2, scale: 1.28 },
};
/** Path of shape A morphing into B at e (e may overshoot for a jelly feel). */
export function morphPath(ctx, cx, cy, R, A, B, e, rot = 0, samples = 200) {
  ctx.beginPath();
  for (let k = 0; k <= samples; k++) {
    const th = (k / samples) * TAU, r = R * lerp(shapeRadius(A, th), shapeRadius(B, th), e);
    const x = cx + r * Math.cos(th + rot), y = cy + r * Math.sin(th + rot);
    k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// ───────────────────────────── particles
/** Rasterise draw(ctx) offscreen and return a point per `step` px where it painted: {x, y, c:[r,g,b]}. */
export function sampleDrawing(W, H, draw, step = 9, threshold = 140) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true });
  draw(c);
  const d = c.getImageData(0, 0, W, H).data, out = [];
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
    const i = (y * W + x) * 4;
    if (d[i + 3] > threshold) out.push({ x, y, c: [d[i], d[i + 1], d[i + 2]] });
  }
  return out;
}

// ───────────────────────────── glass
/**
 * Frosted glass slats over a background: bg(ctx) paints the backdrop once per frame into
 * an offscreen canvas; each slat shows it displaced (fake refraction) with an edge highlight.
 */
export function glassSlats(ctx, W, H, bg, { angle = -1.02, width = 150, drift = 0, refraction = 70, count = 8, seed = 40 } = {}) {
  const cv = glassSlats._cv ??= document.createElement('canvas');
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  bg(g);
  ctx.drawImage(cv, 0, 0);
  const nx = Math.cos(angle + Math.PI / 2), ny = Math.sin(angle + Math.PI / 2), dx = Math.cos(angle), dy = Math.sin(angle), L = Math.hypot(W, H) * 1.2;
  for (let i = -count; i <= count; i++) {
    const o = i * width + (drift % width);
    const cx = W / 2 + nx * o, cy = H / 2 + ny * o;
    const p0 = [cx - dx * L - nx * width / 2, cy - dy * L - ny * width / 2], p1 = [cx + dx * L - nx * width / 2, cy + dy * L - ny * width / 2];
    const p2 = [cx + dx * L + nx * width / 2, cy + dy * L + ny * width / 2], p3 = [cx - dx * L + nx * width / 2, cy - dy * L + ny * width / 2];
    ctx.save();
    ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.closePath(); ctx.clip();
    const k = (hash(i + seed) - 0.5) * refraction;
    ctx.drawImage(cv, nx * k - 20, ny * k - 20, W + 40, H + 40);
    const gr = ctx.createLinearGradient(cx - nx * width / 2, cy - ny * width / 2, cx + nx * width / 2, cy + ny * width / 2);
    gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.08, 'rgba(255,255,255,0.18)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.22)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.save(); ctx.lineWidth = 1.5;
    for (const [off, col] of [[-1.5, 'rgba(255,120,160,0.10)'], [0, 'rgba(255,255,255,0.9)'], [1.8, 'rgba(90,170,255,0.10)']]) {
      ctx.strokeStyle = col; ctx.beginPath();
      ctx.moveTo(p0[0] + nx * off, p0[1] + ny * off); ctx.lineTo(p1[0] + nx * off, p1[1] + ny * off); ctx.stroke();
    }
    ctx.restore();
  }
}
export function radialBlob(ctx, x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ───────────────────────────── runtime
/**
 * boot(scene, cfg) — scene = { setup?(api), draw(ctx, t, api), post?(ctx, t, api) }.
 * draw() must paint the whole frame (background included) and depend only on t.
 * Motion blur: each output frame averages `subframes` renders across a forward 180° shutter,
 * so hard cuts placed on frame boundaries stay hard.
 */
export async function boot(scene, cfg) {
  const qs = new URLSearchParams(location.search);
  const RENDER = qs.has('render');
  const W = cfg.width, H = cfg.height, FPS = cfg.fps ?? 60, DUR = cfg.duration, SPEED = cfg.speed ?? 1;
  const bpm = cfg.bpm ?? 120;
  const api = {
    W, H, fps: FPS, duration: DUR * SPEED, render: RENDER,
    lang: qs.get('lang') || cfg.lang || 'en',
    bpm, beat: 60 / bpm, bar: 240 / bpm, step: 15 / bpm,
    /** scene time of a bar (and optional 16th-note step) */
    at: (bar, step = 0) => bar * (240 / bpm) + step * (15 / bpm),
  };
  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  // CPU-backed canvases in render mode: GPU compositing of repeated blends is not deterministic.
  const ctx = cv.getContext('2d', { willReadFrequently: RENDER });
  const work = document.createElement('canvas');
  work.width = W; work.height = H;
  const wctx = work.getContext('2d', { willReadFrequently: RENDER });
  if (scene.setup) await scene.setup(api);
  const drawAt = (c, t) => {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.letterSpacing = '0px'; c.filter = 'none';
    scene.draw(c, t, api);
  };
  const shutter = cfg.shutter ?? 0.5;
  window.frameCount = Math.round(DUR * FPS);
  window.renderFrame = (f, S = cfg.subframes ?? 6) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let s = 0; s < S; s++) {
      drawAt(wctx, (SPEED * (f + (S > 1 ? (s / S) * shutter : 0))) / FPS);
      ctx.globalAlpha = 1 / (s + 1);
      ctx.drawImage(work, 0, 0);
    }
    ctx.globalAlpha = 1;
    if (scene.post) scene.post(ctx, (SPEED * f) / FPS, api);
  };
  window.__ready = true;
  if (RENDER) return;

  // live preview: space = play/pause · ←/→ = ±1 frame · shift+←/→ = ±1 s · b = motion blur
  const hud = document.getElementById('hud');
  let playing = !qs.has('t'), blur = false, frame = qs.has('t') ? Math.round(parseFloat(qs.get('t')) * FPS) : 0, last = performance.now();
  addEventListener('keydown', e => {
    if (e.code === 'Space') { playing = !playing; e.preventDefault(); }
    if (e.code === 'ArrowRight') frame += e.shiftKey ? FPS : 1;
    if (e.code === 'ArrowLeft') frame -= e.shiftKey ? FPS : 1;
    if (e.code === 'KeyB') blur = !blur;
    frame = ((frame % window.frameCount) + window.frameCount) % window.frameCount;
  });
  const loop = now => {
    if (playing) frame = (frame + (now - last) / 1000 * FPS) % window.frameCount;
    last = now;
    const f = Math.floor(frame);
    window.renderFrame(f, blur ? cfg.subframes ?? 6 : 1);
    if (hud) hud.textContent = `${(f / FPS).toFixed(2)}s  ·  frame ${f}/${window.frameCount}  ·  scene t ${((SPEED * f) / FPS).toFixed(3)}  ·  ${playing ? '▶' : '❚❚'}  ·  blur ${blur ? 'on' : 'off'}  ·  [space] [←→] [shift] [b]`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
