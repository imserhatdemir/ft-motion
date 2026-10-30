// examples/ft-promo: ft-motion's own promo for X. 1080x1080, 120 BPM, an English narrator, word-by-word captions.
//   hook (a prompt is typed, its letters become dots) → code (draw(ctx, t) and a scrubbed t) → kinetic type → dot field →
//   3D wave → dot sphere → morph + easing → three.js toon letters → motion blur on/off → glitch & wipes on the beat →
//   the real stems → the captions themselves → the render command → wordmark built from dots.
// Scene and word times come from schedule.js (voice.py); every scene starts on a beat, and offsets inside scenes are beats.
// lanes.js holds the loudness of the real stems (sound.py writes it) for the music scene.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, wobble, setFont, layout, rrect, withScale, pointer, shake, vignette,
  chromatic, grid, ripple, project3D, SHAPES, morphPath, sampleDrawing, glassSlats, radialBlob, hash } from '../../engine/core.js';
import { transition, flash, shockRing, glitch, aberrate, aberrationAt, bloom, hud, windowFrame, typeCode, fitFont } from '../../engine/fx.js';
import { surge, tunnel, dotSphere, easingGraph } from '../../engine/recipes.js';
import { THREE, createGL, toon, ink } from '../../engine/three.js';
import { SCHEDULE } from './schedule.js';
import { LANES } from './lanes.js';

const COPY = {
  en: {
    shell: 'zsh — ft-motion', cwd: '~/ft-motion', prompt: 'make a promo video for ft-motion',
    tags: { code: 'draw(ctx, t)', type: 'KINETIC TYPE', dots: 'DOT FIELDS → 3D', morph: 'MORPH + EASING', three: 'THREE.JS · TOON + INK',
      blur: 'MOTION BLUR', glitch: 'FX ON THE BEAT', music: 'SOUND', subs: 'CAPTIONS', render: 'RENDER' },
    preview: 'preview', same: 'same t, same frame',
    type: ['TYPE', 'THAT', 'MOVES'],
    shapes: ['circle', 'square', 'triangle', 'star'], bezier: 'cubic-bezier(.16, 1, .3, 1)',
    blurOff: 'BLUR OFF', blurOn: 'BLUR ON', blurOffSub: '1 sample per frame', blurOnSub: '6 subframes · 180°',
    beats: [['GLITCH', 'fx.glitch()'], ['SKEW', 'fx.wipe()'], ['BARS', 'fx.barsWipe()'], ['DISC', 'fx.discCover()'], ['FLASH', 'fx.flash()'],
      ['SHOCK', 'fx.shockRing()'], ['SPLIT', 'fx.aberrate()'], ['BLOOM', 'fx.bloom()']], bpm: '120 BPM',
    lanes: ['DRUMS', 'MUSIC', 'FX', 'VOICE'], master: '−14 LUFS · −1.5 dBTP', synth: 'numpy + scipy',
    subsNote: 'word times: Whisper on the voice track',
    cmd: '$ node ft.mjs render examples/ft-promo', chrome: '▸ headless chrome · 6 subframes · 1080×1080',
    frame: (f, n) => `▸ frame ${f}/${n}`, audio: '▸ + out/audio.wav', done: '→ examples/ft-promo/out/ft-promo.mp4',
    mark: 'ft-motion', line: 'Motion graphics, written as code.', url: 'github.com/imserhatdemir/ft-motion', chip: 'open source · MIT · node + python',
    spec: '1080×1080 · 60 FPS · 120 BPM',
  },
};

const BG = [10, 10, 13], INK = [242, 237, 228], CORAL = [255, 106, 61], AMBER = [255, 181, 71], PANEL = [19, 19, 24], DIM = [128, 128, 138], GHOST = [58, 58, 66];
const DISP = "'Barlow Condensed'", MONO = "'JetBrains Mono'";
const ORDER = ['hook', 'code', 'type', 'dots', 'morph', 'three', 'blur', 'glitch', 'music', 'subs', 'render', 'end'];
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const BEAT = 0.5;
let TX = COPY.en, DUR = 34, MARK = [], G3 = null;

// ───────────── small helpers
function T(ctx, s, x, y, { w = 800, size = 100, f = DISP, a = 'left', fill = INK, alpha = 1, ls = 0 } = {}) {
  setFont(ctx, w, size, f, ls); ctx.textAlign = a; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
}
const blink = t => Math.floor(t * 3.2) % 2 === 0;
const sceneOf = t => ORDER.reduce((k, n) => (t >= S[n].scene ? n : k), 'hook');
function gridBg(ctx, W, H, t, bg, line, mark) {
  ctx.fillStyle = rgba(bg); ctx.fillRect(0, 0, W, H);
  const g = 90, off = (t * 8) % g;
  ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = -off; x < W + g; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = -off; y < H + g; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke(); ctx.strokeStyle = mark; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = -off; x < W + g; x += g) for (let y = -off; y < H + g; y += g) { ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); }
  ctx.stroke();
}
const darkBg = (ctx, W, H, t) => gridBg(ctx, W, H, t, BG, 'rgba(242,237,228,0.04)', 'rgba(242,237,228,0.12)');
/** numbered technique tag under the HUD; slides in at the start of its scene */
function tag(ctx, key, u, { theme = 'dark' } = {}) {
  const n = ORDER.indexOf(key), label = TX.tags[key], p = EASE.expo(prog(u, 0.05, 0.5));
  if (p <= 0) return;
  const num = String(n).padStart(2, '0'), x = 54 - (1 - p) * 40, y = 96;
  ctx.save(); ctx.globalAlpha = p;
  ctx.fillStyle = rgba(theme === 'dark' ? CORAL : BG); rrect(ctx, x, y, 52, 36, 8); ctx.fill();
  T(ctx, num, x + 26, y + 26, { f: MONO, w: 700, size: 20, a: 'center', fill: theme === 'dark' ? BG : INK });
  T(ctx, label, x + 66, y + 26, { f: MONO, w: 700, size: 22, fill: theme === 'dark' ? INK : BG, ls: 2 });
  ctx.restore();
}

// ───────────── 00 · hook: a prompt is typed; on Enter its letters become a dot field that ripples on the beat
const HG = grid(13, 9, 66), HC = [540, 480];
let CHARS = null;
function hook(ctx, t, { W, H }) {
  const u = t - S.hook.scene, te = 2.0, win = { x: 100, y: 330, w: 880, h: 250 };
  darkBg(ctx, W, H, t);
  const px = win.x + 92, py = win.y + 46 + 128;
  if (!CHARS) {                                   // where every letter of the prompt sits, and the grid dot it flies to
    const L = layout(ctx, TX.prompt, `500 38px ${MONO}`), n = TX.prompt.length;
    CHARS = [];
    for (let i = 0; i < n; i++) {
      if (TX.prompt[i] === ' ') continue;
      const col = Math.round(i / (n - 1) * 12), row = 4 + [0, -1, 1][CHARS.length % 3];
      CHARS.push({ x: L.cx(px, i), y: py - 13, g: HG[row * 13 + col] });
    }
  }
  // the dot field, after Enter
  if (u >= te) {
    const launches = [[te + 0.5, [0, 0]], [te + 1.0, [-198, -132]], [te + 1.5, [198, 132]]];
    const fx = p => { let G = 0, dx = 0, dy = 0; for (const [t0, o] of launches) { const w = ripple(p, o, t0, t, { speed: 900, width: 70, life: 1.1 }); G += w; const d = Math.hypot(p.x - o[0], p.y - o[1]) + 1e-3; dx += (p.x - o[0]) / d * 16 * w; dy += (p.y - o[1]) / d * 16 * w; } return { G: clamp(G * 1.6, 0, 1.3), dx, dy }; };
    const taken = new Set(CHARS.map(c => c.g.i));
    for (const p of HG) {
      if (taken.has(p.i)) continue;
      const s = spring(u - te - 0.2 - p.d / 1600, 20, 7); if (s <= 0.001) continue;
      const { G, dx, dy } = fx(p);
      ctx.fillStyle = rgba(mix(DIM, CORAL, clamp(G * 1.3))); ctx.beginPath(); ctx.arc(HC[0] + p.x + dx, HC[1] + p.y + dy, (6 + 10 * G) * s, 0, TAU); ctx.fill();
    }
    CHARS.forEach((c, i) => {
      const q = EASE.expo(prog(u, te + i * 0.012, te + 0.75 + i * 0.012)), { G, dx, dy } = fx(c.g);
      const x = lerp(c.x, HC[0] + c.g.x + dx * q, q), y = lerp(c.y, HC[1] + c.g.y + dy * q, q);
      ctx.fillStyle = rgba(mix(mix(INK, DIM, q), CORAL, clamp(G * 1.3 + (1 - q) * 0.4))); ctx.beginPath(); ctx.arc(x, y, lerp(9, 6 + 10 * G, q), 0, TAU); ctx.fill();
    });
    for (const [t0] of launches) {
      const a = t - t0; if (a < 0 || a > 0.6) continue;
      ctx.strokeStyle = rgba(CORAL, (1 - a / 0.6) * 0.6); ctx.lineWidth = 6 * (1 - a / 0.6) + 1; ctx.beginPath(); ctx.arc(HC[0], HC[1], 900 * a, 0, TAU); ctx.stroke();
    }
  }
  // the terminal window
  const appear = spring(u + 0.06, 14, 7), gone = E.inBack(prog(u, te, te + 0.3), 2.2), sc = (0.9 + 0.1 * appear) * (1 - gone);
  if (sc > 0.02) withScale(ctx, 540, win.y + win.h / 2, sc, () => {
    ctx.save(); ctx.globalAlpha = clamp(appear * 1.4);
    windowFrame(ctx, win.x, win.y, win.w, win.h, TX.shell);
    T(ctx, TX.cwd, win.x + 44, win.y + 46 + 62, { f: MONO, w: 500, size: 26, fill: DIM });
    T(ctx, '›', win.x + 44, py, { f: MONO, w: 700, size: 40, fill: CORAL });
    const n = Math.floor(clamp((u - 0.3) * 22, 0, TX.prompt.length)), s = TX.prompt.slice(0, n);
    T(ctx, s, px, py, { f: MONO, w: 500, size: 38 });
    setFont(ctx, 500, 38, MONO); const cw = ctx.measureText(s).width;
    if (n < TX.prompt.length || blink(u) || u > te - 0.3) { ctx.fillStyle = rgba(CORAL); ctx.fillRect(px + cw + 4, py - 32, 20, 40); }
    ctx.restore();
  });
}

// ───────────── 01 · code: the scene function types itself; scrubbing t moves the preview, and only t
const CODE = [
  [['export default', 'kw'], [' {', 'p']],
  [['  draw', 'fn'], ['(ctx, t) {', 'p']],
  [['    const ', 'kw'], ['r', 'v'], [' = ', 'p'], ['200', 'n'], [' + ', 'p'], ['80', 'n'], [' * Math.', 'p'], ['sin', 'fn'], ['(t * ', 'p'], ['3', 'n'], [');', 'p']],
  [['    ctx.', 'v'], ['arc', 'fn'], ['(W / ', 'p'], ['2', 'n'], [', H / ', 'p'], ['2', 'n'], [', r, ', 'p'], ['0', 'n'], [', TAU);', 'p']],
  [['    ctx.', 'v'], ['fill', 'fn'], ['();', 'p']],
  [['  },', 'p']],
  [['};', 'p']],
];
const scrubT = u => (u < 2 ? Math.max(0, u - 0.2) : 1.8 + 1.15 * Math.sin((Math.min(u, 3.8) - 2) * 3.4));
function code(ctx, t, { W, H, frameT }) {
  const u = t - S.code.scene, uf = (frameT ?? t) - S.code.scene;
  darkBg(ctx, W, H, t); tag(ctx, 'code', u);
  const wa = EASE.expo(prog(u, 0, 0.5));
  ctx.save(); ctx.globalAlpha = wa; ctx.translate(0, (1 - wa) * 40);
  windowFrame(ctx, 60, 150, 960, 380, 'scene.js');
  typeCode(ctx, 60, 150 + 46 + 52, CODE, Math.floor(Math.max(0, u - 0.25) * 75), { size: 28, lh: 44 });
  ctx.restore();
  // preview window: the same formula, at the scrubbed t
  const pa = spring(u - 1.0, 14, 7);
  if (pa > 0) withScale(ctx, 275, 715, 0.6 + 0.4 * pa, () => {
    ctx.save(); ctx.globalAlpha = clamp(pa * 1.5);
    windowFrame(ctx, 60, 560, 430, 310, TX.preview);
    const ts = scrubT(u), k = 264 / 1080, r = (200 + 80 * Math.sin(ts * 3)) * k, cx = 275, cy = 606 + 132;
    ctx.save(); rrect(ctx, 61, 606, 428, 263, 0); ctx.clip();
    radialBlob(ctx, cx, cy, r * 2.4, CORAL, 0.18);
    ctx.fillStyle = rgba(CORAL); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.restore(); ctx.restore();
  });
  // t readout + scrubber (digits from the un-blurred frame time)
  const ra = EASE.expo(prog(u, 1.25, 1.75));
  if (ra > 0) {
    ctx.save(); ctx.globalAlpha = ra; ctx.translate((1 - ra) * 40, 0);
    const ts = scrubT(u), tsf = scrubT(uf);
    T(ctx, `t = ${tsf.toFixed(2)} s`, 530, 655, { f: MONO, w: 700, size: 64, fill: AMBER });
    T(ctx, TX.same, 532, 705, { f: MONO, w: 500, size: 26, fill: DIM });
    const x0 = 540, x1 = 1000, y = 790, X = v => lerp(x0, x1, v / 4);
    ctx.fillStyle = rgba(INK, 0.18); ctx.fillRect(x0, y - 2, x1 - x0, 4);
    for (let v = 0; v <= 8; v++) { ctx.fillStyle = rgba(INK, v % 2 ? 0.25 : 0.5); ctx.fillRect(X(v / 2) - 1, y + 10, 2, v % 2 ? 8 : 14); }
    for (let v = 0; v <= 4; v++) T(ctx, `${v}s`, X(v), y + 50, { f: MONO, w: 500, size: 20, a: 'center', fill: DIM });
    ctx.fillStyle = rgba(CORAL); ctx.fillRect(x0, y - 2, X(ts) - x0, 4); ctx.fillRect(X(ts) - 2, y - 26, 4, 30);
    ctx.beginPath(); ctx.arc(X(ts), y - 30, 12, 0, TAU); ctx.fill();
    const pp = prog(u, 1.75, 2.0) * (1 - prog(u, 3.8, 4));
    if (pp > 0) { ctx.globalAlpha = ra * pp; pointer(ctx, X(ts) + 4, y - 26, 1.25, u > 2 && u < 3.8 ? 1 : 0); }
    ctx.restore();
  }
}

// ───────────── 02 · kinetic type on coral: letters rise out of masks, MOVES hops on the beats
function kinetic(ctx, t, { W, H }) {
  const u = t - S.type.scene, len = S.type.end - S.type.scene;
  gridBg(ctx, W, H, t, CORAL, 'rgba(10,10,13,0.07)', 'rgba(10,10,13,0.16)');
  tag(ctx, 'type', u, { theme: 'light' });
  const size = 236, x0 = 84, bases = [372, 584, 796];
  TX.type.forEach((word, li) => {
    const font = `900 ${size}px ${DISP}`, L = layout(ctx, word, font, -4);
    ctx.font = font; ctx.letterSpacing = '-4px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < word.length; i++) {
      const p = EASE.expo(prog(u, li * 0.25 + i * 0.04, li * 0.25 + i * 0.04 + 0.5));
      if (p <= 0) continue;
      let dy = (1 - p) * size * 1.05, sy = 1;
      if (li === 2) for (const hb of [1.0, 1.5]) {              // hop on beats 3 and 4 (left → right)
        const h = prog(u, hb + i * 0.045, hb + i * 0.045 + 0.26);
        if (h > 0 && h < 1) dy -= Math.sin(Math.PI * h) * 70;
        sy *= 1 - 0.14 * wobble(u - hb - i * 0.045 - 0.26, 26, 9) * (u > hb + i * 0.045 + 0.26 ? 1 : 0);
      }
      const exit = E.inBack(prog(u, len - 0.25 + li * 0.04, len), 2);
      dy -= exit * 260;
      ctx.save(); ctx.beginPath(); ctx.rect(0, bases[li] - size * (li === 2 ? 1.3 : 0.82), W, size * (li === 2 ? 1.46 : 0.98)); ctx.clip();
      ctx.fillStyle = rgba(li === 2 ? INK : BG);
      ctx.translate(x0 + L.cx(0, i), bases[li] + dy); ctx.scale(1, sy); ctx.fillText(word[i], -L.w(i) / 2, 0);
      ctx.restore();
    }
  });
}

// ───────────── 03 · dot field → ripples → 3D wave → swirl into a point → dot sphere → collapses into a dot
const DG = grid(15, 15, 58), DC = [540, 470], DMAX = Math.hypot(406, 406);
function dots(ctx, t, { W, H }) {
  const u = t - S.dots.scene, len = S.dots.end - S.dots.scene;
  darkBg(ctx, W, H, t); tag(ctx, 'dots', u);
  const RIP = [{ t: 0.5, o: [0, 0], c: CORAL }, { t: 1.0, o: [-232, -174], c: AMBER }, { t: 1.5, o: [232, 174], c: INK }];
  const tilt = 1.0 * E.inOutCubic(prog(u, 1.0, 1.6)), yaw = 0.35 * E.inOutCubic(prog(u, 1.0, 2.0)), amp = 70 * E.inOutCubic(prog(u, 1.0, 1.5));
  if (u < 2.55) {
    const pts = [];
    for (const p of DG) {
      const s = spring(u - 0.05 - 0.45 * (p.d / DMAX), 22, 7.5); if (s <= 0.001) continue;
      let x = p.x, y = p.y, z = 0, r = 4.2 * s, col = DIM;
      for (const q of RIP) {
        const w = ripple(p, q.o, q.t, u, { speed: 1000, width: 70, life: 1.1 }); if (w < 0.002) continue;
        const dx = p.x - q.o[0], dy = p.y - q.o[1], dd = Math.hypot(dx, dy) + 1e-3;
        r += 6 * w; x += dx / dd * 16 * w; y += dy / dd * 16 * w; col = mix(col, q.c, clamp(w * 1.4));
      }
      if (amp > 0) { const h = (Math.sin(p.d * 0.012 - u * 7.5) + 0.45 * Math.sin(p.x * 0.008 + p.y * 0.005 + u * 4)) * amp; z = -h; col = h > 0 ? mix(col, CORAL, clamp(h / amp)) : mix(col, AMBER, clamp(-h / amp) * 0.5); }
      const v = E.inCubic(prog(u, 2.1 + 0.15 * (p.d / DMAX), 2.5));
      if (v > 0) { const a = v * 3, ca = Math.cos(a), sa = Math.sin(a), k = 1 - v; [x, y] = [(x * ca - y * sa) * k, (x * sa + y * ca) * k]; z *= k; r *= 1 - 0.5 * v; col = mix(col, CORAL, v); }
      const P = project3D(x, y, z, { tilt, yaw });
      pts.push({ x: DC[0] + P.x, y: DC[1] - 40 * tilt * (1 - v) + P.y, r: r * P.s, z: P.z, col, a: clamp(0.3 + 0.7 * P.s) * (1 - prog(v, 0.85, 1)) });
    }
    pts.sort((a, b) => b.z - a.z);
    for (const o of pts) { ctx.fillStyle = rgba(o.col, o.a); ctx.beginPath(); ctx.arc(o.x, o.y, Math.max(0.1, o.r), 0, TAU); ctx.fill(); }
  }
  // the sphere grows out of the point, spins, pulses on the beats, then collapses into one dot
  const grow = spring(u - 2.45, 12, 6), fall = E.inBack(prog(u, len - 0.45, len), 2.2);
  const R = 250 * grow * (1 - fall);
  if (u > 2.45 && R > 2) {
    let pulse = 0; for (let b = 3.0; b < len - 0.4; b += BEAT) if (u >= b) pulse = Math.max(pulse, Math.exp(-(u - b) * 7));
    dotSphere(ctx, DC[0], DC[1], R, { yaw: u * 1.3, tilt: 0.42, count: 1100, band: Math.sin(u * 2.6) * 0.8, pulse, rings: R > 120, satellite: u * 2.4 });
  }
  const dot = Math.max(E.inExpo(prog(u, 2.3, 2.5)) * (1 - prog(u, 2.5, 2.7)), prog(u, len - 0.15, len));
  if (dot > 0) { ctx.fillStyle = rgba(CORAL); ctx.beginPath(); ctx.arc(DC[0], DC[1], 6 + 20 * dot, 0, TAU); ctx.fill(); }
}

// ───────────── 04 · morph with onion skins, next to the easing curve that drives it
const MORPH = [SHAPES.circle, SHAPES.square, SHAPES.triangle, SHAPES.star], MCOL = [CORAL, AMBER, INK, CORAL], MT = [0.5, 1.0, 1.5];
const MROT = [0, Math.PI / 2, (4 * Math.PI) / 3, 2 * Math.PI];
function morphAt(u) {
  let a = 0, b = 0, e = 0;
  for (let k = 0; k < 3; k++) if (u >= MT[k]) { a = k; b = k + 1; e = prog(u, MT[k], MT[k] + 0.3); }
  return { A: MORPH[a], B: MORPH[b], e: E.outBack(e, 1.6), idx: e > 0.5 ? b : a, rot: lerp(MROT[a], MROT[b], E.inOutCubic(e)), col: mix(MCOL[a], MCOL[b], clamp(e * 1.4)) };
}
function morph(ctx, t, { W, H }) {
  const u = t - S.morph.scene;
  darkBg(ctx, W, H, t); tag(ctx, 'morph', u);
  const cx = 300, cy = 460, R = 150 * (0.13 + 0.87 * spring(u, 14, 6));
  for (let k = 7; k >= 1; k--) {                        // onion skins: the same shape a few moments ago
    const m = morphAt(u - k * 0.04); if (u - k * 0.04 < 0) continue;
    ctx.strokeStyle = rgba(m.col, 0.32 * (1 - k / 8)); ctx.lineWidth = 2.5;
    morphPath(ctx, cx, cy, 150 * (0.13 + 0.87 * spring(u - k * 0.04, 14, 6)), m.A, m.B, m.e, m.rot); ctx.stroke();
  }
  const m = morphAt(u);
  ctx.fillStyle = rgba(m.col); morphPath(ctx, cx, cy, R, m.A, m.B, m.e, m.rot); ctx.fill();
  ctx.fillStyle = rgba(BG); ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.fill();
  // shape names, the active one lit
  const na = EASE.expo(prog(u, 0.2, 0.6));
  setFont(ctx, 700, 28, MONO); let x = cx - 220;
  TX.shapes.forEach((s, i) => {
    T(ctx, s, x, 720, { f: MONO, w: 700, size: 28, fill: i === m.idx ? MCOL[i] === INK ? INK : MCOL[i] : GHOST, alpha: na });
    setFont(ctx, 700, 28, MONO); x += ctx.measureText(s).width + 26;
  });
  // the easing curve: bends from linear into expo-out, then a ball rides it on the last beat
  const ga = EASE.expo(prog(u, 0.1, 0.5)), cpE = [0.16, 1, 0.3, 1], bend = E.inOutCubic(prog(u, 0.3, 0.9));
  const cp = [0.33, 0.33, 0.66, 0.66].map((v, i) => lerp(v, cpE[i], bend));
  easingGraph(ctx, 640, 660, 330, { cp, handles: prog(u, 0.15, 0.5), drawn: prog(u, 0.1, 0.6), ball: u > 0.9 ? clamp((u - 0.9) / 0.9) : null, pop: prog(u, 1.8, 2.1) }, { alpha: ga, bg: BG });
  T(ctx, TX.bezier, 805, 720, { f: MONO, w: 500, size: 24, a: 'center', fill: DIM, alpha: ga });
}

// ───────────── 05 · three.js: toon-shaded, ink-outlined "ft" built from extruded outlines, hopping on the beats
function letterShape(pts) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; }
const F_PTS = [[0, 0], [0.5, 0], [0.5, 1.3], [1.0, 1.3], [1.0, 1.7], [0.5, 1.7], [0.5, 1.95], [1.15, 1.95], [1.15, 2.4], [0.1, 2.4], [0, 2.3], [0, 1.7], [-0.3, 1.7], [-0.3, 1.3], [0, 1.3]];
const T_PTS = [[0, 0.1], [0.1, 0], [1.0, 0], [1.0, 0.42], [0.5, 0.42], [0.5, 1.3], [1.0, 1.3], [1.0, 1.7], [0.5, 1.7], [0.5, 2.2], [0, 2.2], [0, 1.7], [-0.3, 1.7], [-0.3, 1.3], [0, 1.3]];
function setup3D(api) {
  const gl = createGL(api, { shadows: true });
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf2ede4);
  const cam = new THREE.PerspectiveCamera(30, api.W / api.H, 0.1, 100); cam.position.set(0, 2.1, 10.5); cam.lookAt(0, 1.15, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(3.5, 7, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22, color: 0x0a0a0d }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ext = { depth: 0.55, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 };
  const mk = (pts, color) => { const g = new THREE.ExtrudeGeometry(letterShape(pts), ext); g.translate(0, 0, -0.275); const m = new THREE.Mesh(g, toon(color, { rim: 0.35 })); m.castShadow = true; return ink(m, 0.045, 0x0a0a0d); };
  const group = new THREE.Group(), f = mk(F_PTS, 0xff6a3d), tt = mk(T_PTS, 0xffb547);
  f.position.x = -1.25; tt.position.x = 0.35; group.add(f, tt); scene.add(group);
  const moons = [0, 1, 2, 3, 4, 5].map(i => { const m = ink(new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), toon(i % 2 ? 0x0a0a0d : 0xff6a3d)), 0.025, 0x0a0a0d); m.castShadow = true; scene.add(m); return m; });
  return { gl, scene, cam, group, f, tt, moons };
}
function threeD(ctx, t, api) {
  const u = t - S.three.scene, g = G3;
  const s = Math.max(0.001, spring(u, 12, 6));
  g.group.scale.setScalar(s);
  g.group.rotation.y = lerp(-1.5, 0.28, spring(u, 7, 4.5)) + 0.12 * Math.sin(u * 1.7);
  const hop = (b) => { const h = prog(u, b, b + 0.4); return h > 0 && h < 1 ? Math.sin(Math.PI * h) * 0.55 : 0; };
  const squash = (b) => 1 - 0.16 * wobble(u - b - 0.4, 24, 8) * (u > b + 0.4 ? 1 : 0);
  g.f.position.y = hop(0.5) + hop(1.5); g.f.scale.set(1, squash(0.5) * squash(1.5), 1);
  g.tt.position.y = hop(1.0); g.tt.scale.set(1, squash(1.0), 1);
  g.moons.forEach((m, i) => { const a = u * 1.6 + i * TAU / 6; m.position.set(Math.cos(a) * 2.5, 0.35 + 0.25 * Math.sin(a * 2 + i), Math.sin(a) * 1.6); m.scale.setScalar(spring(u - 0.3 - i * 0.05, 14, 6) + 0.001); });
  g.gl.render(ctx, g.scene, g.cam);
  tag(ctx, 'three', u, { theme: 'light' });
}

// ───────────── 06 · motion blur: the same spinner drawn at the frame time (sharp) and at the subframe time (blurred), over the tunnel
function spinner(ctx, cx, cy, time, col) {
  const a = time * 13;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
  ctx.fillStyle = rgba(col); rrect(ctx, -12, -150, 24, 150, 12); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -150, 22, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.fillStyle = rgba(INK); ctx.beginPath(); ctx.arc(cx, cy, 14, 0, TAU); ctx.fill();
}
function blur(ctx, t, { W, H, frameT }) {
  const u = t - S.blur.scene, tf = frameT ?? t;
  ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);
  tunnel(ctx, W, H, surge(u, BEAT, { rate: 1.3, kick: 0.6 }), t, { layers: 18 });
  ctx.fillStyle = rgba(BG, 0.25 + 0.35 * prog(u, 0.2, 0.6)); ctx.fillRect(0, 0, W, H);
  tag(ctx, 'blur', u);
  [[0, TX.blurOff, TX.blurOffSub, DIM, tf], [1, TX.blurOn, TX.blurOnSub, CORAL, t]].forEach(([i, head, sub, col, time]) => {
    const p = spring(u - 0.25 - i * 0.12, 13, 6.5), x = 70 + i * 480, y = 200, w = 460, h = 600;
    if (p <= 0) return;
    ctx.save(); ctx.translate(0, (1 - p) * 700);
    ctx.fillStyle = rgba(PANEL, 0.94); rrect(ctx, x, y, w, h, 26); ctx.fill();
    ctx.strokeStyle = rgba(i ? CORAL : INK, i ? 0.6 : 0.15); ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 26); ctx.stroke();
    T(ctx, head, x + w / 2, y + 82, { w: 800, size: 60, a: 'center', fill: i ? CORAL : INK });
    spinner(ctx, x + w / 2, y + 340, time, i ? CORAL : INK);
    T(ctx, sub, x + w / 2, y + h - 40, { f: MONO, w: 700, size: 26, a: 'center', fill: col });
    ctx.restore();
  });
}

// ───────────── 07 · one technique per beat: glitch, skew wipe, bars wipe, disc wipe
const BEATBG = [BG, CORAL, INK, BG, BG, BG, BG, BG], BEATFG = [CORAL, BG, BG, INK, INK, AMBER, INK, CORAL];
const fxBeats = () => clamp(Math.round((S.glitch.end - S.glitch.scene) / BEAT), 1, 8);
function fxBeat(ctx, t, { W, H }) {
  const u = t - S.glitch.scene, nb = fxBeats(), k = clamp(Math.floor(u / BEAT), 0, nb - 1), uk = u - k * BEAT, light = k === 1 || k === 2;
  ctx.fillStyle = rgba(BEATBG[k]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.5; gridBg(ctx, W, H, t, BEATBG[k], light ? 'rgba(10,10,13,0.06)' : 'rgba(242,237,228,0.04)', 'rgba(128,128,128,0.15)'); ctx.restore();
  if (k === 5) shockRing(ctx, 540, 470, uk, 0, { color: AMBER, life: 0.45, radius: 800, width: 34 });
  tag(ctx, 'glitch', u, { theme: light ? 'light' : 'dark' });
  const [word, fn] = TX.beats[k], size = fitFont(ctx, word, 880, 330, 900, DISP, -0.01), p = EASE.expo(prog(uk, 0, 0.3));
  withScale(ctx, 540, 470, lerp(1.35, 1, p), () => {
    const draw = (col, dx) => T(ctx, word, 540 + dx, 470 + size * 0.36, { w: 900, size, a: 'center', fill: col, ls: -size * 0.01 });
    if (k === 0 || k === 6) chromatic(ctx, BEATFG[k], 24 * (1 - prog(uk, 0, 0.4)) + 3, draw);
    else draw(BEATFG[k], 0);
  });
  T(ctx, fn, 540, 700, { f: MONO, w: 700, size: 34, a: 'center', fill: BEATFG[k], alpha: EASE.expo(prog(uk, 0.05, 0.3)) });
  for (let i = 0; i < nb; i++) { ctx.fillStyle = rgba(BEATFG[k], i <= k ? 1 : 0.25); ctx.beginPath(); ctx.arc(540 + (i - (nb - 1) / 2) * 40, 790, i === k ? 12 : 8, 0, TAU); ctx.fill(); }
  T(ctx, TX.bpm, 540, 845, { f: MONO, w: 700, size: 22, a: 'center', fill: BEATFG[k], alpha: 0.7, ls: 3 });
  if (k === 4) flash(ctx, W, H, uk, 0, 0.85, 0.09);
}

// ───────────── 08 · the real stems (lanes.js) scrolling under a playhead on the beat grid
function laneEnv(name, i, time) {
  if (LANES?.[name]) { const a = LANES[name], x = time * LANES.rate; const j = Math.floor(x); return a[clamp(j, 0, a.length - 1)] ?? 0; }
  if (name === 'voice') { const s = SCHEDULE.find(l => time >= l.voice && time < l.voice + l.dur); return s ? 0.4 + 0.5 * Math.abs(Math.sin(time * 23)) : 0; }
  if (name === 'kick') { const d = ((time % BEAT) + BEAT) % BEAT; return Math.exp(-d * 18); }
  if (name === 'music') return 0.35 + 0.15 * Math.sin(time * 4 + i);
  return 0.2 * Math.abs(Math.sin(time * 1.3));
}
function music(ctx, t, { W, H }) {
  const u = t - S.music.scene;
  darkBg(ctx, W, H, t); tag(ctx, 'music', u);
  const x0 = 210, x1 = 1020, back = 2.6, fwd = 1.0, X = time => lerp(x0, x1, (time - (t - back)) / (back + fwd)), ph = X(t);
  const cols = [CORAL, AMBER, INK, CORAL], top = 200, lh = 140;
  T(ctx, TX.master, 1020, 170, { f: MONO, w: 700, size: 26, a: 'right', fill: AMBER, alpha: EASE.expo(prog(u, 0.3, 0.7)) });
  // beat grid
  for (let b = Math.ceil((t - back) / BEAT); b * BEAT < t + fwd; b++) { const x = X(b * BEAT); ctx.fillStyle = rgba(INK, b % 4 === 0 ? 0.18 : 0.07); ctx.fillRect(x - 1, top - 10, 2, lh * 4 - 10); }
  TX.lanes.forEach((name, li) => {
    const p = EASE.expo(prog(u, li * 0.08, li * 0.08 + 0.5)), cy = top + li * lh + lh / 2 - 10, key = ['kick', 'music', 'fx', 'voice'][li];
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - p) * -60, 0);
    T(ctx, name, 60, cy + 9, { f: MONO, w: 700, size: 26, fill: cols[li] === INK ? INK : cols[li], ls: 2 });
    ctx.fillStyle = rgba(PANEL); rrect(ctx, x0 - 10, cy - lh / 2 + 14, x1 - x0 + 10, lh - 28, 14); ctx.fill();
    for (let x = x0; x < x1; x += 6) {
      const time = (t - back) + (x - x0) / (x1 - x0) * (back + fwd); if (time < 0) continue;
      const v = clamp(laneEnv(key, li, time)), hh = 4 + v * (lh / 2 - 22);
      ctx.fillStyle = rgba(cols[li], x < ph ? 0.95 : 0.3); ctx.fillRect(x, cy - hh, 4, hh * 2);
    }
    ctx.restore();
  });
  ctx.fillStyle = rgba(INK); ctx.fillRect(ph - 1.5, top - 24, 3, lh * 4 - 2);
  ctx.beginPath(); ctx.moveTo(ph - 10, top - 34); ctx.lineTo(ph + 10, top - 34); ctx.lineTo(ph, top - 22); ctx.closePath(); ctx.fill();
  T(ctx, TX.synth, 60, 800, { f: MONO, w: 500, size: 24, fill: DIM, alpha: EASE.expo(prog(u, 0.6, 1.0)) });
}

// ───────────── 09 · the captions, big: each word lights up when it's spoken, with its time from the voice track
function subs(ctx, t, { W, H, frameT }) {
  const u = t - S.subs.scene, s = S.subs;
  darkBg(ctx, W, H, t); tag(ctx, 'subs', u);
  const size = 104, sp = 28, maxW = 920, rowH = 150;
  setFont(ctx, 900, size, DISP, -1);
  const ws = s.words.map(w => ({ w, width: ctx.measureText(w[0]).width })), rows = [[]]; let cur = 0;
  for (const it of ws) { if (cur + it.width > maxW && rows[rows.length - 1].length) { rows.push([]); cur = 0; } rows[rows.length - 1].push(it); cur += it.width + sp; }
  const y0 = 470 - (rows.length - 1) * rowH / 2 + size * 0.36;
  let n = 0;
  rows.forEach((row, ri) => {
    const wTot = row.reduce((q, it) => q + it.width, 0) + sp * (row.length - 1); let x = 540 - wTot / 2;
    for (const it of row) {
      const [txt, w0, w1] = it.w, y = y0 + ri * rowH, appear = EASE.expo(prog(u, n * 0.03, n * 0.03 + 0.4));
      const spoken = t >= w0, now = t >= w0 && t < w1 + 0.08, lit = EASE.expo(prog(t, w0 - 0.04, w0 + 0.12));
      ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - size * 1.05 - 40, it.width + 20, size * 1.4 + 40); ctx.clip();
      T(ctx, txt, x, y + (1 - appear) * size * 1.1, { w: 900, size, fill: now ? CORAL : spoken ? INK : GHOST, ls: -1 });
      ctx.restore();
      if (lit > 0) {
        T(ctx, `${w0.toFixed(2)}s`, x, y - size * 0.86 - 6 + (1 - lit) * 10, { f: MONO, w: 700, size: 22, fill: AMBER, alpha: lit * 0.9 });
        if (now) { ctx.fillStyle = rgba(CORAL); ctx.fillRect(x, y + 18, it.width * EASE.expo(prog(t, w0, w0 + 0.2)), 7); }
      }
      x += it.width + sp; n++;
    }
  });
  void frameT;
  T(ctx, TX.subsNote, 540, 820, { f: MONO, w: 500, size: 24, a: 'center', fill: DIM, alpha: EASE.expo(prog(u, 0.5, 0.9)) });
}

// ───────────── 10 · the render command, counting real frames
function render(ctx, t, { W, H, frameT, fps }) {
  const u = t - S.render.scene, uf = (frameT ?? t) - S.render.scene, len = S.render.end - S.render.scene;
  darkBg(ctx, W, H, t); tag(ctx, 'render', u);
  const appear = EASE.expo(prog(u, 0, 0.4)), gone = E.inBack(prog(u, len - 0.35, len), 2.2), sc = (0.94 + 0.06 * appear) * (1 - gone);
  if (sc < 0.02) return;
  withScale(ctx, 540, 450, sc, () => {
    ctx.save(); ctx.globalAlpha = appear;
    windowFrame(ctx, 60, 190, 960, 500, 'terminal');
    const x = 104, y = 190 + 46 + 70, lh = 64, N = Math.round(DUR * fps);
    const n = Math.floor(clamp((u - 0.1) * 80, 0, TX.cmd.length));
    T(ctx, TX.cmd.slice(0, n), x, y, { f: MONO, w: 700, size: 28 });
    const show = (at, s, col = DIM) => { const a = EASE.expo(prog(u, at, at + 0.2)); if (a > 0) T(ctx, s, x, y + lh * (s === TX.chrome ? 1 : s === TX.audio ? 3 : 4), { f: MONO, w: 500, size: 26, fill: col, alpha: a }); };
    show(0.6, TX.chrome);
    const pr = clamp((uf - 0.75) / 1.1), f = Math.round(pr * N);
    if (u > 0.7) {
      T(ctx, TX.frame(f, N), x, y + lh * 2, { f: MONO, w: 700, size: 26, fill: INK });
      ctx.fillStyle = rgba(INK, 0.12); rrect(ctx, 560, y + lh * 2 - 22, 400, 22, 11); ctx.fill();
      ctx.fillStyle = rgba(CORAL); rrect(ctx, 560, y + lh * 2 - 22, Math.max(22, 400 * clamp((u - 0.75) / 1.1)), 22, 11); ctx.fill();
    }
    show(1.9, TX.audio); show(2.0, TX.done, CORAL);
    ctx.restore();
  });
}

// ───────────── 11 · end card: the wordmark assembles from dots, then the line, the URL and the licence
function endCard(ctx, t, { W, H }) {
  const u = t - S.end.scene, len = S.end.end - S.end.scene;
  ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);
  glassSlats(ctx, W, H, g => {
    g.fillStyle = rgba(BG); g.fillRect(0, 0, W, H);
    radialBlob(g, 540 + 260 * Math.sin(t * 0.7), 300 + 80 * Math.cos(t * 0.9), 520, CORAL, 0.32);
    radialBlob(g, 540 - 280 * Math.cos(t * 0.6), 760 + 60 * Math.sin(t * 0.8), 460, AMBER, 0.18);
  }, { angle: -1.1, width: 170, drift: t * 22, refraction: 60, count: 9 });
  ctx.fillStyle = rgba(BG, 0.55); ctx.fillRect(0, 0, W, H);
  const solid = EASE.expo(prog(u, 0.85, 1.25));
  if (solid < 1) {
    MARK.forEach(p => {
      const d = (p.x - 140) / 800, q = EASE.expo(prog(u, 0.05 + d * 0.25, 0.75 + d * 0.25)), a = hash(p.x * 0.13 + p.y * 0.71) * TAU;
      const sx = 540 + Math.cos(a) * 40 * (1 - q), sy = 450 + Math.sin(a) * 40 * (1 - q);
      ctx.fillStyle = rgba(mix(CORAL, INK, q), 1 - solid); ctx.beginPath(); ctx.arc(lerp(sx, p.x, q), lerp(sy, p.y, q), lerp(5, 3.4, q), 0, TAU); ctx.fill();
    });
  }
  if (solid > 0) {
    ctx.save(); ctx.globalAlpha = solid;
    setFont(ctx, 900, 230, DISP, -4); ctx.textAlign = 'center'; const w = ctx.measureText(TX.mark).width; ctx.textAlign = 'left';
    setFont(ctx, 900, 230, DISP, -4); const wFt = ctx.measureText('ft').width, wDash = ctx.measureText('ft-').width - wFt;
    T(ctx, 'ft', 540 - w / 2, 470, { w: 900, size: 230, ls: -4 });
    T(ctx, '-', 540 - w / 2 + wFt, 470, { w: 900, size: 230, ls: -4, fill: CORAL });
    T(ctx, 'motion', 540 - w / 2 + wFt + wDash, 470, { w: 900, size: 230, ls: -4 });
    ctx.restore();
  }
  const la = EASE.expo(prog(u, 1.0, 1.5));
  if (la > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 520, W, 80); ctx.clip(); T(ctx, TX.line, 540, 576 + (1 - la) * 70, { w: 700, size: 56, a: 'center', fill: INK }); ctx.restore(); }
  const ua = spring(u - 1.5, 14, 7);
  if (ua > 0) withScale(ctx, 540, 668, 0.85 + 0.15 * ua, () => {
    ctx.save(); ctx.globalAlpha = clamp(ua * 1.5);
    setFont(ctx, 700, 30, MONO); const w = ctx.measureText(TX.url).width + 64;
    ctx.fillStyle = rgba(PANEL, 0.95); rrect(ctx, 540 - w / 2, 636, w, 64, 32); ctx.fill();
    ctx.strokeStyle = rgba(CORAL, 0.7); ctx.lineWidth = 2; rrect(ctx, 540 - w / 2, 636, w, 64, 32); ctx.stroke();
    T(ctx, TX.url, 540, 679, { f: MONO, w: 700, size: 30, a: 'center', fill: INK });
    ctx.restore();
  });
  T(ctx, TX.chip, 540, 760, { f: MONO, w: 500, size: 24, a: 'center', fill: [176, 172, 166], alpha: EASE.expo(prog(u, 1.9, 2.3)), ls: 1 });
  void len;
}

const FN = { hook, code, type: kinetic, dots, morph, three: threeD, blur, glitch: fxBeat, music, subs, render, end: endCard };

// ───────────── captions: the narration, word by word, on a dark pill (drawn in post so they stay sharp)
function captions(ctx, t) {
  const i = SCHEDULE.findIndex(l => t >= l.voice - 0.15 && t < l.voice + l.dur + 0.4); if (i < 0) return;
  const s = SCHEDULE[i]; if (s.key === 'subs') return;
  const nxt = SCHEDULE[i + 1], out = Math.min(s.voice + s.dur + 0.4, nxt ? nxt.voice - 0.05 : 1e9);
  const a = EASE.expo(prog(t, s.voice - 0.15, s.voice + 0.05)) * (1 - E.inCubic(prog(t, out - 0.2, out)));
  if (a <= 0) return;
  const size = 50, sp = 14, maxW = 880, rowH = 60;
  setFont(ctx, 800, size, DISP, 0);
  const ws = s.words.map(w => ({ w, width: ctx.measureText(w[0]).width })), rows = [[]]; let cur = 0;
  for (const it of ws) { if (cur + it.width > maxW && rows[rows.length - 1].length) { rows.push([]); cur = 0; } rows[rows.length - 1].push(it); cur += it.width + sp; }
  const widths = rows.map(r => r.reduce((q, it) => q + it.width, 0) + sp * (r.length - 1)), bw = Math.max(...widths) + 56, bh = rows.length * rowH + 30;
  const cy = 936, top = cy - bh / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 14);
  ctx.fillStyle = rgba(BG, 0.86); rrect(ctx, 540 - bw / 2, top, bw, bh, 22); ctx.fill();
  ctx.strokeStyle = rgba(INK, 0.1); ctx.lineWidth = 1.5; rrect(ctx, 540 - bw / 2, top, bw, bh, 22); ctx.stroke();
  rows.forEach((row, ri) => {
    let x = 540 - widths[ri] / 2; const y = top + 15 + ri * rowH + 46;
    for (const it of row) {
      const [txt, w0, w1] = it.w, spoken = t >= w0, now = spoken && t < w1 + 0.06;
      T(ctx, txt, x, y, { w: 800, size, fill: now ? CORAL : spoken ? INK : [96, 96, 104] });
      x += it.width + sp;
    }
  });
  ctx.restore();
}

const lightAt = t => { const k = sceneOf(t); if (k === 'type' || k === 'three') return true; if (k !== 'glitch') return false; const b = Math.floor((t - S.glitch.scene) / BEAT); return b === 1 || b === 2; };
const HITS = () => [[S.hook.scene + 2, 0.45], [S.three.scene, 0.5], [S.blur.scene, 1], [S.glitch.scene, 0.85], ...(fxBeats() > 6 ? [[S.glitch.scene + 6 * BEAT, 1.2]] : []), [S.end.scene, 0.4]];

export default {
  async setup(api) {
    TX = COPY[api.lang] || COPY.en; DUR = api.duration;
    MARK = sampleDrawing(api.W, api.H, c => { setFont(c, 900, 230, DISP, -4); c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(TX.mark, 540, 470); }, 8);
    G3 = setup3D(api);
  },

  draw(ctx, t, api) {
    const { W, H } = api, key = sceneOf(t);
    const [sx, sy] = shake(t, [[S.hook.scene + 2, 9], [S.three.scene, 10], [S.blur.scene, 22], [S.glitch.scene, 12], [S.end.scene, 5]], 8);
    ctx.save(); ctx.translate(sx, sy);
    ctx.fillStyle = rgba(BG); ctx.fillRect(-40, -40, W + 80, H + 80);
    FN[key](ctx, t, api);
    ctx.restore();

    // transitions between scenes (cover before the cut, reveal after it)
    transition(ctx, W, H, t, { mid: S.code.scene, color: CORAL, stripe: INK, cover: { kind: 'skew', dur: 0.3 }, reveal: { kind: 'skew', dur: 0.4 } });
    transition(ctx, W, H, t, { mid: S.type.scene, color: CORAL, stripe: INK, cover: { kind: 'skew', dur: 0.3, dir: -1 }, reveal: { kind: 'skew', dur: 0.01 } });
    transition(ctx, W, H, t, { mid: S.dots.scene, color: BG, cover: { kind: 'bars', dur: 0.35 }, reveal: { kind: 'bars', dur: 0.01 } });
    transition(ctx, W, H, t, { mid: S.three.scene, color: CORAL, cover: { kind: 'disc', dur: 0.3, at: [300, 460] }, reveal: { kind: 'disc', dur: 0.4 } });
    transition(ctx, W, H, t, { mid: S.glitch.scene + BEAT, color: CORAL, stripe: INK, cover: { kind: 'skew', dur: 0.2 }, reveal: { kind: 'skew', dur: 0.01 } });
    transition(ctx, W, H, t, { mid: S.glitch.scene + 2 * BEAT, color: INK, cover: { kind: 'bars', dur: 0.22 }, reveal: { kind: 'bars', dur: 0.01 } });
    transition(ctx, W, H, t, { mid: S.glitch.scene + 3 * BEAT, color: BG, cover: { kind: 'disc', dur: 0.22, at: [540, 470] }, reveal: { kind: 'disc', dur: 0.01 } });
    transition(ctx, W, H, t, { mid: S.music.scene, color: CORAL, stripe: INK, cover: { kind: 'skew', dur: 0.3 }, reveal: { kind: 'skew', dur: 0.4 } });
    transition(ctx, W, H, t, { mid: S.subs.scene, color: CORAL, cover: { kind: 'skew', dur: 0.3, axis: 'y' }, reveal: { kind: 'skew', dur: 0.4, axis: 'y' } });
    transition(ctx, W, H, t, { mid: S.render.scene, color: CORAL, cover: { kind: 'bars', dur: 0.35 }, reveal: { kind: 'bars', dur: 0.45 } });

    // impacts
    flash(ctx, W, H, t, S.hook.scene + 2, 0.35, 0.06);
    shockRing(ctx, 540, 470, t, S.three.scene, { color: CORAL, life: 0.6, radius: 900, width: 40 });
    flash(ctx, W, H, t, S.blur.scene, 0.75, 0.08);
    shockRing(ctx, 540, 540, t, S.blur.scene, { color: AMBER, life: 0.7, radius: 1100, width: 60 });
    flash(ctx, W, H, t, S.end.scene, 0.25, 0.08, CORAL);
    // fade in from, and out to, the background so the loop is clean
    const f = Math.max(1 - prog(t, 0, 0.15), prog(t, api.duration - 0.45, api.duration));
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // glitch tears last: into the glitch beat, and a smaller one on its second half
    glitch(ctx, W, H, t, S.glitch.scene, { pre: 0.12, post: 0.3, width: 0.28 });
    glitch(ctx, W, H, t, S.glitch.scene + 0.3, { pre: 0.04, post: 0.12, width: 0.1, seed: 41 });
  },

  post(ctx, t, api) {
    const { W, H } = api, light = lightAt(t), key = sceneOf(t);
    const bl = key === 'glitch' && t >= S.glitch.scene + 7 * BEAT ? 0.3 * (1 - prog(t, S.glitch.scene + 7 * BEAT, S.glitch.end)) : 0;
    if (!light) bloom(ctx, W, H, { alpha: 0.12 + bl, blur: 9 + 20 * bl });
    aberrate(ctx, W, H, aberrationAt(t, HITS(), { px: 14, life: 0.3 }));
    vignette(ctx, W, H, light ? 0.1 : 0.25);
    captions(ctx, t);
    const label = `SCENE ${String(ORDER.indexOf(key)).padStart(2, '0')} ${key.toUpperCase()}`;
    const f = Math.max(1 - prog(t, 0, 0.15), prog(t, api.duration - 0.45, api.duration));
    ctx.save(); ctx.globalAlpha = 1 - f; hud(ctx, api, t, { theme: light ? 'light' : 'dark', scene: label, spec: TX.spec }); ctx.restore();
  },
};
