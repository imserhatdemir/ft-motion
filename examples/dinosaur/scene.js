// examples/dinosaur: "Dinozorlar nasıl yok oldu", a 18 s, 160 BPM story for Reels (1080x1920).
//   dusk → asteroid → impact → ash → silence → 75 % → a bird → the sky again (loops into bar 0)
// One bar = 1.5 s. Every cut and hit sits on a bar line: impact on bar 3, the %75 on bar 8, the bird on bar 9.
// Copy lives in COPY (tr / en). The voice-over lines (sound.py) are placed on the same bars.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, hash, noise1, setFont, vignette } from '../../engine/core.js';
import { flash, shockRing, glitch, aberrate, aberrationAt, bloom } from '../../engine/fx.js';

const COPY = {
  tr: {
    when: ['66 MİLYON', 'YIL ÖNCE'], size: '~10 KM', where: 'YUCATÁN', sun: 'GÜNEŞ KAYBOLDU', plants: 'BİTKİLER ÖLDÜ', chain: 'BESİN ZİNCİRİ ÇÖKTÜ',
    pct: '%', but: ['AMA HEPSİ', 'GİTMEDİ'], birds: 'KUŞLAR', birdsSub: 'hayatta kalan dinozorlardır', end: ['HÂLÂ', 'GÖKYÜZÜNDE'], species: 'türlerin yaklaşık %75\'i',
  },
  en: {
    when: ['66 MILLION', 'YEARS AGO'], size: '~10 KM', where: 'YUCATÁN', sun: 'THE SUN WENT OUT', plants: 'THE PLANTS DIED', chain: 'THE FOOD CHAIN COLLAPSED',
    pct: '%', but: ['BUT NOT', 'ALL OF THEM'], birds: 'BIRDS', birdsSub: 'are the dinosaurs that survived', end: ['STILL IN', 'THE SKY'], species: 'of all species, roughly',
  },
};

const INK = [244, 238, 226], EMBER = [255, 112, 52], GOLD = [255, 190, 90], NIGHT = [6, 9, 15], ASH = [70, 64, 60];
const DISP = "'Barlow Condensed'", MONO = "'JetBrains Mono'";
let BAR = 1.5, TX = COPY.tr;
const bar = n => n * BAR;

const HY = 1400;                     // horizon
const IMPACT = [830, HY + 12];         // where the rock lands
const AST0 = [985, 400];               // where the first light appears
const T_HIT = bar(3);

// ───────────── tiny helpers
function T(ctx, s, x, y, { w = 900, size = 100, f = DISP, a = 'left', fill = INK, ls = 0, alpha = 1 } = {}) {
  setFont(ctx, w, size, f, ls); ctx.textAlign = a; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
}
/** headline that rises out of a mask; the box leaves room for descenders and Turkish diacritics */
function rise(ctx, s, x, base, size, p, o = {}) {
  if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 1.0, 1080, size * 1.4); ctx.clip();
  T(ctx, s, x, base + (1 - p) * size * 1.2, { size, ...o }); ctx.restore();
}
const typed = (s, t, t0, cps) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - t0) * cps))));

// ───────────── world state, all a function of t
const lifeAt = t => 1 - E.inOutCubic(prog(t, bar(3.2), bar(6.5))) * 0.92 + E.inOutCubic(prog(t, bar(9), bar(11))) * 0.45;   // how green the ground is
const ashAt = t => E.outCubic(prog(t, T_HIT, bar(5.6))) * (1 - E.inOutCubic(prog(t, bar(8.8), bar(10.8))) * 0.85);       // how much sky the ash covers
const fireAt = t => (t < T_HIT ? 0 : Math.exp(-(t - T_HIT) / 1.6));

function sky(ctx, W, H, t) {
  const dusk = [[8, 14, 30], [128, 66, 44]], fire = [[26, 15, 14], [150, 52, 20]], dead = [[17, 15, 15], [52, 44, 40]], dawn = [[22, 40, 72], [255, 196, 130]];
  let top = dusk[0], hor = dusk[1];
  const f1 = E.outCubic(prog(t, T_HIT, bar(5))), f2 = E.inOutCubic(prog(t, bar(5), bar(7))), f3 = E.inOutCubic(prog(t, bar(9), bar(10.5))), f4 = E.inOutCubic(prog(t, bar(10.8), bar(12)));
  top = mix(top, fire[0], f1); hor = mix(hor, fire[1], f1);
  top = mix(top, dead[0], f2); hor = mix(hor, dead[1], f2);
  top = mix(top, dawn[0], f3 * (1 - f4)); hor = mix(hor, dawn[1], f3 * (1 - f4));
  top = mix(top, dusk[0], f4); hor = mix(hor, dusk[1], f4 * 0.9);
  const g = ctx.createLinearGradient(0, 0, 0, HY);
  g.addColorStop(0, rgba(top)); g.addColorStop(0.55, rgba(mix(top, hor, 0.25))); g.addColorStop(1, rgba(hor));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
  // stars
  const vis = (1 - ashAt(t)) * (1 - f3 * 0.9);
  for (let i = 0; i < 110; i++) {
    const x = hash(i) * W, y = hash(i + 200) * HY * 0.78, tw = 0.55 + 0.45 * noise1(t * 1.3 + i * 3.1);
    const a = vis * tw * (0.25 + 0.75 * hash(i + 400)) * (1 - y / HY * 0.6);
    if (a < 0.02) continue;
    ctx.fillStyle = rgba(INK, a); const r = 1 + hash(i + 600) * 1.8; ctx.fillRect(x, y, r, r);
  }
  // the low sun
  const sunA = 1 - E.inCubic(prog(t, bar(4.2), bar(6.2)));
  if (sunA > 0.01) {
    const sx = 170, sy = HY - 90 + prog(t, bar(4.2), bar(6.2)) * 90;
    const gg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 420); gg.addColorStop(0, rgba(GOLD, 0.55 * sunA)); gg.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = gg; ctx.fillRect(0, sy - 420, 760, 840);
    ctx.fillStyle = rgba([255, 214, 140], sunA); ctx.beginPath(); ctx.arc(sx, sy, 62, 0, TAU); ctx.fill();
  }
}

/** ash: slow dark billows rolling down the sky after the impact (circles with noise offsets, drawn back to front) */
function ashClouds(ctx, W, t) {
  const a = ashAt(t); if (a < 0.01) return;
  for (let i = 0; i < 46; i++) {
    const r = 150 + hash(i) * 190, x = hash(i + 50) * (W + 300) - 150 + noise1(t * 0.35 + i) * 60;
    const yTarget = hash(i + 90) * HY * 0.95, delay = hash(i + 130) * 0.5;
    const k = E.outCubic(clamp((a - delay * 0.6) / (1 - delay * 0.6)));
    const y = lerp(-r * 1.3, yTarget, k) + noise1(t * 0.4 + i * 2) * 25;
    const shade = 28 + hash(i + 170) * 22, glow = fireAt(t) * (1 - y / HY) * 0.9;
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    const c = mix([shade, shade - 3, shade - 6], [150, 54, 22], glow * 0.55);
    g.addColorStop(0, rgba(c, 0.93)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

// ───────────── ground: a perspective dot field the shockwave runs through
const ROWS = 24, COLS = 30;
function ground(ctx, W, H, t) {
  ctx.fillStyle = rgba([7, 9, 13]); ctx.fillRect(0, HY, W, H - HY);
  const life = clamp(lifeAt(t), 0, 1.2), d0 = t - T_HIT, ringR = d0 * 1700;
  for (let j = 0; j < ROWS; j++) {
    const u = (j + 0.5) / ROWS, y0 = HY + 34 + 480 * Math.pow(u, 1.9), s = 0.28 + u * 1.5;
    for (let i = 0; i < COLS; i++) {
      const x0 = 540 + (i - COLS / 2 + 0.5) * 62 * s;
      if (x0 < -40 || x0 > W + 40) continue;
      const dist = Math.hypot(x0 - IMPACT[0], (y0 - IMPACT[1]) * 2.4);
      let w = 0, heat = 0;
      if (d0 > 0) { const q = (dist - ringR) / 150; w = Math.exp(-q * q) * Math.exp(-d0 * 0.7); heat = clamp(1 - dist / (ringR + 1)) * Math.exp(-d0 / 2.2) * (ringR > dist ? 1 : 0); }
      const lift = w * (60 * s + 20);
      let c = mix(ASH, [64, 138, 88], clamp(life));
      c = mix(c, EMBER, clamp(heat * 1.3 + w * 0.7));
      ctx.fillStyle = rgba(mix(c, INK, 0.12), 0.55 + 0.45 * u);
      ctx.beginPath(); ctx.arc(x0, y0 - lift, (3.2 + w * 4) * s, 0, TAU); ctx.fill();
    }
  }
}

// ───────────── creatures
function sauropod(ctx, x, y, s, look, alpha = 1, tilt = 0, col = NIGHT) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(col); ctx.strokeStyle = rgba(col); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(0, -215, 200, 108, 0, 0, TAU); ctx.fill();                       // body
  ctx.beginPath(); ctx.moveTo(-170, -270); ctx.bezierCurveTo(-330, -230, -400, -120, -470, -78); ctx.bezierCurveTo(-380, -110, -300, -170, -165, -160); ctx.fill();   // tail
  for (const lx of [-120, -55, 85, 150]) { ctx.beginPath(); ctx.roundRect(lx - 28, -190, 56, 192, 24); ctx.fill(); }                                         // legs
  const ex = 335, ey = lerp(-95, -640, look), cx = lerp(340, 235, look), cy = lerp(-320, -420, look);
  ctx.lineWidth = 62; ctx.beginPath(); ctx.moveTo(140, -280); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();                                          // neck
  ctx.lineWidth = 40; ctx.beginPath(); ctx.moveTo(ex - 8, ey - 6); ctx.quadraticCurveTo(ex + 6, ey - 4, ex + 22, ey + 2); ctx.stroke();
  ctx.save(); ctx.translate(ex + 16, ey + 4); ctx.rotate(lerp(0.55, -0.15, look)); ctx.beginPath(); ctx.ellipse(18, 0, 50, 27, 0, 0, TAU); ctx.fill(); ctx.restore();   // head
  ctx.restore();
}
function plant(ctx, x, y, s, wilt, life) {
  const c = mix([70, 66, 58], [58, 132, 82], clamp(life)); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = rgba(c); ctx.lineCap = 'round';
  const bend = wilt * 0.9; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10 + bend * 60, -120, 24 + bend * 170, -240 + bend * 90); ctx.stroke();
  const tx = 24 + bend * 170, ty = -240 + bend * 90;
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.42 + bend * 1.0, L = 150 - Math.abs(k - 3) * 14, dr = bend * 55;
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - 20, tx + Math.cos(a) * L, ty + Math.sin(a) * L + dr); ctx.stroke();
  }
  ctx.restore();
}
function bird(ctx, x, y, s, flap, rot = 0, col = NIGHT, perch = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.fillStyle = rgba(col); ctx.strokeStyle = rgba(col); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(0, 0, 54, 30, -0.1, 0, TAU); ctx.fill();                          // body
  ctx.beginPath(); ctx.arc(52, -20, 21, 0, TAU); ctx.fill();                                     // head
  ctx.beginPath(); ctx.moveTo(70, -24); ctx.lineTo(100, -15); ctx.lineTo(70, -10); ctx.fill();   // beak
  ctx.beginPath(); ctx.moveTo(-44, 6); ctx.lineTo(-130, 30); ctx.lineTo(-120, 4); ctx.lineTo(-44, -8); ctx.fill(); // tail
  const wy = lerp(-10, -105, flap) * (1 - perch * 0.9), wl = 96 + flap * 10;                     // wing: folded when perched
  ctx.beginPath(); ctx.moveTo(-10, -8); ctx.quadraticCurveTo(-30, wy - 30, -70, wy + (1 - flap) * 20); ctx.quadraticCurveTo(-40, wy * 0.35, 14, 4); ctx.fill();
  if (perch > 0.01) { ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-6, 26); ctx.lineTo(-8, 54); ctx.moveTo(14, 27); ctx.lineTo(18, 54); ctx.stroke(); }
  ctx.restore();
}

// ───────────── the asteroid: a faint light, then a rock on fire
function asteroid(ctx, t) {
  const s = prog(t, bar(1), T_HIT); if (s <= 0 || t >= T_HIT) return;
  const p = E.inCubic(s), x = lerp(AST0[0], IMPACT[0], p), y = lerp(AST0[1], IMPACT[1], p), r = 3 + 172 * Math.pow(p, 0.82);
  const tail = 90 + 900 * p, ang = Math.atan2(y - AST0[1], x - AST0[0]);
  const tx = x - Math.cos(ang) * tail, ty = y - Math.sin(ang) * tail;
  const tg = ctx.createLinearGradient(x, y, tx, ty); tg.addColorStop(0, rgba(GOLD, 0.85)); tg.addColorStop(0.3, rgba(EMBER, 0.45)); tg.addColorStop(1, rgba(EMBER, 0));
  ctx.save(); ctx.strokeStyle = tg; ctx.lineCap = 'round'; ctx.lineWidth = r * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  const gg = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 3.2); gg.addColorStop(0, rgba(GOLD, 0.8)); gg.addColorStop(0.4, rgba(EMBER, 0.35)); gg.addColorStop(1, rgba(EMBER, 0));
  ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, TAU); ctx.fill();
  ctx.beginPath(); for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU, rr = r * (0.82 + 0.2 * hash(k % 16 + 5)); k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = rgba([34, 22, 18]); ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = rgba(GOLD); ctx.stroke(); ctx.restore();
}

/** fireball column and glowing crater at the landing point */
function fireball(ctx, t) {
  const d = t - T_HIT; if (d < 0 || d > 4.2) return;
  const k = E.outExpo(prog(d, 0, 0.9)), fade = 1 - E.inCubic(prog(d, 1.2, 4.2));
  const h = 1050 * k, w = 220 + 300 * k;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const q = i / 8, yy = IMPACT[1] - h * q, rr = (w * 0.5) * (0.5 + 0.9 * Math.sin(q * 2.6 + 0.4)) + noise1(t * 3 + i) * 14;
    const g = ctx.createRadialGradient(IMPACT[0], yy, 0, IMPACT[0], yy, rr);
    g.addColorStop(0, rgba(mix(GOLD, EMBER, q), 0.55 * fade)); g.addColorStop(1, rgba(EMBER, 0)); ctx.fillStyle = g; ctx.fillRect(IMPACT[0] - rr, yy - rr, rr * 2, rr * 2);
  }
  ctx.restore();
}

// ───────────── the 100 species dots: 75 go dark, centre-out
const SP_COLS = 10, SP_X = 540, SP_Y = 590, SP_GAP = 70;
const SP_END = bar(9.6);
const spDist = i => Math.hypot((i % SP_COLS) - 4.5, Math.floor(i / SP_COLS) - 4.5);
const SURVIVORS = (() => { const o = [...Array(100).keys()].sort((a, b) => spDist(b) - spDist(a) + (hash(a) - hash(b)) * 0.9); return new Set(o.slice(0, 25)); })();
function species(ctx, t) {
  const a = E.outExpo(prog(t, bar(7.3), bar(7.9))) * (1 - E.inCubic(prog(t, SP_END, bar(10)))); if (a <= 0.01) return;
  for (let i = 0; i < 100; i++) {
    const cx = SP_X + ((i % SP_COLS) - 4.5) * SP_GAP, cy = SP_Y + (Math.floor(i / SP_COLS) - 4.5) * SP_GAP;
    const born = E.outBack(prog(t, bar(7.3) + (i % 10) * 0.012 + Math.floor(i / 10) * 0.02, bar(7.3) + 0.4 + (i % 10) * 0.012 + Math.floor(i / 10) * 0.02), 2);
    const die = SURVIVORS.has(i) ? 0 : E.outCubic(prog(t, bar(8) + spDist(i) * 0.05 + hash(i) * 0.1, bar(8) + 0.35 + spDist(i) * 0.05 + hash(i) * 0.1));
    const alive = mix(GOLD, INK, 0.3), c = mix(alive, [58, 54, 52], die);
    const surv = SURVIVORS.has(i) ? 0.5 + 0.5 * Math.sin(t * 5 + i) * E.inOutCubic(prog(t, bar(9), bar(9.4))) : 0;
    const r = (15 - die * 7 + surv * 4) * born;
    ctx.globalAlpha = a; ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, r), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ───────────── text layers
function texts(ctx, W, t, tFrame) {
  // bar 0: when
  const w0 = prog(t, 0.08, 0.7), wOut = E.inCubic(prog(t, bar(1.7), bar(2)));
  if (wOut < 1) { ctx.save(); ctx.globalAlpha = 1 - wOut; TX.when.forEach((s, i) => rise(ctx, s, 84, 470 + i * 150, i ? 150 : 170, E.outExpo(prog(t, 0.08 + i * 0.12, 0.7 + i * 0.12)), { fill: i ? INK : GOLD })); ctx.restore(); }
  // bar 2: size
  const sz = prog(t, bar(2), bar(2.3));
  if (sz > 0 && t < T_HIT) { T(ctx, typed(TX.size, t, bar(2) + 0.05, 14), 84, 500, { f: MONO, w: 700, size: 76, fill: GOLD, alpha: E.outExpo(sz) }); }
  // bar 3: where
  if (t >= T_HIT && t < bar(5)) rise(ctx, TX.where, 84, 520, 190, E.outExpo(prog(t, T_HIT + 0.03, T_HIT + 0.5)), { fill: INK, alpha: 1 - E.inCubic(prog(t, bar(4.6), bar(5))) });
  // bar 5, 6, 7: one line each
  const line = (s, t0, t1, col = INK) => { const a = E.outExpo(prog(t, t0, t0 + 0.5)), o = E.inCubic(prog(t, t1 - 0.3, t1)); if (a <= 0 || o >= 1) return; ctx.save(); ctx.globalAlpha = 1 - o; rise(ctx, s, 84, 520, 118, a, { fill: col }); ctx.restore(); };
  line(TX.sun, bar(5), bar(6)); line(TX.plants, bar(6), bar(7), [200, 190, 176]);
  const ch = prog(t, bar(7), bar(7.25)), cho = E.inCubic(prog(t, bar(7.8), bar(8)));
  if (ch > 0 && cho < 1) T(ctx, typed(TX.chain, t, bar(7), 26), 540, 1250, { f: MONO, w: 700, size: 50, a: 'center', fill: [214, 204, 190], alpha: 1 - cho });
  // bar 8: the number, from the un-blurred frame time so digits stay crisp
  const nP = E.outExpo(prog(tFrame, bar(8), bar(8.9))), nOut = E.inCubic(prog(t, bar(8.85), bar(9.05)));
  if (nP > 0 && nOut < 1) {
    ctx.save(); ctx.globalAlpha = 1 - nOut; const n = Math.round(75 * nP), pop = 1 + 0.07 * Math.max(0, 1 - (tFrame - bar(8)) * 6);
    ctx.translate(540, 1330); ctx.scale(pop, pop);
    T(ctx, TX.pct + n, 0, 0, { size: 330, a: 'center', fill: EMBER }); ctx.restore();
    T(ctx, TX.species, 540, 1415, { f: MONO, w: 700, size: 40, a: 'center', fill: INK, alpha: (1 - nOut) * E.outExpo(prog(t, bar(8.3), bar(8.6))) });
  }
  // bar 9: but… (below the surviving 25 dots)
  TX.but.forEach((s, i) => { const a = E.outExpo(prog(t, bar(9) + i * 0.1, bar(9) + 0.6 + i * 0.1)), o = E.inCubic(prog(t, bar(10) - 0.2, bar(10))); if (a > 0 && o < 1) { ctx.save(); ctx.globalAlpha = 1 - o; rise(ctx, s, 84, 1230 + i * 165, 160, a, { fill: i ? GOLD : INK }); ctx.restore(); } });
  // bar 10: birds
  const bp = E.outExpo(prog(t, bar(10), bar(10.45))), bo = E.inCubic(prog(t, bar(10.8), bar(11.05)));
  if (bp > 0 && bo < 1) { ctx.save(); ctx.globalAlpha = 1 - bo; rise(ctx, TX.birds, 84, 560, 300, bp, { fill: INK }); T(ctx, typed(TX.birdsSub, t, bar(10.3), 32), 90, 650, { f: MONO, w: 700, size: 44, fill: GOLD }); ctx.restore(); }
  // bar 11: the last line
  TX.end.forEach((s, i) => { const ep = E.outExpo(prog(t, bar(11.1) + i * 0.12, bar(11.6) + i * 0.12)); if (ep > 0) rise(ctx, s, 84, 470 + i * 175, 175, ep, { fill: i ? GOLD : INK }); });
}

// ───────────── the scene
const CRASH = [[T_HIT, 34], [T_HIT + 0.02, 22]];
function worldCamera(t) {
  let dx = 0, dy = 0, s = 1;
  for (const [t0, a] of CRASH) { const d = t - t0; if (d >= 0) { const k = a * Math.exp(-d * 5.5); dx += noise1(t * 45 + a) * k; dy += noise1(t * 45 + a + 77) * k; s += 0.035 * Math.exp(-d * 7); } }
  const rumble = prog(t, bar(2), T_HIT) * 4 + Math.max(0, 1 - (t - T_HIT) / 2.5) * 6 * (t > T_HIT ? 1 : 0);
  dx += noise1(t * 30) * rumble; dy += noise1(t * 30 + 40) * rumble;
  return { dx, dy, s };
}

export default {
  async setup(api) { BAR = api.bar; TX = COPY[api.lang] || COPY.tr; },

  draw(ctx, t, api) {
    const { W, H } = api, tFrame = api.frameT ?? t, cam = worldCamera(t);
    ctx.fillStyle = rgba(NIGHT); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2 + cam.dx, HY + cam.dy); ctx.scale(cam.s, cam.s); ctx.translate(-W / 2, -HY);

    sky(ctx, W, H, t);
    // fire glow behind the horizon
    const fa = fireAt(t); if (fa > 0.01) { const g = ctx.createRadialGradient(IMPACT[0], HY, 0, IMPACT[0], HY, 900); g.addColorStop(0, rgba(EMBER, 0.55 * fa)); g.addColorStop(1, rgba(EMBER, 0)); ctx.fillStyle = g; ctx.fillRect(0, HY - 900, W, 960); }
    fireball(ctx, t);
    asteroid(ctx, t);
    ashClouds(ctx, W, t);
    ground(ctx, W, H, t);

    // creatures on the horizon: they look up as the light grows, then fade as the world dies
    const look = E.inOutCubic(prog(t, bar(1.2), bar(2.2))) * (1 - E.inOutCubic(prog(t, bar(4.2), bar(5))));
    const graze = (1 - E.inOutCubic(prog(t, bar(1.2), bar(2.2)))) * 0.08 * Math.sin(t * 2.4);
    const blast = d => (t > T_HIT ? E.outExpo(prog(t, T_HIT, T_HIT + 0.9)) * d : 0);
    const vanish = (a, b) => 1 - E.inCubic(prog(t, bar(a), bar(b)));
    sauropod(ctx, 960, HY + 12, 0.27, 0.35, vanish(6.5, 7.1), blast(-0.05));
    sauropod(ctx, 330, HY + 30, 0.84, look + graze, vanish(6.8, 7.6), -blast(0.07));
    sauropod(ctx, 640, HY + 8, 0.34, 0.1 + look * 0.5, vanish(6.6, 7.3), blast(0.04));
    const wilt = E.inOutCubic(prog(t, bar(3.4), bar(6.6)));
    for (const [px, py, ps] of [[70, HY + 140, 0.9], [990, HY + 180, 1.05], [470, HY + 105, 0.55], [770, HY + 125, 0.62]]) plant(ctx, px, py, ps, wilt, lifeAt(t));

    species(ctx, t);

    // the bird on a branch (bar 9) takes off (bar 10) and becomes a star (bar 11)
    if (t >= bar(9)) {
      const land = E.outExpo(prog(t, bar(9.05), bar(9.7))), go = prog(t, bar(10.2), bar(11.8));
      const bx0 = lerp(1300, 820, land), by0 = 1008 - Math.sin(land * Math.PI) * 70;
      if (t < bar(10.2)) {
        const br = E.outExpo(prog(t, bar(9), bar(9.5))), bx = lerp(1250, 0, 1 - br);
        ctx.save(); ctx.translate(bx - 0, 0); ctx.strokeStyle = rgba([12, 14, 18]); ctx.lineCap = 'round'; ctx.lineWidth = 18;
        ctx.beginPath(); ctx.moveTo(1180, 1040); ctx.quadraticCurveTo(920, 1070, 600, 1092); ctx.stroke();
        ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(900, 1066); ctx.quadraticCurveTo(870, 1010, 840, 990); ctx.stroke(); ctx.restore();
        bird(ctx, bx0, by0, 1.1, land < 1 ? 0.6 + 0.4 * Math.sin(land * 30) : 0, 0, [8, 10, 14], land);
      } else {
        const e = E.inBack(go, 1.2), x = lerp(820, 360, E.outCubic(go)), y = lerp(1008, 520, e), sc = lerp(1.1, 0.25, E.inCubic(go));
        bird(ctx, x, y, sc, 0.5 + 0.5 * Math.sin((t - bar(10.2)) * 22), -0.5 * E.outCubic(go), [8, 10, 14] , 0);
        if (go > 0.7) { const k = E.outExpo(prog(go, 0.7, 1)); ctx.fillStyle = rgba(INK, k); ctx.beginPath(); ctx.arc(x, y, 12 * k, 0, TAU); ctx.fill(); }
      }
    }
    ctx.restore();

    texts(ctx, W, t, tFrame);

    // hits
    flash(ctx, W, H, t, T_HIT, 1, 0.09, [255, 240, 214]);
    shockRing(ctx, IMPACT[0], IMPACT[1], t, T_HIT, { color: GOLD, life: 0.9, radius: 1700, width: 70 });
    glitch(ctx, W, H, t, T_HIT, { colors: [EMBER, INK] });

    // fade in from, and out to, the start colour so the loop is seamless
    const fi = 1 - prog(t, 0, 0.25), fo = prog(t, api.duration - 0.25, api.duration);
    const f = Math.max(fi, fo); if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = rgba(NIGHT); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },

  post(ctx, t, api) {
    const { W, H } = api;
    bloom(ctx, W, H, { alpha: 0.2 });
    aberrate(ctx, W, H, aberrationAt(t, [[T_HIT, 1], [bar(8), 0.45], [bar(9), 0.4]], { px: 22 }));
    vignette(ctx, W, H, 0.5);
  },
};
