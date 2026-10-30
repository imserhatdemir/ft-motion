// examples/dotkesk/logo-check: the rebuilt orbit logo next to the site's PNG at the same scale, and the two overlaid
// (difference blend: anything that isn't black is a mismatch). Run: node ft.mjs stills examples/dotkesk/logo-check 0s,1s
// At 0 s the logo is at rest (must match); at 1 s the dashes orbit (shows the motion keeps the ring structure).
import { loadImage, drawAsset } from '../../../engine/brand.js';
import { C, bg, T, drawLogo, LOGO_W, setTheme } from '../kit.js';

let PNG = null;
const W0 = 860, R = W0 / LOGO_W;
const original = (ctx, cx, cy, alpha = 1) => drawAsset(ctx, PNG, cx - 0.035 * R, cy + 0.0225 * R, W0, W0, { alpha });

export default {
  async setup() { setTheme('dark'); PNG = await loadImage('/examples/dotkesk/assets/dotkesk-orbit-logo.png', 1600); },
  draw(ctx, t, { W, H }) {
    bg(ctx, W, H, 0, { glow: 0, rings: 0 });
    T(ctx, 'site PNG', 40, 70, { size: 34, fill: C.t2 }); original(ctx, 540, 380);
    T(ctx, 'rebuilt', 40, 760, { size: 34, fill: C.t2 }); drawLogo(ctx, 540, 1040, W0, { spin: t * 0.8, badge: false });
    T(ctx, 'difference', 40, 1400, { size: 34, fill: C.t2 });
    // the rebuild goes to its own layer first, so the blend compares the finished logos (not sphere and dashes one by one)
    const off = new OffscreenCanvas(W, H), o = off.getContext('2d');
    drawLogo(o, 540, 1650, W0, { spin: t * 0.8, badge: false });
    ctx.save(); original(ctx, 540, 1650); ctx.globalCompositeOperation = 'difference'; ctx.drawImage(off, 0, 0); ctx.restore();
  },
};
