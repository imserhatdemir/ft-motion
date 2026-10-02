// examples/space-launch: a 60 s, 120 BPM story promo for ft-motion, in the shape of a narrated launch film.
//   space (the year, the mark becomes a saucer) → Saturn → HQ → wave → "Write a brief" → product demo inside a window
//   (brief, storyboard, code, contact sheet, sound, render, language) → the saucer beams up "Render" → four feature cards
//   → "Now on GitHub" → end card.
// Bars are 2 s; every cut and hit sits on the grid via A(bar, step) (16 steps per bar). Captions double as a voice-over
// script. Copy lives in COPY (en / tr); caption timing lives in CAP_AT.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, wobble, hash, noise1, setFont, layout, rrect, pill, pointer, check, vignette, project3D, radialBlob, shake } from '../../engine/core.js';
import { windowFrame, typeCode, codeLength, discCover, shockRing, fitFont } from '../../engine/fx.js';

const COPY = {
  en: {
    caps: [
      "It's the year 2040.", 'ft-motion has become', 'the first interplanetary motion studio', 'opening its new studio', 'on Saturn.',
      'Today the team needs a launch video.', "Let's make one.", 'Just describe the video.', 'First, a storyboard', 'on a beat grid.',
      'Every frame is a function of time.', 'It checks its own frames', "and fixes what's off.", 'Sound on the same clock.',
      'Real motion blur, 60 fps.', 'And in Turkish too.',
    ],
    hq: 'ft HQ', button: 'Write a brief', render: 'Render', github: 'Now on GitHub',
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
    features: [['Kinetic', 'Type'], ['Motion', 'Blur'], ['Synth', 'Sound'], ['3D', 'Scenes']],
    cards: ['Kinetic Type', 'Motion Blur', 'Synth Sound', '3D Scenes'],
    dec: '.',
  },
  tr: {
    caps: [
      'Yıl 2040.', 'ft-motion artık', 'ilk gezegenler arası motion stüdyosu', 'yeni stüdyosunu açıyor', "Satürn'de.",
      'Bugün ekibe bir lansman videosu lazım.', 'Hadi yapalım.', 'Videoyu anlatman yeterli.', 'Önce bir storyboard,', 'vuruş ızgarasında.',
      'Her kare, zamanın bir fonksiyonu.', 'Kendi karelerini kontrol ediyor', 've hatalı olanı düzeltiyor.', 'Ses de aynı saatle.',
      'Gerçek motion blur, 60 fps.', 'İngilizcesi de hazır.',
    ],
    hq: 'ft HQ', button: 'Brief yaz', render: 'Render', github: 'Şimdi GitHub’da',
    tagline: 'kodla hareketli grafik', url: 'github.com/imserhatdemir/ft-motion',
    brief: ['Brew için 15 saniyelik bir lansman videosu yap,', 'bir kahve uygulaması. 1:1, 60 fps, sesli.'],
    replies: ['CLAUDE.md ve docs/TECHNIQUES.md okundu', '3 konsept → seçilen: “Sabah telaşı”', 'Storyboard: 15 sn · 160 BPM · 10 ölçü'],
    boardHead: ['ölçü', 'görüntü', 'metin'],
    board: [
      ['0', 'Boş fincandan buhar yükseliyor', '“Sabahlar yavaş.”'],
      ['2', 'Fincan vuruşta doluyor', '“Brew hızlı.”'],
      ['4', 'Sipariş ekranı, tek dokunuş', '“Tek dokunuş. Tamam.”'],
      ['6', 'Kurye pini haritada süzülüyor', '“Yolda.”'],
      ['8', 'Logo ve indirme butonu', '“Brew’u indir.”'],
      ['9', 'Kapanış kartı', 'brew.app'],
    ],
    mini: { from: 'Kahven hazır.', to: 'Your coffee, ready.' }, langA: 'TR', langB: 'EN',
    preview: 'önizleme · 60fps', qaTitle: 'QA · out/sheet.png', qa: ['alt uzantılar ve aksanlar', 'çakışmalar', 'telefonda okunurluk', 'logo sadakati'],
    sheetErr: 'metin kırpılmış', sheetFix: 'düzeltildi', fixing: 'düzeltiliyor…',
    lanes: ['görüntü', 'ses'], events: ['kesme', 'pop', 'yazı', 'pop', 'drop', 'kesme', 'pop'], peak: 'tepe',
    rendering: 'render', frames: 'kare', sub1: '1 alt kare', sub6: '6 alt kare · 180° shutter',
    features: [['Kinetik', 'Tipografi'], ['Hareket', 'Bulanıklığı'], ['Sentez', 'Ses'], ['3D', 'Sahneler']],
    cards: ['Kinetik Tipografi', 'Motion Blur', 'Sentez Ses', '3D Sahneler'],
    dec: ',',
  },
};

// caption windows as [bar, step] → [bar, step] (one entry per COPY.caps line)
const CAP_AT = [
  [[0, 4], [1, 15]], [[2, 0], [2, 15]], [[3, 0], [3, 15]], [[4, 0], [4, 15]], [[5, 0], [5, 14]],
  [[6, 4], [7, 15]], [[9, 0], [9, 12]], [[10, 2], [11, 15]], [[12, 0], [12, 15]], [[13, 0], [13, 15]],
  [[14, 2], [15, 15]], [[16, 0], [16, 15]], [[17, 0], [17, 15]], [[18, 2], [19, 15]],
  [[20, 0], [20, 15]], [[21, 0], [21, 15]],
];
// demo sections inside the window: [draw fn name, start bar, window title]
const SECTIONS = [['term', 10, 'agent · ~/brew'], ['board', 12, 'storyboard.md'], ['code', 14, 'scene.js'], ['sheet', 16, 'out/sheet.png'],
  ['sound', 18, 'sound.py'], ['render', 20, 'node ft.mjs render'], ['lang', 21, 'project.json · lang']];

const BG = [10, 10, 13], INK = [242, 237, 228], CORAL = [255, 106, 61], AMBER = [255, 181, 71];
const CORAL_D = [222, 82, 46], CORAL_DD = [178, 58, 32], OCEAN = [46, 64, 118], ESP = [32, 24, 21], DARK = [22, 19, 22];
const WIN = [18, 18, 23], DIM = [128, 126, 134], OK = [104, 204, 126], BAD = [255, 72, 92];
const DISP = "'Barlow Condensed'", MONO = "'JetBrains Mono'", NAME = 'ft-motion';
const WX = 230, WY = 92, WW = 1460, WH = 812;          // the demo window (the button grows into it)

let W = 1920, H = 1080, A = (bar, step = 0) => bar * 2 + step * 0.125, TX = COPY.en, CAPS = [], FT = 0;

// ───────────────────────────── small helpers
function T(ctx, s, x, y, { w = 800, size = 100, f = DISP, a = 'left', fill = INK, alpha = 1, ls = 0, base = 'alphabetic' } = {}) {
  setFont(ctx, w, size, f, ls); ctx.textAlign = a; ctx.textBaseline = base;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
}
const fill = (ctx, col) => { ctx.fillStyle = rgba(col); ctx.fillRect(-80, -80, W + 160, H + 160); };
const circle = (ctx, x, y, r, col, a = 1) => { if (r <= 0) return; ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const num = v => v.toFixed(1).replace('.', TX.dec);
function cross(ctx, x, y, s, col, lw = 3) {
  ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); ctx.restore();
}

/** The bottom caption pill. Captions are the voice-over script, so they come from COPY.caps on CAP_AT. */
function caption(ctx, t) {
  CAPS.forEach(([a, b], i) => {
    const s = TX.caps[i];
    if (!s || t < a || t > b) return;
    const pin = spring(t - a, 20, 11), out = prog(t, b - 0.12, b), k = lerp(0.88, 1, clamp(pin, 0, 1.2));
    setFont(ctx, 600, 46, DISP, 0.4);
    const w = ctx.measureText(s).width + 68;
    ctx.save(); ctx.globalAlpha = prog(t, a, a + 0.06) * (1 - out);
    ctx.translate(W / 2, H - 82 + out * 10); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(16,16,20,0.94)'; pill(ctx, 0, 0, w, 72); ctx.fill();
    ctx.strokeStyle = 'rgba(242,237,228,0.22)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rgba(INK); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, 0, 15);
    ctx.restore();
  });
}

// ───────────────────────────── space pieces
const STARS = Array.from({ length: 240 }, (_, i) => ({
  x: hash(i * 3.1), y: hash(i * 7.7 + 1), z: 0.2 + 0.8 * hash(i * 1.3 + 5),
  c: hash(i * 9.1 + 2) < 0.1 ? (hash(i + 40) < 0.6 ? CORAL : AMBER) : INK,
}));
function stars(ctx, t, drift = 0, alpha = 1) {
  const span = W + 200;
  for (const s of STARS) {
    const x = ((((s.x * span - drift * s.z) % span) + span) % span) - 100, y = s.y * H, big = s.c !== INK;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + 3 * s.z) + s.x * 40);
    circle(ctx, x, y, (big ? 3.4 : 1.7) * s.z + 0.5, s.c, alpha * (big ? 0.9 : (0.3 + 0.55 * tw) * s.z));
  }
}
const LANDS = [[0.1, 0.45, 0.42], [0.8, 0.05, 0.36], [1.5, -0.35, 0.4], [2.2, 0.5, 0.34], [2.9, -0.05, 0.42], [3.6, 0.6, 0.3], [4.3, 0.2, 0.38], [5.0, -0.4, 0.36], [5.7, 0.35, 0.3]];
function earth(ctx, cx, cy, R, rot) {
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = rgba(OCEAN); ctx.fill(); ctx.clip();
  ctx.fillStyle = rgba(CORAL);
  LANDS.forEach(([lon, lat, r], i) => {
    for (let k = 0; k < 4; k++) {
      const lo = lon + (hash(i * 11 + k) - 0.5) * r * 1.6, la = lat + (hash(i * 13 + k + 3) - 0.5) * r * 1.2, rr = r * (0.45 + 0.4 * hash(i * 17 + k));
      const a = lo - rot, z = Math.cos(a) * Math.cos(la);
      if (z < -0.05) continue;
      ctx.beginPath(); ctx.ellipse(cx + Math.sin(a) * Math.cos(la) * R, cy - Math.sin(la) * R, rr * R * Math.max(0.06, z), rr * R * 0.8, 0, 0, TAU); ctx.fill();
    }
  });
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.15, cx, cy, R);
  g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.65, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.restore();
  ctx.strokeStyle = rgba(INK, 0.22); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
}
function moon(ctx, x, y, R) {
  circle(ctx, x, y, R, [214, 207, 194]);
  [[-0.35, -0.2, 0.22], [0.3, 0.25, 0.17], [-0.05, 0.45, 0.12], [0.4, -0.35, 0.1]].forEach(([u, v, r]) => circle(ctx, x + u * R, y + v * R, r * R, [184, 176, 162]));
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip(); circle(ctx, x + R * 0.55, y + R * 0.35, R * 0.95, [0, 0, 0], 0.22); ctx.restore();
}
function saturn(ctx, cx, cy, R) {
  const tilt = -0.2, rx = R * 2.0, ry = R * 0.42;
  const ring = front => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
    ctx.beginPath(); ctx.rect(-rx * 1.2, front ? 0 : -ry * 1.6, rx * 2.4, ry * 1.6); ctx.clip();
    ctx.lineWidth = R * 0.22; ctx.strokeStyle = rgba(AMBER); ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.8, ry * 0.8, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = R * 0.05; ctx.strokeStyle = rgba(INK, 0.9); ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.97, ry * 0.97, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  };
  ring(false);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = rgba(CORAL); ctx.fill(); ctx.clip();
  ctx.translate(cx, cy); ctx.rotate(tilt);
  [[-0.62, 0.1], [-0.36, 0.07], [0.42, 0.09], [0.66, 0.06]].forEach(([v, h]) => { ctx.fillStyle = rgba(CORAL_D); ctx.fillRect(-R, v * R - h * R / 2, 2 * R, h * R); });
  circle(ctx, R * 0.6, R * 0.5, R * 1.05, CORAL_DD, 0.35);
  ctx.restore();
  ring(true);
}
function flag(ctx, x, y, h, d, t) {
  if (d <= 0) return;
  const s = spring(d, 16, 7), top = y - h * s;
  ctx.strokeStyle = rgba(INK); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, top); ctx.stroke();
  const fw = 64 * clamp(s), wave = Math.sin(t * 7) * 6;
  ctx.fillStyle = rgba(INK); ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + fw / 2, top + wave, x + fw, top + 4); ctx.lineTo(x + fw, top + 40); ctx.quadraticCurveTo(x + fw / 2, top + 40 + wave, x, top + 42); ctx.closePath(); ctx.fill();
  circle(ctx, x + fw * 0.5, top + 21 + wave * 0.5, 9 * clamp(s), CORAL);
}

/** The saucer. form 0 = the ft-motion dot (radius 34), 1 = the full saucer; scale s multiplies both. */
function saucer(ctx, x, y, s, t, { form = 1, tilt = 0, alpha = 1 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s); ctx.globalAlpha *= alpha;
  const f = Math.max(0, form), bw = lerp(34, 140, f), bh = 34;
  const dm = E.outBack(clamp((f - 0.35) / 0.65));
  if (dm > 0) {
    ctx.fillStyle = rgba(INK); ctx.beginPath(); ctx.ellipse(0, -bh * 0.35, 68 * dm, 64 * dm, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = rgba(AMBER, 0.6); ctx.beginPath(); ctx.ellipse(-24 * dm, -bh * 0.35 - 34 * dm, 11 * dm, 20 * dm, -0.5, 0, TAU); ctx.fill();
  }
  if (f > 0.2) { ctx.fillStyle = rgba(CORAL_DD); ctx.beginPath(); ctx.ellipse(0, bh * 0.62, 64 * f, 16 * f, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = rgba(CORAL); ctx.beginPath(); ctx.ellipse(0, 0, bw, bh, 0, 0, TAU); ctx.fill();
  const k = clamp((f - 0.3) / 0.7);
  if (k > 0) {
    ctx.fillStyle = rgba(CORAL_D); ctx.beginPath(); ctx.ellipse(0, bh * 0.18, bw * 0.985, bh * 0.62 * k, 0, 0, Math.PI); ctx.fill();
    for (let j = 0; j < 9; j++) {
      const a = Math.PI * (0.12 + 0.76 * j / 8), lit = 0.5 + 0.5 * Math.sin(t * 10 - j * 1.1);
      circle(ctx, Math.cos(a) * bw * 0.82, bh * 0.18 + Math.sin(a) * bh * 0.36 * k, 6.5 * k, mix(AMBER, INK, lit));
    }
  }
  ctx.restore();
}
/** Tractor beam from (x, y0) downwards, `len` long; p opens it. */
function beam(ctx, x, y0, len, p, t, { top = 70, bottom = 360, col = AMBER } = {}) {
  if (p <= 0.001) return;
  const L = len * p, wb = lerp(top, bottom, p);
  const g = ctx.createLinearGradient(0, y0, 0, y0 + L);
  g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(1, rgba(col, 0.05));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - top / 2, y0); ctx.lineTo(x + top / 2, y0); ctx.lineTo(x + wb / 2, y0 + L); ctx.lineTo(x - wb / 2, y0 + L); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    const q = (t * 0.9 + k / 4) % 1, ww = lerp(top, wb, q) / 2;
    ctx.strokeStyle = rgba(INK, 0.4 * (1 - q) * p); ctx.beginPath(); ctx.ellipse(x, y0 + q * L, ww, ww * 0.12, 0, 0, TAU); ctx.stroke();
  }
}

// ───────────────────────────── the mark
/** Geometry of the ft-motion mark (dot + name) centred on cx, baseline `base`. */
function markGeom(ctx, cx, base, size) {
  const font = `800 ${size}px ${DISP}`, L = layout(ctx, NAME, font, 0);
  const r = size * 0.19, gap = size * 0.16, x0 = cx - (2 * r + gap + L.total) / 2;
  return { font, L, size, base, r, dx: x0 + r, dy: base - size * 0.25, tx: x0 + 2 * r + gap };
}
/** The name rising letter by letter (lt = seconds since start). suck 0→1 pulls the letters into the dot. */
function letters(ctx, g, lt, { ink = INK, alpha = 1, suck = 0 } = {}) {
  if (lt <= 0) return;
  ctx.save(); ctx.font = g.font; ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = rgba(ink, alpha);
  if (suck <= 0) { ctx.beginPath(); ctx.rect(g.tx - 40, g.base - g.size * 1.05, g.L.total + 80, g.size * 1.32); ctx.clip(); }
  for (let i = 0; i < NAME.length; i++) {
    const e = EASE.expo(prog(lt, 0.05 + i * 0.035, 0.65 + i * 0.035)), sk = E.inCubic(prog(suck, i * 0.05, i * 0.05 + 0.6));
    if (sk >= 1) continue;
    const w = g.L.w(i), x = lerp(g.tx + g.L.xs[i] + w / 2, g.dx, sk), y = g.base + (1 - e) * g.size * 1.1 + (g.dy - g.base + g.size * 0.3) * sk;
    ctx.save(); ctx.translate(x, y); ctx.scale(1 - sk, 1 - sk); ctx.fillText(NAME[i], -w / 2, 0); ctx.restore();
  }
  ctx.restore();
}

/** Four-digit odometer: v is a real number, each column rolls (with carry) like a frame counter. */
function odometer(ctx, v, cx, base, size, col, alpha) {
  if (alpha <= 0) return;
  setFont(ctx, 800, size, DISP, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const cw = size * 0.5, lh = size * 0.9;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(col);
  ctx.beginPath(); ctx.rect(cx - cw * 2.5, base - size * 0.8, cw * 5, size * 0.88); ctx.clip();
  for (let k = 0; k < 4; k++) {
    const p = Math.pow(10, 3 - k), d = v / p, i = Math.floor(d);
    const f = p === 1 ? d - i : clamp((v % p) - (p - 1));
    const x = cx + cw * (k - 1.5);
    ctx.fillText(String(i % 10), x, base - f * lh);
    if (f > 0) ctx.fillText(String((i + 1) % 10), x, base + (1 - f) * lh);
  }
  ctx.restore();
}

// ───────────────────────────── 1 · space: the year, the mark, the saucer (bars 0–3)
function space1(ctx, t) {
  fill(ctx, BG); stars(ctx, t, t * 18);
  const R = 640, er = EASE.expo(prog(t, 0, A(1)));
  earth(ctx, W / 2, H + R * 0.42 + (1 - er) * 520, R, 0.6 + t * 0.12);

  const v = lerp(2025, 2040, EASE.expo(prog(t, A(0, 3), A(1))));
  const dim = prog(t, A(2) - 0.1, A(2) + 0.15), gone = prog(t, A(3, 12), A(4));
  const bump = t >= A(1) ? 1 + 0.05 * wobble(t - A(1), 16, 7) : 1;
  ctx.save(); ctx.translate(W / 2, 420); ctx.scale(bump, bump); ctx.translate(-W / 2, -420);
  odometer(ctx, v, W / 2, 520, 330, mix(INK, [120, 118, 126], dim), lerp(1, 0.35, dim) * (1 - gone));
  ctx.restore();

  const lt = t - A(2);
  if (lt < 0) return;
  const g = markGeom(ctx, W / 2, 545, 150);
  letters(ctx, g, lt, { suck: prog(t, A(2, 8), A(2, 13)) });
  const fly = EASE.expo(prog(t, A(2, 10), A(2, 15)));              // the dot glides to centre stage
  const form = E.outBack(prog(t, A(2, 12), A(3)), 2.2);             // …and becomes the saucer
  const zip = E.inBack(prog(t, A(3, 12), A(4)), 2.4);               // anticipation, then gone
  const pop = spring(lt, 16, 8);
  const x = lerp(g.dx, W / 2, fly) + 1500 * zip, y = lerp(g.dy, 360, fly) + Math.sin(t * 3) * 8 * clamp(form) - 160 * zip;
  const s = lerp(g.r / 34 * pop, 1.2, fly);
  const bp = EASE.expo(prog(t, A(3), A(3, 4))) * (1 - E.inCubic(prog(t, A(3, 9), A(3, 12))));
  beam(ctx, x, y + 40 * s, 760 - y, bp, t, { bottom: 460 });
  saucer(ctx, x, y, s, t, { form, tilt: 0.3 * zip - 0.12 * (fly - clamp(form)) });
}

// ───────────────────────────── 2 · flight to Saturn, flag, dive (bars 4–5)
function space2(ctx, t) {
  const lt = t - A(4), SX = 1380, SY = 650, SR = 230;
  const cx = lerp(2500, SX, EASE.expo(prog(t, A(4, 3), A(4, 14))));
  const z = 1 + 18 * E.inExpo(prog(t, A(5, 8), A(6)));
  fill(ctx, BG);
  ctx.save(); ctx.translate(SX, SY); ctx.scale(z, z); ctx.translate(-SX, -SY);
  stars(ctx, t, t * 18 + lt * 240);
  circle(ctx, 1600 - lt * 90, 190, 44, AMBER); circle(ctx, 1612 - lt * 90, 200, 40, CORAL_D, 0.35);
  moon(ctx, 780 - lt * 300, 250, 76);
  saturn(ctx, cx, SY, SR);
  flag(ctx, SX - 34, SY - SR + 8, 120, t - A(5, 4), t);

  // the ship draws an expo-out curve as it flies: y = outExpo(x)
  const P = v => [lerp(-160, 1180, v), lerp(900, 300, E.outExpo(v))];
  const u = E.inOutCubic(prog(t, A(4), A(4, 13)));
  const tail = lerp(Math.max(0, u - 0.55), u, EASE.expo(prog(t, A(4, 13), A(5, 3))));
  if (u - tail > 0.002) {
    ctx.lineCap = 'round'; ctx.strokeStyle = rgba(CORAL);
    let prev = P(tail);
    for (let k = 1; k <= 60; k++) {
      const v = lerp(tail, u, k / 60), p = P(v);
      ctx.lineWidth = 4 + 24 * (k / 60); ctx.beginPath(); ctx.moveTo(...prev); ctx.lineTo(...p); ctx.stroke(); prev = p;
    }
  }
  const land = EASE.expo(prog(t, A(4, 13), A(5, 2))), leave = E.inBack(prog(t, A(5, 7), A(5, 11)), 2);
  const [px, py] = P(u), d = P(Math.min(1, u + 0.01));
  const hx = SX, hy = 262 + Math.sin(t * 3) * 6;
  const x = lerp(px, hx, land) + 300 * leave, y = lerp(py, hy, land) - 700 * leave;
  const tilt = (1 - land) * Math.atan2(d[1] - py, d[0] - px + 1e-6) * 0.35 + 0.25 * leave;
  beam(ctx, x, y + 32, SY - SR - y - 20, EASE.expo(prog(t, A(5, 1), A(5, 3))) * (1 - prog(t, A(5, 6), A(5, 8))), t, { top: 60, bottom: 200 });
  saucer(ctx, x, y, 0.8, t, { tilt });
  ctx.restore();
}

// ───────────────────────────── 3 · HQ on the coral planet (bars 6–7), then the wave
function slab(ctx, cx, y, w, h) {
  ctx.fillStyle = rgba(INK); rrect(ctx, cx - w / 2, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = rgba(DARK);
  for (let x = -w / 2 + 34; x <= w / 2 - 34; x += 30) { rrect(ctx, cx + x - 6, y + h / 2 - 7, 12, 14, 3); ctx.fill(); }
}
function miniCard(ctx, x, y, rot, s) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = rgba(INK); rrect(ctx, -34, -25, 68, 50, 9); ctx.fill(); ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 3.5; ctx.stroke();
  ctx.fillStyle = rgba(CORAL); ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(13, 0); ctx.lineTo(-8, 12); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function wave(ctx, t, t0, t1, col, ph) {
  const p = E.inOutCubic(prog(t, t0, t1));
  if (p <= 0) return;
  const by = lerp(H + 150, -190, p);
  ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.moveTo(-80, H + 80);
  for (let x = -80; x <= W + 80; x += 24) ctx.lineTo(x, by + Math.sin(x * 0.0042 + t * 4 + ph) * 70 + noise1(x * 0.003 + t * 1.5 + ph) * 50);
  ctx.lineTo(W + 80, H + 80); ctx.closePath(); ctx.fill();
}
function hq(ctx, t) {
  const lt = t - A(6), cx = W / 2, base = 890, N = 9;
  fill(ctx, CORAL);
  const settle = 1 + 0.4 * (1 - EASE.expo(prog(lt, 0, 1.0)));
  ctx.save(); ctx.translate(cx, 560); ctx.scale(settle, settle); ctx.translate(-cx, -560);
  // ground ripples
  for (let k = 5; k >= 0; k--) {
    const rx = 240 + k * 190 + ((t * 60) % 190);
    ctx.strokeStyle = rgba(CORAL_D, 0.9 * (1 - k / 6)); ctx.lineWidth = 24 * (1 - k / 7);
    ctx.beginPath(); ctx.ellipse(cx, base + 6, rx, rx * 0.16, 0, 0, TAU); ctx.stroke();
  }
  ctx.fillStyle = rgba(CORAL_DD, 0.45); ctx.beginPath(); ctx.ellipse(cx, base + 4, 300, 40, 0, 0, TAU); ctx.fill();
  // the tower: film-frame slabs dropping in from the top, bottom first
  const top = base - N * 58;
  for (let i = 0; i < N; i++) {
    const d = lt - (0.15 + i * 0.085);
    if (d <= 0) continue;
    const w = 300 + 170 * Math.sin(Math.PI * (i + 0.7) / (N + 0.4));
    slab(ctx, cx, base - (i + 1) * 58 - (1 - spring(d, 15, 9)) * 760, w, 48);
  }
  const dc = lt - (0.2 + N * 0.085);
  if (dc > 0) {
    const s = spring(dc, 14, 8), blink = 0.35 + 0.65 * Math.exp(-((t % 0.5) * 7));
    ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, top - 4); ctx.lineTo(cx, top - 4 - 170 * s); ctx.stroke();
    circle(ctx, cx, top - 4 - 170 * s, 13 * s, CORAL); circle(ctx, cx, top - 4 - 170 * s, 30 * s, CORAL, 0.35 * blink);
    ctx.fillStyle = rgba(AMBER); ctx.beginPath(); ctx.arc(cx, top + 4, 108 * s, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 4; ctx.stroke();
  }
  const dd = spring(lt - 0.95, 15, 9);
  if (dd > 0) {
    ctx.fillStyle = rgba(DARK); rrect(ctx, cx - 56 * dd, base - 128 * dd, 112 * dd, 128 * dd, [56 * dd, 56 * dd, 0, 0]); ctx.fill();
    ctx.strokeStyle = rgba(AMBER); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, base - 118 * dd); ctx.lineTo(cx, base); ctx.stroke();
  }
  const ds = spring(lt - 1.1, 15, 8);
  if (ds > 0) {
    ctx.save(); ctx.translate(cx, base - 5 * 58 - 30); ctx.scale(ds, ds);
    ctx.fillStyle = rgba(DARK); rrect(ctx, -150, -54, 300, 108, 24); ctx.fill();
    circle(ctx, -88, -12, 15, CORAL);
    T(ctx, TX.hq, -62, 10, { w: 800, size: 72, fill: INK, base: 'alphabetic' });
    ctx.restore();
  }
  // little film cards flying out like mail
  for (let k = 0; k < 18; k++) {
    const a = lt - (1.2 + k * 0.16);
    if (a <= 0) continue;
    const dir = hash(k * 3.7) < 0.5 ? -1 : 1, sp = 0.6 + 0.6 * hash(k + 2);
    const x = cx + dir * (60 + (360 + 320 * hash(k + 9)) * a * sp), y = top - 90 - (230 + 220 * hash(k + 5)) * a * sp + 40 * Math.sin(a * 3 + k);
    miniCard(ctx, x, y, dir * (0.2 + a * 0.5), spring(a, 14, 8) * (0.8 + 0.4 * hash(k + 7)));
  }
  ctx.restore();
  wave(ctx, t, A(7, 10), A(8, 1), AMBER, 0);
  wave(ctx, t, A(7, 12), A(8, 2), INK, 2.1);
}

// ───────────────────────────── 4 · the mark again, "Write a brief", the button grows into the window (bars 8–9)
function pencil(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.78); ctx.fillStyle = rgba(col);
  ctx.fillRect(-s * 0.5, -s * 0.13, s * 0.85, s * 0.26);
  ctx.beginPath(); ctx.moveTo(s * 0.38, -s * 0.13); ctx.lineTo(s * 0.6, 0); ctx.lineTo(s * 0.38, s * 0.13); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function halo(ctx, t, a) {
  if (a <= 0) return;
  [[0, 0], [0.5, -0.05], [1, 0], [1.05, 0.5], [1, 1], [0.5, 1.05], [0, 1], [-0.05, 0.5]].forEach(([u, v], i) => {
    const x = WX + u * WW + noise1(t * 0.4 + i * 7) * 70, y = WY + v * WH + noise1(t * 0.4 + i * 3 + 50) * 70;
    radialBlob(ctx, x, y, 400, i % 2 ? AMBER : CORAL, 0.5 * a);
  });
}
function intro(ctx, t) {
  fill(ctx, INK);
  halo(ctx, t, prog(t, A(9, 11), A(10)));
  const lt = t - A(8, 2), up = EASE.expo(prog(t, A(8, 12), A(9))), fade = prog(t, A(9, 9), A(9, 12));
  const g = markGeom(ctx, W / 2, lerp(600, 200, up), lerp(180, 84, up));
  circle(ctx, g.dx, g.dy, g.r * spring(lt, 16, 8), CORAL, 1 - fade);
  letters(ctx, g, lt, { ink: DARK, alpha: 1 - fade });

  const bt = t - A(9);
  if (bt < 0) return;
  const ex = EASE.expo(prog(t, A(9, 11), A(10)));
  const click = A(9, 8), press = clamp(1 - Math.abs(t - click - 0.05) / 0.08);
  const pop = spring(bt, 16, 8) * (1 - 0.05 * press), bw = 600, bh = 132, by = 610;
  const x = lerp(W / 2 - bw / 2 * pop, WX, ex), y = lerp(by - bh / 2 * pop, WY, ex);
  const w = lerp(bw * pop, WW, ex), h = lerp(bh * pop, WH, ex);
  ctx.fillStyle = rgba(mix(CORAL, WIN, ex)); rrect(ctx, x, y, w, h, lerp(66 * pop, 22, ex)); ctx.fill();
  ctx.strokeStyle = rgba(DARK, 1 - ex); ctx.lineWidth = 5; ctx.stroke();
  const ta = (1 - prog(ex, 0, 0.12)) * clamp(pop);
  if (ta > 0) {
    ctx.save(); ctx.globalAlpha = ta; ctx.translate(W / 2, by); ctx.scale(pop, pop);
    setFont(ctx, 700, 60, DISP, 0.5); const tw = ctx.measureText(TX.button).width;
    pencil(ctx, -tw / 2 - 30, -4, 54, DARK);
    T(ctx, TX.button, -tw / 2 + 24, 21, { w: 700, size: 60, fill: DARK, ls: 0.5 });
    ctx.restore();
  }
  const cin = EASE.expo(prog(t, A(9, 3), A(9, 7))), cx = lerp(1580, W / 2 + 248, cin), cy = lerp(1100, by + 26, cin);
  shockRing(ctx, W / 2 + 248, by + 26, t, click, { color: CORAL, life: 0.5, radius: 260, width: 18 });
  ctx.save(); ctx.globalAlpha = 1 - prog(t, A(9, 11), A(9, 13)); pointer(ctx, cx, cy, 2.4, press); ctx.restore();
}

// ───────────────────────────── the product the agent is making: a tiny 1:1 promo for "Brew" (a placeholder brand)
function miniTitle(ctx, x, y, s, text, p, { clip = false, alpha = 1 } = {}) {
  const u = s / 100, size = 9 * u, base = y + 86 * u;
  setFont(ctx, 800, size, DISP, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.beginPath(); ctx.rect(x, base - size * 1.05, s, size * (clip ? 0.8 : 1.4)); ctx.clip();
  ctx.fillStyle = rgba(INK, alpha); ctx.fillText(text, x + 50 * u, base + (1 - p) * size * 1.1);
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
    ctx.fillStyle = rgba(INK, 0.2); ctx.beginPath(); ctx.ellipse(cx, cy + 15 * u, 25 * u, 4 * u, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(AMBER); ctx.lineWidth = 3.2 * u; ctx.beginPath(); ctx.arc(cx + 17 * u, cy, 6.5 * u, -1.3, 1.3); ctx.stroke();
    ctx.fillStyle = rgba(AMBER); rrect(ctx, cx - 17 * u, cy - 13 * u, 34 * u, 28 * u, [2 * u, 2 * u, 9 * u, 9 * u]); ctx.fill();
    const lv = EASE.expo(prog(tm, 0.8, 1.5));
    ctx.fillStyle = rgba([118, 62, 36]); ctx.fillRect(cx - 14 * u, cy - 10 * u + (1 - lv) * 22 * u, 28 * u, lv * 4.5 * u);
    ctx.restore();
  }
  const st = prog(tm, 1.2, 1.8);
  if (st > 0) {
    ctx.strokeStyle = rgba(INK, 0.55 * st); ctx.lineWidth = 2.2 * u; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      for (let j = 0; j <= 12; j++) { const yy = cy - 18 * u - j * 1.4 * u * st, xx = cx + k * 9 * u + Math.sin(j * 0.6 + tm * 5 + k) * 2.2 * u; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
    }
  }
  circle(ctx, x + 84 * u, y + 16 * u, 4.5 * u * spring(tm - 1.0, 16, 8), CORAL);
  if (showTitle && title) miniTitle(ctx, x, y, s, title, EASE.expo(prog(tm, 1.5, 2.2)), { clip });
  ctx.restore();
}

// ───────────────────────────── 5 · the demo window (bars 10–21)
const CODE = title => [
  [['export default', 'kw'], [' {', 'p']],
  [['  draw', 'fn'], ['(ctx, t, api) {', 'p']],
  [['    const ', 'kw'], ['p = ', 'v'], ['EASE', 'fn'], ['.expo(prog(t, ', 'p'], ['0.2', 'n'], [', ', 'p'], ['0.9', 'n'], ['));', 'p']],
  [['    cup', 'fn'], ['(ctx, spring(t - api.at(', 'p'], ['1', 'n'], [')));', 'p']],
  [['    title', 'fn'], ['(ctx, ', 'p'], [`'${title}'`, 'str'], [', p);', 'p']],
  [['  },', 'p']],
  [['};', 'p']],
];
const DRAW = {
  term(ctx, lt, X, Y, w) {
    const px = X + 74, y = Y + 150, lines = TX.brief, total = lines.join('').length;
    T(ctx, '~/ft-motion', px, Y + 62, { f: MONO, w: 500, size: 20, fill: DIM });
    const n = Math.floor(Math.max(0, lt - 0.3) * total / 2.3), sent = lt > 2.75;
    ctx.strokeStyle = rgba(sent ? INK : CORAL, sent ? 0.14 : 0.7); ctx.lineWidth = 2; rrect(ctx, px - 30, y - 64, w - 2 * 74 + 60, 190, 16); ctx.stroke();
    T(ctx, '›', px, y, { f: MONO, w: 700, size: 42, fill: CORAL });
    let left = n, cx = px + 44, cy = y;
    lines.forEach((line, li) => {
      const take = clamp(left, 0, line.length); left -= line.length;
      if (take <= 0 && li > 0) return;
      T(ctx, line.slice(0, take), px + 44, y + li * 64, { f: MONO, w: 500, size: 40, fill: INK });
      setFont(ctx, 500, 40, MONO); cx = px + 44 + ctx.measureText(line.slice(0, take)).width; cy = y + li * 64;
    });
    if (!sent && (n < total || Math.floor(lt * 2.5) % 2 === 0)) { ctx.fillStyle = rgba(CORAL); ctx.fillRect(cx + 4, cy - 34, 21, 44); }
    TX.replies.forEach((r, j) => {
      const a = lt - (3.0 + j * 0.25);
      if (a < 0) return;
      const e = EASE.expo(clamp(a / 0.45)), ry = y + 236 + j * 78;
      ctx.save(); ctx.globalAlpha *= e;
      circle(ctx, px + 8 + (1 - e) * 30, ry - 12, 10, j === 2 ? AMBER : CORAL);
      T(ctx, r, px + 44 + (1 - e) * 30, ry, { f: MONO, w: 500, size: 34, fill: INK });
      ctx.restore();
    });
  },
  board(ctx, lt, X, Y, w) {
    const x0 = X + 74, x1 = X + w - 74, ry = Y + 76, bars = 10, bw = (x1 - x0) / bars;
    ctx.fillStyle = rgba(INK, 0.1); ctx.fillRect(x0, ry, x1 - x0, 2);
    for (let b = 0; b <= bars; b++) {
      ctx.fillStyle = rgba(INK, 0.45); ctx.fillRect(x0 + b * bw - 1, ry - 18, 2, 20);
      if (b < bars) {
        T(ctx, String(b), x0 + b * bw + 8, ry - 4, { f: MONO, w: 500, size: 20, fill: DIM });
        for (let k = 1; k < 4; k++) { ctx.fillStyle = rgba(INK, 0.18); ctx.fillRect(x0 + (b + k / 4) * bw - 1, ry - 8, 2, 10); }
      }
    }
    const ph = x0 + (x1 - x0) * EASE.css(prog(lt, 0.2, 3.4));
    ctx.fillStyle = rgba(CORAL); ctx.fillRect(ph - 2, ry - 28, 4, 40); circle(ctx, ph, ry - 30, 7, CORAL);
    const cols = [0, 100, 820];
    TX.boardHead.forEach((s, i) => T(ctx, s.toLocaleUpperCase(TX === COPY.tr ? 'tr-TR' : 'en-US'), x0 + cols[i], Y + 156, { f: MONO, w: 700, size: 22, fill: DIM, ls: 2 }));
    TX.board.forEach((row, i) => {
      const a = lt - (0.25 + i * 0.5);
      if (a < 0) return;
      const e = EASE.expo(clamp(a / 0.5)), y = Y + 236 + i * 86, dx = (1 - e) * 60;
      ctx.save(); ctx.globalAlpha *= e;
      ctx.fillStyle = rgba(INK, i % 2 ? 0.03 : 0.06); rrect(ctx, x0 - 20 + dx, y - 52, x1 - x0 + 40, 76, 12); ctx.fill();
      const st = [[CORAL, 700, 34], [INK, 500, 31], [AMBER, 500, 31]];
      row.forEach((s, c) => T(ctx, s, x0 + cols[c] + dx, y, { f: MONO, w: st[c][1], size: st[c][2], fill: st[c][0] }));
      ctx.restore();
    });
  },
  code(ctx, lt, X, Y, w) {
    const lines = CODE(TX.mini.from), total = codeLength(lines), n = Math.floor(Math.max(0, lt - 0.25) * total / 2.6);
    const titleAt = codeLength(lines.slice(0, 5));
    typeCode(ctx, X + 24, Y + 120, lines, n, { size: 31, lh: 66, gutterW: 78 });
    ctx.fillStyle = rgba(INK, 0.08); ctx.fillRect(X + 948, Y + 30, 2, 700);
    const PX = X + 990, PY = Y + 116, PS = 420;
    T(ctx, TX.preview, PX, PY - 26, { f: MONO, w: 500, size: 22, fill: DIM });
    const tm = Math.max(0, lt - 0.6) % 3.4;
    brewMini(ctx, PX, PY, PS, tm, TX.mini.from, { showTitle: n >= titleAt });
    ctx.fillStyle = rgba(INK, 0.14); ctx.fillRect(PX, PY + PS + 40, PS, 4);
    ctx.fillStyle = rgba(CORAL); ctx.fillRect(PX, PY + PS + 40, PS * tm / 3.4, 4); circle(ctx, PX + PS * tm / 3.4, PY + PS + 42, 8, CORAL);
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
      (mark === 'x' ? cross : check)(ctx, bx + S / 2 - tw / 2 + 18, by - 22, 5, DARK, 2.6);
      T(ctx, text, bx + S / 2 - tw / 2 + 34, by - 16, { f: MONO, w: 700, size: 16, fill: DARK });
      ctx.restore();
    };
    if (lt >= 1.0 && lt < 2.5) {
      ctx.strokeStyle = rgba(BAD, 0.7 + 0.3 * Math.sin(lt * 14)); ctx.lineWidth = 4; rrect(ctx, bx - 4, by - 4, S + 8, S + 8, 8); ctx.stroke();
      if (lt > 1.9) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, S, S);
        ctx.strokeStyle = rgba(INK); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(bx + S / 2, by + S / 2, 18, lt * 9, lt * 9 + 4.2); ctx.stroke();
      }
      badge(lt > 1.9 ? TX.fixing : TX.sheetErr, BAD, EASE.expo(prog(lt, 1.0, 1.2)), 'x');
    }
    if (lt >= 2.5) {
      const a = 1 - prog(lt, 3.3, 3.7);
      ctx.strokeStyle = rgba(OK, a); ctx.lineWidth = 4; rrect(ctx, bx - 4, by - 4, S + 8, S + 8, 8); ctx.stroke();
      badge(TX.sheetFix, OK, a, 'v');
    }
    ctx.restore();
    // QA panel
    const px = X + 840;
    ctx.fillStyle = rgba(WIN); ctx.fillRect(px - 30, Y, X + w - px + 30, h);
    ctx.fillStyle = rgba(INK, 0.05); rrect(ctx, px, Y + 44, X + w - px - 60, 420, 18); ctx.fill();
    T(ctx, TX.qaTitle, px + 34, Y + 100, { f: MONO, w: 700, size: 22, fill: DIM });
    TX.qa.forEach((s, i) => {
      const y = Y + 180 + i * 72, state = i === 0 ? (lt < 1.0 ? 0 : lt < 2.5 ? -1 : 1) : (lt > 0.45 + i * 0.15 ? 1 : 0);
      ctx.strokeStyle = rgba(state === 1 ? OK : state === -1 ? BAD : DIM); ctx.lineWidth = 3; rrect(ctx, px + 34, y - 26, 34, 34, 8); ctx.stroke();
      if (state === 1) check(ctx, px + 51, y - 9, 9, OK, 3.5);
      if (state === -1) cross(ctx, px + 51, y - 9, 8, BAD, 3.5);
      T(ctx, s, px + 90, y, { f: MONO, w: 500, size: 27, fill: state === -1 ? BAD : INK });
    });
  },
  sound(ctx, lt, X, Y, w) {
    const x0 = X + 190, x1 = X + w - 420, top = Y + 70, bars = 8, bw = (x1 - x0) / bars, cy = top + 330;
    const ltF = FT - A(18);
    TX.lanes.forEach((s, i) => T(ctx, s, X + 50, i ? cy + 8 : top + 94, { f: MONO, w: 500, size: 22, fill: DIM }));
    for (let b = 0; b <= bars * 4; b++) { ctx.fillStyle = rgba(INK, b % 4 ? 0.06 : 0.16); ctx.fillRect(x0 + b * bw / 4 - 1, top, 2, 520); }
    for (let b = 0; b < bars; b++) T(ctx, String(b + 1), x0 + b * bw + 8, top - 12, { f: MONO, w: 500, size: 20, fill: DIM });
    const reveal = EASE.css(prog(lt, 0.2, 2.8)), edge = x0 + (x1 - x0) * reveal;
    for (let x = x0; x < edge; x += 7) {
      const pos = (x - x0) / bw * 4, ph = pos % 1, onKick = Math.floor(pos) % 2 === 0;
      const env = 0.16 + 0.14 * Math.abs(noise1(pos * 3.1)) + (onKick ? 0.7 : 0.38) * Math.exp(-ph * 5);
      ctx.fillStyle = rgba(mix(INK, CORAL, Math.exp(-ph * 7)), 0.9); ctx.fillRect(x, cy - env * 160, 4, env * 320);
    }
    [0, 1, 2, 3, 4, 6, 7].forEach((bar, i) => {
      const x = x0 + bar * bw, a = edge - x;
      if (a < 0) return;
      const s = spring(a / 600, 18, 9), label = TX.events[i];
      setFont(ctx, 700, 20, MONO); const tw = ctx.measureText(label).width + 28;
      ctx.save(); ctx.translate(x + tw / 2 + 2, top + 86); ctx.scale(s, s);
      ctx.fillStyle = rgba(CORAL); pill(ctx, 0, 0, tw, 40); ctx.fill();
      T(ctx, label, 0, 7, { f: MONO, w: 700, size: 20, fill: DARK, a: 'center' });
      ctx.restore();
      ctx.fillStyle = rgba(CORAL, 0.6); ctx.fillRect(x - 1, top + 104, 2, cy - top - 104 - 170);
    });
    ctx.fillStyle = rgba(CORAL); ctx.fillRect(edge - 2, top, 4, 520);
    const mx = X + w - 360, lufs = lerp(-32, -14, EASE.expo(prog(ltF, 0.4, 3.0)));
    ctx.fillStyle = rgba(INK, 0.05); rrect(ctx, mx, top, 300, 520, 18); ctx.fill();
    T(ctx, num(lufs), mx + 36, top + 160, { w: 800, size: 116, fill: INK });
    T(ctx, 'LUFS', mx + 40, top + 204, { f: MONO, w: 700, size: 26, fill: DIM, ls: 2 });
    T(ctx, `${TX.peak} ${num(-1.0)} dBTP`, mx + 40, top + 262, { f: MONO, w: 500, size: 22, fill: DIM });
    const lv = clamp((lufs + 40) / 40);
    ctx.fillStyle = rgba(INK, 0.12); rrect(ctx, mx + 40, top + 300, 220, 16, 8); ctx.fill();
    ctx.fillStyle = rgba(lufs > -14.5 ? OK : AMBER); rrect(ctx, mx + 40, top + 300, 220 * lv, 16, 8); ctx.fill();
    ctx.fillStyle = rgba(INK); ctx.fillRect(mx + 40 + 220 * (26 / 40) - 1, top + 292, 3, 32);
  },
  render(ctx, lt, X, Y, w) {
    const px = X + 74, cmd = '$ node ft.mjs render examples/brew', ltF = FT - A(20);
    T(ctx, cmd.slice(0, Math.floor(clamp(lt / 0.35) * cmd.length)), px, Y + 116, { f: MONO, w: 500, size: 30, fill: INK });
    const pr = EASE.css(prog(ltF, 0.4, 1.7)), n = Math.round(900 * pr);
    T(ctx, `${TX.rendering} ${n} / 900 ${TX.frames}`, px, Y + 240, { f: MONO, w: 700, size: 36, fill: INK });
    ctx.fillStyle = rgba(INK, 0.12); rrect(ctx, px, Y + 270, 640, 18, 9); ctx.fill();
    ctx.fillStyle = rgba(CORAL); rrect(ctx, px, Y + 270, Math.max(18, 640 * pr), 18, 9); ctx.fill();
    if (pr >= 1) { check(ctx, px + 12, Y + 352, 12, OK, 4); T(ctx, '→ out/brew.mp4', px + 44, Y + 364, { f: MONO, w: 700, size: 34, fill: OK }); }
    const bx = X + 820, bw = w - 820 - 70, by = Y + 60;
    ctx.fillStyle = rgba(INK, 0.05); rrect(ctx, bx, by, bw, 560, 18); ctx.fill();
    const ballX = tt => bx + 90 + (bw - 180) * (0.5 - 0.5 * Math.cos(tt * 3.2));
    T(ctx, TX.sub1, bx + 36, by + 60, { f: MONO, w: 500, size: 24, fill: DIM });
    circle(ctx, ballX(lt), by + 160, 46, CORAL);
    T(ctx, TX.sub6, bx + 36, by + 320, { f: MONO, w: 500, size: 24, fill: DIM });
    for (let j = 5; j >= 0; j--) circle(ctx, ballX(lt - j * 0.022), by + 430, 46, CORAL, 1 / (j + 1.4));
  },
  lang(ctx, lt, X, Y, w) {
    const s = 470, mx = X + w / 2 - s / 2, my = Y + 150;
    brewMini(ctx, mx, my, s, 3.0, null);
    const sw = spring(lt - 0.5, 16, 9), cx = X + w / 2, ty = Y + 82;
    ctx.fillStyle = rgba(INK, 0.1); pill(ctx, cx, ty, 220, 60); ctx.fill();
    ctx.fillStyle = rgba(CORAL); pill(ctx, cx + lerp(-54, 54, sw), ty, 104, 48); ctx.fill();
    T(ctx, TX.langA, cx - 54, ty + 9, { f: MONO, w: 700, size: 24, fill: sw < 0.5 ? DARK : INK, a: 'center' });
    T(ctx, TX.langB, cx + 54, ty + 9, { f: MONO, w: 700, size: 24, fill: sw >= 0.5 ? DARK : INK, a: 'center' });
    // the title flips letter by letter from one language to the other
    const u = s / 100, size = 9 * u, base = my + 86 * u, font = `800 ${size}px ${DISP}`, ft = lt - 0.6;
    ctx.save(); ctx.beginPath(); ctx.rect(mx, base - size * 1.05, s, size * 1.4); ctx.clip();
    ctx.font = font; ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = rgba(INK);
    [[TX.mini.from, -1], [TX.mini.to, 1]].forEach(([str, dir]) => {
      const L = layout(ctx, str, font, 0), x0 = mx + s / 2 - L.total / 2;
      for (let i = 0; i < str.length; i++) {
        const e = dir < 0 ? E.inCubic(prog(ft, i * 0.02, i * 0.02 + 0.25)) : 1 - EASE.expo(prog(ft, 0.2 + i * 0.025, 0.7 + i * 0.025));
        if (e >= 1) continue;
        ctx.save(); ctx.translate(x0 + L.cx(0, i), base + e * size * 1.15);
        ctx.fillText(str[i], -L.w(i) / 2, 0); ctx.restore();
      }
    });
    ctx.restore();
  },
};
function demo(ctx, t) {
  fill(ctx, INK); halo(ctx, t, 1);
  let k = 0;
  for (const [, b] of SECTIONS.slice(1)) { const d = t - A(b); if (d >= 0) k += 0.02 * Math.exp(-d * 7); }
  let i = SECTIONS.length - 1;
  while (i > 0 && t < A(SECTIONS[i][1])) i--;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + k, 1 + k); ctx.translate(-W / 2, -H / 2);
  windowFrame(ctx, WX, WY, WW, WH, SECTIONS[i][2], { body: rgba(WIN) });
  ctx.save(); ctx.beginPath(); ctx.rect(WX, WY + 46, WW, WH - 46); ctx.clip();
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

// ───────────────────────────── 6 · "Render": the saucer beams the button up, its beam floods the frame (bar 22)
function renderShot(ctx, t) {
  demo(ctx, t);
  ctx.fillStyle = rgba(INK, 0.82 * EASE.expo(prog(t, A(22), A(22, 3)))); ctx.fillRect(-80, -80, W + 160, H + 160);
  const click = A(22, 4), press = clamp(1 - Math.abs(t - click - 0.05) / 0.08);
  const lift = E.inExpo(prog(t, A(22, 9), A(22, 13))), pop = spring(t - A(22), 16, 8);
  const by = lerp(560, 300, lift), bs = pop * lerp(1, 0.12, lift) * (1 - 0.05 * press);
  const come = EASE.expo(prog(t, A(22, 5), A(22, 8))), sy = lerp(-240, 210, come) + Math.sin(t * 3) * 6;
  beam(ctx, W / 2, sy + 44, 560 - sy, EASE.expo(prog(t, A(22, 8), A(22, 9))), t, { top: 80, bottom: 520 });
  if (bs > 0.01 && lift < 1) {
    ctx.save(); ctx.translate(W / 2, by); ctx.scale(bs, bs);
    ctx.fillStyle = rgba(CORAL); pill(ctx, 0, 0, 440, 136); ctx.fill(); ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = rgba(DARK); ctx.beginPath(); ctx.moveTo(-118, -26); ctx.lineTo(-76, 0); ctx.lineTo(-118, 26); ctx.closePath(); ctx.fill();
    T(ctx, TX.render, -50, 23, { w: 700, size: 66, fill: DARK });
    ctx.restore();
  }
  saucer(ctx, W / 2, sy, 1.25, t);
  const cin = EASE.expo(prog(t, A(22, 1), A(22, 3)));
  shockRing(ctx, W / 2 + 170, 594, t, click, { color: CORAL, life: 0.45, radius: 240, width: 16 });
  ctx.save(); ctx.globalAlpha = 1 - prog(t, A(22, 6), A(22, 8)); pointer(ctx, lerp(1600, W / 2 + 170, cin), lerp(1120, 594, cin), 2.4, press); ctx.restore();
  const c = E.inOutCubic(prog(t, A(22, 12), A(23)));
  if (c > 0) {
    const y0 = sy + 44, tw = lerp(80, 4200, E.inCubic(c)), bw = lerp(520, 6000, c);
    ctx.fillStyle = rgba(CORAL, Math.min(1, 0.6 + c)); ctx.beginPath();
    ctx.moveTo(W / 2 - tw / 2, y0 - 2000 * E.inCubic(c)); ctx.lineTo(W / 2 + tw / 2, y0 - 2000 * E.inCubic(c)); ctx.lineTo(W / 2 + bw / 2, H + 100); ctx.lineTo(W / 2 - bw / 2, H + 100); ctx.closePath(); ctx.fill();
  }
}

// ───────────────────────────── 7 · four feature cards (bars 23–26)
function illustration(ctx, k, lt) {
  if (k === 0) {
    const font = `800 170px ${DISP}`, L = layout(ctx, 'Aa', font, 0), x0 = 300 - L.total / 2, lp = lt % 2;
    ctx.save(); ctx.beginPath(); ctx.rect(40, 120, 520, 190); ctx.clip(); ctx.font = font; ctx.letterSpacing = '0px'; ctx.fillStyle = rgba(DARK); ctx.textAlign = 'left';
    for (let i = 0; i < 2; i++) ctx.fillText('Aa'[i], x0 + L.xs[i], 290 + (1 - EASE.expo(prog(lp, 0.1 + i * 0.08, 0.7 + i * 0.08))) * 190);
    ctx.restore();
    ctx.fillStyle = rgba(CORAL); ctx.fillRect(300 - 110 * EASE.expo(prog(lp, 0.4, 1.0)), 304, 220 * EASE.expo(prog(lp, 0.4, 1.0)), 10);
  } else if (k === 1) {
    ctx.strokeStyle = rgba(DARK, 0.35); ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.moveTo(80, 230); ctx.lineTo(520, 230); ctx.stroke(); ctx.setLineDash([]);
    const bx = tt => lerp(120, 480, 0.5 - 0.5 * Math.cos(tt * 3.4));
    for (let j = 7; j >= 1; j--) circle(ctx, bx(lt - j * 0.03), 230, 40, CORAL, 0.5 / (j + 0.5));
    circle(ctx, bx(lt), 230, 40, CORAL); ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(bx(lt), 230, 40, 0, TAU); ctx.stroke();
  } else if (k === 2) {
    for (let i = 0; i < 20; i++) {
      const x = 92 + i * 22, hh = 18 + 150 * Math.abs(noise1(i * 0.7 + lt * 3)) * (0.6 + 0.4 * Math.exp(-((lt * 2) % 1) * 4));
      ctx.fillStyle = rgba(i === Math.floor((lt * 10) % 20) ? CORAL : DARK); rrect(ctx, x, 230 - hh / 2, 12, hh, 6); ctx.fill();
    }
  } else {
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const P = V.map(([x, y, z]) => project3D(x * 92, y * 92, z * 92, { tilt: 0.55, yaw: lt * 1.3 + 0.4, D: 900 }));
    ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 5; ctx.lineJoin = 'round';
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(300 + P[a].x, 228 + P[a].y); ctx.lineTo(300 + P[b].x, 228 + P[b].y); ctx.stroke();
    });
    P.forEach(p => circle(ctx, 300 + p.x, 228 + p.y, 9, CORAL));
  }
}
function features(ctx, t) {
  fill(ctx, CORAL);
  radialBlob(ctx, W / 2, H / 2, 900, AMBER, 0.22);
  const k = Math.min(3, Math.floor((t - A(23)) / A(1))), lt = t - A(23 + k), left = k % 2 === 0;
  const inn = spring(lt, 12, 9), out = E.inBack(prog(lt, 1.74, 2.0), 2);
  const side = left ? -1 : 1, cx = (left ? 560 : 1360) + side * ((1 - inn) * 900 + out * 1300), cy = 500;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-side * 0.04 + side * (1 - clamp(inn)) * 0.3); ctx.transform(0.94, -side * 0.08, 0, 1, 0, 0); ctx.translate(-300, -220);
  ctx.fillStyle = rgba(DARK, 0.18); rrect(ctx, 16, 22, 600, 440, 36); ctx.fill();
  ctx.fillStyle = rgba(INK); rrect(ctx, 0, 0, 600, 440, 36); ctx.fill(); ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 6; ctx.stroke();
  circle(ctx, 62, 72, 11, CORAL);
  T(ctx, TX.cards[k], 88, 88, { w: 700, size: 48, fill: CORAL });
  illustration(ctx, k, lt);
  circle(ctx, 300, 372, 40, CORAL); ctx.strokeStyle = rgba(DARK); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(300, 372, 40, 0, TAU); ctx.stroke();
  ctx.fillStyle = rgba(DARK); ctx.beginPath(); ctx.moveTo(290, 356); ctx.lineTo(314, 372); ctx.lineTo(290, 388); ctx.closePath(); ctx.fill();
  ctx.restore();

  const [a, b] = TX.features[k], tx = left ? 1010 : 910, align = left ? 'left' : 'right';
  const s1 = fitFont(ctx, a, 800, 240, 800, DISP), s2 = fitFont(ctx, b, 800, 200, 800, DISP);
  const base1 = 470, base2 = base1 + s2 * 0.98;
  [[a, s1, base1, true, 0.06], [b, s2, base2, false, 0.14]].forEach(([str, size, base, outline, d]) => {
    const e = EASE.expo(prog(lt, d, d + 0.6)), o = E.inBack(prog(lt, 1.72 + d * 0.3, 2.0), 1.6);
    setFont(ctx, 800, size, DISP, -size * 0.01); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.save(); ctx.beginPath(); ctx.rect(-80, base - size * 0.92, W + 160, size * 1.2); ctx.clip();
    const y = base + (1 - e) * size * 1.05 - o * size * 1.05;
    if (outline) { ctx.lineWidth = 4; ctx.strokeStyle = rgba(INK); ctx.lineJoin = 'round'; ctx.strokeText(str, tx, y); }
    else { ctx.fillStyle = rgba(INK); ctx.fillText(str, tx, y); }
    ctx.restore();
  });
}

// ───────────────────────────── 8 · "Now on GitHub" (bar 27) and the end card (bars 28–29)
function github(ctx, t) {
  fill(ctx, CORAL);
  const lt = t - A(27), font = `800 150px ${DISP}`, L = layout(ctx, TX.github, font, 0), x0 = W / 2 - L.total / 2, base = 590;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - 160, W, 200); ctx.clip();
  ctx.font = font; ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.fillStyle = rgba(INK);
  for (let i = 0; i < TX.github.length; i++) ctx.fillText(TX.github[i], x0 + L.xs[i], base + (1 - EASE.expo(prog(lt, i * 0.03, 0.55 + i * 0.03))) * 170);
  ctx.restore();
  const click = A(27, 8), press = clamp(1 - Math.abs(t - click - 0.05) / 0.08);
  const cin = EASE.expo(prog(t, A(27, 3), A(27, 7))), px = x0 + L.total + 40, py = base - 20;
  shockRing(ctx, px, py, t, click, { color: INK, life: 0.45, radius: 220, width: 14 });
  pointer(ctx, lerp(1760, px, cin), lerp(1140, py, cin), 2.6, press);
  discCover(ctx, W, H, px, py, E.inOutCubic(prog(t, A(27, 10), A(28))), BG, 0);
}
function endCard(ctx, t) {
  fill(ctx, BG); stars(ctx, t, t * 18, 0.6);
  const lt = t - A(28), g = markGeom(ctx, W / 2, 590, 200);
  const come = EASE.expo(prog(lt, 0, 0.6)), m = E.inOutCubic(prog(lt, 0.45, 0.85));
  const x = lerp(-260, g.dx, come), y = lerp(330, g.dy, come) + Math.sin(t * 3) * 8 * (1 - m);
  saucer(ctx, x, y, lerp(1.1, g.r / 34, m), t, { form: 1 - m, tilt: 0.25 * (1 - come) });
  shockRing(ctx, g.dx, g.dy, t, A(28, 7), { color: CORAL, life: 0.6, radius: 320, width: 14 });
  letters(ctx, g, lt - 0.8);
  const e1 = EASE.expo(prog(lt, 1.3, 1.9)), e2 = EASE.expo(prog(lt, 1.7, 2.3));
  T(ctx, TX.tagline, W / 2, 700 + (1 - e1) * 30, { f: MONO, w: 500, size: 40, fill: INK, a: 'center', alpha: e1 * 0.85 });
  T(ctx, TX.url, W / 2, 780 + (1 - e2) * 30, { f: MONO, w: 700, size: 32, fill: CORAL, a: 'center', alpha: e2 });
}

const HITS = () => [[A(1), 7], [A(23), 10], [A(28, 7), 4]];

export default {
  setup(api) {
    W = api.W; H = api.H; A = api.at; TX = COPY[api.lang] ?? COPY.en;
    CAPS = CAP_AT.map(([[b0, s0], [b1, s1]]) => [A(b0, s0), A(b1, s1)]);
  },
  draw(ctx, t, api) {
    FT = api.frameT ?? t;
    const [sx, sy] = shake(t, HITS());
    ctx.save(); ctx.translate(sx, sy);
    if (t < A(4)) space1(ctx, t);
    else if (t < A(6)) space2(ctx, t);
    else if (t < A(8, 2)) hq(ctx, t);
    else if (t < A(10)) intro(ctx, t);
    else if (t < A(22)) demo(ctx, t);
    else if (t < A(23)) renderShot(ctx, t);
    else if (t < A(27)) features(ctx, t);
    else if (t < A(28)) github(ctx, t);
    else endCard(ctx, t);
    ctx.restore();
    caption(ctx, t);
  },
  post(ctx, t, { W, H }) { if (t < A(6) || t >= A(28)) vignette(ctx, W, H, 0.35); },
};
