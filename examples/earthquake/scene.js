// examples/earthquake: "Deprem nasıl oluşur", 30 s Reels (1080x1920), light graph-paper look, one narrator, karaoke captions.
//   a slab of crust → plates slide → the edges lock and the ground bends → it snaps → waves → seismogram → x32 → Turkey's faults → calm
// The thread of the whole piece is one blue line (a road across the fault): it bends, snaps, and becomes the seismograph trace.
// Scene and word times come from schedule.js (written by voice.py from the narration it generated); the rupture sits on 10.0 s.
// Copy lives in COPY (tr / en); captions come from the narration text in schedule.js (Turkish only).
import { TAU, clamp, lerp, prog, rgba, mix, E, spring, hash, noise1, setFont, shake, vignette } from '../../engine/core.js';
import { flash, shockRing, aberrate, aberrationAt } from '../../engine/fx.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  tr: {
    hook: 'YERİN ALTINDA', plates: 'TEKTONİK LEVHALAR', speed: '~3 cm / yıl',
    friction: 'SÜRTÜNME', strain: 'GERİLİM BİRİKİR', gauge: 'GERİLİM', years: 'YIL', schematic: 'şematik', limit: 'SINIR',
    rupture: 'KIRILMA', focus: 'ODAK', epicentre: 'MERKEZ ÜSSÜ', waves: 'DALGALAR', p: 'P DALGASI', s: 'S DALGASI', pv: '~6 km/sn', sv: '~3,5 km/sn',
    seismo: 'SİSMOGRAF', surface: 'YÜZEY', mag: 'BÜYÜKLÜK', x32: '×32', energy: 'ENERJİ', turkey: 'TÜRKİYE', faults: 'AKTİF FAY HATLARI',
    naf: 'KUZEY ANADOLU FAYI', eaf: 'DOĞU ANADOLU FAYI', end: ['SESSİZ GÖRÜNÜR.', 'DURMAZ.'], map: 'sadeleştirilmiş harita',
  },
  en: {
    hook: 'BELOW YOUR FEET', plates: 'TECTONIC PLATES', speed: '~3 cm / year',
    friction: 'FRICTION', strain: 'STRESS BUILDS', gauge: 'STRESS', years: 'YEAR', schematic: 'schematic', limit: 'LIMIT',
    rupture: 'RUPTURE', focus: 'FOCUS', epicentre: 'EPICENTRE', waves: 'WAVES', p: 'P WAVE', s: 'S WAVE', pv: '~6 km/s', sv: '~3.5 km/s',
    seismo: 'SEISMOGRAPH', surface: 'SURFACE', mag: 'MAGNITUDE', x32: '×32', energy: 'ENERGY', turkey: 'TÜRKİYE', faults: 'ACTIVE FAULTS',
    naf: 'NORTH ANATOLIAN FAULT', eaf: 'EAST ANATOLIAN FAULT', end: ['LOOKS QUIET.', 'NEVER STOPS.'], map: 'simplified map',
  },
};

const PAPER = [243, 246, 249], INK = [13, 30, 58], BLUE = [37, 99, 235], TEAL = [14, 165, 150], PINK = [255, 61, 110], GREY = [150, 166, 188], FAINT = [214, 223, 235];
const DISP = "'Barlow Condensed'", MONO = "'JetBrains Mono'";
let TX = COPY.tr;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
// the rupture lands just before the word "kırılır" is spoken, snapped to an eighth note
const T_R = Math.round((S.rupture.words[S.rupture.words.length - 1][1] - 0.03) / 0.25) * 0.25;

// ───────────── small helpers
function T(ctx, s, x, y, { w = 900, size = 100, f = DISP, a = 'left', fill = INK, ls = 0, alpha = 1 } = {}) {
  setFont(ctx, w, size, f, ls); ctx.textAlign = a; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
}
/** headline rising out of a mask; the box leaves room for descenders and Turkish diacritics (İ Ş Ç Ğ Ü Ö) */
function rise(ctx, s, x, base, size, p, o = {}) {
  if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 1.05, 1080, size * 1.5); ctx.clip();
  T(ctx, s, x, base + (1 - p) * size * 1.2, { size, ...o }); ctx.restore();
}
const typed = (s, t, t0, cps) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - t0) * cps))));
const between = (t, a, b, fade = 0.25) => E.outExpo(prog(t, a, a + fade)) * (1 - E.inCubic(prog(t, b - fade, b)));
function line(ctx, pts, { col = INK, lw = 3, alpha = 1, dash = null, cap = 'round' } = {}) {
  ctx.save(); ctx.strokeStyle = rgba(col, alpha); ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = cap; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
}
function poly(ctx, pts, fill, stroke = null, lw = 2) {
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  if (fill) { ctx.fillStyle = rgba(fill); ctx.fill(); }
  if (stroke) { ctx.strokeStyle = rgba(stroke); ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function paper(ctx, W, H, t) {
  ctx.fillStyle = rgba(PAPER); ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(37,99,235,0.07)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = 0; x <= W; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(37,99,235,0.11)'; ctx.beginPath();
  for (let x = 0; x <= W; x += 300) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 300) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

// ───────────── the slab: an oblique block, x right, y into the screen, z up. u(x) is how far the ground has moved along y.
const CX = 505, CY = 1175, XW = 330, DD = 520, ZZ = 170;
const Pj = (x, y, z) => [CX + x + 0.38 * y, CY - z - 0.62 * y];
const T_SLIDE = 1.6, T_LOCK = S.strain.scene;

function motion(t) {
  let A;
  if (t < T_LOCK) A = 38 * E.inOutCubic(prog(t, T_SLIDE, T_LOCK));
  else if (t < T_R) A = 38 + 74 * prog(t, T_LOCK, T_R);
  else A = t > S.end.scene ? 60 + 10 * (t - S.end.scene) : 112;
  let lock = 0;
  if (t >= T_LOCK && t < T_R) lock = E.inOutCubic(prog(t, T_LOCK, T_LOCK + 0.6));
  else if (t >= T_R && t < S.end.scene) lock = 1 - spring(t - T_R, 24, 5.5);       // snaps free, overshoots, settles
  return { A, lock };
}
const disp = (x, m) => -Math.sign(x) * m.A * (1 - m.lock * Math.exp(-Math.abs(x) / 95));

function slab(ctx, t, m) {
  const p = E.outExpo(prog(t, 0.1, 0.9));
  ctx.save(); ctx.translate(0, 110 * (1 - p)); ctx.globalAlpha = p;
  const N = 26;
  for (const sg of [-1, 1]) {
    const xs = Array.from({ length: N + 1 }, (_, i) => sg * (1 + (XW - 1) * i / N));
    const u = xs.map(x => disp(x, m));
    const edge = (y0, z) => xs.map((x, i) => Pj(x, y0 + u[i], z));
    // front face, in strata
    const bands = [[0, 50, [168, 198, 232]], [50, 110, [128, 166, 214]], [110, ZZ, [92, 134, 190]]];
    for (const [z0, z1, c] of bands) poly(ctx, [...edge(0, -z0), ...edge(0, -z1).reverse()], c);
    // outer side (visible on the right half only)
    if (sg > 0) poly(ctx, [Pj(XW, u[N], 0), Pj(XW, DD + u[N], 0), Pj(XW, DD + u[N], -ZZ), Pj(XW, u[N], -ZZ)], [76, 112, 168]);
    // top face
    poly(ctx, [...edge(0, 0), ...edge(DD, 0).reverse()], [219, 232, 248]);
    // ground grid: it bends with the ground
    ctx.save(); ctx.beginPath(); [...edge(0, 0), ...edge(DD, 0).reverse()].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
    for (let k = 1; k < 8; k++) line(ctx, edge(DD * k / 8, 0), { col: [150, 180, 220], lw: 1.6 });
    for (let k = 1; k < 6; k++) { const x = sg * XW * k / 6, uu = disp(x, m); line(ctx, [Pj(x, uu, 0), Pj(x, DD + uu, 0)], { col: [150, 180, 220], lw: 1.6 }); }
    ctx.restore();
    // the road across the fault: this is the line that bends, snaps and becomes the seismograph trace
    line(ctx, edge(DD / 2, 0), { col: BLUE, lw: 9, cap: 'butt' });
    // outlines
    line(ctx, edge(0, 0), { col: INK, lw: 2.5 }); line(ctx, edge(0, -ZZ), { col: INK, lw: 2.5 }); line(ctx, edge(DD, 0), { col: INK, lw: 2.5 });
    line(ctx, [edge(0, 0)[0], edge(0, -ZZ)[0]], { col: INK, lw: 2.5 }); line(ctx, [edge(0, 0)[N], edge(0, -ZZ)[N]], { col: INK, lw: 2.5 });
    line(ctx, [edge(DD, 0)[0], edge(0, 0)[0]], { col: INK, lw: 2.5 }); line(ctx, [edge(DD, 0)[N], edge(0, 0)[N]], { col: INK, lw: 2.5 });
  }
  // the fault trace: appears when the plates part, glows after the rupture
  const fa = E.outExpo(prog(t, 1.5, 2.0));
  if (fa > 0) {
    const ru = t > T_R ? Math.exp(-(t - T_R) / 1.2) : 0;
    line(ctx, [Pj(0, 0, 0), Pj(0, DD, 0)], { col: mix(INK, PINK, clamp(ru * 1.4)), lw: 4 + 7 * ru, alpha: fa, dash: t < T_R ? [14, 10] : null });
  }
  ctx.restore();
}
const EPI = [0, 300];                                          // epicentre on the ground, focus 110 below it
function waves(ctx, t) {
  const d = t - T_R; if (d < 0) return;
  const e0 = Pj(EPI[0], EPI[1], 0), f0 = Pj(EPI[0], EPI[1], -110);
  // crests leave the epicentre one after another; the speeds are schematic (P about 1.7x S) and slow enough to stay on the block
  const ring = (v, delay, col, lw, k) => {
    const r = v * (d - delay); if (r < 4) return;
    const a = (1 - 0.28 * k) * (1 - E.inCubic(prog(r, 330, 470))); if (a <= 0) return;
    const pts = []; for (let i = 0; i <= 96; i++) { const th = i / 96 * TAU; pts.push(Pj(EPI[0] + r * Math.cos(th), EPI[1] + r * Math.sin(th), 0)); }
    ctx.save(); ctx.beginPath(); [Pj(-XW, 0, 0), Pj(XW, 0, 0), Pj(XW, DD, 0), Pj(-XW, DD, 0)].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
    line(ctx, pts, { col, lw: lw * (0.6 + 0.4 * a), alpha: a }); ctx.restore();
  };
  for (let k = 0; k < 4; k++) ring(125, 0.6 * k, BLUE, 11, k);
  for (let k = 0; k < 3; k++) ring(73, 0.9 * k, TEAL, 11, k);
  // the sound travelling through the rock: a circle around the focus
  const r3 = 73 * d, a3 = 1 - prog(r3, 120, 260);
  if (a3 > 0) { ctx.save(); ctx.globalAlpha = a3 * 0.7; ctx.strokeStyle = rgba(TEAL); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(f0[0], f0[1], r3 * 0.9, r3 * 0.62, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  void e0;
}
function pins(ctx, t) {
  const e0 = Pj(EPI[0], EPI[1], 0), f0 = Pj(EPI[0], EPI[1], -110);
  const pf = E.outExpo(prog(t, T_R + 0.05, T_R + 0.4)), pe = E.outExpo(prog(t, T_R + 0.25, T_R + 0.6)), out = 1 - E.inCubic(prog(t, S.waves.end - 0.3, S.waves.end));
  if (pf <= 0 || out <= 0) return;
  ctx.save(); ctx.globalAlpha = out;
  line(ctx, [e0, [lerp(e0[0], f0[0], pe), lerp(e0[1], f0[1], pe)]], { col: INK, lw: 3, dash: [8, 8] });
  const k = 1 + 0.25 * Math.sin(t * 9);
  ctx.fillStyle = rgba(PINK); ctx.beginPath(); ctx.arc(f0[0], f0[1], 18 * pf * k, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(PINK, 0.4); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f0[0], f0[1], 34 * pf * k, 0, TAU); ctx.stroke();
  ctx.strokeStyle = rgba(INK); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(e0[0], e0[1], 14 * pe, 0, TAU); ctx.stroke();
  T(ctx, TX.focus, f0[0] + 56, f0[1] + 12, { f: MONO, w: 700, size: 38, fill: PINK, alpha: pf });
  T(ctx, TX.epicentre, e0[0] - 40, e0[1] - 66, { f: MONO, w: 700, size: 34, a: 'center', fill: INK, alpha: pe });
  ctx.restore();
}

// ───────────── push arrows, the stress gauge, the year counter
function arrow(ctx, x, y, ang, len, col, alpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha; ctx.fillStyle = rgba(col); ctx.strokeStyle = rgba(col); ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2 - 14, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(len / 2 + 22, 0); ctx.lineTo(len / 2 - 22, -26); ctx.lineTo(len / 2 - 22, 26); ctx.closePath(); ctx.fill(); ctx.restore();
}
function pushArrows(ctx, t) {
  const a = between(t, 1.7, T_R + 0.1, 0.4) * (t < T_R ? 1 : 0); if (a <= 0.01) return;
  const bob = Math.sin(t * 5) * 6;
  const l = Pj(-XW - 40, DD * 0.55, 0), r = Pj(XW + 40, DD * 0.2, 0);
  arrow(ctx, l[0] - 30, l[1] - 40 + bob, -Math.PI / 2 - 0.35, 110, BLUE, a);
  arrow(ctx, r[0] - 10, r[1] + 20 - bob, Math.PI / 2 - 0.35, 110, BLUE, a);
}
function gauge(ctx, t, tFrame) {
  const a = between(t, T_LOCK + 0.1, T_R + 0.9, 0.3); if (a <= 0.01) return;
  const x = 70, y0 = 900, h = 450, w = 40;
  const s = t < T_R ? Math.pow(prog(t, T_LOCK, T_R), 1.4) : Math.max(0, 1 - E.outExpo(prog(t, T_R, T_R + 0.5)));
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = rgba(FAINT); ctx.fillRect(x, y0, w, h);
  ctx.fillStyle = rgba(mix(BLUE, PINK, clamp((s - 0.6) / 0.4))); ctx.fillRect(x, y0 + h * (1 - s), w, h * s);
  ctx.strokeStyle = rgba(INK); ctx.lineWidth = 3; ctx.strokeRect(x, y0, w, h);
  line(ctx, [[x - 14, y0], [x + w + 14, y0]], { col: PINK, lw: 4, dash: [10, 8] });
  T(ctx, TX.gauge, x + w / 2, y0 - 22, { f: MONO, w: 700, size: 26, a: 'center', fill: INK });
  const lp = E.outExpo(prog(t, S.rupture.scene + 0.1, S.rupture.scene + 0.5));
  if (lp > 0) T(ctx, TX.limit, x + w + 22, y0 + 8, { f: MONO, w: 700, size: 26, fill: PINK, alpha: lp });
  ctx.restore();
  // years go by (schematic)
  const yp = prog(tFrame, T_LOCK, T_R), yrs = Math.round(100 * yp);
  ctx.save(); ctx.globalAlpha = a;
  T(ctx, `${TX.years} +${yrs}`, 1000, 560, { f: MONO, w: 700, size: 54, a: 'right', fill: INK });
  T(ctx, TX.schematic, 1000, 600, { f: MONO, w: 500, size: 26, a: 'right', fill: GREY });
  ctx.restore();
}

// ───────────── seismograph: the blue line, flattened, now with a pen
const SG = { x0: 70, x1: 1010, y: 1010, T0: S.seismo.scene };
const TRACE_PX = 360;                                           // pixels per second of paper
function seismoSignal(tau) {
  const n = noise1(tau * 40) * 4;
  const env = (a, w, k) => (tau < a ? 0 : Math.min(1, (tau - a) / 0.08) * Math.exp(-(tau - a) / w) * k);
  const P = env(0.55, 0.9, 20) * Math.sin(tau * 95);
  const Sv = env(0.95, 1.1, 58) * Math.sin(tau * 52 + 1);
  const L = env(1.4, 1.6, 128) * Math.sin(tau * 26 + 2);
  return n + P + Sv + L;
}
function seismo(ctx, t) {
  const a = between(t, SG.T0, S.seismo.end, 0.3); if (a <= 0.01) return;
  const tau = Math.max(0, t - SG.T0 - 0.1);
  ctx.save(); ctx.globalAlpha = a;
  // chart paper
  ctx.fillStyle = rgba([252, 253, 255]); ctx.fillRect(40, 640, 1000, 760); ctx.strokeStyle = rgba(INK); ctx.lineWidth = 3; ctx.strokeRect(40, 640, 1000, 760);
  ctx.strokeStyle = 'rgba(37,99,235,0.14)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = 40; x <= 1040; x += 36) { ctx.moveTo(x, 640); ctx.lineTo(x, 1400); }
  for (let y = 640; y <= 1400; y += 36) { ctx.moveTo(40, y); ctx.lineTo(1040, y); }
  ctx.stroke();
  line(ctx, [[40, SG.y], [1040, SG.y]], { col: GREY, lw: 2, dash: [6, 8] });
  const x = Math.min(SG.x1, SG.x0 + TRACE_PX * tau), pts = [];
  for (let px = SG.x0; px <= x; px += 3) pts.push([px, SG.y - seismoSignal((px - SG.x0) / TRACE_PX)]);
  if (pts.length > 1) line(ctx, pts, { col: BLUE, lw: 7, cap: 'butt' });
  const yy = SG.y - seismoSignal(tau);
  ctx.fillStyle = rgba(INK); ctx.beginPath(); ctx.arc(x, yy, 11, 0, TAU); ctx.fill();
  // arrivals
  for (const [name, tt, col, dy] of [['P', 0.55, BLUE, 130], ['S', 0.95, TEAL, 220], [TX.surface, 1.4, PINK, 320]]) {
    const px = SG.x0 + TRACE_PX * tt; if (x < px) continue;
    const q = E.outExpo(prog(tau * TRACE_PX, tt * TRACE_PX, tt * TRACE_PX + 60));
    line(ctx, [[px, SG.y - dy + 40], [px, SG.y + 30]], { col, lw: 3, dash: [6, 6], alpha: q });
    T(ctx, name, px, SG.y - dy + 28, { f: name.length > 1 ? MONO : DISP, w: name.length > 1 ? 700 : 900, size: name.length > 1 ? 34 : 70, a: 'center', fill: col, alpha: q });
  }
  T(ctx, 'ZAMAN →', 1010, 1380, { f: MONO, w: 700, size: 24, a: 'right', fill: GREY });
  ctx.restore();
}

// ───────────── magnitude: each step is a square with 32x the area (side x 5.66)
function magnitude(ctx, t) {
  const a = between(t, S.mag.scene, S.mag.end, 0.3); if (a <= 0.01) return;
  const base = 1300, items = [[5, 22, 90], [6, 22 * 5.657, 175], [7, 22 * 32, 330]];
  const times = [S.mag.scene + 0.35, S.mag.words[2][1] - 0.1, S.mag.words[4][1] - 0.15];
  ctx.save(); ctx.globalAlpha = a;
  items.forEach(([m, side, x], i) => {
    const p = i === 0 ? E.outExpo(prog(t, times[0], times[0] + 0.4)) : E.outBack(prog(t, times[i], times[i] + 0.5), 1.4);
    if (p <= 0) return;
    const sd = side * Math.min(1, Math.max(0, p));
    const col = mix(BLUE, PINK, i / 2);
    ctx.fillStyle = rgba(col, 0.9); ctx.fillRect(x, base - sd, sd, sd); ctx.strokeStyle = rgba(INK); ctx.lineWidth = 3; ctx.strokeRect(x, base - sd, sd, sd);
    T(ctx, `M${m}`, x + (i < 2 ? 0 : 20), i === 2 ? base - sd + 70 : base + 56, { w: 900, size: i === 2 ? 66 : 50, fill: i === 2 ? PAPER : INK });
    if (i > 0) {
      const q = E.outExpo(prog(t, times[i] + 0.15, times[i] + 0.5)), px = i === 1 ? x - 36 : x - 56;
      T(ctx, TX.x32, px, base - 40 - 28 * (i - 1), { w: 900, size: i === 1 ? 52 : 76, a: 'right', fill: PINK, alpha: q });
    }
  });
  T(ctx, TX.energy, 1000, base + 56, { f: MONO, w: 700, size: 28, a: 'right', fill: GREY, alpha: E.outExpo(prog(t, S.mag.scene + 0.3, S.mag.scene + 0.7)) });
  ctx.restore();
}

// ───────────── Turkey, simplified, with the two big fault systems (hand-simplified outline, not a survey)
const LL = ([lon, lat]) => [60 + (lon - 26) * 50.5, 640 + (42.2 - lat) * 65];
const TR = [[26.05, 40.75], [26.35, 41.72], [27.0, 42.0], [28.0, 41.98], [28.95, 41.25], [29.1, 41.2], [30.3, 41.2], [31.5, 41.1], [33.0, 41.95], [34.9, 42.0], [36.2, 41.3], [38.0, 40.95], [39.7, 41.0],
  [41.5, 41.5], [42.5, 41.45], [43.4, 41.1], [44.8, 39.6], [44.5, 38.4], [44.2, 37.3], [42.3, 37.2], [40.0, 36.9], [38.0, 36.8], [36.7, 36.6], [36.0, 35.95], [36.0, 36.7], [35.0, 36.8],
  [34.0, 36.2], [32.5, 36.1], [31.0, 36.8], [29.5, 36.2], [29.1, 36.6], [28.2, 36.7], [27.4, 37.0], [27.25, 37.9], [26.4, 38.4], [26.7, 39.3], [26.05, 39.5], [26.2, 40.05],
  [27.0, 40.4], [28.0, 40.4], [29.1, 40.43], [29.5, 40.72], [29.9, 40.75], [29.3, 40.78], [29.05, 40.98], [28.95, 40.98], [28.0, 40.98], [27.5, 40.97], [27.1, 40.6], [26.65, 40.4], [26.2, 40.1], [26.4, 40.55]].map(LL);
const NAF = [[41.0, 39.3], [39.5, 39.75], [38.0, 40.1], [36.9, 40.5], [35.5, 40.75], [33.6, 41.0], [32.3, 40.85], [31.0, 40.75], [30.0, 40.72], [29.0, 40.75], [28.0, 40.8], [27.0, 40.6], [26.3, 40.5]].map(LL);
const EAF = [[41.0, 39.3], [40.2, 38.85], [39.2, 38.5], [38.3, 38.0], [37.4, 37.55], [36.8, 37.0], [36.3, 36.5]].map(LL);
function part(pts, p) {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = seg.reduce((a, b) => a + b, 0), out = [pts[0]];
  let need = tot * p;
  for (let i = 0; i < seg.length && need > 0; i++) { const k = Math.min(1, need / seg[i]); out.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]); need -= seg[i]; }
  return out;
}
function turkey(ctx, t) {
  const a = between(t, S.turkey.scene, S.turkey.end, 0.3); if (a <= 0.01) return;
  const u = t - S.turkey.scene, pm = E.outExpo(prog(u, 0.05, 0.7));
  ctx.save(); ctx.globalAlpha = a; ctx.translate(540, 850); ctx.scale(0.96 + 0.04 * pm, 0.96 + 0.04 * pm); ctx.translate(-540, -850);
  ctx.globalAlpha = a * pm;
  ctx.beginPath(); TR.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  ctx.fillStyle = rgba([205, 222, 246]); ctx.fill(); ctx.strokeStyle = rgba(INK); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.globalAlpha = a;
  const pn = prog(u, 0.5, 1.5), pe = prog(u, 0.9, 1.7), fl = 0.8 + 0.2 * Math.sin(t * 14);
  for (const [pts, p, name, lx, ly, anc] of [[NAF, pn, TX.naf, 150, 1150, 'left'], [EAF, pe, TX.eaf, 150, 1210, 'left']]) {
    const d = part(pts, E.inOutCubic(p));
    if (d.length > 1) { line(ctx, d, { col: PINK, lw: 20, alpha: 0.18 * fl }); line(ctx, d, { col: PINK, lw: 8 }); }
    const q = E.outExpo(prog(u, p > 0 ? 1.2 : 9, 1.7));
    if (p > 0) { const qq = E.outExpo(prog(p, 0, 0.3)); line(ctx, [[84, ly - 12], [128, ly - 12]], { col: PINK, lw: 8, alpha: qq }); T(ctx, name, lx, ly, { f: MONO, w: 700, size: 36, a: anc, fill: PINK, alpha: Math.max(q, 0) * qq }); }
  }
  T(ctx, TX.map, 1020, 1260, { f: MONO, w: 500, size: 22, a: 'right', fill: GREY });
  ctx.restore();
}

// ───────────── titles, per scene
function titles(ctx, t) {
  const x = 84;
  const big = (s, t0, t1, col = INK, size = 150, y = 470) => { const p = E.outExpo(prog(t, t0, t0 + 0.55)), o = E.inCubic(prog(t, t1 - 0.25, t1)); if (p > 0 && o < 1) { ctx.save(); ctx.globalAlpha = 1 - o; rise(ctx, s, x, y, size, p, { fill: col }); ctx.restore(); } };
  const sub = (s, t0, t1, col = BLUE, y = 540, cps = 40) => { const o = E.inCubic(prog(t, t1 - 0.25, t1)); if (t >= t0 && o < 1) T(ctx, typed(s, t, t0, cps), x, y, { f: MONO, w: 700, size: 40, fill: col, alpha: 1 - o }); };
  big(TX.hook, 0.1, S.hook.end); sub(TX.plates, S.hook.words[5][1], S.hook.end);
  if (t >= S.hook.words[7][1] - 0.4 && t < S.hook.end - 0.25) T(ctx, TX.speed, x, 600, { f: MONO, w: 700, size: 40, fill: INK, alpha: E.outExpo(prog(t, S.hook.words[7][1] - 0.4, S.hook.words[7][1])) });
  big(TX.friction, S.strain.scene + 0.05, S.strain.words[2][1], INK, 130, 470); big(TX.strain, S.strain.words[2][1], S.strain.end, BLUE, 118, 470);
  big(TX.limit, S.rupture.scene + 0.05, T_R, INK, 150, 470);
  const rp = E.outBack(prog(t, T_R, T_R + 0.35), 2.2); if (t >= T_R && t < S.rupture.end - 0.25) { ctx.save(); ctx.translate(x, 470); ctx.scale(0.8 + 0.2 * rp, 0.8 + 0.2 * rp); T(ctx, TX.rupture, 0, 0, { size: 150, fill: PINK, alpha: clamp(rp * 4) }); ctx.restore(); }
  big(TX.waves, S.waves.scene + 0.05, S.waves.end, INK, 150, 470);
  const pv = E.outExpo(prog(t, S.waves.words[1][1] - 0.1, S.waves.words[1][1] + 0.3)), sv = E.outExpo(prog(t, S.waves.words[2][1] - 0.05, S.waves.words[2][1] + 0.35)), wo = 1 - E.inCubic(prog(t, S.waves.end - 0.25, S.waves.end));
  if (pv > 0 && wo > 0) { ctx.save(); ctx.globalAlpha = wo; ctx.fillStyle = rgba(BLUE); ctx.fillRect(x, 520, 40, 14); T(ctx, `${TX.p}  ${TX.pv}`, x + 56, 536, { f: MONO, w: 700, size: 36, fill: BLUE, alpha: pv });
    ctx.fillStyle = rgba(TEAL); ctx.fillRect(x, 580, 40 * sv, 14); T(ctx, `${TX.s}  ${TX.sv}`, x + 56, 596, { f: MONO, w: 700, size: 36, fill: TEAL, alpha: sv }); ctx.restore(); }
  big(TX.seismo, S.seismo.scene + 0.05, S.seismo.end, INK, 150, 470);
  big(TX.mag, S.mag.scene + 0.05, S.mag.end, INK, 150, 470); sub(`+1 = ~${TX.x32.slice(1)}× ${TX.energy}`, S.mag.scene + 0.5, S.mag.end, PINK, 540);
  big(TX.turkey, S.turkey.scene + 0.05, S.turkey.end, INK, 150, 470); sub(TX.faults, S.turkey.scene + 0.4, S.turkey.end, PINK, 540);
  TX.end.forEach((s, i) => { const p = E.outExpo(prog(t, S.end.scene + 0.1 + i * 0.5, S.end.scene + 0.65 + i * 0.5)); if (p > 0) rise(ctx, s, x, 500 + i * 150, 136, p, { fill: i ? BLUE : INK }); });
}

// ───────────── captions: the narration, word by word, in the safe area
function captions(ctx, t) {
  const s = SCHEDULE.find(l => t >= l.voice - 0.2 && t < l.voice + l.dur + 0.45); if (!s) return;
  const a = E.outExpo(prog(t, s.voice - 0.2, s.voice)) * (1 - E.inCubic(prog(t, s.voice + s.dur + 0.15, s.voice + s.dur + 0.45)));
  setFont(ctx, 800, 80, DISP, 0);
  const sp = ctx.measureText(' ').width, ws = s.words.map(w => ({ w, width: ctx.measureText(w[0]).width }));
  const rows = [[]]; let cur = 0;
  for (const it of ws) { if (cur + it.width > 920 && rows[rows.length - 1].length) { rows.push([]); cur = 0; } rows[rows.length - 1].push(it); cur += it.width + sp; }
  const y0 = 1520 - (rows.length - 1) * 46;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 18);
  rows.forEach((row, ri) => {
    const wTot = row.reduce((q, it) => q + it.width, 0) + sp * (row.length - 1); let x = 540 - wTot / 2;
    for (const it of row) {
      const [txt, w0, w1] = it.w, spoken = t >= w0, now = t >= w0 && t < w1 + 0.05;
      T(ctx, txt, x, y0 + ri * 92, { w: 800, size: 80, fill: now ? BLUE : spoken ? INK : [159, 172, 192] });
      x += it.width + sp;
    }
  });
  ctx.restore();
}

// ───────────── the scene
export default {
  async setup(api) { TX = COPY[api.lang] || COPY.tr; },

  draw(ctx, t, api) {
    const { W, H } = api, tFrame = api.frameT ?? t, m = motion(t);
    paper(ctx, W, H, t);
    const [sx, sy] = shake(t, [[T_R, 22]], 6);
    const jit = t > T_R - 1 && t < T_R ? prog(t, T_R - 1, T_R) * 3 : 0;
    ctx.save(); ctx.translate(sx + noise1(t * 60) * jit, sy + noise1(t * 60 + 9) * jit);
    const blockA = 1 - E.inCubic(prog(t, S.rupture.end + 2.8, S.seismo.scene + 0.4)) * (t > S.waves.end ? 1 : 0);
    const blockBack = E.outExpo(prog(t, S.end.scene, S.end.scene + 0.7));
    const blockVis = t < S.seismo.scene ? 1 : t >= S.end.scene ? blockBack : 0;
    if (blockVis > 0.01) {
      ctx.save(); ctx.globalAlpha = blockVis * (t < S.seismo.scene ? 1 - E.inCubic(prog(t, S.seismo.scene - 0.3, S.seismo.scene)) : 1);
      ctx.save(); ctx.translate(540, 1100); ctx.scale(1.08, 1.08); ctx.translate(-540, -1100);
      slab(ctx, t, m); pushArrows(ctx, t); waves(ctx, t); pins(ctx, t); ctx.restore();
      gauge(ctx, t, tFrame); ctx.restore();
    }
    void blockA;
    seismo(ctx, t); magnitude(ctx, t); turkey(ctx, t);
    ctx.restore();
    titles(ctx, t);
    captions(ctx, t);

    // the snap
    flash(ctx, W, H, t, T_R, 0.7, 0.06, [255, 255, 255]);
    const e0 = Pj(EPI[0], EPI[1], 0); shockRing(ctx, e0[0], e0[1], t, T_R, { color: PINK, life: 0.8, radius: 1100, width: 46 });
    // fade in from, and out to, paper so the loop is clean
    const f = Math.max(1 - prog(t, 0, 0.3), prog(t, api.duration - 0.3, api.duration));
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = rgba(PAPER); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },

  post(ctx, t, api) {
    const { W, H } = api;
    aberrate(ctx, W, H, aberrationAt(t, [[T_R, 1]], { px: 14 }));
    vignette(ctx, W, H, 0.08);
  },
};
