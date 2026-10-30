// examples/dotkesk-06 "Refund requests": dotkesk daily #6, Reels / Shorts (1080x1920), English narrator, word-by-word captions.
//   "I want a refund." lands, then four more pings pile on and shake: the worst possible moment →
//   the pile breaks into dots that orbit into the logo on "dotkesk" → the chat: the agent asks for the order, checks it line by
//   line (delivered · within the return window · unused) → Eligible → a damaged-item case is handed to a person on the team →
//   "Handled" → end card.
// From the site: refund handling (guides, checks eligibility, escalates when needed) and smart human handoff.
// Names, the order, the dates and the return-window rule are placeholders.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, noise1, vignette } from '../../engine/core.js';
import { C, T, card, themeFrom, notifCard, tag, chatCard, turnLogo, payoff, payoffDots, track, stage } from '../dotkesk/kit.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  en: {
    refund: { app: 'WhatsApp', dot: [37, 211, 102], name: 'Emma', msg: 'I want a refund.' },
    pile: [
      { app: 'Calendar', dot: [59, 130, 246], name: '', msg: 'Supplier call in 5 min' },
      { app: 'Courier', dot: [234, 179, 8], name: '', msg: 'Pickup moved to 6 PM' },
      { app: 'Instagram', dot: [225, 48, 108], name: 'Maya', msg: 'Is the pink one back?' },
      { app: 'Team', dot: [148, 163, 184], name: 'Selin', msg: 'Can you check stock?' },
    ],
    q1: 'I want a refund for my order.', a1: "Sorry about that! What's your order number?", q2: '#20931',
    checkTitle: 'Order #20931', checks: ['Delivered 6 days ago', 'Within the 14-day return window', 'Item unused'], eligible: 'Eligible for a refund',
    q3: 'Another order arrived damaged. Photo attached.', a3: "I'm sorry! I'm handing this to our team right now.",
    handoff: 'Handed to your team', assigned: 'Assigned: Selin · Support',
    done: 'Handled', doneSub: '1 refund guided · 1 case with your team',
  },
};
let TX = COPY.en;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const wt = (key, i) => S[key].words[Math.min(i, S[key].words.length - 1)][1];
const AVATAR = [152, 422, 84];

// ───────────── hook: the refund lands, then the day piles on and shakes
function hook(ctx, t) {
  const gone = E.inCubic(prog(t, S.turn.scene, S.turn.scene + 0.35)), worst = wt('hook', 5);
  const amp = 7 * clamp((t - worst) * 3) * (1 - gone);
  ctx.save(); ctx.translate(noise1(t * 30) * amp, noise1(t * 30 + 7) * amp);
  TX.pile.forEach((n, i) => notifCard(ctx, 90 + (i % 2 ? 24 : -12), 620 + i * 150, 900, n, { p: t - (worst + i * 0.16), gone, h: 168 }));
  notifCard(ctx, 90, 380, 900, TX.refund, { p: t + 0.6, gone });            // up on frame 0 (the thumbnail)
  ctx.restore();
}

// ───────────── proof + handoff: one chat across both lines
function checkCard(ctx, X0, X1, y, t) {
  const w = 720, h = 330, x = X1 - w, t0 = wt('proof', 8);
  card(ctx, x, y, w, h, 28, { fill: C.panel, shadow: false });
  T(ctx, TX.checkTitle, x + 32, y + 58, { size: 34, w: 700, fill: C.ink });
  TX.checks.forEach((c, i) => {
    const on = E.outExpo(prog(t, t0 + i * 0.3, t0 + i * 0.3 + 0.25)), cy = y + 116 + i * 58;
    ctx.fillStyle = rgba(mix(C.b1, C.green, on)); ctx.beginPath(); ctx.arc(x + 48, cy, 16, 0, TAU); ctx.fill();
    if (on > 0.4) tick(ctx, x + 48, cy, 8, C.white, 4);
    T(ctx, c, x + 82, cy + 11, { size: 30, w: 500, fill: mix(C.t3, C.t1, on) });
  });
  tag(ctx, x + 32, y + h - 40, TX.eligible, { size: 30, alpha: E.outExpo(prog(t, wt('proof', 13) - 0.05, wt('proof', 13) + 0.3)) });
}
function handoffCard(ctx, X0, X1, y, t) {
  const w = 640, h = 170, x = X1 - w;
  card(ctx, x, y, w, h, 28, { fill: C.panel, shadow: false });
  ctx.fillStyle = rgba(C.ink); ctx.beginPath(); ctx.arc(x + 70, y + 85, 44, 0, TAU); ctx.fill();
  T(ctx, 'S', x + 70, y + 100, { size: 40, w: 700, a: 'center', fill: C.white });
  ctx.fillStyle = rgba(C.green); ctx.beginPath(); ctx.arc(x + 102, y + 117, 12, 0, TAU); ctx.fill();
  T(ctx, TX.handoff, x + 140, y + 74, { size: 32, w: 700, fill: C.ink });
  T(ctx, TX.assigned, x + 140, y + 120, { size: 30, w: 500, fill: C.t2 });
}
function tick(ctx, x, y, s, col, lw) { ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.7); ctx.stroke(); ctx.restore(); }
function photo(ctx, X0, y) {                                      // the customer's photo: a box with a dent
  const x = X0, w = 300, h = 200; ctx.beginPath(); ctx.roundRect(x, y, w, h, 24); ctx.fillStyle = rgba([226, 232, 240]); ctx.fill();
  ctx.fillStyle = rgba([180, 140, 100]); ctx.beginPath(); ctx.moveTo(x + 70, y + 70); ctx.lineTo(x + 230, y + 70); ctx.lineTo(x + 230, y + 160); ctx.lineTo(x + 150, y + 160); ctx.lineTo(x + 130, y + 120); ctx.lineTo(x + 110, y + 160); ctx.lineTo(x + 70, y + 160); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba([120, 90, 60]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 70, y + 92); ctx.lineTo(x + 230, y + 92); ctx.stroke();
}

const focusAt = track([[S.turn.scene, 540, 820], [S.proof.scene + 0.3, 330, 520], [wt('proof', 1), 720, 640], [wt('proof', 8), 700, 900],
  [S.handoff.scene, 330, 900], [wt('handoff', 4), 700, 1100], [S.payoff.scene + 0.2, 540, 760], [S.end.scene + 0.4, 540, 630], [S.end.scene + 1.9, 700, 1262], [S.end.scene + 2.6, 540, 1420]]);

export default {
  async setup(api) { TX = COPY[api.lang] || COPY.en; await themeFrom(import.meta.url); },
  draw(ctx, t, api) {
    stage(ctx, t, api, {
      schedule: SCHEDULE, focusAt, endFrom: payoffDots(S.payoff.scene, S.end.scene),
      content: (tFrame, { name }) => {
        hook(ctx, t);
        turnLogo(ctx, t, { t0: S.turn.scene, name, at: [540, 820, 600], move: { t: S.proof.scene, at: AVATAR }, until: S.proof.scene + 0.7 });
        const w = i => wt('proof', i), h = i => wt('handoff', i);
        chatCard(ctx, t, tFrame, {
          t0: S.proof.scene, t1: S.handoff.end, items: [
            { at: S.proof.scene + 0.25, side: 'in', text: TX.q1 },
            { ty: S.proof.scene + 0.5, at: w(1), side: 'out', text: TX.a1 },
            { at: w(4), side: 'in', text: TX.q2 },
            { at: w(8) - 0.1, h: 330, side: 'out', draw: (c, X0, X1, y) => checkCard(c, X0, X1, y, t) },
            { at: S.handoff.scene + 0.05, side: 'in', text: TX.q3 },
            { at: S.handoff.scene + 0.3, h: 200, side: 'in', draw: (c, X0, X1, y) => photo(c, X0, y) },
            { ty: S.handoff.scene + 0.6, at: h(2), side: 'out', text: TX.a3 },
            { at: h(5), h: 170, side: 'out', draw: (c, X0, X1, y) => handoffCard(c, X0, X1, y, t) },
          ],
        });
        payoff(ctx, t, S.payoff.scene, S.end.scene, { title: TX.done, sub: TX.doneSub });
      },
    });
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, C.light ? 0.06 : 0.28); },
};
