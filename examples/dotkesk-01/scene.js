// examples/dotkesk-01 "2 A.M.": dotkesk daily #1, ~23 s Reels / Shorts (1080x1920), English narrator, word-by-word captions.
//   2:07 lock screen → three DMs nobody answers → the clock runs to morning and the messages break into dots and drift off →
//   the clock rewinds, the dots fly back and orbit a sphere that lights up: the dotkesk logo → the agent answers in the chat
//   (stock, sizes, checkout link) → order placed → end card (the order's dots become the logo; Follow @dotkesk; book a free demo).
// The thread is the logo's own dashes: lost customers are dots leaving orbit, dotkesk is them coming back.
// Scene and word times come from schedule.js (voice.py). Copy lives in COPY. Names, the product and the questions are placeholders.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, hash, rrect, pill, pointer, check, vignette } from '../../engine/core.js';
import { flash, shockRing } from '../../engine/fx.js';
import { C, T, rise, card, bg, heroGlass, camera, themeFrom, drawLogo, captions, bubble, typingDots, endCard } from '../dotkesk/kit.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  en: {
    store: 'Your store', closed: 'Closed', unanswered: n => `${n} unanswered`, now: 'now',
    notes: [
      { app: 'Instagram', dot: [225, 48, 108], name: 'Maya', msg: 'Do you have this in pink?' },
      { app: 'WhatsApp', dot: [37, 211, 102], name: 'Leo', msg: 'Do you ship tonight?' },
      { app: 'Web chat', dot: [148, 163, 184], name: 'Ana', msg: 'Is the linen shirt back?' },
    ],
    agent: 'AI agent · online',
    q1: 'Do you have this in pink?', a1: 'Yes! Pink is in stock in S, M and L. Want the link?',
    product: 'Linen Shirt', colour: 'Pink', sizes: ['S', 'M', 'L'], stock: 'In stock',
    q2: 'M please!', a2: "Added to your cart. Here's your secure checkout link.", checkout: 'Checkout',
    placed: 'Order placed', placedSub: 'Linen Shirt · Pink · M',
  },
};
let TX = COPY.en;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const wt = (key, i) => S[key].words[Math.min(i, S[key].words.length - 1)][1];
const PINK = [244, 114, 182];                                    // the product's colour (not a brand colour)
const LOGO = [540, 820, 600];                                    // where the logo forms at the turn: x, y, width

// ───────────── the clock: 2:07, runs to 8:14 ("by morning"), rewinds to 2:07 for the turn
function minutes(t) {
  if (t < S.lost.scene) return 127;
  if (t < S.turn.scene) return lerp(127, 494, EASE.snap(prog(t, S.lost.scene + 0.15, S.lost.end - 0.3)));
  return lerp(494, 127, EASE.expo(prog(t, S.turn.scene, S.turn.scene + 0.55)));
}
const clockStr = m => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
function clock(ctx, t, tFrame) {
  const out = E.inCubic(prog(t, wt('turn', 1) - 0.25, wt('turn', 1) + 0.1));
  if (out >= 1) return;
  const inn = E.outExpo(prog(t, -0.2, 0.35));
  const y = 470 - out * 120, a = inn * (1 - out);
  T(ctx, clockStr(minutes(tFrame)), 540, y, { w: 300, size: 240, a: 'center', ls: -6, fill: C.ink, alpha: a });
  // the store's status under the clock: closed, and the unanswered count as the DMs pile up
  const n = TX.notes.filter((_, i) => t >= noteAt(i)).length;
  const label = n && t < S.turn.scene ? `${TX.store} · ${TX.closed} · ${TX.unanswered(n)}` : `${TX.store} · ${TX.closed}`;
  ctx.save(); ctx.globalAlpha = a;
  T(ctx, '', 0, 0, { size: 32, w: 600 }); const tw = ctx.measureText(label).width, w = tw + 84, cy = y + 80;
  pill(ctx, 540, cy, w, 60); ctx.fillStyle = rgba(C.light ? C.card : C.b1); ctx.fill();
  ctx.fillStyle = rgba(C.t3); ctx.beginPath(); ctx.arc(540 - w / 2 + 34, cy, 8, 0, TAU); ctx.fill();
  T(ctx, label, 540 - w / 2 + 56, cy + 11, { size: 32, w: 600, fill: C.t2 });
  ctx.restore();
}

// ───────────── the DMs nobody answers (they land while the question is spoken), then break into dots and drift away
const noteAt = i => [wt('ask', 3) - 0.05, wt('ask', 6) - 0.05, wt('ask', 9) - 0.05][i];
const NOTE = { x: 90, w: 900, h: 168, y0: 690, gap: 186 };
function notes(ctx, t) {
  const gone = E.inCubic(prog(t, S.lost.scene + 0.15, S.lost.scene + 0.55));
  if (gone >= 1) return;
  TX.notes.forEach((n, i) => {
    const d = t - noteAt(i); if (d < 0) return;
    const p = spring(d, 15, 8), y = NOTE.y0 + i * NOTE.gap - (1 - p) * 70;
    ctx.save(); ctx.globalAlpha = clamp(d * 6) * (1 - gone);
    ctx.translate(540, y + NOTE.h / 2); const k = 1 - 0.04 * gone; ctx.scale(k, k); ctx.translate(-540, -(y + NOTE.h / 2));
    card(ctx, NOTE.x, y, NOTE.w, NOTE.h, 40);
    ctx.fillStyle = rgba(n.dot); ctx.beginPath(); ctx.arc(NOTE.x + 46, y + 50, 10, 0, TAU); ctx.fill();
    T(ctx, `${n.app} · ${TX.now}`, NOTE.x + 70, y + 61, { size: 30, w: 600, fill: C.t2 });
    const nw = T(ctx, `${n.name}:`, NOTE.x + 40, y + 124, { size: 40, w: 700, fill: C.ink });
    T(ctx, n.msg, NOTE.x + 40 + nw + 14, y + 124, { size: 40, w: 500, fill: C.t1 });
    ctx.restore();
  });
}
// 9 dashes per card: they appear where the card was, then leave the frame (each its own way, mostly out and up)
const LOST = Array.from({ length: 27 }, (_, k) => {
  const i = Math.floor(k / 9), j = k % 9;
  const x = NOTE.x + 70 + (j % 5) * 190 + (j >= 5 ? 95 : 0), y = NOTE.y0 + i * NOTE.gap + (j >= 5 ? 118 : 52);
  const a = Math.atan2(y - 960, x - 540) + (hash(k * 1.7) - 0.5) * 1.2 - 0.35;
  return { x, y, a, dist: 900 + hash(k * 4.3) * 700, ang0: hash(k * 9.1) * TAU, spin: (hash(k * 2.9) - 0.5) * 6 };
});
function lostAt(k, t) {
  const L = LOST[k], m = EASE.snap(prog(t, S.lost.scene + 0.2 + hash(k) * 0.35, S.lost.end - 0.1));
  return { x: L.x + Math.cos(L.a) * L.dist * m, y: L.y + Math.sin(L.a) * L.dist * m, ang: L.ang0 + L.spin * m, m };
}
function lostDots(ctx, t) {
  if (t < S.lost.scene + 0.15 || t >= S.turn.scene) return;
  const a = E.outExpo(prog(t, S.lost.scene + 0.15, S.lost.scene + 0.45));
  for (let k = 0; k < LOST.length; k++) {
    const d = lostAt(k, t), s = 1 - 0.4 * d.m;
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.ang); ctx.scale(26 * s, 11 * s);
    ctx.fillStyle = rgba(mix(C.light ? C.t2 : C.white, C.t4, d.m), a * (1 - 0.7 * d.m)); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
}

// ───────────── the turn: the lost dots fly back, orbit, and the sphere lights up on "dotkesk"
function turnLogo(ctx, t) {
  const t0 = S.turn.scene, name = wt('turn', 1);
  if (t < t0 || t >= S.proof.scene + 0.7) return;
  const from = LOST.map((_, k) => lostAt(k, S.turn.scene - 1e-3));
  const move = EASE.expo(prog(t, S.proof.scene, S.proof.scene + 0.6));         // then it shrinks into the chat header avatar
  const [x, y, w] = [lerp(LOGO[0], CHAT.x + 92, move), lerp(LOGO[1], CHAT.y + 92, move), lerp(LOGO[2], 92, move)];
  drawLogo(ctx, x, y, w, {
    from, gather: EASE.expo(prog(t, t0, name + 0.05)), spin: -2.4 * (1 - EASE.expo(prog(t, t0, name + 0.9))) + (t - t0) * 0.15,
    grow: spring(t - t0 - 0.05, 12, 7), lit: EASE.expo(prog(t, name - 0.05, name + 0.3)), seed: 3, disc: spring(t - t0, 11, 7) * (1 - move * 0.05),
  });
}

// ───────────── the chat: the agent answers on the words of the line (checks · stock · sizes · drops · checkout link)
const CHAT = { x: 60, y: 330, w: 960, h: 960 };
const TAP = () => S.proof.end - 0.5;
function chat(ctx, t, tFrame) {
  const P0 = S.proof.scene, P1 = S.proof.end, w = i => wt('proof', i);
  const inn = EASE.expo(prog(t, P0 + 0.1, P0 + 0.6)), out = E.inCubic(prog(t, P1 - 0.1, P1 + 0.25));
  if (inn <= 0 || out >= 1) return;
  const { x, y, w: cw, h } = CHAT, k = (0.94 + 0.06 * inn) * (1 - 0.06 * out);
  ctx.save(); ctx.globalAlpha = inn * (1 - out);
  ctx.translate(540, y + h / 2); ctx.scale(k, k); ctx.translate(-540, -(y + h / 2));
  card(ctx, x, y, cw, h, 48);
  // header (the logo itself lands in the avatar disc, see turnLogo)
  ctx.fillStyle = rgba(C.disc); ctx.beginPath(); ctx.arc(x + 92, y + 92, 56, 0, TAU); ctx.fill();
  if (t >= S.proof.scene + 0.7) drawLogo(ctx, x + 92, y + 92, 84, { spin: (t - S.turn.scene) * 0.15, badge: false });
  T(ctx, TX.store, x + 172, y + 84, { size: 42, w: 700, fill: C.ink });
  ctx.fillStyle = rgba(C.chipInk); ctx.beginPath(); ctx.arc(x + 182, y + 120, 8, 0, TAU); ctx.fill();
  T(ctx, TX.agent, x + 200, y + 131, { size: 32, w: 500, fill: C.chipInk });
  ctx.fillStyle = rgba(C.b1); ctx.fillRect(x, y + 184, cw, 2);
  // messages: each slot grows in when it arrives; the list scrolls once it reaches the bottom
  const X0 = x + 40, X1 = x + cw - 40, top = y + 220, bottom = y + h - 40;
  const items = [
    { at: P0 + 0.25, side: 'in', text: TX.q1 },
    { ty: P0 + 0.55, at: w(1), side: 'out', text: TX.a1 },
    { at: w(3) - 0.05, kind: 'product', hgt: 236 },
    { at: w(6) + 0.15, side: 'in', text: TX.q2 },
    { ty: w(6) + 0.45, at: w(8), side: 'out', text: TX.a2 },
    { at: w(10) - 0.05, kind: 'checkout', hgt: 96 },
  ];
  let total = 0;
  const slots = items.map(it => {
    const full = it.hgt ?? bubble(ctx, X0, X1, 0, it.text, { measure: true });
    const hh = it.ty !== undefined && t < it.at ? 72 * EASE.expo(prog(t, it.ty, it.ty + 0.25)) : lerp(it.ty !== undefined ? 72 : 0, full, EASE.expo(prog(t, it.at, it.at + 0.35)));
    const slot = { it, y: total, hh }; total += hh + (hh > 0 ? 24 : 0); return slot;
  });
  const scroll = Math.max(0, top + total - bottom);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y + 186, cw, h - 188); ctx.clip();
  for (const { it, y: sy, hh } of slots) {
    if (hh <= 0.5) continue;
    const yy = top + sy - scroll;
    if (it.ty !== undefined && t < it.at) { typingDots(ctx, X1, yy, tFrame, clamp((t - it.ty) * 5)); continue; }
    const p = prog(t, it.at, it.at + 0.6);
    if (it.kind === 'product') product(ctx, X1, yy, t, p, w(6), items[3].at);
    else if (it.kind === 'checkout') checkout(ctx, X1, yy, t, p);
    else bubble(ctx, X0, X1, yy, it.text, { side: it.side, p });
  }
  ctx.restore();
  ctx.restore();
}
function product(ctx, x1, y, t, p, tSizes, tPick) {
  const w = 640, h = 236, x = x1 - w, s = 0.7 + 0.3 * spring(p * 0.6, 15, 7);
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(x1, y + h); ctx.scale(s, s); ctx.translate(-x1, -(y + h));
  card(ctx, x, y, w, h, 32, { fill: C.panel, shadow: false });
  // thumbnail: a simple shirt on the product colour
  rrect(ctx, x + 22, y + 22, 192, 192, 24); ctx.fillStyle = rgba(mix(PINK, C.white, 0.55)); ctx.fill();
  ctx.save(); ctx.translate(x + 118, y + 122); ctx.fillStyle = rgba(PINK); ctx.beginPath();
  ctx.moveTo(-26, -62); ctx.lineTo(-74, -38); ctx.lineTo(-60, -6); ctx.lineTo(-42, -14); ctx.lineTo(-42, 66); ctx.lineTo(42, 66); ctx.lineTo(42, -14);
  ctx.lineTo(60, -6); ctx.lineTo(74, -38); ctx.lineTo(26, -62); ctx.quadraticCurveTo(0, -40, -26, -62); ctx.closePath(); ctx.fill(); ctx.restore();
  T(ctx, TX.product, x + 240, y + 66, { size: 38, w: 700, fill: C.ink });
  T(ctx, TX.colour, x + 240, y + 110, { size: 32, w: 500, fill: C.t2 });
  // sizes light up on "sizes"; M is picked when the customer asks for it
  TX.sizes.forEach((sz, i) => {
    const on = E.outExpo(prog(t, tSizes - 0.05 + i * 0.08, tSizes + 0.25 + i * 0.08)), cx = x + 240 + 34 + i * 82, cy = y + 170;
    rrect(ctx, cx - 34, cy - 30, 68, 60, 16); ctx.fillStyle = rgba(mix(C.b2, C.chipBg, on)); ctx.fill();
    if (sz === 'M' && t >= tPick) { ctx.strokeStyle = rgba(C.chipInk); ctx.lineWidth = 4; ctx.stroke(); }
    T(ctx, sz, cx, cy + 12, { size: 32, w: 700, a: 'center', fill: mix(C.t2, C.chipInk, on) });
  });
  // the stock check, on "stock"
  const sw = 190, sx = x + w - 22 - sw, sy = y + 170;
  pill(ctx, sx + sw / 2, sy, sw, 56); ctx.fillStyle = rgba(C.chipBg); ctx.fill();
  check(ctx, sx + 32, sy, 10, C.chipInk, 4.5);
  T(ctx, TX.stock, sx + 56, sy + 11, { size: 30, w: 600, fill: C.chipInk });
  ctx.restore();
}
function checkout(ctx, x1, y, t, p) {
  const w = 330, h = 96, cx = x1 - w / 2, cy = y + h / 2, press = Math.exp(-Math.pow((t - TAP()) / 0.07, 2)), done = prog(t, TAP(), TAP() + 0.1);
  const s = (0.7 + 0.3 * spring(p * 0.6, 15, 7)) * (1 - 0.06 * press);
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(cx, cy); ctx.scale(s, s);
  pill(ctx, 0, 0, w, h); ctx.fillStyle = rgba(mix(C.green, [21, 128, 61], done)); ctx.fill();
  T(ctx, TX.checkout, -30, 14, { size: 38, w: 700, a: 'center', fill: C.white });
  ctx.save(); ctx.translate(98, 0); ctx.strokeStyle = rgba(C.white); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.moveTo(2, -12); ctx.lineTo(14, 0); ctx.lineTo(2, 12); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function chatPointer(ctx, t) {
  const tp = TAP(), a = prog(t, tp - 0.75, tp - 0.15);
  if (a <= 0 || t > S.proof.end + 0.1) return;
  const bx = CHAT.x + CHAT.w - 40 - 165, by = 1150;                   // where the checkout button sits once the list has scrolled
  const px = lerp(1010, bx + 20, EASE.expo(a)), py = lerp(1720, by + 10, EASE.expo(a));
  ctx.save(); ctx.globalAlpha = clamp(a * 4) * (1 - prog(t, S.proof.end - 0.1, S.proof.end + 0.1));
  pointer(ctx, px, py, 1.9, Math.exp(-Math.pow((t - tp) / 0.07, 2))); ctx.restore();
}

// ───────────── order placed: a green check, its ring of dots (which become the logo on the end card)
const BURST = 18;
function burstAt(k, t) {
  const t0 = S.sale.scene, a = k / BURST * TAU + (t - t0) * 0.35, r = 175 + 170 * EASE.expo(prog(t, t0 + 0.12, t0 + 1.1));
  return { x: 540 + Math.cos(a) * r, y: 760 + Math.sin(a) * r * 0.86, ang: a + Math.PI / 2 };
}
function sale(ctx, t) {
  const t0 = S.sale.scene, t1 = S.end.scene, out = E.inCubic(prog(t, t1 - 0.05, t1 + 0.3));
  if (t < t0 || out >= 1) return;
  const d = t - t0, sp = spring(d - 0.02, 13, 7);
  ctx.save(); ctx.globalAlpha = 1 - out;
  T(ctx, clockStr(128), 540, 300, { w: 300, size: 96, a: 'center', ls: -3, fill: C.t3, alpha: E.outExpo(prog(d, 0.3, 0.8)) });
  const ba = E.outExpo(prog(d, 0.1, 0.4));
  for (let k = 0; k < BURST; k++) {
    const b = burstAt(k, t);
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang); ctx.scale(24, 10); ctx.fillStyle = rgba(k % 2 ? (C.light ? C.limeBot : C.limeTop) : (C.light ? C.ink : C.white), ba); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.shadowColor = rgba(C.green, C.light ? 0.35 : 0.6); ctx.shadowBlur = 60;
  ctx.fillStyle = rgba(C.green); ctx.beginPath(); ctx.arc(540, 760, 140 * sp, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  const cp = EASE.expo(prog(d, 0.18, 0.6));
  if (cp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(540 - 80, 600, 160 * cp, 320); ctx.clip(); check(ctx, 540, 765, 62, C.white, 20); ctx.restore(); }
  rise(ctx, TX.placed, 540, 1150, 84, EASE.expo(prog(d, 0.25, 0.85)), { w: 700, a: 'center', ls: -2, fill: C.ink });
  T(ctx, TX.placedSub, 540, 1215, { size: 38, w: 500, a: 'center', fill: C.t2, alpha: E.outExpo(prog(d, 0.5, 1.0)) });
  ctx.restore();
}

// where the hero glass's green flow sits (the site's follows the cursor; here it follows the action)
function focusAt(t) {
  const keys = [
    [S.turn.scene, LOGO[0], LOGO[1]], [S.proof.scene + 0.3, 330, 520], [wt('proof', 1), 720, 700], [wt('proof', 6), 300, 950],
    [wt('proof', 8), 720, 1050], [TAP(), 820, 1150], [S.sale.scene + 0.2, 540, 760], [S.end.scene + 0.4, 540, 630],
    [S.end.scene + 1.9, 700, 1262], [S.end.scene + 2.6, 540, 1420],
  ];
  let i = keys.findIndex(k => k[0] > t); if (i === 0) return keys[0].slice(1); if (i < 0) return keys[keys.length - 1].slice(1);
  const [a, b] = [keys[i - 1], keys[i]], e = EASE.css(prog(t, a[0], a[0] + Math.min(0.9, b[0] - a[0])));
  return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
}

export default {
  async setup(api) { TX = COPY[api.lang] || COPY.en; await themeFrom(import.meta.url); },

  draw(ctx, t, api) {
    const { W, H } = api, tFrame = api.frameT ?? t, lit = E.outExpo(prog(t, wt('turn', 1) - 0.05, wt('turn', 1) + 0.6));
    if (C.light) heroGlass(ctx, W, H, t, { focusAt, flow: lit, night: 1 - lit, frame: Math.round(tFrame * api.fps) });
    else bg(ctx, W, H, t, { glow: lit * (t < S.end.scene ? 1 : 0.8), gy: t < S.proof.scene ? LOGO[1] : 760 });
    // a slow push-in through every section keeps the picture moving between the beats (captions stay put)
    ctx.save(); camera(ctx, t, SCHEDULE.map(s => [s.scene, s.end]));
    clock(ctx, t, tFrame);
    notes(ctx, t);
    lostDots(ctx, t);
    turnLogo(ctx, t);
    chat(ctx, t, tFrame);
    chatPointer(ctx, t);
    sale(ctx, t);
    endCard(ctx, t, S.end.scene, { from: Array.from({ length: BURST }, (_, k) => burstAt(k, S.end.scene)) });
    ctx.restore();
    captions(ctx, t, SCHEDULE);
    // the turn lands with a lime flash and a ring from the sphere; the order with a softer one
    flash(ctx, W, H, t, wt('turn', 1), C.light ? 0.5 : 0.35, 0.09, C.light ? C.white : C.limeTop);
    shockRing(ctx, LOGO[0], LOGO[1], t, wt('turn', 1), { color: C.light ? C.limeBot : C.limeTop, life: 0.7, radius: 900, width: 36 });
    shockRing(ctx, 540, 760, t, S.sale.scene + 0.05, { color: C.light ? C.green : [74, 222, 128], life: 0.6, radius: 700, width: 26 });
  },

  post(ctx, t, { W, H }) { vignette(ctx, W, H, C.light ? 0.06 : 0.28); },
};
