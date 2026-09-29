// examples/reel: a 12.8 s, 150 BPM showcase reel (32 beats). Nine scenes, one file, zero keyframes.
//   hook → easing → morph → rhythm → type → tunnel → sphere → code → end card
// It exists to show the effects in engine/fx.js and engine/recipes.js working together (wipes, glitch, bloom, aberration,
// crisp HUD, dot sphere, tunnel, easing graph, typed code with a live preview inside a preview).
// Every time constant sits on the beat grid: `b(n)` = n beats, so bars are b(4), b(8) …  Copy lives in COPY (tr / en).
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, setFont, layout, rrect, vignette, morphPath, SHAPES } from '../../engine/core.js';
import { transition, flash, shockRing, glitch, aberrate, aberrationAt, bloom, hud, windowFrame, typeCode, codeLength, fitFont } from '../../engine/fx.js';
import { surge, tunnel, dotSphere, easingGraph, rippleDots } from '../../engine/recipes.js';

const COPY = {
  tr: {
    hook: ['NE', 'KADAR', 'İYİ'], hookSub: () => `hareketli grafik tasarımcısı, ${secs()} saniyede.`,
    tags: { easing: 'EASING', morph: 'MORPH', rhythm: 'RİTİM', type: 'TİPOGRAFİ' },
    typeA: 'HARE', typeB: 'KET', typeSub: 'kinetik tipografi',
    stamps: [{ small: 'KARE', counts: true }, { big: '60', small: 'FPS' }, { big: 'SIFIR', small: 'FARE' }],
    marquee: 'SADECE KOD · ',
    comment: '// hareket = zaman + matematik', rendering: n => `▸ ${n} / ${FRAMES} kare çiziliyor`, previewTitle: 'önizleme · 60fps',
    lines: ['BU VİDEO', 'KODLA', 'YAZILDI.'],
    endTop: 'KANITLADIM', endBig: 'MI', endSub: () => `${secs()} sn · ${FRAMES} kare · sadece kod`, sign: 'ft-motion ile yapıldı',
  },
  en: {
    hook: ['HOW', 'GOOD', 'AM I'], hookSub: () => `motion graphics, in ${secs()} seconds.`,
    tags: { easing: 'EASING', morph: 'MORPH', rhythm: 'RHYTHM', type: 'TYPOGRAPHY' },
    typeA: 'MOVE', typeB: 'MENT', typeSub: 'kinetic typography',
    stamps: [{ small: 'FRAMES', counts: true }, { big: '60', small: 'FPS' }, { big: 'ZERO', small: 'MOUSE' }],
    marquee: 'CODE ONLY · ',
    comment: '// motion = time + math', rendering: n => `▸ rendering ${n} / ${FRAMES} frames`, previewTitle: 'preview · 60fps',
    lines: ['THIS VIDEO', 'WAS WRITTEN', 'IN CODE.'],
    endTop: 'PROVED', endBig: 'IT', endSub: () => `${secs()} s · ${FRAMES} frames · code only`, sign: 'made with ft-motion',
  },
};

const BG = [10, 10, 13], INK = [242, 237, 228], ACCENT = [61, 123, 255], AMBER = [255, 181, 71], PANEL = [19, 19, 24];
const DISP = "'Barlow Condensed'", MONO = "'JetBrains Mono'";

// ───────────── timeline (in beats; filled in setup from api.beat)
let BEAT = 0.46875, TX = COPY.tr, LAY = null, FRAMES = 900, DURATION = 15;
const secs = () => DURATION.toFixed(1).replace(/\.0$/, '');     // "15" or "12.8", so copy never quotes a stale length
const b = n => n * BEAT;
const SCENES = [['hook', 0, 4], ['easing', 4, 6], ['morph', 6, 8], ['rhythm', 8, 10], ['type', 10, 12], ['tunnel', 12, 16], ['sphere', 16, 20], ['code', 20, 28], ['end', 28, 32]];
const at = name => b(SCENES.find(s => s[0] === name)[1]);
const sceneAt = t => (SCENES.find(([, a, z]) => t >= b(a) && t < b(z)) || SCENES[8])[0];
// camera hits [beat, strength]: zoom punch + shake. The sound track mirrors these in sound.py.
const HITS = [[0, 0.55], [1, 0.7], [2, 0.8], [2.5, 1], [4, 0.9], [6, 0.55], [8, 0.6], [10, 0.6], [12, 1], [14, 0.8], [15, 0.9], [16, 1], [20, 0.8], [24, 0.8], [25, 0.85], [26, 0.9], [28, 1], [29, 0.95]];
const BIG = [4, 12, 16, 20, 28];                      // hits that also get chromatic aberration (plus anything ≥ 0.95)

function camera(t) {
  let s = 1, dx = 0, dy = 0, r = 0;
  for (const [n, str] of HITS) {
    const d = t - b(n); if (d < 0 || d > 0.7) continue;
    const k = Math.exp(-d * 9) * str;
    s += 0.03 * k; dx += Math.sin(d * 97 + n * 5.1) * 15 * k; dy += Math.cos(d * 83 + n * 3.7) * 12 * k; r += Math.sin(d * 61 + n) * 0.007 * k;
  }
  return { s, dx, dy, r };
}

// ───────────── small drawing helpers
function T(ctx, s, x, y, { w = 800, size = 100, f = DISP, a = 'left', fill = INK, stroke = null, lw = 8, ls = 0, alpha = 1 } = {}) {
  setFont(ctx, w, size, f, ls); ctx.textAlign = a; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.globalAlpha *= alpha;
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = rgba(stroke); ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  if (fill) { ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); }
  ctx.restore();
}
const tw = (ctx, s, size, f = DISP, w = 800, ls = 0) => { setFont(ctx, w, size, f, ls); return ctx.measureText(s).width; };
const typed = (s, t, t0, cps) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - t0) * cps))));
const blink = t => Math.floor(t * 3.4) % 2 === 0;
const beatPulse = (t, t0) => Math.exp(-5 * ((((t - t0) / BEAT) % 1 + 1) % 1));
function grid(ctx, W, H, t, bg, line, mark) {
  ctx.fillStyle = rgba(bg); ctx.fillRect(0, 0, W, H);
  const g = 90, off = (t * 8) % g;
  ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = -off; x < W + g; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = -off; y < H + g; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke(); ctx.strokeStyle = mark; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = -off; x < W + g; x += g) for (let y = -off; y < H + g; y += g) { ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); }
  ctx.stroke();
}
const gridDark = (ctx, W, H, t) => grid(ctx, W, H, t, BG, 'rgba(242,237,228,0.045)', 'rgba(242,237,228,0.15)');
/** number pill + label, top left of the mini scenes */
function tag(ctx, u, num, label, theme = 'dark') {
  const p = E.outExpo(prog(u, 0, 0.22)); if (p <= 0) return;
  const x = 84, y = 128, pill = theme === 'coral' ? BG : ACCENT;
  ctx.save(); ctx.globalAlpha = p; ctx.translate(-36 * (1 - p), 0);
  ctx.fillStyle = rgba(pill); rrect(ctx, x, y - 30, 64, 44, 10); ctx.fill();
  T(ctx, num, x + 32, y, { size: 22, f: MONO, w: 700, a: 'center', fill: theme === 'coral' ? INK : BG });
  T(ctx, label, x + 84, y, { size: 22, f: MONO, w: 700, fill: theme === 'dark' ? INK : BG, ls: 4 });
  ctx.restore();
}
/** text that rises out of a mask line: clip to the line box, offset by (1 − p) */
function riseText(ctx, W, s, x, base, size, p, opt) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 1.25, W, size * 1.25 + size * 0.1); ctx.clip();
  T(ctx, s, x, base + (1 - p) * size * 1.15, { size, ...opt }); ctx.restore();
}

// ───────────── 1 · hook: three words slam on the beat, the "?" dot becomes the transition
function hook(ctx, W, H, t) {
  gridDark(ctx, W, H, t);
  const { size, x0, ls, lines, xq, byQ, cap } = LAY.hook;
  lines.forEach(({ s, t0, by }, i) => {
    const p = E.outExpo(prog(t, t0, t0 + 0.38)), rp = E.outExpo(prog(t, t0 + 0.03, t0 + 0.58));
    ctx.fillStyle = 'rgba(242,237,228,0.22)'; ctx.fillRect(x0, by + 30, (W - 2 * x0) * (i === 0 ? 1 : rp), 3);
    T(ctx, '0' + (i + 1), W - x0, by - cap - 22, { size: 22, f: MONO, w: 700, a: 'right', fill: [106, 106, 115], ls: 3, alpha: i === 0 ? 1 : p });
    if (i === 0) { const sc = 1 + 0.08 * (1 - E.outExpo(prog(t, 0, 0.32))); ctx.save(); ctx.translate(x0, by); ctx.scale(sc, sc); T(ctx, s, 0, 0, { size, w: 900, ls }); ctx.restore(); }
    else riseText(ctx, W, s, x0, by, size, p, { w: 900, ls });
  });
  const q = prog(t, b(2.5), b(2.5) + 0.5);
  if (q > 0) {
    const sq = 1 + 1.5 * (1 - E.outBack(q, 2.2)), wQ = LAY.hook.wQ;
    ctx.save(); ctx.translate(xq + wQ / 2, byQ - cap / 2); ctx.rotate(-0.3 * (1 - E.outExpo(q))); ctx.scale(sq, sq); ctx.globalAlpha = clamp(q * 5);
    T(ctx, '?', 0, cap / 2, { size, w: 900, a: 'center', fill: ACCENT }); ctx.restore();
  }
  const sub = TX.hookSub(), ss = typed(sub, t, b(3), 46);
  if (ss.length) {
    T(ctx, ss, x0, 994, { size: 26, f: MONO, w: 500, fill: INK, alpha: 0.85 });
    if (blink(t) || ss.length < sub.length) { ctx.fillStyle = rgba(ACCENT); ctx.fillRect(x0 + tw(ctx, ss, 26, MONO, 500) + 4, 974, 14, 26); }
  }
}

// ───────────── 2 · easing: a straight line bends into expo-out while a ball rides it
function easing(ctx, W, H, t) {
  const u = t - at('easing');
  gridDark(ctx, W, H, t); tag(ctx, u, '01', TX.tags.easing);
  const pin = E.outExpo(prog(u, 0, 0.3)), sc = lerp(0.9, 1, pin);
  ctx.save(); ctx.translate(540, 550); ctx.scale(sc, sc); ctx.globalAlpha = pin; ctx.translate(-540, -550);
  ctx.fillStyle = rgba(PANEL); rrect(ctx, 190, 190, 700, 700, 36); ctx.fill();
  ctx.strokeStyle = 'rgba(242,237,228,0.1)'; ctx.lineWidth = 2; rrect(ctx, 190, 190, 700, 700, 36); ctx.stroke();
  const k = E.inOutCubic(prog(u, 0.1, 0.52));
  const tb = prog(u, 0.2, 0.82);
  const ey = easingGraph(ctx, 270, 770, 540, {
    cp: [lerp(0.33, 0.16, k), lerp(0.33, 1, k), lerp(0.66, 0.3, k), lerp(0.66, 1, k)],
    handles: E.outExpo(prog(u, 0.02, 0.32)), drawn: E.outCubic(prog(u, 0.04, 0.46)), ball: u > 0.18 ? tb : null, pop: prog(u, 0.82, 1.22),
  }, { bg: BG, accent: ACCENT, alpha: 1 });
  T(ctx, 'TIME', 810, 804, { size: 15, f: MONO, w: 700, a: 'right', fill: [106, 106, 115], ls: 3 });
  ctx.save(); ctx.translate(244, 230); ctx.rotate(-Math.PI / 2); T(ctx, 'VALUE', 0, 0, { size: 15, f: MONO, w: 700, a: 'right', fill: [106, 106, 115], ls: 3 }); ctx.restore();
  if (ey !== null) T(ctx, 'y = ' + ey.toFixed(2), 802, 744, { size: 46, f: MONO, w: 700, a: 'right', fill: ACCENT });
  T(ctx, typed('cubic-bezier(.16, 1, .3, 1)', u, 0.12, 60), 270, 850, { size: 27, f: MONO, w: 500, fill: INK });
  ctx.restore();
}

// ───────────── 3 · morph: core's radial shape morph with onion skins
const HEX = { n: 6, inner: Math.cos(Math.PI / 6), rot: 0, scale: 1.02 };
const SEQ = [SHAPES.circle, SHAPES.square, SHAPES.triangle, SHAPES.star, HEX], MSTART = [0.05, 0.28, 0.515, 0.75];
function morphState(u) { let a = 0, m = 0; for (let k = 0; k < 4; k++) if (u >= MSTART[k]) { a = k; m = E.inOutCubic(prog(u, MSTART[k], MSTART[k] + 0.2)); } return { a, m }; }
function morph(ctx, W, H, t, u, mini = false) {
  gridDark(ctx, W, H, t); if (!mini) tag(ctx, u, '02', TX.tags.morph);
  const pin = E.outBack(prog(u, 0, 0.35), 2.2), R = 205;
  const rotOf = uu => { const { a, m } = morphState(uu); return uu * 0.5 + (a + m) * 1.0472 - 0.4; };
  ctx.save(); ctx.translate(540, 560);
  ctx.strokeStyle = 'rgba(242,237,228,0.16)'; ctx.lineWidth = 2; ctx.setLineDash([4, 14]); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, 360 * pin, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 4; i++) { const a = u * 2.4 + i * Math.PI / 2; ctx.fillStyle = rgba(i % 2 ? INK : AMBER); ctx.beginPath(); ctx.arc(Math.cos(a) * 360 * pin, Math.sin(a) * 360 * pin, 8, 0, TAU); ctx.fill(); }
  const pathAt = (uu, s) => { const { a, m } = morphState(uu); morphPath(ctx, 0, 0, R * s, SEQ[a], SEQ[a + 1], m, rotOf(uu)); };
  for (let k = 6; k >= 1; k--) { const uk = Math.max(0, u - k * 0.03); pathAt(uk, pin * (1 + 0.045 * k)); ctx.strokeStyle = `rgba(242,237,228,${0.5 * (1 - k / 7)})`; ctx.lineWidth = 3; ctx.stroke(); }
  pathAt(u, pin);
  const g = ctx.createLinearGradient(-R, -R, R, R); g.addColorStop(0, rgba(ACCENT)); g.addColorStop(1, rgba(mix(ACCENT, INK, 0.4)));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = rgba(INK); ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = rgba(BG); ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
  ctx.restore();
}

// ───────────── 4 · rhythm (cream): dot grid, ripples launched on the beat
function rhythm(ctx, W, H, t, api) {
  const u = t - at('rhythm'), t0 = at('rhythm');
  grid(ctx, W, H, t, INK, 'rgba(10,10,13,0.05)', 'rgba(10,10,13,0.16)'); tag(ctx, u, '03', TX.tags.rhythm, 'light');
  rippleDots(ctx, 540, 560, t, [[t0, 1], [t0 + BEAT / 2, 0.45], [t0 + BEAT, 1], [t0 + BEAT * 1.5, 0.45]], { from: BG, to: ACCENT });
  ctx.fillStyle = rgba(ACCENT); ctx.beginPath(); ctx.arc(540, 560, 16 + 22 * beatPulse(t, t0), 0, TAU); ctx.fill();
  T(ctx, `${api.bpm} BPM`, W - 84, 128, { size: 22, f: MONO, w: 700, a: 'right', fill: BG, ls: 4 });
}

// ───────────── 5 · type (coral): letters flip up out of masks, ghost outlines drift behind
function typo(ctx, W, H, t) {
  const u = t - at('type');
  grid(ctx, W, H, t, ACCENT, 'rgba(10,10,13,0.09)', 'rgba(10,10,13,0.25)'); tag(ctx, u, '04', TX.tags.type, 'coral');
  const { size, ls, x0, wFull } = LAY.type;
  [{ s: TX.typeA, by: 545, t0: 0.08, col: BG }, { s: TX.typeB, by: 885, t0: 0.26, col: INK }].forEach(l => {
    const gp = E.outExpo(prog(u, l.t0 + 0.4, l.t0 + 0.8));
    if (gp > 0.02) for (let k = 3; k >= 1; k--) T(ctx, l.s, x0 + 14 * k * gp, l.by + 14 * k * gp, { size, w: 900, ls, fill: null, stroke: BG, lw: 3, alpha: (0.28 - k * 0.06) * gp });
    const L = layout(ctx, l.s, `900 ${size}px ${DISP}`, ls);
    ctx.save(); ctx.beginPath(); ctx.rect(0, l.by - size * 0.95, W, size * 1.05); ctx.clip();
    for (let i = 0; i < l.s.length; i++) {
      const p = prog(u, l.t0 + i * 0.04, l.t0 + i * 0.04 + 0.3), pe = E.outExpo(p);
      ctx.save(); ctx.translate(L.cx(x0, i), l.by + (1 - pe) * size); ctx.rotate(-0.4 * (1 - pe)); ctx.scale(1, 0.85 + 0.15 * E.outBack(p, 2.5));
      T(ctx, l.s[i], 0, 0, { size, w: 900, ls, a: 'center', fill: l.col }); ctx.restore();
    }
    ctx.restore();
  });
  const bp = E.outExpo(prog(u, 0.55, 0.9));
  ctx.fillStyle = rgba(BG); ctx.fillRect(x0, 935, wFull * bp, 16);
  T(ctx, TX.typeSub, W - 84, 975, { size: 22, f: MONO, w: 700, a: 'right', fill: BG, ls: 2, alpha: bp });
}

// ───────────── 6 · tunnel: nested squares, one stamp per beat group
function stamp(ctx, W, H, big, small, p, maxW, maxPx = 470) {
  if (p <= 0) return;
  const size = fitFont(ctx, big, maxW, maxPx, 900, DISP, 0), cap = size * 0.7, sSize = 130, sCap = sSize * 0.7, gap = 40;
  const top = 540 - (cap + gap + sCap) / 2, bb = top + cap, sb = bb + gap + sCap, sc = lerp(1.7, 1, E.outExpo(p));
  ctx.save(); ctx.translate(540, 540); ctx.scale(sc, sc); ctx.translate(-540, -540); ctx.globalAlpha = clamp(p * 4);
  T(ctx, big, 540, bb, { size, w: 900, a: 'center', fill: INK, stroke: BG, lw: 30 });
  T(ctx, small, 540, sb, { size: sSize, w: 900, a: 'center', fill: ACCENT, stroke: BG, lw: 24, ls: 22 });
  ctx.restore();
}
function tunnelScene(ctx, W, H, t, api, tFrame) {
  const u = t - at('tunnel');
  ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(540, 540, 0, 540, 540, 560); g.addColorStop(0, rgba(ACCENT, 0.55)); g.addColorStop(1, rgba(ACCENT, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  tunnel(ctx, W, H, surge(u, BEAT), u, { colors: { a: ACCENT } });
  const seg = u < b(2) ? 0 : u < b(3) ? 1 : 2, S = TX.stamps[seg], u0 = [0, b(2), b(3)][seg];
  // the counter uses the un-blurred frame time so its digits stay sharp under motion blur
  const big = S.counts ? String(Math.round(FRAMES * E.outExpo(prog(tFrame - at('tunnel'), 0, 0.85)))) : S.big;
  stamp(ctx, W, H, big, S.small, prog(u, u0, u0 + 0.24), seg === 2 ? 800 : 780, seg === 2 ? 380 : 470);
}

// ───────────── 7 · sphere: dots, rings, a satellite, and a marquee behind it
function sphere(ctx, W, H, t) {
  const u = t - at('sphere');
  gridDark(ctx, W, H, t);
  const pulse = beatPulse(t, at('sphere')), unit = TX.marquee, size = 330, uw = tw(ctx, unit, size, DISP, 900);
  const o1 = (u * 300) % uw, o2 = (u * 220) % uw;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  for (let k = -1; k < 3; k++) T(ctx, unit, -o1 + k * uw, 470, { size, w: 900, fill: null, stroke: INK, lw: 3, alpha: 0.22 + 0.25 * pulse });
  for (let k = -1; k < 3; k++) T(ctx, unit, -uw + o2 + k * uw, 850, { size, w: 900, fill: INK, alpha: 0.06 + 0.06 * pulse });
  ctx.restore();
  ctx.save(); ctx.translate(0, 15);
  dotSphere(ctx, 540, 540, 315, { yaw: u * 1.05 + 0.4 + 0.25 * E.outExpo(clamp(u / BEAT)), tilt: 0.42, band: Math.sin(u * 3.3) * 0.85, pulse, satellite: u * 2.6, colors: { accent: ACCENT } });
  ctx.restore();
  shockRing(ctx, 540, 555, t, at('sphere'), { life: 0.7, width: 70, radius: 1500, color: ACCENT });
}

// ───────────── 8 · code: a real ft-motion scene types itself, renders, and previews inside itself
const CODE = [
  [['// motion = time + math', 'cm']],
  [['export default', 'kw'], [' {', 'p']],
  [['  draw', 'fn'], ['(ctx, t, api) {', 'p']],
  [['    const', 'kw'], [' p ', 'v'], ['= ', 'p'], ['EASE', 'v'], ['.', 'p'], ['expo', 'fn'], ['(', 'p'], ['prog', 'fn'], ['(t, ', 'p'], ['0', 'n'], [', ', 'p'], ['1', 'n'], ['));', 'p']],
  [['    ctx', 'v'], ['.', 'p'], ['fillRect', 'fn'], ['(', 'p'], ['0', 'n'], [', ', 'p'], ['0', 'n'], [', p * W, H);', 'p']],
  [['  },', 'p']],
  [['};', 'p']],
];
function code(ctx, W, H, t, api, tFrame) {
  const u = t - at('code');
  gridDark(ctx, W, H, t);
  const ep = E.outExpo(prog(u, 0, 0.35)), ex = 64, ey = 160, ew = 760, eh = 440;
  ctx.save(); ctx.globalAlpha = ep; ctx.translate(0, 50 * (1 - ep));
  windowFrame(ctx, ex, ey, ew, eh, 'scene.js', { accent: ACCENT });
  CODE[0][0][0] = TX.comment;
  typeCode(ctx, ex, ey + 100, CODE, Math.max(0, u - 0.12) * 150, { caret: ACCENT, colors: { kw: rgba(ACCENT) } });
  ctx.restore();
  const tp = E.outExpo(prog(u, b(1.5), b(1.5) + 0.35));
  if (tp > 0) {
    const tx = 64, ty = 650, tW = 520, tH = 250;
    ctx.save(); ctx.globalAlpha = tp; ctx.translate(0, 40 * (1 - tp));
    windowFrame(ctx, tx, ty, tW, tH, 'terminal', { accent: ACCENT });
    T(ctx, '$ node ft.mjs render examples/reel', tx + 28, ty + 92, { size: 21, f: MONO, w: 700 });
    const pr = E.inOutCubic(prog(tFrame - at('code'), b(2.2), b(2.2) + 1.3)), fr = String(Math.round(FRAMES * pr)).padStart(3, '0');
    T(ctx, TX.rendering(fr), tx + 28, ty + 134, { size: 22, f: MONO, w: 500, fill: [154, 154, 163] });
    ctx.fillStyle = 'rgba(242,237,228,0.14)'; rrect(ctx, tx + 28, ty + 158, tW - 56, 14, 7); ctx.fill();
    ctx.fillStyle = rgba(ACCENT); if (pr > 0) { rrect(ctx, tx + 28, ty + 158, Math.max(14, (tW - 56) * pr), 14, 7); ctx.fill(); }
    if (pr >= 1) T(ctx, `✓ reel.mp4 · ${DURATION.toFixed(1)} s`, tx + 28, ty + 214, { size: 24, f: MONO, w: 700, fill: AMBER });
    ctx.restore();
  }
  const pp = E.outBack(prog(u, b(2), b(2) + 0.4), 1.9);
  if (pp > 0) {
    const px = 620, py = 470, pw = 400, ph = 444;
    ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.scale(pp, pp); ctx.translate(-(px + pw / 2), -(py + ph / 2));
    windowFrame(ctx, px, py, pw, ph, TX.previewTitle, { r: 20, accent: ACCENT });
    ctx.save(); ctx.beginPath(); ctx.rect(px, py + 46, pw, ph - 46); ctx.clip();
    ctx.translate(px + pw / 2, py + 46 + (ph - 46) / 2); const ps = pw / 1080 * 1.04; ctx.scale(ps, ps); ctx.translate(-540, -560);
    const dur = b(2), ul = (u - b(2)) % dur;
    morph(ctx, W, H, at('morph') + ul, ul, true);
    ctx.restore();
    ctx.fillStyle = 'rgba(242,237,228,0.15)'; ctx.fillRect(px + 24, py + ph - 20, pw - 48, 4);
    ctx.fillStyle = rgba(ACCENT); ctx.fillRect(px + 24, py + ph - 20, (pw - 48) * (((u - b(2)) % dur) / dur), 4);
    ctx.restore();
  }
  // dim the windows and stamp the three lines (same masked rise as the hook: a bookend)
  const dp = E.outCubic(prog(u, b(4) - 0.05, b(4) + 0.25));
  ctx.fillStyle = `rgba(10,10,13,${0.86 * dp})`; ctx.fillRect(0, 0, W, H);
  const size = LAY.code.size, x0 = 84, cap = size * 0.72;
  TX.lines.forEach((s, i) => {
    const t0 = b(4 + i), by = 540 - (2 * (cap + 0.32 * size) + cap) / 2 + cap + i * (cap + 0.32 * size), p = E.outExpo(prog(u, t0, t0 + 0.36));
    if (p <= 0) return;
    ctx.fillStyle = 'rgba(242,237,228,0.22)'; ctx.fillRect(x0, by + 30, (W - 2 * x0) * E.outExpo(prog(u, t0 + 0.03, t0 + 0.58)), 3);
    riseText(ctx, W, s, x0, by, size, p, { w: 900, fill: i === 2 ? ACCENT : INK });
  });
}

// ───────────── 9 · end card (cream): a question, on purpose
function end(ctx, W, H, t) {
  const u = t - at('end');
  grid(ctx, W, H, t, INK, 'rgba(10,10,13,0.05)', 'rgba(10,10,13,0.16)');
  const x0 = 84, { s1, by1, s2, by2, mx, wMI, wQ } = LAY.end;
  const L = layout(ctx, TX.endTop, `900 ${s1}px ${DISP}`, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, by1 - s1 * 1.05, W, s1 * 1.15); ctx.clip();
  for (let i = 0; i < TX.endTop.length; i++) {
    const p = E.outExpo(prog(u, 0.14 + i * 0.03, 0.48 + i * 0.03));
    T(ctx, TX.endTop[i], x0 + L.xs[i], by1 + (1 - p) * s1 * 1.05, { size: s1, w: 900, fill: BG });
  }
  ctx.restore();
  const mp = prog(u, BEAT, BEAT + 0.6);
  if (mp > 0) {
    const cap = s2 * 0.7, sc = 1 + 1.3 * (1 - E.outBack(mp, 2.0));
    ctx.save(); ctx.translate(mx + wMI / 2, by2 - cap / 2); ctx.scale(sc, sc); ctx.globalAlpha = clamp(mp * 6);
    T(ctx, TX.endBig, 0, cap / 2, { size: s2, w: 900, a: 'center', fill: BG }); ctx.restore();
    const qu = prog(u, BEAT + 0.1, BEAT + 0.7), sq = 1 + 1.6 * (1 - E.outBack(qu, 2.4)), w0 = BEAT + 0.7;
    const wig = u > w0 ? 0.09 * Math.sin((u - w0) * 11) * Math.exp(-(u - w0) * 2.2) : 0;
    ctx.save(); ctx.translate(mx + wMI + 10 + wQ / 2, by2 - cap / 2); ctx.rotate(-0.3 * (1 - E.outExpo(qu)) + wig); ctx.scale(sq, sq); ctx.globalAlpha = clamp(qu * 6);
    T(ctx, '?', 0, cap / 2, { size: s2, w: 900, a: 'center', fill: ACCENT }); ctx.restore();
  }
  const ss = typed(TX.endSub(), u, b(1.2), 50);
  if (ss.length) T(ctx, ss, x0, 950, { size: 26, f: MONO, w: 700, fill: BG });
  const sg = typed(TX.sign, u, b(2), 40);
  if (sg.length) T(ctx, sg, W - x0, 950, { size: 26, f: MONO, w: 700, a: 'right', fill: ACCENT });
}

// ───────────── transitions, in one place so the order is obvious
function transitions(ctx, W, H, t, hookDot) {
  transition(ctx, W, H, t, { mid: b(4), color: ACCENT, cover: { kind: 'disc', dur: 0.36, at: hookDot }, reveal: { kind: 'skew', axis: 'y', dir: -1, dur: 0.46 } });
  transition(ctx, W, H, t, { mid: b(6), color: INK, stripe: ACCENT, cover: { dur: 0.3, dir: 1 }, reveal: { dur: 0.36, dir: 1 } });
  transition(ctx, W, H, t, { mid: b(8), color: ACCENT, cover: { kind: 'bars', dur: 0.32 }, reveal: { kind: 'bars', dur: 0.42 } });
  transition(ctx, W, H, t, { mid: b(10), color: BG, stripe: ACCENT, cover: { dur: 0.3, dir: -1 }, reveal: { dur: 0.36, dir: -1 } });
  transition(ctx, W, H, t, { mid: b(28), color: ACCENT, cover: { kind: 'disc', dur: 0.27, at: [540, 560] }, reveal: { kind: 'skew', axis: 'y', dir: -1, dur: 0.5 } });
}

export default {
  async setup(api) {
    BEAT = api.beat; TX = COPY[api.lang] || COPY.en; DURATION = api.duration; FRAMES = Math.round(api.duration * api.fps);
    const c = document.createElement('canvas').getContext('2d'), W = api.W;
    // hook: one size that fits the widest line (and the last word + "?"), then baselines with room for the İ dots
    const hs = Math.min(300, ...[...TX.hook.slice(0, 2), TX.hook[2] + '?'].map(s => fitFont(c, s, W - 168 - 80, 300, 900, DISP, 0)));
    const cap = hs * 0.7, pitch = cap + hs * 0.34, top = 555 - (2 * pitch + cap) / 2, by = [top + cap, top + cap + pitch, top + cap + 2 * pitch];
    const wQ = tw(c, '?', hs, DISP, 900), xq = 84 + tw(c, TX.hook[2], hs, DISP, 900) + 14;
    LAY = {
      hook: { size: hs, cap, x0: 84, ls: 0, wQ, xq, byQ: by[2], lines: TX.hook.map((s, i) => ({ s, t0: b(i), by: by[i] })) },
      type: (() => {
        const size = Math.min(430, fitFont(c, TX.typeA, 900, 430, 900, DISP, 0), fitFont(c, TX.typeB, 900, 430, 900, DISP, 0));
        const w = Math.max(tw(c, TX.typeA, size, DISP, 900), tw(c, TX.typeB, size, DISP, 900));
        return { size, ls: 0, wFull: w, x0: (W - w) / 2 };
      })(),
      code: { size: Math.min(250, ...TX.lines.map(s => fitFont(c, s, W - 168, 250, 900, DISP, 0))) },
      end: (() => {
        const s1 = fitFont(c, TX.endTop, W - 168, 300, 900, DISP, 0), s2 = 605, wMI = tw(c, TX.endBig, s2, DISP, 900), wQ2 = tw(c, '?', s2, DISP, 900);
        return { s1, by1: 372, s2, by2: 858, wMI, wQ: wQ2, mx: (W - (wMI + wQ2 + 10)) / 2 };
      })(),
    };
    LAY.hook.dot = [xq + wQ * 0.5, by[2] - hs * 0.088];
  },

  draw(ctx, t, api) {
    const { W, H } = api, cam = camera(t), name = sceneAt(t);
    ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(540 + cam.dx, 540 + cam.dy); ctx.rotate(cam.r); ctx.scale(cam.s, cam.s); ctx.translate(-540, -540);
    const tFrame = api.frameT ?? t;
    if (name === 'hook') hook(ctx, W, H, t);
    else if (name === 'easing') easing(ctx, W, H, t);
    else if (name === 'morph') morph(ctx, W, H, t, t - at('morph'));
    else if (name === 'rhythm') rhythm(ctx, W, H, t, api);
    else if (name === 'type') typo(ctx, W, H, t);
    else if (name === 'tunnel') tunnelScene(ctx, W, H, t, api, tFrame);
    else if (name === 'sphere') sphere(ctx, W, H, t);
    else if (name === 'code') code(ctx, W, H, t, api, tFrame);
    else end(ctx, W, H, t);
    ctx.restore();
    transitions(ctx, W, H, t, LAY.hook.dot);
    flash(ctx, W, H, t, b(12), 0.85, 0.07); flash(ctx, W, H, t, b(16), 0.6, 0.06, ACCENT);
    shockRing(ctx, 540, 540, t, b(12), { color: INK });
    glitch(ctx, W, H, t, b(20), { colors: [ACCENT, INK] });
    const fo = prog(t, api.duration - 0.2, api.duration);                      // fade to the start colour so the loop is seamless
    if (fo > 0) { ctx.save(); ctx.globalAlpha = fo; ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },

  // post runs once per output frame on the blended image: crisp HUD, glow, aberration on the big hits, vignette
  post(ctx, t, api) {
    const { W, H } = api, name = sceneAt(t), light = name === 'rhythm' || name === 'type' || name === 'end';
    hud(ctx, api, t, { theme: light ? 'light' : 'dark', brand: 'FT-MOTION · REEL', scene: 'SCENE 0' + (SCENES.findIndex(s => s[0] === name) + 1) + ' ' + name.toUpperCase(), spec: `1080×1080 · 60 FPS · ${api.bpm} BPM`, accent: ACCENT });
    bloom(ctx, W, H);
    aberrate(ctx, W, H, aberrationAt(t, HITS.filter(([n, s]) => BIG.includes(n) || s >= 0.95).map(([n, s]) => [b(n), s])));
    vignette(ctx, W, H, 0.45);
  },
};
