// The dotkesk mark rebuilt from the supplied logo (1024 px master, measured): a lime → green sphere inside three tilted
// orbit rings of white elongated dots. Ring geometry was fitted to the dot centroids: centre (513, 511), rotation 27°,
// axis ratio 0.6, radii 238 / 302 / 371; each dot keeps its measured arc position and size. Units are master px.
import { TAU, clamp, lerp } from '../../engine/core.js';

const ROT = 27 * Math.PI / 180, Q = 0.6;
const RADII = [238.4, 302.3, 370.7];
// [arc fraction, length, width, dx, dy, dAngle] per dot, measured from the 1024 px master; dx/dy (px) and dAngle (rad)
// are residuals from the fitted ellipse and its tangent (0 for dots hidden behind the sphere, which are filled in evenly)
const DOTS = [
  [[0.0238, 49, 24, 9.8, 6.6, -0.20], [0.0804, 62, 25, 1.4, 1.7, -0.02], [0.1450, 65, 25, -0.4, -1.3, -0.08], [0.2139, 68, 25, 0.7, -4.2, -0.10], [0.2869, 69, 25, 5.7, -5.8, -0.11], [0.3614, 67, 25, 10.1, -2.7, -0.17], [0.4293, 62, 26, 4.6, 0.5, -0.26], [0.4808, 48, 24, -6.9, -2.7, -0.36], [0.5283, 50, 24, -9.7, -6.9, 0.00], [0.5791, 58, 23, -1.8, -2.1, 0.02], [0.6478, 60, 25, 0.0, 0.0, 0.00], [0.7166, 60, 25, 0.0, 0.0, 0.00], [0.7854, 60, 25, 0.0, 0.0, 0.00], [0.8541, 60, 25, 0.0, 0.0, 0.00], [0.9229, 43, 21, -2.9, -0.2, -0.02], [0.9729, 54, 26, 6.4, 2.2, -0.35]],
  [[0.0363, 55, 26, 1.2, 1.0, -0.25], [0.0833, 66, 27, -1.4, -1.7, -0.07], [0.1387, 67, 26, -0.2, -0.6, -0.14], [0.1931, 67, 26, 0.0, -1.4, -0.12], [0.2508, 69, 26, -0.5, 1.0, -0.09], [0.3076, 69, 26, 0.5, -0.4, -0.09], [0.3624, 68, 25, 3.2, -0.8, -0.16], [0.4146, 63, 25, 1.6, 0.1, -0.21], [0.4610, 59, 27, -3.4, -1.0, -0.24], [0.5062, 53, 27, -4.4, -2.4, -0.09], [0.5500, 57, 25, -2.3, -2.0, -0.06], [0.5965, 58, 23, -0.7, -1.0, -0.05], [0.6413, 61, 23, 1.2, 3.2, -0.14], [0.6954, 61, 26, 0.0, 0.0, 0.00], [0.7494, 61, 26, 0.0, 0.0, 0.00], [0.8034, 61, 26, 0.0, 0.0, 0.00], [0.8575, 64, 25, -5.2, 1.5, -0.12], [0.9095, 61, 25, -4.2, -0.0, -0.16], [0.9558, 55, 25, 4.0, 1.0, -0.20], [0.9968, 51, 26, 8.5, 4.2, -0.23]],
  [[0.0274, 55, 27, -5.7, -4.0, -0.23], [0.0660, 65, 29, -5.6, -5.8, -0.26], [0.1140, 80, 31, -3.3, -5.9, -0.17], [0.1701, 72, 28, 0.1, 0.8, -0.20], [0.2144, 68, 27, -0.6, 3.6, -0.13], [0.2631, 71, 27, -6.2, 9.5, -0.09], [0.3074, 70, 26, -2.1, 1.5, -0.13], [0.3524, 71, 27, -0.8, 0.3, -0.15], [0.3951, 71, 28, -0.3, 0.0, -0.20], [0.4375, 66, 28, 0.4, 0.1, -0.19], [0.4778, 57, 29, 1.3, 0.5, -0.20], [0.5163, 57, 29, 3.2, 2.0, -0.07], [0.5560, 63, 28, 4.1, 3.9, -0.14], [0.5998, 63, 25, 2.1, 3.2, -0.14], [0.6458, 68, 25, 0.3, 0.9, -0.17], [0.6913, 67, 25, -0.0, -2.7, -0.18], [0.7350, 68, 25, 1.6, -4.5, -0.16], [0.7778, 68, 26, 3.2, -3.7, -0.16], [0.8223, 68, 26, 2.1, -1.2, -0.14], [0.8655, 66, 25, -0.7, 0.2, -0.14], [0.9067, 62, 25, -3.6, 0.0, -0.12], [0.9481, 57, 26, -2.7, -0.6, -0.14], [0.9896, 56, 27, -4.9, -2.2, -0.10]],
];

const SPHERE = { x: 6, y: -4, r: 192, top: [214, 236, 74], bottom: [90, 219, 76] };

// arc-length tables: fraction of the ellipse perimeter → parameter angle
const TABLE = RADII.map(r => {
  const N = 720, acc = [0];
  for (let i = 1; i <= N; i++) {
    const a = (i - 0.5) / N * TAU;
    acc.push(acc[i - 1] + Math.hypot(r * Math.sin(a), r * Q * Math.cos(a)));
  }
  return acc.map(v => v / acc[N]);
});
function angleAt(k, f) {
  const T = TABLE[k], N = T.length - 1;
  f = ((f % 1) + 1) % 1;
  let lo = 0, hi = N;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] < f) lo = m; else hi = m; }
  return (lo + (f - T[lo]) / (T[hi] - T[lo] || 1)) / N * TAU;
}

/**
 * Draw the mark centred on the ring centre. size = drawn width of the 1024 master.
 * spin: extra turns of the dots along their orbits; sphere / rings ∈ [0,1] build-in amounts (rings fly in per dot);
 * dotColor / alpha for light or dark grounds.
 */
export function dkLogo(ctx, cx, cy, size, { spin = 0, sphere = 1, rings = 1, dotColor = [255, 255, 255], alpha = 1, outline = null } = {}) {
  const u = size / 1024;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(u, u); ctx.globalAlpha *= alpha;
  const dots = [];
  DOTS.forEach((ring, k) => {
    const r = RADII[k];
    ring.forEach(([f, len, w, rx, ry, ra], i) => {
      const d = clamp(rings * 1.5 - (i / ring.length) * 0.3 - k * 0.1);    // fully built at rings = 1
      if (d <= 0) return;
      const a = angleAt(k, f + spin * (1 - k * 0.12) - (1 - d) * 0.25);
      const ex = r * Math.cos(a), ey = r * Q * Math.sin(a);
      const fade = Math.max(0, 1 - Math.abs(spin) * 8);                  // residuals only while the mark is (nearly) still
      const x = ex * Math.cos(ROT) - ey * Math.sin(ROT) + rx * fade * d, y = ex * Math.sin(ROT) + ey * Math.cos(ROT) + ry * fade * d;
      const tx = -r * Math.sin(a), ty = r * Q * Math.cos(a);
      const ang = Math.atan2(tx * Math.sin(ROT) + ty * Math.cos(ROT), tx * Math.cos(ROT) - ty * Math.sin(ROT));
      dots.push({ x, y, ang: ang + ra * fade, len: len * d, w: w * d, front: Math.sin(a) > 0 });
    });
  });
  const dot = p => {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.beginPath(); ctx.ellipse(0, 0, p.len / 2, p.w / 2, 0, 0, TAU);
    ctx.fillStyle = `rgb(${dotColor})`; ctx.fill();
    if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = 3 / u; ctx.stroke(); }
    ctx.restore();
  };
  dots.filter(p => !p.front).forEach(dot);
  const R = SPHERE.r * sphere;
  if (R > 0) {
    const g = ctx.createLinearGradient(0, SPHERE.y - R, 0, SPHERE.y + R);
    g.addColorStop(0, `rgb(${SPHERE.top})`); g.addColorStop(1, `rgb(${SPHERE.bottom})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(SPHERE.x, SPHERE.y, R, 0, TAU); ctx.fill();
  }
  dots.filter(p => p.front).forEach(dot);
  ctx.restore();
}
/** Offset from the ring centre to the sphere centre, in units of `size` (for aiming camera dives at the sphere). */
export const SPHERE_OFFSET = { x: SPHERE.x / 1024, y: SPHERE.y / 1024, r: SPHERE.r / 1024 };
