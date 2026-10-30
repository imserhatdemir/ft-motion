// examples/dotkesk-04 "Before your coffee gets cold": dotkesk daily #4, Reels / Shorts (1080x1920), English narrator, captions.
//   a steaming coffee → it shrinks to the corner and keeps steaming all the way through →
//   Train: Products · Policies · FAQ cards pour their lines into the logo as each is named →
//   Test: the site's own demo ("Do you have this in blue, size M?"), then "Add correction" is clicked →
//   Activate: a master switch, then WhatsApp · Instagram · Telegram · Web chat switch on word by word →
//   "Live", the coffee still steaming → end card.
// The flow (Train / Test / Activate, "From setup to sales, in minutes") is the site's own. Channel names are text chips.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, hash, vignette, pointer } from '../../engine/core.js';
import { C, T, card, themeFrom, tag, toggle, chatCard, turnLogo, payoff, payoffDots, track, stage } from '../dotkesk/kit.js';
import { SCHEDULE } from './schedule.js';

const COPY = {
  en: {
    docs: [['Products', 'catalog'], ['Policies', 'returns · shipping'], ['FAQ', 'questions']], trained: 'Trained',
    testTitle: 'Test your agent', testSub: 'Preview', q: 'Do you have this in blue, size M?', a: 'Yes — available in blue, size M. Want me to add it to your cart?',
    fix: 'Add correction', saved: 'Correction saved',
    live: 'Go live', master: 'AI agent', channels: [['WhatsApp', [37, 211, 102]], ['Instagram', [225, 48, 108]], ['Telegram', [42, 171, 238]], ['Web chat', [148, 163, 184]]],
    done: 'Live', doneSub: 'Trained · tested · on 4 channels',
  },
};
let TX = COPY.en;
const S = Object.fromEntries(SCHEDULE.map(s => [s.key, s]));
const wt = (key, i) => S[key].words[Math.min(i, S[key].words.length - 1)][1];

// ───────────── the coffee: big in the hook, then a small, still-steaming witness in the corner
function coffee(ctx, t) {
  const m = EASE.expo(prog(t, S.turn.scene - 0.2, S.turn.scene + 0.5)), back = EASE.expo(prog(t, S.payoff.scene, S.payoff.scene + 0.6));
  const out = E.inCubic(prog(t, S.end.scene - 0.05, S.end.scene + 0.3)); if (out >= 1) return;
  const x = lerp(lerp(540, 935, m), 540, back), y = lerp(lerp(840, 250, m), 290, back), s = lerp(lerp(1.5, 0.42, m), 0.45, back);
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(x, y); ctx.scale(s, s);
  // steam: three wisps rising and swaying forever
  ctx.lineCap = 'round'; ctx.lineWidth = 10;
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.6 + i / 3) % 1;
    ctx.strokeStyle = rgba(C.t3, 0.55 * Math.sin(Math.PI * ph)); ctx.beginPath();
    for (let k = 0; k <= 20; k++) { const u = k / 20, yy = -150 - u * 150 - ph * 40, xx = (i - 1) * 46 + Math.sin(u * 5 + t * 3 + i) * 16; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  // saucer, cup, handle, coffee
  ctx.fillStyle = rgba(C.light ? [229, 231, 235] : C.b2); ctx.beginPath(); ctx.ellipse(0, 108, 190, 36, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = rgba(C.b1); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-130, -110); ctx.lineTo(130, -110); ctx.quadraticCurveTo(122, 90, 0, 100); ctx.quadraticCurveTo(-122, 90, -130, -110); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 22; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(140, -30, 44, -1.3, 1.3); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = rgba(C.b1); ctx.beginPath(); ctx.arc(140, -30, 56, -1.25, 1.25); ctx.stroke();
  ctx.fillStyle = rgba([120, 72, 40]); ctx.beginPath(); ctx.ellipse(0, -110, 130, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgba([196, 140, 96], 0.6); ctx.beginPath(); ctx.ellipse(-20, -114, 50, 9, 0, 0, TAU); ctx.fill();
  // a green dot-mark on the cup: the brand
  ctx.fillStyle = rgba(C.green); ctx.beginPath(); ctx.arc(0, -10, 18, 0, TAU); ctx.fill();
  ctx.restore();
}

// ───────────── train: three source cards pour into the logo
const LOGO = [540, 700, 420];
function train(ctx, t) {
  const T0 = S.turn.scene, out = E.inCubic(prog(t, S.test.scene - 0.1, S.test.scene + 0.25)); if (t < T0 || out >= 1) return;
  const at = [wt('turn', 4), wt('turn', 6), wt('turn', 9)];
  ctx.save(); ctx.globalAlpha = 1 - out;
  TX.docs.forEach(([name, sub], i) => {
    const a = E.outExpo(prog(t, at[i] - 0.15, at[i] + 0.25)); if (a <= 0) return;
    const x = 70 + i * 320, y = 1130 + (1 - a) * 60, w = 300, h = 200, pour = prog(t, at[i] + 0.2, at[i] + 1.2);
    ctx.save(); ctx.globalAlpha *= a; card(ctx, x, y, w, h, 28);
    T(ctx, name, x + 28, y + 58, { size: 36, w: 700, fill: C.ink }); T(ctx, sub, x + 28, y + 98, { size: 28, w: 500, fill: C.t2 });
    for (let l = 0; l < 3; l++) { ctx.fillStyle = rgba(C.b1); ctx.beginPath(); ctx.roundRect(x + 28, y + 124 + l * 22, (w - 56) * (1 - 0.25 * l) * (1 - 0.6 * pour), 10, 5); ctx.fill(); }
    // its lines rise as orbit dashes into the logo
    for (let k = 0; k < 8; k++) {
      const u = prog(t, at[i] + 0.15 + k * 0.08, at[i] + 0.75 + k * 0.08); if (u <= 0 || u >= 1) continue;
      const sx = x + 40 + (k % 4) * 60, sy = y + 130, e = EASE.snap(u), px = lerp(sx, LOGO[0] + (hash(k + i * 9) - 0.5) * 120, e), py = lerp(sy, LOGO[1] + 140, e) - Math.sin(u * Math.PI) * 80;
      ctx.save(); ctx.translate(px, py); ctx.rotate(-1.2 + e); ctx.scale(18, 7); ctx.fillStyle = rgba(C.green, 1 - u * 0.5); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
    }
    if (pour >= 1) tag(ctx, x + 28, y + h - 2, TX.trained, { size: 26 });
    ctx.restore();
  });
  ctx.restore();
}

// ───────────── test: the site's demo question, and a one-click correction
function test(ctx, t, tFrame) {
  const w = i => wt('test', i), tap = w(12);
  chatCard(ctx, t, tFrame, {
    box: { x: 60, y: 420, w: 960, h: 680 }, title: TX.testTitle, sub: TX.testSub, t0: S.test.scene, t1: S.test.end, items: [
      { at: w(4) - 0.1, side: 'in', text: TX.q },
      { ty: w(4) + 0.4, at: w(6), side: 'out', text: TX.a },
      { at: w(7), h: 90, side: 'out', draw: (c, X0, X1, y) => {
        const done = prog(t, tap, tap + 0.15), press = Math.exp(-Math.pow((t - tap) / 0.07, 2)), bw = 360, bx = X1 - bw;
        c.save(); c.translate(bx + bw / 2, y + 45); c.scale(1 - 0.05 * press, 1 - 0.05 * press); c.translate(-(bx + bw / 2), -(y + 45));
        c.beginPath(); c.roundRect(bx, y, bw, 90, 45); c.fillStyle = rgba(mix(C.card, C.chipBg, done)); c.fill(); c.strokeStyle = rgba(mix(C.b1, C.green, done)); c.lineWidth = 3; c.stroke();
        T(c, done > 0.5 ? TX.saved : TX.fix, bx + bw / 2, y + 57, { size: 32, w: 700, a: 'center', fill: done > 0.5 ? C.chipInk : C.ink });
        c.restore();
      } },
    ],
  });
  const pa = prog(t, tap - 0.6, tap - 0.05);
  if (pa > 0 && t < S.test.end) pointer(ctx, lerp(1000, 790, EASE.expo(pa)), lerp(1700, 955, EASE.expo(pa)), 1.8, Math.exp(-Math.pow((t - tap) / 0.07, 2)));
}

// ───────────── live: the master switch on "on", then each channel on its own name
function live(ctx, t) {
  const L = S.live, w = i => wt('live', i), inn = EASE.expo(prog(t, L.scene + 0.05, L.scene + 0.5)), out = E.inCubic(prog(t, L.end - 0.1, L.end + 0.25));
  if (inn <= 0 || out >= 1) return;
  const x = 90, y = 380, W = 900, k = 0.94 + 0.06 * inn;
  ctx.save(); ctx.globalAlpha = inn * (1 - out); ctx.translate(540, 800); ctx.scale(k, k); ctx.translate(-540, -800);
  card(ctx, x, y, W, 840, 44);
  T(ctx, TX.live, x + 48, y + 84, { size: 48, w: 700, fill: C.ink, ls: -1 });
  const master = prog(t, w(3) - 0.05, w(3) + 0.2);
  T(ctx, TX.master, x + 48, y + 186, { size: 38, w: 700, fill: C.t1 }); toggle(ctx, x + W - 110, y + 172, master, { w: 132, h: 74 });
  ctx.fillStyle = rgba(C.b1); ctx.fillRect(x + 48, y + 250, W - 96, 2);
  const at = [w(4), w(5), w(6), w(7)];
  TX.channels.forEach(([n, dot], i) => {
    const on = prog(t, at[i] - 0.05, at[i] + 0.2), ry = y + 340 + i * 130;
    ctx.fillStyle = rgba(dot); ctx.beginPath(); ctx.arc(x + 66, ry, 13, 0, TAU); ctx.fill();
    T(ctx, n, x + 100, ry + 13, { size: 38, w: 600, fill: C.t1 });
    toggle(ctx, x + W - 110, ry, on);
  });
  ctx.restore();
}

const focusAt = track([[S.turn.scene, LOGO[0], LOGO[1]], [wt('turn', 6), 540, 1100], [S.test.scene + 0.3, 600, 700], [wt('test', 12), 800, 1000],
  [S.live.scene, 540, 560], [S.live.end - 0.3, 900, 1100], [S.payoff.scene + 0.2, 540, 760], [S.end.scene + 0.4, 540, 630], [S.end.scene + 1.9, 700, 1262], [S.end.scene + 2.6, 540, 1420]]);

export default {
  async setup(api) { TX = COPY[api.lang] || COPY.en; await themeFrom(import.meta.url); },
  draw(ctx, t, api) {
    stage(ctx, t, api, {
      schedule: SCHEDULE, focusAt, night: 0.25, endFrom: payoffDots(S.payoff.scene, S.end.scene),
      content: (tFrame, { name }) => {
        train(ctx, t);
        const lo = E.inCubic(prog(t, S.test.scene - 0.1, S.test.scene + 0.25));
        if (lo < 1) { ctx.save(); ctx.globalAlpha = 1 - lo; turnLogo(ctx, t, { t0: S.turn.scene, name, at: LOGO }); ctx.restore(); }
        test(ctx, t, tFrame);
        live(ctx, t);
        payoff(ctx, t, S.payoff.scene, S.end.scene, { title: TX.done, sub: TX.doneSub, cy: 700 });
        coffee(ctx, t);
      },
    });
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, C.light ? 0.06 : 0.28); },
};
