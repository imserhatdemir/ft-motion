// examples/dotkesk-05 "Added to cart… and left": dotkesk daily #5, Reels / Shorts (1080x1920), English narrator, captions.
//   a product page: the pointer adds the shoe to the cart, then drifts away; the page greys, an idle timer counts →
//   the logo forms on "dotkesk" and lands as the page's chat button; on "steps in" it opens with a message →
//   a one-time code card (single use) and "Your rules" (the rules that built it) →
//   the cart badge comes back to life, checkout → "Cart recovered" → end card.
// From the site: proactive engagement on hesitation signals (cart abandonment, dwell time) and unique single-use codes from
// your rules. The product, the code, 10% and the rule values are placeholders.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, vignette, pointer } from '../../engine/core.js';
import { C, T, card, themeFrom, drawLogo, tag, toggle, bubble, productArt, browserFrame, turnLogo, payoff, payoffDots, track, stage } from '../dotkesk/kit.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  en: {
    url: 'yourstore.com/core-runner', product: 'Core Runner', colour: 'Black', add: 'Add to cart', added: 'Added', idle: 'Cart idle',
    hello: 'Still thinking about the Core Runner? I can help.',
    codeTitle: '10% off, just for you', code: 'CORE-7Q2X', single: 'Single use', apply: 'Apply',
    rules: 'Your rules', rule: [['Cart idle for 30 min', true], ['Discount: 10%', true], ['One use per customer', true]],
    checkout: 'Checkout', done: 'Cart recovered', doneSub: 'Core Runner · code applied',
  },
};
let TX = COPY.en;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const BACK = S.payoff.scene + 0.05, DONE = S.payoff.scene + 0.85;   // the cart wakes up first, then the payoff lands
const wt = (key, i) => S[key].words[Math.min(i, S[key].words.length - 1)][1];
const SHOE = [17, 94, 89];
const PAGE = { x: 110, y: 330, w: 860, h: 980 };
const WIDGET = [905, 1232, 96];

// ───────────── the product page (hook → proof)
function page(ctx, t, tFrame) {
  const out = E.inCubic(prog(t, DONE - 0.05, DONE + 0.3)); if (out >= 1) return;
  const inn = E.outExpo(prog(t, -0.6, 0)), left = wt('hook', 7), gray = E.inOutCubic(prog(t, left, left + 0.6)) * (1 - EASE.expo(prog(t, wt('turn', 5), wt('turn', 5) + 0.5)));
  const { x, y, w, h } = PAGE, back = EASE.expo(prog(t, BACK, BACK + 0.4));
  ctx.save(); ctx.globalAlpha = inn * (1 - out);
  browserFrame(ctx, x, y, w, h, TX.url);
  productArt(ctx, 'shoe', x + 60, y + 140, w - 120, SHOE.map((v, i) => lerp(v, [148, 163, 184][i], gray * 0.5)));
  T(ctx, TX.product, x + 60, y + 870, { size: 48, w: 700, fill: C.ink, ls: -1 });
  T(ctx, TX.colour, x + 60, y + 920, { size: 32, w: 500, fill: C.t2 });
  // add to cart, tapped on "added"
  const tap = wt('hook', 1), done = prog(t, tap, tap + 0.12), press = Math.exp(-Math.pow((t - tap) / 0.07, 2));
  const bx = x + w - 440, by = y + 850, bw = 300, bh = 96;
  ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(1 - 0.05 * press, 1 - 0.05 * press);
  ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fillStyle = rgba(mix(mix(C.green, C.b2, done * gray), C.green, back)); ctx.fill();
  T(ctx, back > 0.5 ? TX.checkout : done ? TX.added : TX.add, 0, 12, { size: 34, w: 700, a: 'center', fill: done * gray > 0.5 && back < 0.5 ? C.t2 : C.white }); ctx.restore();
  // the cart badge: 1 item, grey while idle, green again when it comes back
  const badge = spring(t - tap - 0.1, 14, 7);
  const cx = x + w - 60, cy = y + 46;
  ctx.strokeStyle = rgba(C.t2); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(cx - 22, cy - 14, 44, 32, 6); ctx.stroke();
  if (badge > 0) { ctx.fillStyle = rgba(mix(mix(C.green, C.t3, gray), C.green, back)); ctx.beginPath(); ctx.arc(cx + 22, cy - 18, 18 * badge, 0, TAU); ctx.fill(); T(ctx, '1', cx + 22, cy - 8, { size: 24, w: 700, a: 'center', fill: C.white, alpha: clamp(badge) }); }
  // the idle timer: hesitation, counted with frameT so the digits stay sharp
  const ia = E.outExpo(prog(t, left + 0.3, left + 0.6)) * (1 - E.inCubic(prog(t, wt('turn', 5), wt('turn', 5) + 0.3)));
  if (ia > 0) { const s = Math.floor(Math.max(0, tFrame - left - 0.3) * 9); tag(ctx, x + 40, y + 160, `${TX.idle} · 0:${String(Math.min(59, s)).padStart(2, '0')}`, { green: false, size: 32, alpha: ia, dot: C.t3 }); }
  // the shopper's pointer: adds, then drifts off the page
  const pa = prog(t, 0.1, tap - 0.05), pb = prog(t, left - 0.3, left + 0.5);
  const px = lerp(lerp(700, bx + bw / 2, EASE.expo(pa)), 1150, E.inCubic(pb)), py = lerp(lerp(1600, by + bh / 2, EASE.expo(pa)), 120, E.inCubic(pb));
  if (pb < 1) pointer(ctx, px, py, 1.8, press);
  if (gray > 0) { ctx.fillStyle = rgba(C.light ? [214, 220, 230] : C.bg, 0.35 * gray); ctx.beginPath(); ctx.roundRect(x, y, w, h, 36); ctx.fill(); }
  ctx.restore();
}

// ───────────── the agent steps in: a message from the chat button, then the code and the rules behind it
function stepIn(ctx, t) {
  const st = wt('turn', 5), out = E.inCubic(prog(t, S.payoff.scene - 0.05, S.payoff.scene + 0.3)); if (t < st || out >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - out;
  const fade = 1 - E.inCubic(prog(t, wt('proof', 3) - 0.35, wt('proof', 3) - 0.1));   // the hello leaves before the coupon lands
  if (fade > 0) { ctx.save(); ctx.globalAlpha *= fade; bubble(ctx, 200, 960, 900, TX.hello, { side: 'out', p: prog(t, st + 0.15, st + 0.75), maxW: 560 }); ctx.restore(); }
  // the coupon, on "discount code"
  const ca = prog(t, wt('proof', 3) - 0.05, wt('proof', 3) + 0.55);
  if (ca > 0) {
    const s = 0.7 + 0.3 * spring(ca * 0.6, 14, 7), x = 300, y = 780, w = 640, h = 330;
    ctx.save(); ctx.globalAlpha *= clamp(ca * 3); ctx.translate(x + w, y + h); ctx.scale(s, s); ctx.translate(-(x + w), -(y + h));
    card(ctx, x, y, w, h, 36, { line: C.outLine ?? C.b1 });
    T(ctx, TX.codeTitle, x + 40, y + 78, { size: 42, w: 700, fill: C.ink, ls: -1 });
    ctx.save(); ctx.setLineDash([12, 10]); ctx.strokeStyle = rgba(C.green); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x + 40, y + 120, 370, 100, 22); ctx.stroke(); ctx.restore();
    T(ctx, TX.code, x + 225, y + 186, { size: 44, w: 800, a: 'center', fill: C.chipInk, ls: 2 });
    ctx.beginPath(); ctx.roundRect(x + 430, y + 120, 170, 100, 50); ctx.fillStyle = rgba(C.green); ctx.fill();
    T(ctx, TX.apply, x + 515, y + 182, { size: 34, w: 700, a: 'center', fill: C.white });
    tag(ctx, x + 40, y + 276, TX.single, { size: 30 });
    ctx.restore();
  }
  // the rules that built it, on "rules"
  const ra = EASE.expo(prog(t, wt('proof', 8) - 0.15, wt('proof', 8) + 0.4));
  if (ra > 0) {
    const x = 140 - (1 - ra) * 120, y = 420, w = 640, h = 330;
    ctx.save(); ctx.globalAlpha *= ra; card(ctx, x, y, w, h, 36);
    T(ctx, TX.rules, x + 40, y + 70, { size: 38, w: 700, fill: C.ink });
    TX.rule.forEach(([r], i) => { const ry = y + 140 + i * 66; T(ctx, r, x + 40, ry + 12, { size: 30, w: 500, fill: C.t1 }); toggle(ctx, x + w - 80, ry, prog(t, wt('proof', 8) + i * 0.12, wt('proof', 8) + 0.2 + i * 0.12), { w: 84, h: 48 }); });
    ctx.restore();
  }
  ctx.restore();
}
// the chat button the logo lands in (bottom-right of the page), kept while the agent is around
function widget(ctx, t) {
  const st = wt('turn', 5), out = E.inCubic(prog(t, DONE - 0.05, DONE + 0.3));
  if (t < st + 0.6 || out >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - out; drawLogo(ctx, WIDGET[0], WIDGET[1], WIDGET[2], { spin: t * 0.4 }); ctx.restore();
}

const focusAt = track([[S.turn.scene, 540, 800], [wt('turn', 5), WIDGET[0], WIDGET[1]], [wt('proof', 3), 620, 940], [wt('proof', 8), 460, 580],
  [BACK, PAGE.x + PAGE.w - 210, PAGE.y + 898], [DONE + 0.2, 540, 760], [S.end.scene + 0.4, 540, 630], [S.end.scene + 1.9, 700, 1262], [S.end.scene + 2.6, 540, 1420]]);

export default {
  async setup(api) { TX = COPY[api.lang] || COPY.en; await themeFrom(import.meta.url); },
  draw(ctx, t, api) {
    stage(ctx, t, api, {
      schedule: SCHEDULE, focusAt, night: 0.45, endFrom: payoffDots(DONE, S.end.scene),
      content: (tFrame, { name }) => {
        page(ctx, t, tFrame);
        turnLogo(ctx, t, { t0: S.turn.scene, name, at: [540, 800, 460], move: { t: wt('turn', 5) - 0.1, at: WIDGET }, until: wt('turn', 5) + 0.6 });
        widget(ctx, t);
        stepIn(ctx, t);
        payoff(ctx, t, DONE, S.end.scene, { title: TX.done, sub: TX.doneSub });
      },
    });
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, C.light ? 0.06 : 0.28); },
};
