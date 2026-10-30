// examples/dotkesk-03 "Connect everything": dotkesk daily #3, Reels / Shorts (1080x1920), English narrator, word-by-word captions.
//   the inbox in one window, the store admin in another, a broken link between them → switching tabs back and forth →
//   both windows fold into dots that orbit into the logo on "dotkesk" → the hub: five chat channels on the left, three store
//   platforms on the right, each wired to the logo as it is named, dots running along the wires → a chat that answers with
//   live stock, Catalog · Stock · Orders lit → end card.
// Third-party apps and platforms appear as text chips with a colour dot, never as logos. Stock numbers are placeholders.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, vignette, pointer } from '../../engine/core.js';
import { C, T, card, themeFrom, drawLogo, tag, chatCard, productArt, turnLogo, track, stage } from '../dotkesk/kit.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  en: {
    inbox: 'Inbox', store: 'Store admin', q: 'Is the blue one in stock?', rows: [['Linen Shirt · Blue', '?'], ['Linen Shirt · Pink', '?'], ['Core Runner', '?']],
    tabs: ['Inbox', 'Store'],
    channels: [['WhatsApp', [37, 211, 102]], ['Instagram', [225, 48, 108]], ['Telegram', [42, 171, 238]], ['Email', [234, 179, 8]], ['Web chat', [148, 163, 184]]],
    stores: [['ikas', [99, 102, 241]], ['Shopify', [149, 191, 71]], ['WooCommerce', [127, 84, 179]]],
    sync: ['Catalog', 'Stock', 'Orders'],
    q2: 'Is the blue one in stock in M?', a2: 'Yes, 12 left in M. Want the link?', product: 'Linen Shirt', colour: 'Blue · M', live: 'Live from your store', left: '12 in stock',
  },
};
let TX = COPY.en;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const wt = (key, i) => S[key].words[Math.min(i, S[key].words.length - 1)][1];
const HUB = [540, 880], HUB_W = 280;
const BLUE = [59, 130, 246];

// ───────────── hook + pain: two windows that never talk; the pain line flips between them on the beat
function windows(ctx, t) {
  const inn = i => EASE.expo(prog(t, -0.6 + i * 0.6, i * 0.6)),          // the inbox is up on frame 0 (the thumbnail)
    out = E.inCubic(prog(t, S.turn.scene - 0.05, S.turn.scene + 0.3));
  if (out >= 1) return;
  // which window is in front: inbox, then on every beat of the pain line they swap
  const flips = Math.max(0, Math.floor((t - S.pain.voice) / 0.5) + 1), front = t < S.pain.voice ? 1 : flips % 2;
  const win = (i, x, y) => {
    const a = inn(i) * (1 - out); if (a <= 0) return;
    const isFront = front === i, k = isFront ? 1 : 0.94;
    ctx.save(); ctx.globalAlpha = a * (isFront || t < S.pain.voice ? 1 : 0.75);
    ctx.translate(x + 300, y + 230); ctx.scale(k, k); ctx.translate(-(x + 300), -(y + 230));
    card(ctx, x, y, 600, 460, 36);
    if (i === 0) {
      T(ctx, TX.inbox, x + 40, y + 66, { size: 38, w: 700, fill: C.ink });
      ctx.fillStyle = rgba(C.b1); ctx.fillRect(x, y + 100, 600, 2);
      ctx.beginPath(); ctx.roundRect(x + 40, y + 140, 430, 84, [28, 28, 28, 8]); ctx.fillStyle = rgba(C.inBg); ctx.fill();
      T(ctx, TX.q, x + 66, y + 194, { size: 32, w: 500, fill: C.inInk });
      // nobody can answer: an empty reply slot with a blinking caret
      ctx.beginPath(); ctx.roundRect(x + 140, y + 260, 420, 84, [28, 28, 8, 28]); ctx.strokeStyle = rgba(C.b1); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      if (Math.sin(t * 7) > 0) { ctx.fillStyle = rgba(C.t3); ctx.fillRect(x + 172, y + 282, 4, 40); }
    } else {
      T(ctx, TX.store, x + 40, y + 66, { size: 38, w: 700, fill: C.ink });
      ctx.fillStyle = rgba(C.b1); ctx.fillRect(x, y + 100, 600, 2);
      TX.rows.forEach(([n, v], r) => { T(ctx, n, x + 40, y + 170 + r * 90, { size: 32, w: 500, fill: C.t1 }); T(ctx, v, x + 540, y + 170 + r * 90, { size: 32, w: 700, a: 'right', fill: C.t3 }); });
    }
    ctx.restore();
  };
  const order = front === 0 ? [1, 0] : [0, 1];
  for (const i of order) win(i, i ? 400 : 80, i ? 800 : 360);
  // the missing link between them
  const la = inn(1) * (1 - out);
  if (la > 0 && t < S.pain.voice + 0.2) {
    ctx.save(); ctx.globalAlpha = la; ctx.strokeStyle = rgba(C.t3); ctx.lineWidth = 6; ctx.setLineDash([16, 14]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(380, 840); ctx.lineTo(500, 760); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(420, 780); ctx.lineTo(460, 820); ctx.moveTo(460, 780); ctx.lineTo(420, 820); ctx.stroke(); ctx.restore();
  }
  // tab bar + a pointer clicking the tabs on the pain line
  const tb = EASE.expo(prog(t, S.pain.scene, S.pain.scene + 0.3)) * (1 - out);
  if (tb > 0) {
    ctx.save(); ctx.globalAlpha = tb; card(ctx, 290, 230, 500, 90, 45);
    TX.tabs.forEach((s, i) => {
      const on = front === i; ctx.beginPath(); ctx.roundRect(300 + i * 240, 240, 240, 70, 35); ctx.fillStyle = rgba(on ? C.ink : C.card); ctx.fill();
      T(ctx, s, 420 + i * 240, 287, { size: 32, w: 700, a: 'center', fill: on ? C.white : C.t2 });
    });
    const px = 420 + front * 240 + 20, press = t > S.pain.voice ? Math.exp(-Math.pow((((t - S.pain.voice) % 0.5) - 0.02) / 0.05, 2)) : 0;
    pointer(ctx, px, 290, 1.7, press); ctx.restore();
  }
}

// ───────────── proof: the hub (channels ← logo → stores), wired as they are named
const CH_Y = i => 560 + i * 150, ST_Y = i => 710 + i * 170;
function wire(ctx, x0, y0, x1, y1, p, t, k) {
  if (p <= 0) return;
  const mx = (x0 + x1) / 2, P = u => { const v = 1 - u; return [v * v * v * x0 + 3 * v * v * u * mx + 3 * v * u * u * mx + u * u * u * x1, v * v * v * y0 + 3 * v * v * u * y0 + 3 * v * u * u * y1 + u * u * u * y1]; };
  ctx.save(); ctx.strokeStyle = rgba(C.green, 0.55); ctx.lineWidth = 4; ctx.beginPath();
  for (let i = 0; i <= 40 * p; i++) { const [x, y] = P(i / 40); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  if (p >= 1) for (let j = 0; j < 3; j++) {                                 // data: orbit dashes running along the wire
    const u = ((t * 0.55 + j / 3 + k * 0.17) % 1), [x, y] = P(u), [x2, y2] = P(Math.min(1, u + 0.01));
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(y2 - y, x2 - x)); ctx.scale(16, 6.5); ctx.fillStyle = rgba(C.green); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function hub(ctx, t) {
  const P0 = S.proof.scene, out = E.inCubic(prog(t, S.proof.end - 0.1, S.proof.end + 0.3)); if (t < P0 || out >= 1) return;
  const w = i => wt('proof', i), chT = [w(0), w(1), w(2), w(3), w(5)], stT = [w(10), w(11), w(13)], linked = w(7);
  ctx.save(); ctx.globalAlpha = 1 - out;
  TX.channels.forEach(([n, dot], i) => {
    const a = E.outExpo(prog(t, chT[i] - 0.1, chT[i] + 0.3)), y = CH_Y(i);
    wire(ctx, 330, y, HUB[0] - 150, HUB[1], EASE.expo(prog(t, chT[i], chT[i] + 0.5)), t, i);
    if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.translate((1 - a) * -40, 0); chipBox(ctx, 60, y, 270, n, dot, t >= linked); ctx.restore(); }
  });
  TX.stores.forEach(([n, dot], i) => {
    const a = E.outExpo(prog(t, stT[i] - 0.1, stT[i] + 0.3)), y = ST_Y(i);
    wire(ctx, 720, y, HUB[0] + 150, HUB[1], EASE.expo(prog(t, stT[i], stT[i] + 0.5)), t, i + 5);
    if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.translate((1 - a) * 40, 0); chipBox(ctx, 720, y, 320, n, dot, t >= stT[i] + 0.4); ctx.restore(); }
  });
  ctx.restore();
}
function chipBox(ctx, x, y, w, label, dot, on) {
  card(ctx, x, y - 52, w, 104, 30, { line: on ? C.outLine ?? C.b1 : C.b1 });
  ctx.fillStyle = rgba(dot); ctx.beginPath(); ctx.arc(x + 42, y, 12, 0, TAU); ctx.fill();
  T(ctx, label, x + 68, y + 12, { size: 34, w: 700, fill: C.ink });
}

// ───────────── payoff: a chat that answers with live stock; Catalog · Stock · Orders light up as they are named
function payoffChat(ctx, t, tFrame) {
  const P = S.payoff, w = i => wt('payoff', i);
  [[0, w(0)], [1, w(1)], [2, w(3)]].forEach(([i, at], k) => {
    const a = E.outExpo(prog(t, at - 0.05, at + 0.3)) * (1 - E.inCubic(prog(t, P.end - 0.1, P.end + 0.25)));
    if (a > 0) { const lx = [130, 410, 650][k]; tag(ctx, lx, 280, TX.sync[i], { size: 36, alpha: a }); }
  });
  chatCard(ctx, t, tFrame, {
    box: { x: 60, y: 360, w: 960, h: 900 }, t0: P.scene - 0.1, t1: P.end, items: [
      { at: P.scene + 0.15, side: 'in', text: TX.q2 },
      { ty: P.scene + 0.35, at: w(1) - 0.05, side: 'out', text: TX.a2 },
      { at: w(3), h: 236, side: 'out', draw: (c, X0, X1, y) => {
        const x = X1 - 640; card(c, x, y, 640, 236, 32, { fill: C.panel, shadow: false });
        productArt(c, 'shirt', x + 22, y + 22, 192, BLUE);
        T(c, TX.product, x + 240, y + 66, { size: 38, w: 700, fill: C.ink }); T(c, TX.colour, x + 240, y + 110, { size: 32, w: 500, fill: C.t2 });
        tag(c, x + 240, y + 176, TX.left, { size: 28 });
      } },
    ],
  });
}

const focusAt = track([[S.turn.scene, 540, 860], [S.proof.scene + 0.3, HUB[0], HUB[1]], [wt('proof', 3), 200, 900], [wt('proof', 11), 880, 900],
  [S.payoff.scene + 0.3, 700, 800], [S.end.scene + 0.4, 540, 630], [S.end.scene + 1.9, 700, 1262], [S.end.scene + 2.6, 540, 1420]]);

export default {
  async setup(api) { TX = COPY[api.lang] || COPY.en; await themeFrom(import.meta.url); },
  draw(ctx, t, api) {
    stage(ctx, t, api, {
      schedule: SCHEDULE, focusAt,
      content: (tFrame, { name }) => {
        windows(ctx, t);
        hub(ctx, t);
        // the logo forms on "dotkesk", then settles as the hub between channels and stores
        const pOut = E.inCubic(prog(t, S.proof.end - 0.1, S.proof.end + 0.3));
        if (pOut < 1) { ctx.save(); ctx.globalAlpha = 1 - pOut; turnLogo(ctx, t, { t0: S.turn.scene, name, at: [540, 860, 520], move: { t: S.proof.scene - 0.2, at: [HUB[0], HUB[1], HUB_W] } }); ctx.restore(); }
        payoffChat(ctx, t, tFrame);
      },
    });
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, C.light ? 0.06 : 0.28); },
};
