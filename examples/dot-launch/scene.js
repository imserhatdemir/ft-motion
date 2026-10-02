// examples/dot-launch: a 72 s, 120 BPM launch film for ft-motion (English only).
//   a sentence is typed → one pink dot bounces on the beat and every bounce grows a shape → it drops into blue liquid →
//   the splash becomes particles that form the name → white wave → "Write a brief" → a white product window with a
//   pink/blue halo, the camera pushing in on each step (brief, storyboard, code, sheet QA, sound, render, languages) →
//   the dot pops out of the window and floods the frame pink → six feature cards → "Open source on GitHub" → the dot
//   lands as the dot of the end card.
// Bars are 2 s; every cut and hit sits on the grid via A(bar, step) (16 steps per bar). Captions double as a VO script.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, wobble, hash, noise1, setFont, layout, rrect, pill, check, project3D, radialBlob, shake, morphPath, SHAPES, sampleDrawing } from '../../engine/core.js';
import { typeCode, codeLength, discCover, shockRing, fitFont } from '../../engine/fx.js';

const COPY = {
  en: {
    caps: [
      'It starts with one sentence.', 'Then one dot,', 'one beat at a time,', 'until it builds a world.', 'Every frame is code.',
      'Meet ft-motion.', "Let's make a video.", 'Just describe it.', 'First, a storyboard', 'on a beat grid.',
      'Every frame is a function of time.', 'It checks its own frames', "and fixes what's off.", 'Sound on the same clock.',
      'Then it renders,', 'with real motion blur.', 'And in Turkish too.',
    ],
    prompt: 'make me a video', button: 'Write a brief', github: 'Open source on GitHub',
    tagline: 'motion graphics as code', url: 'github.com/imserhatdemir/ft-motion',
    brief: ['Make a 15-second launch video for Brew,', 'a coffee app. 1:1, 60 fps, sound on.'],
    replies: ['Read CLAUDE.md and docs/TECHNIQUES.md', '3 concepts → picked “Morning rush”', 'Storyboard: 15 s · 160 BPM · 10 bars'],
    boardHead: ['bar', 'picture', 'copy'],
    board: [
      ['0', 'Steam rises from an empty cup', '“Mornings are slow.”'],
      ['2', 'The cup fills on the downbeat', '“Brew is fast.”'],
      ['4', 'Order screen, one tap', '“One tap. Done.”'],
      ['6', 'A courier pin glides on a map', '“On its way.”'],
      ['8', 'Logo and download button', '“Get Brew.”'],
      ['9', 'End card holds', 'brew.app'],
    ],
    mini: { from: 'Your coffee, ready.', to: 'Kahven hazır.' }, langA: 'EN', langB: 'TR',
    preview: 'preview · 60fps', qaTitle: 'QA · out/sheet.png', qa: ['descenders & diacritics', 'overlaps', 'phone-size legibility', 'logo fidelity'],
    sheetErr: 'text clipped', sheetFix: 'fixed', fixing: 'fixing…',
    lanes: ['picture', 'sound'], events: ['cut', 'pop', 'type', 'pop', 'drop', 'cut', 'pop'], peak: 'true peak',
    rendering: 'rendering', frames: 'frames', sub1: '1 subframe', sub6: '6 subframes · 180° shutter',
    features: [['Kinetic', 'Type'], ['Motion', 'Blur'], ['Synth', 'Sound'], ['3D', 'Scenes'], ['Brand', 'Kit'], ['Agent', 'Ready']],
    cards: ['Kinetic Type', 'Motion Blur', 'Synth Sound', '3D Scenes', 'Brand Kit', 'Agent Ready'],
    agent: ['› make a launch video', '● storyboard on a beat grid', '● sheet checked', '● out/brew.mp4'],
  },
};

const CAP_AT = [
  [[0, 4], [1, 15]], [[2, 0], [2, 13]], [[2, 14], [3, 15]], [[4, 0], [5, 0]], [[5, 1], [6, 15]],
  [[7, 4], [8, 12]], [[9, 0], [9, 13]], [[10, 2], [11, 15]], [[12, 0], [12, 15]], [[13, 0], [13, 15]],
  [[14, 2], [15, 15]], [[16, 0], [17, 0]], [[17, 1], [17, 15]], [[18, 2], [19, 15]],
  [[20, 0], [20, 15]], [[21, 0], [21, 15]], [[22, 0], [23, 12]],
];
// demo sections: [draw fn, start bar, window title, camera focus [fx, fy] in window fractions, zoom]
const SECTIONS = [
  ['term', 10, 'agent · ~/brew', [0.47, 0.36], 1.24], ['board', 12, 'storyboard.md', [0.5, 0.5], 1.14],
  ['code', 14, 'scene.js', [0.5, 0.44], 1.16], ['sheet', 16, 'out/sheet.png', [0.5, 0.52], 1.08],
  ['sound', 18, 'sound.py', [0.47, 0.5], 1.16], ['render', 20, 'node ft.mjs render', [0.5, 0.42], 1.16],
  ['lang', 22, 'project.json · lang', [0.5, 0.48], 1.28],
];

const BLACK = [0, 0, 0], WHITE = [255, 255, 255], PINK = [255, 115, 226], BLUE = [33, 155, 241], MAG = [188, 55, 161];
const TXT = [24, 24, 32], SUB = [138, 138, 150], ESP = [32, 24, 21], AMBER = [255, 181, 71], CREAM = [242, 237, 228];
const OK = [46, 178, 96], BAD = [235, 52, 82];
const SANS = 'Inter', MONO = "'JetBrains Mono'", NAME = 'ft-motion';
const WX = 230, WY = 92, WW = 1460, WH = 812;
const FULL = [0.5, (540 - WY) / WH];

let W = 1920, H = 1080, A = (bar, step = 0) => bar * 2 + step * 0.125, TX = COPY.en, CAPS = [], FT = 0, PTS = [];

// ───────────────────────────── helpers
function T(ctx, s, x, y, { w = 700, size = 100, f = SANS, a = 'left', fill = WHITE, alpha = 1, ls = 0 } = {}) {
  setFont(ctx, w, size, f, ls); ctx.textAlign = a; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
}
const fill = (ctx, col) => { ctx.fillStyle = rgba(col); ctx.fillRect(-80, -80, W + 160, H + 160); };
const circle = (ctx, x, y, r, col, a = 1) => { if (r <= 0) return; ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
function cross(ctx, x, y, s, col, lw = 3) {
  ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); ctx.restore();
}
/** The ft-motion dot: pink → blue gradient. */
function gdot(ctx, x, y, r, a = 1) {
  if (r <= 0) return;
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, rgba(PINK, a)); g.addColorStop(1, rgba(BLUE, a));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
/** Blue arrow cursor; press ∈ [0,1] shrinks it for a click. */
function cursor(ctx, x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.42); ctx.scale(s * (1 - 0.14 * press), s * (1 - 0.14 * press));
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, 52); ctx.lineTo(8, 46); ctx.lineTo(8, 76); ctx.lineTo(-8, 76); ctx.lineTo(-8, 46); ctx.lineTo(-22, 52); ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.fillStyle = rgba(BLUE); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(WHITE); ctx.stroke();
  ctx.restore();
}
function caption(ctx, t) {
  CAPS.forEach(([a, b], i) => {
    const s = TX.caps[i];
    if (!s || t < a || t > b) return;
    const pin = spring(t - a, 20, 11), out = prog(t, b - 0.12, b), k = lerp(0.88, 1, clamp(pin, 0, 1.2));
    setFont(ctx, 600, 40, SANS, 0);
    const w = ctx.measureText(s).width + 56;
    ctx.save(); ctx.globalAlpha = prog(t, a, a + 0.06) * (1 - out);
    ctx.translate(W / 2, H - 80 + out * 10); ctx.scale(k, k);
    ctx.fillStyle = rgba(BLUE); rrect(ctx, -w / 2, -32, w, 64, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rgba(WHITE); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, 0, 14);
    ctx.restore();
  });
}
const SPARKS = Array.from({ length: 140 }, (_, i) => ({ x: hash(i * 3.1), y: hash(i * 7.7 + 1), z: 0.3 + 0.7 * hash(i * 1.3 + 5) }));
function sparks(ctx, t, drift = 0, alpha = 1, col = PINK) {
  const span = W + 200;
  for (const s of SPARKS) {
    const x = ((((s.x * span - drift * s.z) % span) + span) % span) - 100;
    circle(ctx, x, s.y * H, 2 + 3.5 * s.z, col, alpha * (0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + s.x * 40))) * s.z);
  }
}

// ───────────────────────────── the mark (gradient dot + name)
function markGeom(ctx, cx, base, size, w = 800) {
  const font = `${w} ${size}px ${SANS}`, L = layout(ctx, NAME, font, -size * 0.03);
  const r = size * 0.2, gap = size * 0.16, x0 = cx - (2 * r + gap + L.total) / 2;
  return { font, L, size, base, r, dx: x0 + r, dy: base - size * 0.27, tx: x0 + 2 * r + gap, ls: -size * 0.03 };
}
function letters(ctx, g, lt, { ink = WHITE, alpha = 1 } = {}) {
  if (lt <= 0) return;
  ctx.save(); ctx.font = g.font; ctx.letterSpacing = `${g.ls}px`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = rgba(ink, alpha);
  ctx.beginPath(); ctx.rect(g.tx - 40, g.base - g.size * 1.05, g.L.total + 80, g.size * 1.32); ctx.clip();
  for (let i = 0; i < NAME.length; i++) {
    const e = EASE.expo(prog(lt, 0.05 + i * 0.035, 0.65 + i * 0.035));
    ctx.fillText(NAME[i], g.tx + g.L.xs[i], g.base + (1 - e) * g.size * 1.1);
  }
  ctx.restore();
}

// ───────────────────────────── 1 · a sentence (bars 0–1)
function typed(ctx, t) {
  fill(ctx, BLACK); sparks(ctx, t, t * 10, prog(t, 0.2, 1.2));
  const s = TX.prompt, n = Math.floor(clamp(prog(t, A(0, 4), A(0, 14))) * s.length);
  const del = Math.floor(clamp(prog(t, A(1, 8), A(1, 13))) * s.length), shown = s.slice(0, Math.max(0, n - del));
  setFont(ctx, 600, 84, SANS, -1.5);
  const tw = ctx.measureText(s).width, x0 = W / 2 - tw / 2, base = 470;
  T(ctx, shown, x0, base, { w: 600, size: 84, ls: -1.5 });
  setFont(ctx, 600, 84, SANS, -1.5);
  const cx = x0 + ctx.measureText(shown).width + 8;
  if (t < A(1, 14) && (Math.floor(t * 2.5) % 2 === 0 || (n < s.length && n > 0) || del > 0)) { ctx.fillStyle = rgba(PINK); ctx.fillRect(cx, base - 70, 8, 88); }
  // the caret becomes the dot
  const d = prog(t, A(1, 13), A(1, 15));
  if (d > 0) circle(ctx, cx + 4, lerp(base - 26, base - 26, d), lerp(6, 40, E.outBack(d)), PINK);
}

// ───────────────────────────── 2 · one dot, one beat at a time (bars 2–4), the drop (bar 5)
const FLOOR = 780, HOP = 1.0, STEP = 380;
const SHAPE_SEQ = [SHAPES.circle, SHAPES.square, SHAPES.triangle, SHAPES.star, SHAPES.square, SHAPES.circle];
const SHAPE_COL = [BLUE, PINK, MAG, BLUE, PINK, WHITE];
const impact = k => A(2, 4) + k * HOP;
function dotPath(t) {
  // returns { x (world), y, sx, sy }
  const t0 = A(1, 15);
  if (t < impact(0)) { const u = prog(t, t0, impact(0)); return { x: 0, y: lerp(424, FLOOR - 40, u * u), sx: 1, sy: 1 }; }
  const k = Math.min(5, Math.floor((t - impact(0)) / HOP)), u = (t - impact(k)) / HOP;
  const sq = 0.32 * wobble(t - impact(k), 24, 10);
  let y = FLOOR - 40 - 4 * 360 * u * (1 - u);
  if (k === 5 && u > 0.5) y = FLOOR - 40 - 360 + 360 * Math.pow((u - 0.5) * 2, 2) * 3.4;   // the last hop falls through the floor
  return { x: (k + clamp(u)) * STEP, y, sx: 1 + sq, sy: 1 - sq };
}
function bounce(ctx, t) {
  fill(ctx, BLACK);
  const p = dotPath(t), camX = t < impact(0) ? 0 : p.x;
  sparks(ctx, t, camX * 0.4 + t * 10, 1);
  const floorA = 1 - prog(t, A(5), A(5, 4));
  ctx.fillStyle = rgba(WHITE, 0.16 * floorA); ctx.fillRect(-80, FLOOR, W + 160, 3);
  for (let k = 0; k < 6; k++) {
    const d = t - impact(k);
    if (d < 0) continue;
    const x = W / 2 + k * STEP - camX, s = spring(d, 13, 8), A0 = SHAPE_SEQ[k], B0 = SHAPE_SEQ[(k + 1) % 6];
    const m = E.inOutCubic(prog(d, 0.9, 1.6));
    ctx.save(); ctx.globalAlpha = floorA;
    morphPath(ctx, x, FLOOR - 150 * s, 110 * s, A0, B0, m, d * 0.6);
    ctx.fillStyle = rgba(SHAPE_COL[k], 0.9); ctx.fill();
    ctx.restore();
    shockRing(ctx, x, FLOOR, t, impact(k), { color: PINK, life: 0.55, radius: 260, width: 14 });
  }
  // the blue liquid rises; the dot drops into it
  const lv = lerp(H + 120, 640, EASE.expo(prog(t, A(5), A(5, 8)))) - (H + 400) * E.inExpo(prog(t, A(5, 10), A(6)));
  const hit = A(5, 9);
  if (lv < H + 100) {
    ctx.fillStyle = rgba(BLUE); ctx.beginPath(); ctx.moveTo(-80, H + 80);
    for (let x = -80; x <= W + 80; x += 20) {
      const r = Math.abs(x - W / 2), ring = t > hit ? Math.sin(r * 0.03 - (t - hit) * 14) * 26 * Math.exp(-r / 500) * Math.exp(-(t - hit) * 2.4) : 0;
      ctx.lineTo(x, lv + Math.sin(x * 0.006 + t * 3) * 14 + ring);
    }
    ctx.lineTo(W + 80, H + 80); ctx.closePath(); ctx.fill();
  }
  const dropT = t >= impact(5) + 0.5;
  const dy = dropT ? Math.min(p.y, lv - 10) : p.y, sub = t > hit;
  if (!sub) {
    ctx.save(); ctx.translate(W / 2 + (p.x - camX), dy); ctx.scale(p.sx, p.sy); circle(ctx, 0, 0, 40, PINK); ctx.restore();
  }
  if (sub) for (let k = 0; k < 5; k++) {
    const d = t - hit - k * 0.06;
    if (d < 0) continue;
    ctx.strokeStyle = rgba(WHITE, 0.7 * Math.exp(-d * 2)); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(W / 2, lv, 60 + d * 520, (60 + d * 520) * 0.14, 0, 0, TAU); ctx.stroke();
  }
}

// ───────────────────────────── 3 · underwater: the splash becomes the name (bars 6–8), white wave
function wave(ctx, t, t0, t1, col, ph) {
  const p = E.inOutCubic(prog(t, t0, t1));
  if (p <= 0) return;
  const by = lerp(H + 150, -190, p);
  ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.moveTo(-80, H + 80);
  for (let x = -80; x <= W + 80; x += 24) ctx.lineTo(x, by + Math.sin(x * 0.0042 + t * 4 + ph) * 70 + noise1(x * 0.003 + t * 1.5 + ph) * 50);
  ctx.lineTo(W + 80, H + 80); ctx.closePath(); ctx.fill();
}
function underwater(ctx, t) {
  fill(ctx, BLUE);
  const lt = t - A(6);
  for (let k = 0; k < 40; k++) {                                   // bubbles
    const sp = 120 + 160 * hash(k + 3), y = H + 60 - ((lt * sp + hash(k) * 1400) % 1400), x = hash(k * 7.1) * W + Math.sin(lt * 2 + k) * 20;
    ctx.strokeStyle = rgba(WHITE, 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 6 + 14 * hash(k + 9), 0, TAU); ctx.stroke();
  }
  const conv = (i, h) => E.inOutCubic(prog(t, A(7) + h * 0.5, A(8) + h * 0.4));
  for (let i = 0; i < PTS.length; i++) {
    const q = PTS[i], h = hash(i * 1.7), ang = hash(i * 3.3) * TAU + lt * (0.6 + h), rad = 60 + 460 * Math.sqrt(hash(i * 5.9)) * EASE.expo(prog(lt, 0, 1.4));
    const sx = W / 2 + Math.cos(ang) * rad * 1.5, sy = 500 + Math.sin(ang) * rad * 0.8;
    const c = conv(i, h), x = lerp(sx, q.x, c), y = lerp(sy, q.y, c);
    circle(ctx, x, y, lerp(5, 4.2, c), h < 0.22 ? PINK : WHITE);
  }
  wave(ctx, t, A(8, 6), A(9), WHITE, 1.3);
}

// ───────────────────────────── 4 · "Write a brief" (bar 9) → the window
function halo(ctx, t, a) {
  if (a <= 0) return;
  [[0, 0], [0.5, -0.05], [1, 0], [1.05, 0.5], [1, 1], [0.5, 1.05], [0, 1], [-0.05, 0.5]].forEach(([u, v], i) => {
    const x = WX + u * WW + noise1(t * 0.4 + i * 7) * 70, y = WY + v * WH + noise1(t * 0.4 + i * 3 + 50) * 70;
    radialBlob(ctx, x, y, 420, i % 2 ? BLUE : PINK, 0.5 * a);
  });
}
function pencil(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.78); ctx.fillStyle = rgba(col);
  ctx.fillRect(-s * 0.5, -s * 0.12, s * 0.85, s * 0.24);
  ctx.beginPath(); ctx.moveTo(s * 0.38, -s * 0.12); ctx.lineTo(s * 0.6, 0); ctx.lineTo(s * 0.38, s * 0.12); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function brief(ctx, t) {
  fill(ctx, WHITE);
  halo(ctx, t, prog(t, A(9, 11), A(10)));
  const lt = t - A(9), fade = prog(t, A(9, 9), A(9, 12));
  const g = markGeom(ctx, W / 2, 230, 96);
  ctx.save(); ctx.globalAlpha = 1 - fade;
  gdot(ctx, g.dx, g.dy, g.r * spring(lt, 16, 8)); letters(ctx, g, lt, { ink: TXT });
  ctx.restore();
  const ex = EASE.expo(prog(t, A(9, 11), A(10)));
  const click = A(9, 8), press = clamp(1 - Math.abs(t - click - 0.05) / 0.08);
  const pop = spring(lt - 0.25, 16, 8) * (1 - 0.05 * press), bw = 560, bh = 120, by = 590;
  const x = lerp(W / 2 - bw / 2 * pop, WX, ex), y = lerp(by - bh / 2 * pop, WY, ex), w = lerp(bw * pop, WW, ex), h = lerp(bh * pop, WH, ex);
  if (pop > 0.01) {
    ctx.save(); ctx.shadowColor = rgba(PINK, 0.4 * (1 - ex)); ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = rgba(mix(PINK, WHITE, ex)); rrect(ctx, x, y, w, h, lerp(18 * pop, 22, ex)); ctx.fill(); ctx.restore();
    if (ex > 0) { ctx.strokeStyle = rgba(TXT, 0.08 * ex); ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 22); ctx.stroke(); }
  }
  const ta = (1 - prog(ex, 0, 0.12)) * clamp(pop);
  if (ta > 0) {
    ctx.save(); ctx.globalAlpha = ta; ctx.translate(W / 2, by); ctx.scale(pop, pop);
    setFont(ctx, 600, 52, SANS, -0.5); const tw = ctx.measureText(TX.button).width;
    pencil(ctx, -tw / 2 - 30, -2, 48, WHITE);
    T(ctx, TX.button, -tw / 2 + 22, 18, { w: 600, size: 52, ls: -0.5 });
    ctx.restore();
  }
  const cin = EASE.expo(prog(t, A(9, 3), A(9, 7))), cx = lerp(1600, W / 2 + 220, cin), cy = lerp(1120, by + 30, cin);
  shockRing(ctx, W / 2 + 220, by + 30, t, click, { color: PINK, life: 0.5, radius: 240, width: 14 });
  ctx.save(); ctx.globalAlpha = 1 - prog(t, A(9, 11), A(9, 13)); cursor(ctx, cx, cy, 1.1, press); ctx.restore();
}

// ───────────────────────────── the product the agent is making: a 1:1 promo for "Brew" (a placeholder brand)
function miniTitle(ctx, x, y, s, text, p, { clip = false } = {}) {
  const u = s / 100, size = 8.5 * u, base = y + 86 * u;
  setFont(ctx, 800, size, SANS, -size * 0.02); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.beginPath(); ctx.rect(x, base - size * 1.05, s, size * (clip ? 0.8 : 1.4)); ctx.clip();
  ctx.fillStyle = rgba(CREAM); ctx.fillText(text, x + 50 * u, base + (1 - p) * size * 1.1);
  ctx.restore();
}
function brewMini(ctx, x, y, s, tm, title, { clip = false, showTitle = true } = {}) {
  const u = s / 100;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, s, s, 3 * u); ctx.clip();
  ctx.fillStyle = rgba(ESP); ctx.fillRect(x, y, s, s);
  radialBlob(ctx, x + 50 * u, y + 44 * u, 46 * u, AMBER, 0.16);
  const cs = spring(tm - 0.2, 15, 8), cx = x + 50 * u, cy = y + 46 * u;
  if (cs > 0) {
    ctx.save(); ctx.translate(cx, cy + 14 * u); ctx.scale(cs, cs); ctx.translate(-cx, -cy - 14 * u);
    ctx.fillStyle = rgba(CREAM, 0.2); ctx.beginPath(); ctx.ellipse(cx, cy + 15 * u, 25 * u, 4 * u, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(AMBER); ctx.lineWidth = 3.2 * u; ctx.beginPath(); ctx.arc(cx + 17 * u, cy, 6.5 * u, -1.3, 1.3); ctx.stroke();
    ctx.fillStyle = rgba(AMBER); rrect(ctx, cx - 17 * u, cy - 13 * u, 34 * u, 28 * u, [2 * u, 2 * u, 9 * u, 9 * u]); ctx.fill();
    const lv = EASE.expo(prog(tm, 0.8, 1.5));
    ctx.fillStyle = rgba([118, 62, 36]); ctx.fillRect(cx - 14 * u, cy - 10 * u + (1 - lv) * 22 * u, 28 * u, lv * 4.5 * u);
    ctx.restore();
  }
  const st = prog(tm, 1.2, 1.8);
  if (st > 0) {
    ctx.strokeStyle = rgba(CREAM, 0.55 * st); ctx.lineWidth = 2.2 * u; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      for (let j = 0; j <= 12; j++) { const yy = cy - 18 * u - j * 1.4 * u * st, xx = cx + k * 9 * u + Math.sin(j * 0.6 + tm * 5 + k) * 2.2 * u; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
    }
  }
  circle(ctx, x + 84 * u, y + 16 * u, 4.5 * u * spring(tm - 1.0, 16, 8), PINK);
  if (showTitle && title) miniTitle(ctx, x, y, s, title, EASE.expo(prog(tm, 1.5, 2.2)), { clip });
  ctx.restore();
}

// ───────────────────────────── 5 · the white product window (bars 10–23)
const CODE = title => [
  [['export default', 'kw'], [' {', 'p']],
  [['  draw', 'fn'], ['(ctx, t, api) {', 'p']],
  [['    const ', 'kw'], ['p = ', 'v'], ['EASE', 'fn'], ['.expo(prog(t, ', 'p'], ['0.2', 'n'], [', ', 'p'], ['0.9', 'n'], ['));', 'p']],
  [['    cup', 'fn'], ['(ctx, spring(t - api.at(', 'p'], ['1', 'n'], [')));', 'p']],
  [['    title', 'fn'], ['(ctx, ', 'p'], [`'${title}'`, 'str'], [', p);', 'p']],
  [['  },', 'p']],
  [['};', 'p']],
];
const CODE_COLORS = { kw: rgba(MAG), fn: rgba(TXT), p: '#7C7C88', v: '#3A3A46', n: rgba(BLUE), str: '#D63FB8', cm: '#A0A0AA' };
function lightWindow(ctx, title) {
  ctx.save(); ctx.shadowColor = 'rgba(40,20,60,0.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = rgba(WHITE); rrect(ctx, WX, WY, WW, WH, 22); ctx.fill(); ctx.restore();
  ctx.save(); rrect(ctx, WX, WY, WW, WH, 22); ctx.clip(); ctx.fillStyle = 'rgb(246,246,249)'; ctx.fillRect(WX, WY, WW, 46);
  ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(WX, WY + 46, WW, 1.5); ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 2; rrect(ctx, WX, WY, WW, WH, 22); ctx.stroke();
  [PINK, BLUE, [210, 210, 218]].forEach((c, i) => circle(ctx, WX + 26 + i * 24, WY + 23, 7, c));
  T(ctx, title, WX + WW - 22, WY + 29, { f: MONO, w: 500, size: 16, fill: SUB, a: 'right' });
}
const DRAW = {
  term(ctx, lt, X, Y, w) {
    const px = X + 74, y = Y + 150, lines = TX.brief, total = lines.join('').length;
    T(ctx, '~/ft-motion', px, Y + 62, { f: MONO, w: 500, size: 20, fill: SUB });
    const n = Math.floor(Math.max(0, lt - 0.3) * total / 2.3), sent = lt > 2.75;
    ctx.strokeStyle = rgba(sent ? TXT : PINK, sent ? 0.1 : 0.9); ctx.lineWidth = 2.5; rrect(ctx, px - 30, y - 64, w - 2 * 74 + 60, 190, 16); ctx.stroke();
    T(ctx, '›', px, y, { f: MONO, w: 700, size: 42, fill: PINK });
    let left = n, cx = px + 44, cy = y;
    lines.forEach((line, li) => {
      const take = clamp(left, 0, line.length); left -= line.length;
      if (take <= 0 && li > 0) return;
      T(ctx, line.slice(0, take), px + 44, y + li * 64, { f: MONO, w: 500, size: 40, fill: TXT });
      setFont(ctx, 500, 40, MONO); cx = px + 44 + ctx.measureText(line.slice(0, take)).width; cy = y + li * 64;
    });
    if (!sent && (n < total || Math.floor(lt * 2.5) % 2 === 0)) { ctx.fillStyle = rgba(PINK); ctx.fillRect(cx + 4, cy - 34, 21, 44); }
    TX.replies.forEach((r, j) => {
      const a = lt - (3.0 + j * 0.25);
      if (a < 0) return;
      const e = EASE.expo(clamp(a / 0.45)), ry = y + 236 + j * 78;
      ctx.save(); ctx.globalAlpha *= e;
      circle(ctx, px + 8 + (1 - e) * 30, ry - 12, 10, j === 2 ? BLUE : PINK);
      T(ctx, r, px + 44 + (1 - e) * 30, ry, { f: MONO, w: 500, size: 34, fill: TXT });
      ctx.restore();
    });
  },
  board(ctx, lt, X, Y, w) {
    const x0 = X + 74, x1 = X + w - 74, ry = Y + 76, bars = 10, bw = (x1 - x0) / bars;
    ctx.fillStyle = rgba(TXT, 0.1); ctx.fillRect(x0, ry, x1 - x0, 2);
    for (let b = 0; b <= bars; b++) {
      ctx.fillStyle = rgba(TXT, 0.4); ctx.fillRect(x0 + b * bw - 1, ry - 18, 2, 20);
      if (b < bars) {
        T(ctx, String(b), x0 + b * bw + 8, ry - 4, { f: MONO, w: 500, size: 20, fill: SUB });
        for (let k = 1; k < 4; k++) { ctx.fillStyle = rgba(TXT, 0.16); ctx.fillRect(x0 + (b + k / 4) * bw - 1, ry - 8, 2, 10); }
      }
    }
    const ph = x0 + (x1 - x0) * EASE.css(prog(lt, 0.2, 3.4));
    ctx.fillStyle = rgba(PINK); ctx.fillRect(ph - 2, ry - 28, 4, 40); circle(ctx, ph, ry - 30, 7, PINK);
    const cols = [0, 100, 820];
    TX.boardHead.forEach((s, i) => T(ctx, s.toUpperCase(), x0 + cols[i], Y + 156, { f: MONO, w: 700, size: 22, fill: SUB, ls: 2 }));
    TX.board.forEach((row, i) => {
      const a = lt - (0.25 + i * 0.5);
      if (a < 0) return;
      const e = EASE.expo(clamp(a / 0.5)), y = Y + 236 + i * 86, dx = (1 - e) * 60;
      ctx.save(); ctx.globalAlpha *= e;
      ctx.fillStyle = i % 2 ? 'rgba(33,155,241,0.06)' : 'rgba(255,115,226,0.08)'; rrect(ctx, x0 - 20 + dx, y - 52, x1 - x0 + 40, 76, 12); ctx.fill();
      const st = [[MAG, 700, 34], [TXT, 500, 31], [BLUE, 500, 31]];
      row.forEach((s, c) => T(ctx, s, x0 + cols[c] + dx, y, { f: MONO, w: st[c][1], size: st[c][2], fill: st[c][0] }));
      ctx.restore();
    });
  },
  code(ctx, lt, X, Y, w) {
    const lines = CODE(TX.mini.from), total = codeLength(lines), n = Math.floor(Math.max(0, lt - 0.25) * total / 2.6);
    const titleAt = codeLength(lines.slice(0, 5));
    typeCode(ctx, X + 24, Y + 120, lines, n, { size: 31, lh: 66, gutterW: 78, colors: CODE_COLORS, gutter: '#C4C4CC', caret: PINK });
    ctx.fillStyle = rgba(TXT, 0.08); ctx.fillRect(X + 948, Y + 30, 2, 700);
    const PX = X + 990, PY = Y + 116, PS = 420;
    T(ctx, TX.preview, PX, PY - 26, { f: MONO, w: 500, size: 22, fill: SUB });
    const tm = Math.max(0, lt - 0.6) % 3.4;
    brewMini(ctx, PX, PY, PS, tm, TX.mini.from, { showTitle: n >= titleAt });
    ctx.fillStyle = rgba(TXT, 0.1); ctx.fillRect(PX, PY + PS + 40, PS, 4);
    ctx.fillStyle = rgba(PINK); ctx.fillRect(PX, PY + PS + 40, PS * tm / 3.4, 4); circle(ctx, PX + PS * tm / 3.4, PY + PS + 42, 8, PINK);
  },
  sheet(ctx, lt, X, Y, w, h) {
    const S = 160, G = 14, gx = X + 74, gy = Y + 44, BADI = 9;
    const bx = gx + (BADI % 4) * (S + G), by = gy + Math.floor(BADI / 4) * (S + G);
    const zi = EASE.expo(prog(lt, 0.95, 1.45)) * (1 - EASE.expo(prog(lt, 2.9, 3.4)));
    ctx.save(); ctx.translate(bx + S / 2, by + S / 2); ctx.scale(1 + 0.55 * zi, 1 + 0.55 * zi); ctx.translate(-bx - S / 2, -by - S / 2);
    for (let i = 0; i < 16; i++) {
      const a = lt - i * 0.035;
      if (a < 0) continue;
      const sc = spring(a, 16, 9), x = gx + (i % 4) * (S + G), y = gy + Math.floor(i / 4) * (S + G);
      ctx.save(); ctx.translate(x + S / 2, y + S / 2); ctx.scale(sc, sc); ctx.translate(-x - S / 2, -y - S / 2);
      brewMini(ctx, x, y, S, 0.25 + i * 0.2, TX.mini.from, { clip: i === BADI && lt < 2.5 });
      ctx.restore();
    }
    const badge = (text, col, a, mark) => {
      setFont(ctx, 700, 16, MONO); const tw = ctx.measureText(text).width + 52;
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgba(col); pill(ctx, bx + S / 2, by - 22, tw, 32); ctx.fill();
      (mark === 'x' ? cross : check)(ctx, bx + S / 2 - tw / 2 + 18, by - 22, 5, WHITE, 2.6);
      T(ctx, text, bx + S / 2 - tw / 2 + 34, by - 16, { f: MONO, w: 700, size: 16, fill: WHITE });
      ctx.restore();
    };
    if (lt >= 1.0 && lt < 2.5) {
      ctx.strokeStyle = rgba(BAD, 0.7 + 0.3 * Math.sin(lt * 14)); ctx.lineWidth = 4; rrect(ctx, bx - 4, by - 4, S + 8, S + 8, 8); ctx.stroke();
      if (lt > 1.9) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, S, S);
        ctx.strokeStyle = rgba(WHITE); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(bx + S / 2, by + S / 2, 18, lt * 9, lt * 9 + 4.2); ctx.stroke();
      }
      badge(lt > 1.9 ? TX.fixing : TX.sheetErr, BAD, EASE.expo(prog(lt, 1.0, 1.2)), 'x');
    }
    if (lt >= 2.5) {
      const a = 1 - prog(lt, 3.3, 3.7);
      ctx.strokeStyle = rgba(OK, a); ctx.lineWidth = 4; rrect(ctx, bx - 4, by - 4, S + 8, S + 8, 8); ctx.stroke();
      badge(TX.sheetFix, OK, a, 'v');
    }
    ctx.restore();
    const px = X + 840;
    ctx.fillStyle = rgba(WHITE); ctx.fillRect(px - 30, Y, X + w - px + 30, h);
    ctx.fillStyle = 'rgba(255,115,226,0.07)'; rrect(ctx, px, Y + 44, X + w - px - 60, 420, 18); ctx.fill();
    T(ctx, TX.qaTitle, px + 34, Y + 100, { f: MONO, w: 700, size: 22, fill: SUB });
    TX.qa.forEach((s, i) => {
      const y = Y + 180 + i * 72, state = i === 0 ? (lt < 1.0 ? 0 : lt < 2.5 ? -1 : 1) : (lt > 0.45 + i * 0.15 ? 1 : 0);
      ctx.strokeStyle = rgba(state === 1 ? OK : state === -1 ? BAD : SUB); ctx.lineWidth = 3; rrect(ctx, px + 34, y - 26, 34, 34, 8); ctx.stroke();
      if (state === 1) check(ctx, px + 51, y - 9, 9, OK, 3.5);
      if (state === -1) cross(ctx, px + 51, y - 9, 8, BAD, 3.5);
      T(ctx, s, px + 90, y, { f: MONO, w: 500, size: 27, fill: state === -1 ? BAD : TXT });
    });
  },
  sound(ctx, lt, X, Y, w) {
    const x0 = X + 190, x1 = X + w - 420, top = Y + 70, bars = 8, bw = (x1 - x0) / bars, cy = top + 330, ltF = FT - A(18);
    TX.lanes.forEach((s, i) => T(ctx, s, X + 50, i ? cy + 8 : top + 94, { f: MONO, w: 500, size: 22, fill: SUB }));
    for (let b = 0; b <= bars * 4; b++) { ctx.fillStyle = rgba(TXT, b % 4 ? 0.05 : 0.14); ctx.fillRect(x0 + b * bw / 4 - 1, top, 2, 520); }
    for (let b = 0; b < bars; b++) T(ctx, String(b + 1), x0 + b * bw + 8, top - 12, { f: MONO, w: 500, size: 20, fill: SUB });
    const reveal = EASE.css(prog(lt, 0.2, 2.8)), edge = x0 + (x1 - x0) * reveal;
    for (let x = x0; x < edge; x += 7) {
      const pos = (x - x0) / bw * 4, ph = pos % 1, onKick = Math.floor(pos) % 2 === 0;
      const env = 0.16 + 0.14 * Math.abs(noise1(pos * 3.1)) + (onKick ? 0.7 : 0.38) * Math.exp(-ph * 5);
      ctx.fillStyle = rgba(mix(BLUE, PINK, Math.exp(-ph * 6))); ctx.fillRect(x, cy - env * 160, 4, env * 320);
    }
    [0, 1, 2, 3, 4, 6, 7].forEach((bar, i) => {
      const x = x0 + bar * bw, a = edge - x;
      if (a < 0) return;
      const s = spring(a / 600, 18, 9), label = TX.events[i];
      setFont(ctx, 700, 20, MONO); const tw = ctx.measureText(label).width + 28;
      ctx.save(); ctx.translate(x + tw / 2 + 2, top + 86); ctx.scale(s, s);
      ctx.fillStyle = rgba(PINK); pill(ctx, 0, 0, tw, 40); ctx.fill();
      T(ctx, label, 0, 7, { f: MONO, w: 700, size: 20, fill: WHITE, a: 'center' });
      ctx.restore();
      ctx.fillStyle = rgba(PINK, 0.6); ctx.fillRect(x - 1, top + 106, 2, cy - top - 106 - 170);
    });
    ctx.fillStyle = rgba(PINK); ctx.fillRect(edge - 2, top, 4, 520);
    const mx = X + w - 360, lufs = lerp(-32, -14, EASE.expo(prog(ltF, 0.4, 3.0)));
    ctx.fillStyle = 'rgba(33,155,241,0.07)'; rrect(ctx, mx, top, 300, 520, 18); ctx.fill();
    T(ctx, lufs.toFixed(1), mx + 36, top + 160, { w: 800, size: 96, fill: TXT, ls: -3 });
    T(ctx, 'LUFS', mx + 40, top + 204, { f: MONO, w: 700, size: 26, fill: SUB, ls: 2 });
    T(ctx, `${TX.peak} -1.0 dBTP`, mx + 40, top + 262, { f: MONO, w: 500, size: 22, fill: SUB });
    const lv = clamp((lufs + 40) / 40);
    ctx.fillStyle = rgba(TXT, 0.1); rrect(ctx, mx + 40, top + 300, 220, 16, 8); ctx.fill();
    ctx.fillStyle = rgba(lufs > -14.5 ? OK : BLUE); rrect(ctx, mx + 40, top + 300, 220 * lv, 16, 8); ctx.fill();
    ctx.fillStyle = rgba(TXT); ctx.fillRect(mx + 40 + 220 * (26 / 40) - 1, top + 292, 3, 32);
  },
  render(ctx, lt, X, Y, w) {
    const px = X + 74, cmd = '$ node ft.mjs render examples/brew', ltF = FT - A(20);
    T(ctx, cmd.slice(0, Math.floor(clamp(lt / 0.35) * cmd.length)), px, Y + 116, { f: MONO, w: 500, size: 30, fill: TXT });
    const pr = EASE.css(prog(ltF, 0.4, 3.0)), n = Math.round(900 * pr);
    T(ctx, `${TX.rendering} ${n} / 900 ${TX.frames}`, px, Y + 240, { f: MONO, w: 700, size: 36, fill: TXT });
    ctx.fillStyle = rgba(TXT, 0.08); rrect(ctx, px, Y + 270, 640, 18, 9); ctx.fill();
    const g = ctx.createLinearGradient(px, 0, px + 640, 0); g.addColorStop(0, rgba(PINK)); g.addColorStop(1, rgba(BLUE));
    ctx.fillStyle = g; rrect(ctx, px, Y + 270, Math.max(18, 640 * pr), 18, 9); ctx.fill();
    if (pr >= 1) { check(ctx, px + 12, Y + 352, 12, OK, 4); T(ctx, '→ out/brew.mp4', px + 44, Y + 364, { f: MONO, w: 700, size: 34, fill: OK }); }
    const bx = X + 820, bw = w - 820 - 70, by = Y + 60;
    ctx.fillStyle = 'rgba(33,155,241,0.06)'; rrect(ctx, bx, by, bw, 560, 18); ctx.fill();
    const ballX = tt => bx + 90 + (bw - 180) * (0.5 - 0.5 * Math.cos(tt * 3.2));
    T(ctx, TX.sub1, bx + 36, by + 60, { f: MONO, w: 500, size: 24, fill: SUB });
    circle(ctx, ballX(lt), by + 160, 46, PINK);
    T(ctx, TX.sub6, bx + 36, by + 320, { f: MONO, w: 500, size: 24, fill: SUB });
    for (let j = 5; j >= 0; j--) circle(ctx, ballX(lt - j * 0.022), by + 430, 46, PINK, 1 / (j + 1.4));
  },
  lang(ctx, lt, X, Y, w) {
    const s = 470, mx = X + w / 2 - s / 2, my = Y + 150;
    brewMini(ctx, mx, my, s, 3.0, null);
    const sw = spring(lt - 0.5, 16, 9), cx = X + w / 2, ty = Y + 82;
    ctx.fillStyle = rgba(TXT, 0.07); pill(ctx, cx, ty, 220, 60); ctx.fill();
    ctx.fillStyle = rgba(PINK); pill(ctx, cx + lerp(-54, 54, sw), ty, 104, 48); ctx.fill();
    T(ctx, TX.langA, cx - 54, ty + 9, { f: MONO, w: 700, size: 24, fill: sw < 0.5 ? WHITE : TXT, a: 'center' });
    T(ctx, TX.langB, cx + 54, ty + 9, { f: MONO, w: 700, size: 24, fill: sw >= 0.5 ? WHITE : TXT, a: 'center' });
    const u = s / 100, size = 8.5 * u, base = my + 86 * u, font = `800 ${size}px ${SANS}`, ft = lt - 0.6;
    ctx.save(); ctx.beginPath(); ctx.rect(mx, base - size * 1.05, s, size * 1.4); ctx.clip();
    ctx.font = font; ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = rgba(CREAM);
    [[TX.mini.from, -1], [TX.mini.to, 1]].forEach(([str, dir]) => {
      const L = layout(ctx, str, font, 0), x0 = mx + s / 2 - L.total / 2;
      for (let i = 0; i < str.length; i++) {
        const e = dir < 0 ? E.inCubic(prog(ft, i * 0.02, i * 0.02 + 0.25)) : 1 - EASE.expo(prog(ft, 0.2 + i * 0.025, 0.7 + i * 0.025));
        if (e >= 1) continue;
        ctx.save(); ctx.translate(x0 + L.cx(0, i), base + e * size * 1.15); ctx.fillText(str[i], -L.w(i) / 2, 0); ctx.restore();
      }
    });
    ctx.restore();
  },
};
/** Camera over the window: eases from the previous section's focus to this one's, then pushes in slowly. */
function demoCam(t) {
  let i = SECTIONS.length - 1;
  while (i > 0 && t < A(SECTIONS[i][1])) i--;
  const s0 = A(SECTIONS[i][1]), e = EASE.expo(prog(t, s0, s0 + 0.9));
  const [pf, pz] = i === 0 ? [FULL, 1] : [SECTIONS[i - 1][3], SECTIONS[i - 1][4] * 1.03];
  const [cf, cz] = [SECTIONS[i][3], SECTIONS[i][4]];
  const z = lerp(pz, cz, e) * (1 + 0.03 * prog(t, s0 + 0.9, s0 + 4));
  return { i, fx: lerp(pf[0], cf[0], e), fy: lerp(pf[1], cf[1], e), z };
}
function demo(ctx, t, { out = 0 } = {}) {
  fill(ctx, WHITE); halo(ctx, t, 1);
  const c = demoCam(Math.min(t, A(24) - 0.001)), i = c.i;
  const z = lerp(c.z, 0.55, out), fx = lerp(c.fx, FULL[0], out), fy = lerp(c.fy, FULL[1], out);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-(WX + fx * WW), -(WY + fy * WH));
  lightWindow(ctx, SECTIONS[i][2]);
  ctx.save(); ctx.beginPath(); ctx.rect(WX, WY + 47, WW, WH - 47); ctx.clip();
  const tr = EASE.expo(prog(t, A(SECTIONS[i][1]), A(SECTIONS[i][1]) + 0.4));
  const run = (j, a, dy) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
    DRAW[SECTIONS[j][0]](ctx, t - A(SECTIONS[j][1]), WX, WY + 46, WW, WH - 46);
    ctx.restore();
  };
  if (i > 0 && tr < 1) run(i - 1, 1 - tr, -70 * tr);
  run(i, i === 0 ? 1 : tr, i === 0 ? 0 : 70 * (1 - tr));
  ctx.restore();
  ctx.restore();
}

// ───────────────────────────── 6 · the dot pops out of the window and floods the frame pink (bar 24)
function popOut(ctx, t) {
  demo(ctx, t, { out: EASE.expo(prog(t, A(24), A(24, 6))) });
  const d = t - A(24, 6), s = spring(d, 14, 8), cx = W / 2, cy = 520 - 140 * EASE.expo(prog(d, 0, 0.5));
  if (d > 0) {
    ctx.save(); ctx.shadowColor = rgba(PINK, 0.5); ctx.shadowBlur = 30; gdot(ctx, cx, cy, 60 * s); ctx.restore();
    shockRing(ctx, cx, cy, t, A(24, 6), { color: PINK, life: 0.5, radius: 300, width: 14 });
  }
  discCover(ctx, W, H, cx, cy, E.inOutCubic(prog(t, A(24, 10), A(25))), PINK, 60);
}

// ───────────────────────────── 7 · six feature cards on pink (bars 25–30)
function illustration(ctx, k, lt) {
  const lp = lt % 2;
  if (k === 0) {
    const font = `800 170px ${SANS}`, L = layout(ctx, 'Aa', font, -4), x0 = 300 - L.total / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(40, 120, 520, 190); ctx.clip(); ctx.font = font; ctx.letterSpacing = '-4px'; ctx.fillStyle = rgba(TXT); ctx.textAlign = 'left';
    for (let i = 0; i < 2; i++) ctx.fillText('Aa'[i], x0 + L.xs[i], 290 + (1 - EASE.expo(prog(lp, 0.1 + i * 0.08, 0.7 + i * 0.08))) * 190);
    ctx.restore();
    ctx.fillStyle = rgba(PINK); ctx.fillRect(300 - 110 * EASE.expo(prog(lp, 0.4, 1.0)), 304, 220 * EASE.expo(prog(lp, 0.4, 1.0)), 10);
  } else if (k === 1) {
    ctx.strokeStyle = rgba(TXT, 0.25); ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.moveTo(80, 230); ctx.lineTo(520, 230); ctx.stroke(); ctx.setLineDash([]);
    const bx = tt => lerp(120, 480, 0.5 - 0.5 * Math.cos(tt * 3.4));
    for (let j = 7; j >= 1; j--) circle(ctx, bx(lt - j * 0.03), 230, 40, BLUE, 0.5 / (j + 0.5));
    circle(ctx, bx(lt), 230, 40, BLUE);
  } else if (k === 2) {
    for (let i = 0; i < 20; i++) {
      const x = 92 + i * 22, hh = 18 + 150 * Math.abs(noise1(i * 0.7 + lt * 3)) * (0.6 + 0.4 * Math.exp(-((lt * 2) % 1) * 4));
      ctx.fillStyle = rgba(i === Math.floor((lt * 10) % 20) ? PINK : BLUE); rrect(ctx, x, 230 - hh / 2, 12, hh, 6); ctx.fill();
    }
  } else if (k === 3) {
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const P = V.map(([x, y, z]) => project3D(x * 92, y * 92, z * 92, { tilt: 0.55, yaw: lt * 1.3 + 0.4, D: 900 }));
    ctx.strokeStyle = rgba(TXT); ctx.lineWidth = 5; ctx.lineJoin = 'round';
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(300 + P[a].x, 228 + P[a].y); ctx.lineTo(300 + P[b].x, 228 + P[b].y); ctx.stroke();
    });
    P.forEach(p => circle(ctx, 300 + p.x, 228 + p.y, 9, PINK));
  } else if (k === 4) {
    const cols = [PINK, BLUE, MAG], pick = Math.floor(lt * 2) % 3;
    cols.forEach((c, i) => { circle(ctx, 120 + i * 80, 230, 30, c); if (i === pick) { ctx.strokeStyle = rgba(TXT); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(120 + i * 80, 230, 38, 0, TAU); ctx.stroke(); } });
    const s = 1 + 0.08 * wobble(lt * 2 % 1, 18, 8);
    ctx.save(); ctx.translate(430, 230); ctx.scale(s, s); ctx.fillStyle = rgba(cols[pick]); rrect(ctx, -70, -70, 140, 140, 28); ctx.fill();
    T(ctx, 'Aa', 0, 26, { w: 800, size: 72, fill: WHITE, a: 'center', ls: -2 }); ctx.restore();
  } else {
    ctx.fillStyle = rgba(TXT); rrect(ctx, 60, 125, 480, 190, 16); ctx.fill();
    const n = Math.floor(lt * 40);
    let left = n;
    TX.agent.forEach((line, i) => {
      const take = clamp(left, 0, line.length); left -= line.length + 4;
      if (take > 0) T(ctx, line.slice(0, take), 84, 172 + i * 40, { f: MONO, w: 500, size: 24, fill: i === 0 ? PINK : WHITE });
    });
  }
}
function features(ctx, t) {
  fill(ctx, PINK);
  const k = Math.min(5, Math.floor((t - A(25)) / A(1))), lt = t - A(25 + k), left = k % 2 === 0;
  const inn = spring(lt, 12, 9), out = E.inBack(prog(lt, 1.74, 2.0), 2);
  const side = left ? -1 : 1, cx = (left ? 560 : 1360) + side * ((1 - inn) * 900 + out * 1300), cy = 500;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-side * 0.04 + side * (1 - clamp(inn)) * 0.3); ctx.transform(0.94, -side * 0.08, 0, 1, 0, 0); ctx.translate(-300, -220);
  ctx.fillStyle = 'rgba(120,20,100,0.18)'; rrect(ctx, 16, 22, 600, 440, 30); ctx.fill();
  ctx.fillStyle = rgba(WHITE); rrect(ctx, 0, 0, 600, 440, 30); ctx.fill(); ctx.strokeStyle = rgba(TXT, 0.85); ctx.lineWidth = 4; ctx.stroke();
  gdot(ctx, 62, 72, 11);
  T(ctx, TX.cards[k], 88, 86, { w: 700, size: 40, fill: PINK, ls: -0.5 });
  illustration(ctx, k, lt);
  gdot(ctx, 300, 378, 34);
  ctx.fillStyle = rgba(WHITE); ctx.beginPath(); ctx.moveTo(291, 364); ctx.lineTo(313, 378); ctx.lineTo(291, 392); ctx.closePath(); ctx.fill();
  ctx.restore();

  const [a, b] = TX.features[k], tx = left ? 1010 : 910, align = left ? 'left' : 'right';
  const s1 = fitFont(ctx, a, 780, 200, 700, SANS, -0.03), s2 = fitFont(ctx, b, 780, 170, 700, SANS, -0.03);
  const base1 = 460, base2 = base1 + s2 * 1.02;
  [[a, s1, base1, true, 0.06], [b, s2, base2, false, 0.14]].forEach(([str, size, base, outline, d]) => {
    const e = EASE.expo(prog(lt, d, d + 0.6)), o = E.inBack(prog(lt, 1.72 + d * 0.3, 2.0), 1.6);
    setFont(ctx, 700, size, SANS, -size * 0.03); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.save(); ctx.beginPath(); ctx.rect(-80, base - size * 0.95, W + 160, size * 1.25); ctx.clip();
    const y = base + (1 - e) * size * 1.05 - o * size * 1.05;
    if (outline) { ctx.lineWidth = 3; ctx.strokeStyle = rgba(WHITE); ctx.lineJoin = 'round'; ctx.strokeText(str, tx, y); }
    else { ctx.fillStyle = rgba(WHITE); ctx.fillText(str, tx, y); }
    ctx.restore();
  });
}

// ───────────────────────────── 8 · "Open source on GitHub" (bars 31–32) and the end card (bars 33–35)
function github(ctx, t) {
  fill(ctx, PINK);
  const lt = t - A(31), font = `700 120px ${SANS}`, L = layout(ctx, TX.github, font, -3), x0 = W / 2 - L.total / 2, base = 580;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - 140, W, 180); ctx.clip();
  ctx.font = font; ctx.letterSpacing = '-3px'; ctx.textAlign = 'left'; ctx.fillStyle = rgba(WHITE);
  for (let i = 0; i < TX.github.length; i++) ctx.fillText(TX.github[i], x0 + L.xs[i], base + (1 - EASE.expo(prog(lt, i * 0.025, 0.55 + i * 0.025))) * 150);
  ctx.restore();
  const click = A(31, 12), press = clamp(1 - Math.abs(t - click - 0.05) / 0.08);
  const cin = EASE.expo(prog(t, A(31, 6), A(31, 11))), px = x0 + L.total + 50, py = base - 10;
  shockRing(ctx, px, py, t, click, { color: WHITE, life: 0.45, radius: 220, width: 14 });
  cursor(ctx, lerp(1760, px, cin), lerp(1140, py, cin), 1.2, press);
  discCover(ctx, W, H, px, py, E.inOutCubic(prog(t, A(32, 6), A(33))), BLACK, 0);
}
function endCard(ctx, t) {
  fill(ctx, BLACK); sparks(ctx, t, t * 10, 0.5);
  const lt = t - A(33), g = markGeom(ctx, W / 2, 590, 190);
  // the dot falls in, bounces twice on the beat and settles as the mark's dot
  const land = [0.5, 1.0, 1.25];
  let y;
  if (lt < land[0]) y = lerp(-80, g.dy, Math.pow(lt / land[0], 2));
  else if (lt < land[1]) { const u = (lt - land[0]) / (land[1] - land[0]); y = g.dy - 4 * 200 * u * (1 - u); }
  else if (lt < land[2]) { const u = (lt - land[1]) / (land[2] - land[1]); y = g.dy - 4 * 60 * u * (1 - u); }
  else y = g.dy;
  const lastHit = lt >= land[2] ? land[2] : lt >= land[1] ? land[1] : land[0];
  const sq = lt >= land[0] ? 0.3 * wobble(lt - lastHit, 24, 10) : 0;
  ctx.save(); ctx.translate(g.dx, y + g.r * sq); ctx.scale(1 + sq, 1 - sq); gdot(ctx, 0, 0, g.r); ctx.restore();
  land.forEach(l => shockRing(ctx, g.dx, g.dy + g.r, t, A(33) + l, { color: PINK, life: 0.5, radius: 160, width: 8 }));
  letters(ctx, g, lt - 1.25);
  const e1 = EASE.expo(prog(lt, 1.8, 2.4)), e2 = EASE.expo(prog(lt, 2.2, 2.8));
  T(ctx, TX.tagline, W / 2, 700 + (1 - e1) * 30, { w: 500, size: 44, fill: WHITE, a: 'center', alpha: e1 * 0.8 });
  T(ctx, TX.url, W / 2, 780 + (1 - e2) * 30, { f: MONO, w: 700, size: 32, fill: BLUE, a: 'center', alpha: e2 });
}

const HITS = () => [[A(5, 9), 8], [A(25), 9], [A(33) + 0.5, 5]];

export default {
  setup(api) {
    W = api.W; H = api.H; A = api.at; TX = COPY[api.lang] ?? COPY.en;
    CAPS = CAP_AT.map(([[b0, s0], [b1, s1]]) => [A(b0, s0), A(b1, s1)]);
    PTS = sampleDrawing(W, H, c => {
      const g = markGeom(c, W / 2, 610, 260);
      c.fillStyle = '#fff'; c.font = g.font; c.letterSpacing = `${g.ls}px`; c.textBaseline = 'alphabetic'; c.fillText(NAME, g.tx, g.base);
      c.beginPath(); c.arc(g.dx, g.dy, g.r, 0, TAU); c.fill();
    }, 8);
  },
  draw(ctx, t, api) {
    FT = api.frameT ?? t;
    const [sx, sy] = shake(t, HITS());
    ctx.save(); ctx.translate(sx, sy);
    if (t < A(2)) typed(ctx, t);
    else if (t < A(6)) bounce(ctx, t);
    else if (t < A(9)) underwater(ctx, t);
    else if (t < A(10)) brief(ctx, t);
    else if (t < A(24)) demo(ctx, t);
    else if (t < A(25)) popOut(ctx, t);
    else if (t < A(31)) features(ctx, t);
    else if (t < A(33)) github(ctx, t);
    else endCard(ctx, t);
    ctx.restore();
    caption(ctx, t);
  },
};
