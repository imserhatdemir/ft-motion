// A new ft-motion project. draw(ctx, t, api) paints the whole frame at scene time t (seconds).
// Rules: depend only on t · no Math.random/Date (use hash) · start sections on bar lines (api.at(bar)).
import { TAU, prog, rgba, E, EASE, spring, setFont, vignette } from '../../engine/core.js';

const BG = [12, 12, 14], INK = [240, 240, 236], ACCENT = [255, 106, 61];

export default {
  // setup(api) { }                       // optional, runs once (async allowed)
  draw(ctx, t, api) {
    const { W, H } = api;
    ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);

    // bar 0: a headline rises out of a mask
    const p = EASE.expo(prog(t, 0.1, 0.9));
    setFont(ctx, 700, 120, 'Inter', -4); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.save(); ctx.beginPath(); ctx.rect(0, H / 2 - 130, W, 175); ctx.clip();
    ctx.fillStyle = rgba(INK); ctx.fillText('Hello.', W / 2, H / 2 + 40 + (1 - p) * 150);
    ctx.restore();

    // bar 1: a dot springs in on the downbeat
    const s = spring(t - api.at(1), 16, 7);
    if (s > 0) { ctx.fillStyle = rgba(ACCENT); ctx.beginPath(); ctx.arc(W / 2, H / 2 + 160, 18 * s, 0, TAU); ctx.fill(); }
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, 0.25); },
};
