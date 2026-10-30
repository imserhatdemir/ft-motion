// examples/dotkesk-02 "Where's my order?": dotkesk daily #2, Reels / Shorts (1080x1920), English narrator, word-by-word captions.
//   the same question piles up from five channels → the old way: open the panel, search the order, wait on the courier site →
//   the cards break into dots that orbit into the logo on "dotkesk" → the agent finds the order, lights up the live status and
//   sends the courier details → "Answered" → end card.
// Scene and word times come from schedule.js (voice.py). Copy lives in COPY. Names, order and tracking numbers are placeholders.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, vignette, pointer } from '../../engine/core.js';
import { C, T, card, themeFrom, notifCard, tag, chatCard, turnLogo, payoff, payoffDots, track, stage } from '../dotkesk/kit.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  en: {
    asks: [
      { app: 'Instagram', dot: [225, 48, 108], name: 'Maya', msg: "Where's my order?" },
      { app: 'WhatsApp', dot: [37, 211, 102], name: 'Leo', msg: 'Any update on my order?' },
      { app: 'Web chat', dot: [148, 163, 184], name: 'Ana', msg: 'Has my order shipped?' },
      { app: 'Messenger', dot: [0, 132, 255], name: 'Sam', msg: 'Where is my package?' },
      { app: 'Email', dot: [234, 179, 8], name: 'Jo', msg: 'Order status, please?' },
    ],
    panel: 'Admin panel', orders: 'Orders', search: 'Search orders', order: '#10482', orderRow: '#10482 · Leo · 1 item', courier: 'Courier tracking', loading: 'Loading…',
    q: "Hi! Where's my order? #10482", a: 'Found it! Order #10482 is on its way.',
    steps: ['Ordered', 'Packed', 'Shipped', 'Out for delivery'], live: 'Live status',
    courierTitle: 'Courier details', trackNo: 'Tracking no.', trackVal: 'TR 4829 1176', eta: 'Estimated', etaVal: 'Today, 14:00–18:00', trackBtn: 'Track',
    done: 'Answered', doneSub: 'Order #10482 · out for delivery',
  },
};
let TX = COPY.en;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const wt = (key, i) => S[key].words[Math.min(i, S[key].words.length - 1)][1];
const AVATAR = [152, 422, 84];                        // the chat header avatar (chatCard's default box)

// ───────────── hook: the same question, five channels
const askAt = i => -0.4 + i * 0.42;                // the first card is already in on frame 0 (the thumbnail)
function asks(ctx, t) {
  const gone = E.inCubic(prog(t, S.pain.scene, S.pain.scene + 0.35));
  TX.asks.forEach((n, i) => notifCard(ctx, 90, 360 + i * 186, 900, n, { p: t - askAt(i), gone }));
}
// ───────────── pain: panel → search → courier site that keeps loading
function panel(ctx, t, tFrame) {
  const w = i => wt('pain', i), inn = EASE.expo(prog(t, w(3) - 0.1, w(3) + 0.4)), out = E.inCubic(prog(t, S.turn.scene - 0.05, S.turn.scene + 0.3));
  if (inn <= 0 || out >= 1) return;
  ctx.save(); ctx.globalAlpha = inn * (1 - out);
  const x = 90, y = 380, W = 900, H = 640;
  card(ctx, x, y, W, H, 36);
  T(ctx, TX.panel, x + 44, y + 66, { size: 38, w: 700, fill: C.ink });
  tag(ctx, x + W - 200, y + 54, TX.orders, { green: false, size: 28 });
  ctx.fillStyle = rgba(C.b1); ctx.fillRect(x, y + 110, W, 2);
  // the search field types the order number on "finding"
  const typed = TX.order.slice(0, Math.max(0, Math.floor((t - w(6)) * 14)));
  rrectFill(ctx, x + 44, y + 150, W - 88, 84, 20, C.b2);
  T(ctx, typed || TX.search, x + 80, y + 205, { size: 34, w: 500, fill: typed ? C.ink : C.t3 });
  for (let r = 0; r < 4; r++) {                                       // order rows; the match lights up
    const ry = y + 270 + r * 96, hit = r === 1 && t > w(6) + 0.6;
    rrectFill(ctx, x + 44, ry, W - 88, 76, 18, hit ? C.chipBg : C.panel);
    T(ctx, r === 1 ? TX.orderRow : '#1048' + (5 - r) + ' · ···', x + 76, ry + 50, { size: 30, w: hit ? 700 : 500, fill: hit ? C.chipInk : C.t3 });
  }
  // on "checking the courier": a second window that never finishes loading
  const cw = EASE.expo(prog(t, w(10) - 0.1, w(10) + 0.4));
  if (cw > 0) {
    const cx = 230, cy = 700 + (1 - cw) * 80;
    ctx.save(); ctx.globalAlpha *= cw; card(ctx, cx, cy, 720, 360, 32);
    T(ctx, TX.courier, cx + 40, cy + 66, { size: 34, w: 700, fill: C.ink });
    ctx.strokeStyle = rgba(C.b1); ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx + 360, cy + 210, 52, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(C.t3); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx + 360, cy + 210, 52, tFrame * 6, tFrame * 6 + 1.6); ctx.stroke();
    T(ctx, TX.loading, cx + 360, cy + 315, { size: 30, w: 500, a: 'center', fill: C.t3 });
    ctx.restore();
  }
  // the pointer does the clicking
  const pa = prog(t, w(3) - 0.3, w(3)), pb = prog(t, w(6) - 0.3, w(6)), pc = prog(t, w(10) - 0.3, w(10));
  const px = lerp(lerp(lerp(980, 860, EASE.expo(pa)), 600, EASE.expo(pb)), 560, EASE.expo(pc)), py = lerp(lerp(lerp(1500, 434, EASE.expo(pa)), 572, EASE.expo(pb)), 640, EASE.expo(pc));
  const press = Math.max(...[w(3), w(6) + 0.6, w(10)].map(tp => Math.exp(-Math.pow((t - tp) / 0.07, 2))));
  pointer(ctx, px, py, 1.8, press);
  ctx.restore();
}
function rrectFill(ctx, x, y, w, h, r, col) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = rgba(col); ctx.fill(); }

// ───────────── proof: the agent answers in the chat
function statusCard(ctx, X0, X1, y, t) {
  const w = 700, h = 330, x = X1 - w, t0 = wt('proof', 5);
  card(ctx, x, y, w, h, 28, { fill: C.panel, shadow: false });
  T(ctx, TX.live, x + 32, y + 56, { size: 32, w: 700, fill: C.ink });
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  tag(ctx, x + w - 150, y + 44, 'LIVE', { size: 24, dot: mix(C.green, [134, 239, 172], pulse) });
  TX.steps.forEach((s, i) => {
    const on = E.outExpo(prog(t, t0 + i * 0.18, t0 + i * 0.18 + 0.3)), sy = y + 112 + i * 56, last = i === TX.steps.length - 1;
    ctx.fillStyle = rgba(mix(C.b1, C.green, on)); ctx.beginPath(); ctx.arc(x + 48, sy, 15, 0, TAU); ctx.fill();
    if (on > 0.5) { if (last) { ctx.fillStyle = rgba(C.white); ctx.beginPath(); ctx.arc(x + 48, sy, 6 + 2 * pulse, 0, TAU); ctx.fill(); } else check(ctx, x + 48, sy, 8, C.white, 4); }
    if (i) { ctx.fillStyle = rgba(mix(C.b1, C.green, on)); ctx.fillRect(x + 46, sy - 41, 4, 26); }
    T(ctx, s, x + 82, sy + 11, { size: 30, w: last ? 700 : 500, fill: last && on > 0.5 ? C.chipInk : C.t1 });
  });
}
function courierCard(ctx, X0, X1, y) {
  const w = 700, h = 230, x = X1 - w;
  card(ctx, x, y, w, h, 28, { fill: C.panel, shadow: false });
  T(ctx, TX.courierTitle, x + 32, y + 56, { size: 32, w: 700, fill: C.ink });
  T(ctx, TX.trackNo, x + 32, y + 112, { size: 30, w: 500, fill: C.t2 }); T(ctx, TX.trackVal, x + 280, y + 112, { size: 30, w: 600, fill: C.t1 });
  T(ctx, TX.eta, x + 32, y + 162, { size: 30, w: 500, fill: C.t2 }); T(ctx, TX.etaVal, x + 280, y + 162, { size: 30, w: 600, fill: C.t1 });
  ctx.beginPath(); ctx.roundRect(x + w - 170, y + 30, 140, 56, 28); ctx.fillStyle = rgba(C.green); ctx.fill();
  T(ctx, TX.trackBtn, x + w - 100, y + 69, { size: 28, w: 700, a: 'center', fill: C.white });
}
const check = (ctx, x, y, s, col, lw) => { ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.7); ctx.stroke(); ctx.restore(); };

const focusAt = track([[S.turn.scene, 540, 820], [S.proof.scene + 0.3, 330, 520], [wt('proof', 1), 720, 700], [wt('proof', 5), 700, 900], [wt('proof', 9), 700, 1100],
  [S.payoff.scene + 0.2, 540, 760], [S.end.scene + 0.4, 540, 630], [S.end.scene + 1.9, 700, 1262], [S.end.scene + 2.6, 540, 1420]]);

export default {
  async setup(api) { TX = COPY[api.lang] || COPY.en; await themeFrom(import.meta.url); },
  draw(ctx, t, api) {
    stage(ctx, t, api, {
      schedule: SCHEDULE, focusAt, endFrom: payoffDots(S.payoff.scene, S.end.scene),
      content: (tFrame, { name }) => {
        asks(ctx, t);
        panel(ctx, t, tFrame);
        turnLogo(ctx, t, { t0: S.turn.scene, name, at: [540, 820, 600], move: { t: S.proof.scene, at: AVATAR }, until: S.proof.scene + 0.7 });
        chatCard(ctx, t, tFrame, {
          t0: S.proof.scene, t1: S.proof.end, items: [
            { at: S.proof.scene + 0.25, side: 'in', text: TX.q },
            { ty: S.proof.scene + 0.55, at: wt('proof', 1), side: 'out', text: TX.a },
            { at: wt('proof', 5) - 0.1, h: 330, side: 'out', draw: (c, X0, X1, y) => statusCard(c, X0, X1, y, t) },
            { at: wt('proof', 9) - 0.1, h: 230, side: 'out', draw: (c, X0, X1, y) => courierCard(c, X0, X1, y) },
          ],
        });
        payoff(ctx, t, S.payoff.scene, S.end.scene, { title: TX.done, sub: TX.doneSub });
      },
    });
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, C.light ? 0.06 : 0.28); },
};
