// examples/locale-games: a 24 s, 16:9 X/Twitter showcase of the Locale Games landing page (UI/UX portfolio piece).
// Concept: the page is played like a game. PRESS START → the robot's eyes become the hero → each section is a level
// (HUD: level, progress, score) → a design-system beat → contact → the footer sky → LEVEL COMPLETE → designer credits.
// The page is rebuilt in code at 1440 px wide (page units) inside a browser window; the camera moves over it.
// Time constants sit on the 120 BPM grid: at(bar, step), bar = 2 s, step = 1/16 bar. Copy lives in COPY.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, setFont, layout, rrect, pointer, shake, vignette, radialBlob } from '../../engine/core.js';
import { flash } from '../../engine/fx.js';

const COPY = {
  en: {
    press: 'PRESS START',
    tab: 'Locale Games',
    nav: ['Home', 'Games', 'Contact'],
    hero: ['WE MAKE', 'GAMES', 'WORTH', 'PLAYING.'],
    heroSub: ['Different worlds. Different challenges.', 'One place to play them all'],
    heroBtn: 'Explore Our Games',
    gamesEyebrow: 'OUR GAMES',
    games: ['PICK A WORLD.', 'START PLAYING.'],
    gamesSub: ['From casual fun to competitive challenges —', 'explore our growing collection of games.'],
    // the design repeated "DropTis" under the bubbles icon; renamed here
    cards: ['DropTis', 'TurboRush', 'StackPop', 'BubbleBurst', 'Bullseye!', 'Cloudsee', 'Hopscape', 'Fruity Frenzy'],
    badges: [['Download on the', 'App Store'], ['GET IT ON', 'Google Play']],
    system: { title: 'DESIGN SYSTEM', color: 'COLOR', type: 'TYPE', display: 'Display · Black', body: 'Body · Regular', comps: 'COMPONENTS' },
    contactEyebrow: "LET'S CONNECT",
    contact: ['GOT SOMETHING', 'IN MIND?'],            // the design reads "SOMETIHING"; corrected here
    contactSub: ["Whether it's a game, a collaboration or just a", "hello — we'd love to hear from you."],
    fields: ['Your Name', 'Mail', "What's on your mind?"],
    typed: ['Alex Rivera', 'admin@localegames.dev', "Let's build a new world together."],   // placeholder sample input
    send: 'Send Message',
    level: 'LEVEL', levels: ['HERO', 'GAMES', 'CONTACT'], score: 'SCORE',
    complete: 'LEVEL COMPLETE',
    role: 'LANDING PAGE · UI/UX DESIGN',
    by: 'Designed by',
    designer: 'Şimal Su Erdoğan',
    links: [['Behance', '/simalsuerdogan'], ['Dribbble', '/susimalerd'], ['LinkedIn', '/simalsuerdogan']],
  },
};

// palette sampled from the design
const INK = [5, 3, 15], HERO_M = [34, 28, 53], HERO_R = [69, 56, 95], VIOLET = [166, 111, 250], LILAC = [184, 156, 255];
const BTN_L = [117, 62, 201], BTN_R = [74, 17, 87], LIGHT = [239, 242, 253], NAVY = [14, 5, 47], DEEP = [139, 76, 240];
const CARD_A = [49, 27, 101], CARD_B = [30, 19, 71], CARD_C = [13, 10, 39], FIELD = [49, 47, 71], SKY_TOP = [108, 106, 174];
const WHITE = [255, 255, 255], GOLD = [255, 197, 107];
const DISP = "'Exo 2'", UI = 'Inter';
const SWATCHES = [[INK, '#05030F'], [HERO_R, '#45385F'], [VIOLET, '#A66FFA'], [BTN_L, '#753EC9'], [LIGHT, '#EFF2FD']];
const ICONS = ['icon-droptis', 'icon-turborush', 'icon-stackpop', 'icon-bubbles', 'icon-bullseye', 'icon-cloudsee', 'icon-hopscape', 'icon-fruity'];

// browser window: content 1536×864 shows the page at 1440 × 810 page units
const WIN = { x: 192, y: 44, w: 1536, bar: 40, h: 864 };
const K = WIN.w / 1440, CX = WIN.x, CY = WIN.y + WIN.bar;
// hero robot box and its eyes (measured in robot-hero.png, 668×708)
const ROBOT = { x: 740, y: 96, w: 640, h: 640 * 708 / 668 }, RS = 640 / 668;
const EYE = { x: 740 + 313.4 * RS, y: 96 + 285.7 * RS, hx: 57.6 * RS, hy: 12.3 * RS, len: 106 * RS, wid: 41 * RS, rot: 0.31 };
const Z0 = 2.6;                                           // hook zoom: the eyes fill the frame
const GRID = { x: 105, y: 1060, w: 285, h: 250, gx: 30, gy: 24 };
const FORM = { x: 960, w: 390, name: 1800, mail: 1876, msg: 1952, send: 2116 };
const SCROLL = { games: 830, contact: 1640, footer: 2400 };
const SKY_Y = 2400;                                       // the sunset image fills the footer view exactly
const cardT0 = i => at(3, 8 + 2 * i);                     // cards land on eighth notes

let at = (bar, step = 0) => bar * 2 + step * 0.125;
let IMG = {};
let TX = COPY.en;

// ───────────── helpers
const bump = (t, t0, a = 0.03, b = 0.12) => Math.sin(Math.PI * prog(t, t0 - a, t0 + b));
const bob = (t, k = 1) => Math.sin(t * Math.PI * 0.5 * k) * 7;

/** Per-letter masked rise (stagger 0 = whole line). Clip keeps room for diacritics above and below. */
function rise(ctx, text, x, base, t, t0, { w = 900, size = 100, fam = DISP, color = WHITE, ls = 0, stagger = 0.025, dur = 0.7, alpha = 1, align = 'left' } = {}) {
  if (t < t0 || alpha <= 0) return;
  const font = `${w} ${size}px ${fam}`, L = layout(ctx, text, font, ls);
  const x0 = align === 'center' ? x - L.total / 2 : align === 'right' ? x - L.total : x;
  ctx.save();
  ctx.font = font; ctx.letterSpacing = `${ls}px`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.beginPath(); ctx.rect(x0 - size, base - size * 1.2, L.total + size * 2, size * 1.55); ctx.clip();
  ctx.fillStyle = rgba(color, alpha);
  if (!stagger) {
    const p = EASE.expo(prog(t, t0, t0 + dur));
    ctx.fillText(text, x0, base + (1 - p) * size * 1.25);
  } else {
    for (let i = 0; i < text.length; i++) {
      const p = EASE.expo(prog(t, t0 + i * stagger, t0 + i * stagger + dur));
      if (p > 0 && text[i] !== ' ') ctx.fillText(text[i], x0 + L.xs[i], base + (1 - p) * size * 1.25);
    }
  }
  ctx.restore();
}
function text(ctx, s, x, y, { w = 500, size = 20, fam = UI, color = WHITE, alpha = 1, ls = 0, align = 'left' } = {}) {
  setFont(ctx, w, size, fam, ls); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(color, alpha); ctx.fillText(s, x, y);
}
function arrowNE(ctx, x, y, s, col, lw = 2.4) {
  ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y + s); ctx.lineTo(x + s, y - s); ctx.moveTo(x - s * 0.3, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x + s, y + s * 0.3); ctx.stroke(); ctx.restore();
}
function img(ctx, im, x, y, w, h = w * im.height / im.width) { ctx.drawImage(im, x, y, w, h); }
function star(ctx, cx, cy, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.46 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function gradPill(ctx, x, y, w, h, hov = 0) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, rgba(mix(BTN_L, VIOLET, hov * 0.45))); g.addColorStop(1, rgba(BTN_R));
  ctx.fillStyle = g; rrect(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.5; ctx.stroke();
}
function glassCard(ctx, x, y, w, h, r, alpha = 1) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, rgba(CARD_A, alpha)); g.addColorStop(0.5, rgba(CARD_B, alpha)); g.addColorStop(1, rgba(CARD_C, alpha));
  ctx.fillStyle = g; rrect(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1.5; ctx.stroke();
}
/** One robot eye: a glowing capsule. open squashes it (blink). */
function eyeShape(ctx, cx, cy, len, wid, rot, open, glow = 1) {
  if (open <= 0.01) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(1, open);
  ctx.shadowColor = rgba(VIOLET, 0.95 * glow); ctx.shadowBlur = 70 * glow;
  const g = ctx.createLinearGradient(-wid / 2, 0, wid / 2, 0);
  g.addColorStop(0, '#e4d3ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#d6c0ff');
  ctx.fillStyle = g; rrect(ctx, -wid / 2, -len / 2, wid, len, wid / 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.lineWidth = wid * 0.1; ctx.strokeStyle = rgba(VIOLET, 0.9 * glow); ctx.stroke();
  ctx.restore();
}
function speechBubble(ctx, cx, cy, w, rot = 0) {
  const h = w * 0.72;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.shadowColor = rgba(VIOLET, 0.8); ctx.shadowBlur = 40;
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, '#b07cff'); g.addColorStop(1, '#6a2de0');
  ctx.fillStyle = g;
  rrect(ctx, -w / 2, -h / 2, w, h, w * 0.22); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w * 0.12, h / 2 - 2); ctx.lineTo(w * 0.3, h / 2 + w * 0.2); ctx.lineTo(w * 0.32, h / 2 - 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#fff';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * w * 0.24, 0, w * 0.085, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ───────────── camera & scroll
// camera {z, f, s}: a zoom-1 screen point p lands at s + z·(p − f)
const ID = { z: 1, f: [960, 540], s: [960, 540] };
const SYS = { z: 0.56, f: [960, 496], s: [620, 540] };
const ZFORM = { z: 1.3, f: [1424, 470], s: [1480, 540] };   // robot, headline and form in one frame
const FULL = { z: 1.25, f: [960, 516], s: [960, 540] };     // the content rect fills the frame exactly
function blend(a, b, p) {
  return { z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), p)), f: [lerp(a.f[0], b.f[0], p), lerp(a.f[1], b.f[1], p)], s: [lerp(a.s[0], b.s[0], p), lerp(a.s[1], b.s[1], p)] };
}
function camera(t) {
  if (t < at(5)) {
    const hook = { z: Z0, f: [CX + EYE.x * K, CY + (EYE.y + bob(t)) * K], s: [960, 500] };
    return blend(hook, ID, EASE.expo(prog(t, at(1), at(1, 13))));
  }
  if (t < at(5, 14)) return blend(ID, SYS, E.inOutCubic(prog(t, at(5), at(5, 4))));
  if (t < at(6, 7)) return blend(SYS, ID, E.inOutCubic(prog(t, at(5, 14), at(6, 2))));
  if (t < at(7, 9)) return blend(ID, ZFORM, EASE.expo(prog(t, at(6, 7), at(6, 11))));
  if (t < at(8)) return blend(ZFORM, FULL, EASE.snap(prog(t, at(7, 9), at(8))));
  return { ...FULL, z: FULL.z * (1 + 0.05 * E.outCubic(prog(t, at(8), at(12)))) };
}
function scrollAt(t) {
  return SCROLL.games * EASE.snap(prog(t, at(3), at(3, 6)))
    + (SCROLL.contact - SCROLL.games) * EASE.snap(prog(t, at(5, 14), at(6, 5)))
    + (SCROLL.footer - SCROLL.contact) * E.inOutCubic(prog(t, at(7, 9), at(8)));
}
function toScreen(px, py, t) {
  const c = camera(t), sc = scrollAt(t);
  const x1 = CX + px * K, y1 = CY + (py - sc) * K;
  return [c.s[0] + c.z * (x1 - c.f[0]), c.s[1] + c.z * (y1 - c.f[1])];
}

// ───────────── bar 0: PRESS START (the robot's eyes in the dark)
function hook(ctx, t, W, H) {
  ctx.fillStyle = rgba(INK); ctx.fillRect(0, 0, W, H);
  const on = Math.max(0, spring(t - at(0, 2), 14, 7));
  radialBlob(ctx, 960, 480, 760, BTN_L, 0.24 * clamp(on));
  const blink = 1 - 0.92 * Math.sin(Math.PI * prog(t, at(0, 8), at(0, 9.5)));
  const look = EASE.expo(prog(t, at(0, 9), at(0, 13))) * 16;       // glance at the incoming cursor
  const p = EASE.expo(prog(t, at(0, 14), at(1)));                     // settle into the hero robot's pose
  const hx = EYE.hx * K * Z0, hy = EYE.hy * K * Z0;
  for (const side of [-1, 1]) {
    eyeShape(ctx, lerp(960 + side * 150 + look, 960 + side * hx, p), lerp(450 + look * 0.5, 500 + side * hy, p),
      lerp(270, EYE.len * K * Z0, p), lerp(100, EYE.wid * K * Z0, p), lerp(0, EYE.rot, p), on * blink);
  }
  // PRESS START: blinks on eighth notes, steadies under the cursor, strobes on the click
  if (t < at(0, 4)) return;
  const hov = EASE.css(prog(t, at(0, 12), at(0, 13.5))), clicked = t >= at(0, 14);
  const blinkA = Math.floor(t / at(0, 2)) % 2 ? 0.28 : 1;
  const a = clicked ? (Math.floor(t / at(0, 0.5)) % 2 ? 0.35 : 1) : lerp(blinkA, 1, hov);
  const enter = EASE.expo(prog(t, at(0, 4), at(0, 8)));
  ctx.save(); ctx.globalAlpha = enter;
  setFont(ctx, 800, 44, DISP, 12);
  const tw = ctx.measureText(TX.press).width;
  if (hov > 0) {
    ctx.fillStyle = rgba(VIOLET, 0.16 * hov); ctx.strokeStyle = rgba(VIOLET, 0.9 * hov); ctx.lineWidth = 2;
    rrect(ctx, 960 - tw / 2 - 40, 712, tw + 70, 74, 37); ctx.fill(); ctx.stroke();
  }
  text(ctx, TX.press, 960 + 6, 765, { w: 800, size: 44, fam: DISP, ls: 12, align: 'center', color: clicked ? LILAC : WHITE, alpha: a });
  ctx.restore();
}

// ───────────── the page (page units, 1440 wide)
function hero(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 1440, 520);
  g.addColorStop(0, rgba(INK)); g.addColorStop(0.45, rgba(HERO_M)); g.addColorStop(1, rgba(HERO_R));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1440, 810);
  // nav
  const n = EASE.expo(prog(t, at(1, 8), at(1, 14)));
  ctx.save(); ctx.globalAlpha = n; ctx.translate(0, (1 - n) * -24);
  img(ctx, IMG['logo-stack'], 100, 40, 177);
  ctx.fillStyle = 'rgba(43,34,60,0.7)'; rrect(ctx, 1010, 42, 330, 48, 24); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke();
  TX.nav.forEach((s, i) => text(ctx, s, 1070 + i * 107, 72, { w: 500, size: 16, align: 'center', alpha: 0.85 }));
  ctx.restore();
  // robot, with the hook's eye glow fading out after the cut
  const by = bob(t);
  radialBlob(ctx, 1060, 440, 440, BTN_L, 0.35);
  img(ctx, IMG['robot-hero'], ROBOT.x, ROBOT.y + by, ROBOT.w, ROBOT.h);
  const glow = t >= at(1) ? Math.exp(-(t - at(1)) * 3.5) : 0;
  if (glow > 0.02) for (const side of [-1, 1]) eyeShape(ctx, EYE.x + side * EYE.hx, EYE.y + by + side * EYE.hy, EYE.len, EYE.wid, EYE.rot, 1, glow);
  // headline + sub + button
  TX.hero.forEach((line, i) => rise(ctx, line, 100, 250 + i * 102, t, at(1, 4) + i * at(0, 1), { w: 900, size: 104, ls: -1, color: i < 2 ? WHITE : VIOLET }));
  TX.heroSub.forEach((line, i) => rise(ctx, line, 100, 622 + i * 36, t, at(2) + i * at(0, 1), { w: 400, size: 24, fam: UI, stagger: 0, alpha: 0.88 }));
  const s = spring(t - at(2, 2), 13, 7);
  if (s <= 0) return;
  const hov = EASE.css(prog(t, at(2, 10), at(2, 11.5))) * (1 - prog(t, at(3), at(3, 2)));
  const press = bump(t, at(2, 14));
  const x = 100, y = 700, w = 370, h = 68;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2 - hov * 4); ctx.scale(s * (1 - 0.05 * press), s * (1 - 0.05 * press)); ctx.translate(-x - w / 2, -y - h / 2);
  ctx.shadowColor = rgba(VIOLET, 0.25 + 0.5 * hov); ctx.shadowBlur = 20 + 34 * hov;
  gradPill(ctx, x, y, w, h, hov);
  ctx.shadowBlur = 0;
  text(ctx, TX.heroBtn, x + 48, y + 43, { w: 500, size: 24 });
  arrowNE(ctx, x + w - 62 + hov * 4, y + h / 2 - hov * 4, 8, WHITE);
  if (t >= at(2, 14)) {
    const q = prog(t, at(2, 14), at(3, 2));
    ctx.save(); rrect(ctx, x, y, w, h, h / 2); ctx.clip();
    ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - q)})`; ctx.beginPath(); ctx.arc(x + 230, y + 42, 320 * EASE.expo(q), 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function badge(ctx, x, y, [small, big]) {
  ctx.fillStyle = '#0b0b10'; rrect(ctx, x, y, 116, 34, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 15, y + 17, 6, 0, TAU); ctx.fill();
  text(ctx, small, x + 28, y + 13, { w: 500, size: 8, alpha: 0.8 });
  text(ctx, big, x + 28, y + 27, { w: 600, size: 14 });
}
function card(ctx, i, t) {
  const t0 = cardT0(i);
  if (t < t0) return;
  const s = spring(t - t0, 14, 6.5), a = clamp((t - t0) / 0.1);
  const { w, h } = GRID, x = GRID.x + (i % 4) * (w + GRID.gx), y = GRID.y + (i >> 2) * (h + GRID.gy);
  const hov = i === 2 ? EASE.css(prog(t, at(4, 12), at(4, 13.5))) * (1 - prog(t, at(5), at(5, 2))) : 0;
  ctx.save(); ctx.globalAlpha = a;
  ctx.translate(x + w / 2, y + h / 2 + (1 - s) * 50 - hov * 12); ctx.scale(0.75 + 0.25 * s + 0.03 * hov, 0.75 + 0.25 * s + 0.03 * hov); ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = `rgba(60,40,120,${0.12 + 0.2 * hov})`; ctx.shadowBlur = 30 + 24 * hov; ctx.shadowOffsetY = 10 + 10 * hov;
  ctx.fillStyle = '#fff'; rrect(ctx, 0, 0, w, h, 20); ctx.fill();
  ctx.shadowColor = 'transparent';
  if (hov > 0) { ctx.strokeStyle = rgba(VIOLET, hov); ctx.lineWidth = 3; ctx.stroke(); }
  const si = Math.max(0, spring(t - t0 - 0.06, 16, 6)), is = 150 * (0.6 + 0.4 * si) * (1 + 0.06 * hov);
  ctx.save(); rrect(ctx, w / 2 - is / 2, 91 - is / 2, is, is, is * 0.2); ctx.clip();
  img(ctx, IMG[ICONS[i]], w / 2 - is / 2, 91 - is / 2, is, is); ctx.restore();
  text(ctx, TX.cards[i], w / 2, 198, { w: 700, size: 23, color: [20, 17, 42], align: 'center' });
  badge(ctx, w / 2 - 121, 208, TX.badges[0]); badge(ctx, w / 2 + 5, 208, TX.badges[1]);
  ctx.restore();
}
function games(ctx, t) {
  const g = ctx.createLinearGradient(0, 810, 0, 1660);
  g.addColorStop(0, rgba(LIGHT)); g.addColorStop(1, '#e6e4fb');
  ctx.fillStyle = g; ctx.fillRect(0, 810, 1440, 850);
  rise(ctx, TX.gamesEyebrow, 100, 866, t, at(3, 4), { w: 500, size: 16, fam: UI, ls: 6, color: DEEP, stagger: 0 });
  TX.games.forEach((line, i) => rise(ctx, line, 100, 942 + i * 72, t, at(3, 4) + i * at(0, 1), { w: 900, size: 70, ls: -0.5, color: i ? DEEP : NAVY }));
  TX.gamesSub.forEach((line, i) => rise(ctx, line, 930, 950 + i * 29, t, at(3, 8) + i * at(0, 1), { w: 400, size: 19, fam: UI, color: [42, 35, 71], stagger: 0 }));
  for (let i = 0; i < 8; i++) card(ctx, i, t);
}

function field(ctx, x, y, w, h, ph, typed, active, t, t0) {
  const s = EASE.expo(prog(t, t0, t0 + 0.6));
  if (s <= 0) return;
  ctx.save(); ctx.globalAlpha = s; ctx.translate((1 - s) * 60, 0);
  if (active > 0) { ctx.shadowColor = rgba(VIOLET, 0.6 * active); ctx.shadowBlur = 24; }
  ctx.fillStyle = rgba(FIELD, 0.8); rrect(ctx, x, y, w, h, 14); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = active > 0 ? rgba(VIOLET, active) : 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2; ctx.stroke();
  if (typed) text(ctx, typed, x + 20, y + 35, { w: 500, size: 19 });
  else text(ctx, ph, x + 20, y + 34, { w: 400, size: 17, alpha: 0.42 });
  if (active > 0.5 && Math.floor(t / 0.25) % 2 === 0) {
    setFont(ctx, 500, 19, UI);
    ctx.fillStyle = rgba(LILAC); ctx.fillRect(x + 22 + (typed ? ctx.measureText(typed).width : 0), y + 17, 2.5, 24);
  }
  ctx.restore();
}
function contact(ctx, t) {
  // sky: the light section fades into the sunset image's top colour; clouds hide the seam
  const g = ctx.createLinearGradient(0, 1660, 0, SKY_Y + 10);
  g.addColorStop(0, rgba(LIGHT)); g.addColorStop(0.35, '#d2cdf0'); g.addColorStop(1, rgba(SKY_TOP));
  ctx.fillStyle = g; ctx.fillRect(0, 1660, 1440, SKY_Y + 10 - 1660);
  img(ctx, IMG.sky, 0, SKY_Y, 1440, 1440 * 816 / 1450);
  img(ctx, IMG['cloud-strip'], -160 + Math.sin(t * 0.5) * 12, 1590, 720);
  img(ctx, IMG['cloud-b'], 1130, 1600 + bob(t, 0.7), 360);
  img(ctx, IMG['cloud-a'], -140 + Math.sin(t * 0.4) * 10, 2130, 560);
  img(ctx, IMG['cloud-b'], 900 + Math.sin(t * 0.35) * 14, 2110, 600);
  img(ctx, IMG['cloud-a'], 430, 2190, 480);
  // card
  ctx.save(); ctx.shadowColor = 'rgba(20,10,60,0.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  glassCard(ctx, 40, 1730, 1360, 510, 36); ctx.restore();
  img(ctx, IMG['rock-island'], 90, 1690 + bob(t, 0.8), 150);
  img(ctx, IMG['rock-a'], -40, 1820 + bob(t + 1, 0.9), 130);
  img(ctx, IMG['rock-b'], 150, 1960 + bob(t + 2, 1.1), 50);
  img(ctx, IMG['rock-ledge'], -70, 2240 + bob(t, 0.5) * 0.5, 600);
  img(ctx, IMG['robot-laptop'], 70, 1975 + bob(t, 0.5) * 0.5, 360);
  // copy
  rise(ctx, TX.contactEyebrow, 470, 1832, t, at(6, 4), { w: 500, size: 16, fam: UI, ls: 6, color: LILAC, stagger: 0 });
  TX.contact.forEach((line, i) => rise(ctx, line, 470, 1906 + i * 64, t, at(6, 4) + i * at(0, 1), { w: 900, size: 58, ls: -0.5, color: i ? VIOLET : WHITE }));
  TX.contactSub.forEach((line, i) => rise(ctx, line, 470, 2030 + i * 32, t, at(6, 6) + i * at(0, 1), { w: 400, size: 21, fam: UI, alpha: 0.65, stagger: 0 }));
  // form: the cursor clicks Name, then the focus tabs through the fields while they fill
  const typed = (s, t0, cps) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - t0) * cps))));
  const act = (a, b) => prog(t, a, a + 0.08) * (1 - prog(t, b, b + 0.08));
  const fx = FORM.x, fw = FORM.w;
  field(ctx, fx, FORM.name, fw, 56, TX.fields[0], typed(TX.typed[0], at(6, 8), 24), act(at(6, 7), at(6, 12)), t, at(6, 4));
  field(ctx, fx, FORM.mail, fw, 56, TX.fields[1], typed(TX.typed[1], at(6, 12), 50), act(at(6, 12), at(6, 15.5)), t, at(6, 5));
  field(ctx, fx, FORM.msg, fw, 140, TX.fields[2], typed(TX.typed[2], at(6, 15.5), 50), act(at(6, 15.5), at(7, 7)), t, at(6, 6));
  const bs = EASE.expo(prog(t, at(6, 7), at(6, 12)));
  if (bs > 0) {
    const hov = EASE.css(prog(t, at(7, 6), at(7, 7.5))), press = bump(t, at(7, 8));
    const y = FORM.send, h = 72;
    ctx.save(); ctx.globalAlpha = bs; ctx.translate(fx + fw / 2 + (1 - bs) * 60, y + h / 2); ctx.scale(1 - 0.05 * press, 1 - 0.05 * press); ctx.translate(-fx - fw / 2, -y - h / 2);
    ctx.shadowColor = rgba(VIOLET, 0.3 + 0.5 * hov); ctx.shadowBlur = 18 + 30 * hov;
    gradPill(ctx, fx, y, fw, h, hov); ctx.shadowBlur = 0;
    text(ctx, TX.send, fx + fw / 2 - 12, y + 43, { w: 500, size: 19, align: 'center' });
    setFont(ctx, 500, 19, UI);
    arrowNE(ctx, fx + fw / 2 - 12 + ctx.measureText(TX.send).width / 2 + 22, y + h / 2 - 1, 6, WHITE, 2);
    if (t >= at(7, 8)) {
      const q = prog(t, at(7, 8), at(7, 14));
      ctx.save(); rrect(ctx, fx, y, fw, h, h / 2); ctx.clip();
      ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - q)})`; ctx.beginPath(); ctx.arc(fx + 240, y + 36, 360 * EASE.expo(q), 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

function page(ctx, t, sc) {
  if (sc < 810) hero(ctx, t);
  if (sc + 810 > 810 && sc < 1660) games(ctx, t);
  if (sc + 810 > 1600) contact(ctx, t);
}

// ───────────── screen space
function backdrop(ctx, t, W, H) {
  ctx.fillStyle = '#08061a'; ctx.fillRect(0, 0, W, H);
  radialBlob(ctx, 260 + 60 * Math.sin(t * 0.4), 180, 900, BTN_L, 0.32);
  radialBlob(ctx, 1700, 920 + 40 * Math.cos(t * 0.5), 820, VIOLET, 0.18);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = 24; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
}
function browser(ctx, t, cam, sc) {
  ctx.save();
  ctx.translate(cam.s[0], cam.s[1]); ctx.scale(cam.z, cam.z); ctx.translate(-cam.f[0], -cam.f[1]);
  const r = 18 * (1 - prog(cam.z, 1, 1.25)), { x, y, w } = WIN, h = WIN.bar + WIN.h;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#120d1f'; rrect(ctx, x, y, w, h, r); ctx.fill(); ctx.restore();
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 24 + i * 22, y + 20, 6.5, 0, TAU); ctx.fill(); });
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; rrect(ctx, x + w / 2 - 170, y + 8, 340, 24, 12); ctx.fill();
  text(ctx, TX.tab, x + w / 2, y + 25, { w: 500, size: 14, align: 'center', alpha: 0.6 });
  ctx.save();
  ctx.beginPath(); ctx.roundRect(CX, CY, WIN.w, WIN.h, [0, 0, r, r]); ctx.clip();
  ctx.translate(CX, CY); ctx.scale(K, K); ctx.translate(0, -sc);
  page(ctx, t, sc);
  ctx.restore();
  ctx.restore();
}
function systemPanel(ctx, t) {
  if (t < at(5, 2) || t > at(6)) return;
  const q = prog(t, at(5, 12), at(5, 15));
  ctx.save(); ctx.globalAlpha = 1 - q; ctx.translate(E.inBack(q) * 700, 0);
  const X = 1150, S = TX.system;
  rise(ctx, S.title, X, 300, t, at(5, 2), { w: 600, size: 18, fam: UI, ls: 6, color: LILAC, stagger: 0 });
  text(ctx, S.color, X, 352, { w: 600, size: 15, ls: 4, alpha: 0.5 * prog(t, at(5, 3), at(5, 4)) });
  SWATCHES.forEach(([c, hx], i) => {
    const s = Math.max(0, spring(t - at(5, 3) - i * at(0, 0.5), 15, 7));
    if (s <= 0) return;
    const x = X + i * 104;
    ctx.save(); ctx.translate(x + 44, 416); ctx.scale(s, s);
    ctx.fillStyle = rgba(c); rrect(ctx, -44, -44, 88, 88, 20); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    text(ctx, hx, x + 44, 492, { w: 500, size: 15, align: 'center', alpha: 0.75 * clamp(s) });
  });
  text(ctx, S.type, X, 548, { w: 600, size: 15, ls: 4, alpha: 0.5 * prog(t, at(5, 6), at(5, 7)) });
  rise(ctx, 'Aa', X, 652, t, at(5, 6), { w: 900, size: 96, stagger: 0 });
  rise(ctx, 'Aa', X + 320, 652, t, at(5, 7), { w: 500, size: 96, fam: UI, stagger: 0 });
  text(ctx, S.display, X, 690, { w: 500, size: 17, alpha: 0.6 * prog(t, at(5, 6), at(5, 8)) });
  text(ctx, S.body, X + 320, 690, { w: 500, size: 17, alpha: 0.6 * prog(t, at(5, 7), at(5, 9)) });
  text(ctx, S.comps, X, 748, { w: 600, size: 15, ls: 4, alpha: 0.5 * prog(t, at(5, 8), at(5, 9)) });
  const b = Math.max(0, spring(t - at(5, 8), 14, 7)), f = Math.max(0, spring(t - at(5, 9), 14, 7));
  if (b > 0) {
    ctx.save(); ctx.translate(X + 150, 800); ctx.scale(b, b); ctx.translate(-X - 150, -800);
    gradPill(ctx, X, 769, 300, 62); text(ctx, TX.heroBtn, X + 34, 807, { w: 500, size: 19 }); arrowNE(ctx, X + 262, 800, 6, WHITE, 2);
    ctx.restore();
  }
  if (f > 0) {
    ctx.save(); ctx.translate(X + 470, 800); ctx.scale(f, f); ctx.translate(-X - 470, -800);
    ctx.fillStyle = rgba(FIELD, 0.85); rrect(ctx, X + 320, 769, 300, 62, 14); ctx.fill();
    ctx.strokeStyle = rgba(VIOLET, 0.9); ctx.lineWidth = 2; ctx.stroke();
    text(ctx, TX.fields[0], X + 342, 806, { w: 400, size: 17, alpha: 0.5 });
    ctx.restore();
  }
  ctx.restore();
}
function cloudPass(ctx, t) {
  const t0 = at(5, 13);
  [['cloud-a', 380, 1300, 0], ['cloud-b', 1450, 1250, 0.05], ['cloud-strip', 960, 1900, 0.1], ['cloud-b', 220, 1000, 0.16], ['cloud-a', 1650, 950, 0.2]].forEach(([n, x, w, d]) => {
    const p = prog(t, t0 + d, t0 + d + 0.8);
    if (p <= 0 || p >= 1) return;
    const im = IMG[n], h = w * im.height / im.width;
    img(ctx, im, x - w / 2, lerp(1080 + h * 0.1, -h * 1.1, E.inOutCubic(p)), w, h);
  });
}
function hudBar(ctx, t, api) {
  const a = prog(t, at(2), at(2, 4)) * (1 - prog(t, at(7, 8), at(7, 12)));
  if (a <= 0) return;
  const ft = api.frameT ?? t, lvl = t < at(3, 4) ? 0 : t < at(6, 4) ? 1 : 2;
  const since = t - [at(2), at(3, 4), at(6, 4)][lvl];
  ctx.save(); ctx.globalAlpha = a;
  // a dark band keeps the HUD legible when the camera pushes the page under it
  const band = ctx.createLinearGradient(0, 930, 0, 1080);
  band.addColorStop(0, 'rgba(8,6,26,0)'); band.addColorStop(0.55, 'rgba(8,6,26,0.82)'); band.addColorStop(1, 'rgba(8,6,26,0.92)');
  ctx.fillStyle = band; ctx.fillRect(0, 930, 1920, 150);
  ctx.fillStyle = rgba(VIOLET, 0.18); ctx.strokeStyle = rgba(VIOLET, 0.9); ctx.lineWidth = 2;
  const pop = 1 + 0.25 * Math.exp(-since * 8) * Math.sin(since * 30);
  ctx.save(); ctx.translate(219, 1003); ctx.scale(pop, pop);
  rrect(ctx, -27, -21, 54, 42, 11); ctx.fill(); ctx.stroke();
  text(ctx, `0${lvl + 1}`, 0, 9, { w: 800, size: 24, fam: DISP, align: 'center' });
  ctx.restore();
  text(ctx, TX.level, 264, 994, { w: 600, size: 14, ls: 4, alpha: 0.55 });
  rise(ctx, TX.levels[lvl], 264, 1026, t, [at(2), at(3, 4), at(6, 4)][lvl], { w: 800, size: 26, fam: DISP, ls: 2, stagger: 0.03, dur: 0.5 });
  // progress: one segment per level
  const pr = prog(t, at(2), at(3)) + prog(t, at(3, 4), at(5, 14)) + prog(t, at(6, 4), at(7, 8));
  const bx = 760, bw = 400, sw = (bw - 20) / 3;
  for (let i = 0; i < 3; i++) {
    const x = bx + i * (sw + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; rrect(ctx, x, 1000, sw, 8, 4); ctx.fill();
    const f = clamp(pr - i);
    if (f > 0) { ctx.fillStyle = rgba(mix(BTN_L, VIOLET, f)); rrect(ctx, x, 1000, sw * f, 8, 4); ctx.fill(); }
  }
  // score: +100 per card, +500 for the message (sharp: frameT)
  const events = [...Array(8).keys()].map(i => [cardT0(i), 100]).concat([[at(7, 8), 500]]);
  const score = Math.round(events.reduce((s, [t0, v]) => s + v * clamp((ft - t0) / 0.25), 0));
  text(ctx, TX.score, 1728, 994, { w: 600, size: 14, ls: 4, alpha: 0.55, align: 'right' });
  text(ctx, String(score).padStart(6, '0'), 1728, 1026, { w: 800, size: 26, fam: DISP, ls: 2, align: 'right' });
  ctx.restore();
}
function cursor(ctx, t) {
  let c = null;
  if (t >= at(0, 8) && t < at(1)) {
    const p = EASE.expo(prog(t, at(0, 8), at(0, 13)));
    c = [lerp(1760, 1095, p), lerp(1160, 772, p), bump(t, at(0, 14)), 1];
  } else if (t >= at(2, 4) && t < at(3, 4)) {
    const [bx, by] = toScreen(330, 742, at(2, 10)), p = EASE.expo(prog(t, at(2, 4), at(2, 10)));
    c = [lerp(1700, bx, p), lerp(1080, by, p), bump(t, at(2, 14)), 1 - prog(t, at(3), at(3, 3))];
  } else if (t >= at(4, 6) && t < at(5, 2)) {
    const [bx, by] = toScreen(GRID.x + 2 * (GRID.w + GRID.gx) + 190, GRID.y + 150, at(4, 12)), p = EASE.expo(prog(t, at(4, 6), at(4, 12)));
    c = [lerp(1760, bx, p), lerp(1080, by, p), 0, 1 - prog(t, at(4, 15), at(5, 1))];
  } else if (t >= at(6, 2) && t < at(7, 14)) {
    const [nx, ny] = toScreen(FORM.x + 70, FORM.name + 30, t), [sx, sy] = toScreen(FORM.x + 250, FORM.send + 40, t);
    const p1 = EASE.expo(prog(t, at(6, 2), at(6, 7))), p2 = EASE.expo(prog(t, at(7, 3), at(7, 7)));
    c = [lerp(lerp(1780, nx, p1), sx, p2), lerp(lerp(1080, ny, p1), sy, p2), bump(t, at(6, 7)) + bump(t, at(7, 8)), 1 - prog(t, at(7, 10), at(7, 13))];
  }
  if (!c || c[3] <= 0) return;
  ctx.save(); ctx.globalAlpha = c[3]; pointer(ctx, c[0], c[1], 1.15, c[2]); ctx.restore();
}
function bubbleLaunch(ctx, t) {
  const p = prog(t, at(7, 8), at(7, 15));
  if (p <= 0 || p >= 1) return;
  const [x0, y0] = toScreen(FORM.x + FORM.w / 2, FORM.send, at(7, 8)), e = E.inCubic(p);
  ctx.save(); ctx.globalAlpha = 1 - prog(p, 0.75, 1);
  speechBubble(ctx, lerp(x0, 1780, e), lerp(y0 - 40, -120, e) - Math.sin(Math.PI * p) * 80, 120 * (0.4 + 0.6 * EASE.expo(prog(p, 0, 0.3))) * (1 + 0.6 * e), Math.sin(p * 9) * 0.15);
  ctx.restore();
}
function footerOverlay(ctx, t) {
  if (t < at(8)) return;
  const up = EASE.expo(prog(t, at(9), at(9, 6)));
  // logo: lands on the drop, then rises to make room for the credits
  const ls = EASE.expo(prog(t, at(8), at(8, 6))), lw = lerp(900, 660, up), lh = lw * IMG.logo.height / IMG.logo.width;
  const ly = lerp(470, 250, up), k = lerp(1.35, 1, ls);
  radialBlob(ctx, 960, ly, 760, CARD_C, 0.5 * clamp((t - at(8)) / 0.3));
  ctx.save(); ctx.globalAlpha = clamp((t - at(8)) / 0.12); ctx.translate(960, ly); ctx.scale(k, k);
  ctx.shadowColor = rgba(VIOLET, 0.6); ctx.shadowBlur = 40;
  img(ctx, IMG.logo, -lw / 2, -lh / 2, lw, lh); ctx.restore();
  // LEVEL COMPLETE + three stars (bar 8), out on the inBack before the credits
  const out = prog(t, at(8, 14), at(9));
  if (out < 1) {
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, E.inBack(out) * -60);
    const s = Math.max(0, spring(t - at(8, 2), 13, 7));
    if (s > 0) {
      setFont(ctx, 800, 34, DISP, 8); const tw = ctx.measureText(TX.complete).width + 90;
      ctx.save(); ctx.translate(960, 632); ctx.scale(s, s);
      ctx.shadowColor = rgba(VIOLET, 0.7); ctx.shadowBlur = 40; gradPill(ctx, -tw / 2, -38, tw, 76); ctx.shadowBlur = 0;
      text(ctx, TX.complete, 4, 12, { w: 800, size: 34, fam: DISP, ls: 8, align: 'center' });
      ctx.restore();
    }
    for (let i = 0; i < 3; i++) {
      const ss = Math.max(0, spring(t - at(8, 4 + 2 * i), 16, 6));
      if (ss <= 0) continue;
      const x = 960 + (i - 1) * 86, y = 742 + (i === 1 ? -14 : 0);
      ctx.save(); ctx.shadowColor = rgba(GOLD, 0.8); ctx.shadowBlur = 30;
      const g = ctx.createLinearGradient(x, y - 30, x, y + 30); g.addColorStop(0, '#fff3c4'); g.addColorStop(1, rgba(GOLD));
      ctx.fillStyle = g; star(ctx, x, y, 34 * ss, (1 - ss) * 1.5); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  // credits (bars 9–11): held ~4.5 s for 14 words
  if (t < at(9)) return;
  const ps = Math.max(0, spring(t - at(9), 11, 7));
  ctx.save(); ctx.globalAlpha = clamp((t - at(9)) / 0.15); ctx.translate(960, 640); ctx.scale(0.9 + 0.1 * ps, 0.9 + 0.1 * ps); ctx.translate(-960, -640);
  ctx.shadowColor = 'rgba(10,6,30,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  glassCard(ctx, 460, 360, 1000, 540, 36, 0.9); ctx.restore();
  rise(ctx, TX.role, 960, 440, t, at(9, 2), { w: 600, size: 22, fam: UI, ls: 6, color: LILAC, stagger: 0, align: 'center' });
  rise(ctx, TX.by, 960, 528, t, at(9, 4), { w: 500, size: 26, fam: UI, alpha: 0.7, stagger: 0, align: 'center' });
  rise(ctx, TX.designer, 960, 612, t, at(9, 5), { w: 800, size: 76, ls: -0.5, stagger: 0.03, align: 'center' });
  const dl = EASE.expo(prog(t, at(9, 7), at(9, 11)));
  ctx.fillStyle = rgba(VIOLET, 0.5); ctx.fillRect(960 - 200 * dl, 664, 400 * dl, 2);
  TX.links.forEach(([label, handle], i) => {
    const t0 = at(9, 8) + i * at(0, 2), y = 740 + i * 52;
    rise(ctx, label, 935, y, t, t0, { w: 600, size: 24, fam: UI, color: LILAC, stagger: 0, align: 'right' });
    rise(ctx, handle, 965, y, t, t0 + at(0, 0.5), { w: 600, size: 28, fam: UI, stagger: 0 });
  });
}

export default {
  async setup(api) {
    at = api.at;
    TX = COPY[api.lang] ?? COPY.en;
    const names = ['robot-hero', 'robot-laptop', 'logo', 'logo-stack', 'sky', 'cloud-a', 'cloud-b', 'cloud-strip', 'rock-ledge', 'rock-island', 'rock-a', 'rock-b', ...ICONS];
    await Promise.all(names.map(async n => {
      const im = new Image();
      im.src = new URL(`./assets/${n}.png`, import.meta.url).href;
      await im.decode();
      IMG[n] = im;
    }));
  },
  draw(ctx, t, api) {
    const { W, H } = api;
    if (t < at(1)) {
      hook(ctx, t, W, H);
    } else {
      const [dx, dy] = shake(t, [[at(1), 7], [at(7, 8), 3], [at(8), 10]]);
      ctx.save(); ctx.translate(dx, dy);
      backdrop(ctx, t, W, H);
      browser(ctx, t, camera(t), scrollAt(t));
      systemPanel(ctx, t);
      cloudPass(ctx, t);
      footerOverlay(ctx, t);
      bubbleLaunch(ctx, t);
      ctx.restore();
      hudBar(ctx, t, api);
      cursor(ctx, t);
      flash(ctx, W, H, t, at(1), 0.4, 0.1, [214, 190, 255]);
      flash(ctx, W, H, t, at(8), 0.45, 0.14, [255, 236, 214]);
    }
    if (t < at(1)) cursor(ctx, t);
    vignette(ctx, W, H, 0.28);
    // fade to the hook's black so the loop is seamless
    const end = prog(t, at(11, 10), at(12));
    if (end > 0) { ctx.fillStyle = rgba(INK, E.inOutCubic(end)); ctx.fillRect(0, 0, W, H); }
  },
};
