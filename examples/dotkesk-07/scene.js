// examples/dotkesk-07 "Web chat": dotkesk daily #7, Reels / Shorts (1080x1920), English narrator, word-by-word captions.
//   a store's site in a browser; a visitor's pointer wanders between products, an empty corner where a hello should be →
//   the logo forms on "dotkesk" and lands in that corner as the chat button → the chat opens over the page: it greets,
//   asks what they need, the visitor answers, it recommends a product from the catalog with a View button →
//   "Right on your site" → end card.
// From the site: on-site web chat that greets visitors and recommends products. The store, the products and the visitor's
// words are placeholders.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, noise1, vignette, pointer } from '../../engine/core.js';
import { C, T, card, themeFrom, drawLogo, tag, chatCard, productArt, browserFrame, turnLogo, payoff, payoffDots, track, stage } from '../dotkesk/kit.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  en: {
    url: 'yourstore.com', shop: 'New in', products: [['Trail Runner', [22, 101, 52]], ['Core Runner', [30, 30, 36]], ['Linen Shirt', [244, 114, 182]], ['City Tee', [59, 130, 246]]],
    title: 'Your Store', sub: 'Web chat · online',
    hi: 'Hi! Welcome to Your Store.', ask: 'What are you looking for today?', need: 'Running shoes for rainy days.',
    pick: 'Trail Runner', pickSub: 'Waterproof · from our catalog', view: 'View', reason: 'This one is waterproof and made for wet trails.',
    done: 'Right on your site', doneSub: 'Greets · asks · recommends',
  },
};
let TX = COPY.en;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const wt = (key, i) => S[key].words[Math.min(i, S[key].words.length - 1)][1];
const PAGE = { x: 70, y: 330, w: 940, h: 920 };                // bottom at 1250, clear of the captions
const LAUNCH = [PAGE.x + PAGE.w - 90, PAGE.y + PAGE.h - 90, 96];

// ───────────── the store's site, with a visitor who never gets a hello
function site(ctx, t, tFrame) {
  const out = E.inCubic(prog(t, S.payoff.scene - 0.05, S.payoff.scene + 0.3)); if (out >= 1) return;
  const inn = E.outExpo(prog(t, -0.6, 0)), dim = EASE.expo(prog(t, S.proof.scene, S.proof.scene + 0.5));
  const { x, y, w, h } = PAGE;
  ctx.save(); ctx.globalAlpha = inn * (1 - out);
  browserFrame(ctx, x, y, w, h, TX.url);
  T(ctx, TX.shop, x + 50, y + 170, { size: 44, w: 700, fill: C.ink, ls: -1 });
  TX.products.forEach(([n, col], i) => {
    const px = x + 95 + (i % 2) * 400, py = y + 195 + Math.floor(i / 2) * 365;     // a 2x2 grid of 350 px tiles inside the page
    productArt(ctx, i < 2 ? 'shoe' : 'shirt', px, py, 350, col);
    ctx.fillStyle = rgba(C.card, 0.9); ctx.beginPath(); ctx.roundRect(px + 16, py + 272, 230, 58, 29); ctx.fill();
    T(ctx, n, px + 34, py + 312, { size: 30, w: 600, fill: C.ink });
  });
  // the visitor's pointer wanders between the products, hovering, never deciding (until the chat opens)
  if (t < S.proof.scene + 0.3) {
    const u = tFrame * 0.55, px = 540 + 300 * Math.sin(u * 1.3) + 40 * noise1(u * 2), py = 900 + 260 * Math.sin(u * 0.9 + 1) + 40 * noise1(u * 2 + 5);
    ctx.save(); ctx.globalAlpha *= 1 - prog(t, S.proof.scene, S.proof.scene + 0.3); pointer(ctx, px, py, 1.8); ctx.restore();
  }
  // the empty corner: a dashed circle where a hello should be (until the logo lands there)
  const ec = 1 - prog(t, S.turn.scene, S.turn.scene + 0.3);
  if (ec > 0) {
    const pulse = 1 + 0.06 * Math.sin(t * 4);
    ctx.save(); ctx.globalAlpha *= ec * E.outExpo(prog(t, wt('hook', 6), wt('hook', 6) + 0.4)); ctx.setLineDash([12, 10]); ctx.strokeStyle = rgba(C.t3); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(LAUNCH[0], LAUNCH[1], 56 * pulse, 0, TAU); ctx.stroke(); ctx.restore();
  }
  if (dim > 0) { ctx.fillStyle = rgba(C.light ? [16, 24, 40] : [0, 0, 0], 0.18 * dim); ctx.beginPath(); ctx.roundRect(x, y, w, h, 36); ctx.fill(); }
  ctx.restore();
}
function launcher(ctx, t) {
  const st = wt('turn', 2) + 0.55, out = E.inCubic(prog(t, S.payoff.scene - 0.05, S.payoff.scene + 0.3));
  if (t < st || out >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.shadowColor = 'rgba(15,23,42,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = rgba(C.disc); ctx.beginPath(); ctx.arc(LAUNCH[0], LAUNCH[1], LAUNCH[2] * 0.66, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = 1 - out; drawLogo(ctx, LAUNCH[0], LAUNCH[1], LAUNCH[2], { spin: t * 0.4, badge: false }); ctx.restore();
}
function pickCard(ctx, X0, X1, y, t) {
  const w = 600, h = 236, x = X1 - w;
  card(ctx, x, y, w, h, 28, { fill: C.panel, shadow: false });
  productArt(ctx, 'shoe', x + 22, y + 22, 192, [22, 101, 52]);
  T(ctx, TX.pick, x + 240, y + 66, { size: 38, w: 700, fill: C.ink }); T(ctx, TX.pickSub, x + 240, y + 108, { size: 26, w: 500, fill: C.t2 });
  ctx.beginPath(); ctx.roundRect(x + 240, y + 146, 150, 64, 32); ctx.fillStyle = rgba(C.green); ctx.fill();
  T(ctx, TX.view, x + 315, y + 189, { size: 30, w: 700, a: 'center', fill: C.white });
}

const focusAt = track([[S.turn.scene, 540, 820], [wt('turn', 2), LAUNCH[0], LAUNCH[1]], [wt('proof', 1), 700, 700], [wt('proof', 6), 400, 950],
  [wt('proof', 8), 700, 1100], [S.payoff.scene + 0.2, 540, 760], [S.end.scene + 0.4, 540, 630], [S.end.scene + 1.9, 700, 1262], [S.end.scene + 2.6, 540, 1420]]);

export default {
  async setup(api) { TX = COPY[api.lang] || COPY.en; await themeFrom(import.meta.url); },
  draw(ctx, t, api) {
    stage(ctx, t, api, {
      schedule: SCHEDULE, focusAt, night: 0.35, endFrom: payoffDots(S.payoff.scene, S.end.scene),
      content: (tFrame, { name }) => {
        site(ctx, t, tFrame);
        launcher(ctx, t);
        turnLogo(ctx, t, { t0: S.turn.scene, name, at: [540, 820, 520], move: { t: wt('turn', 2) - 0.05, at: LAUNCH }, until: wt('turn', 2) + 0.55 });
        const w = i => wt('proof', i);
        chatCard(ctx, t, tFrame, {
          box: { x: 150, y: 440, w: 860, h: 810 }, title: TX.title, sub: TX.sub, t0: S.proof.scene - 0.15, t1: S.proof.end, items: [
            { at: w(1) - 0.05, side: 'out', text: TX.hi },
            { at: w(3) - 0.05, side: 'out', text: TX.ask },
            { at: w(6) - 0.1, side: 'in', text: TX.need },
            { ty: w(6) + 0.25, at: w(8), side: 'out', text: TX.reason },
            { at: w(11), h: 236, side: 'out', draw: (c, X0, X1, y) => pickCard(c, X0, X1, y, t) },
          ],
        });
        payoff(ctx, t, S.payoff.scene, S.end.scene, { title: TX.done, sub: TX.doneSub });
      },
    });
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, C.light ? 0.06 : 0.28); },
};
