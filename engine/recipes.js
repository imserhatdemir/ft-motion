// ft-motion recipes: whole visual ideas as functions, built on core.js helpers.
// Each one paints into the current transform and depends only on its arguments.
import { TAU, clamp, lerp, rgba, mix, E, EASE, cubicBezier, project3D, grid, ripple, rrect } from './core.js';

// ───────────────────────────── tunnel of rounded squares
/**
 * Layer-phase for tunnel(): steady drift plus a surge on every beat (each beat shoves the tunnel forward half a layer
 * with an expo-out, so the camera "punches" with the kick). Returns a number that only ever grows.
 */
export function surge(t, beat, { rate = 1.1, kick = 0.5 } = {}) {
  const tb = t / beat, fl = Math.floor(tb);
  return rate * t + kick * (fl + E.outExpo(tb - fl));
}
/**
 * Infinite zoom through nested rounded squares. Layers keep their identity while they travel outward (colour and twist
 * come from the layer's global index), inner layers fade in, outer ones leave the frame.
 * colors: { a: main, b: accent2, c: cream, planes: [dark, darker] } (rgb arrays).
 */
export function tunnel(ctx, W, H, phase, t, { layers = 17, base = 44, growth = 1.27, twist = 0.115, spin = 0.12, radius = 0.2, colors = {} } = {}) {
  const c = { a: [255, 106, 61], b: [255, 181, 71], c: [242, 237, 228], planes: [[13, 13, 17], [17, 17, 22]], ...colors };
  const fl = Math.floor(phase), fr = phase - fl;
  ctx.save(); ctx.translate(W / 2, H / 2);
  for (let i = layers; i >= 0; i--) {
    const d = i - fr, size = base * Math.pow(growth, d), idx = i + fl, odd = idx % 2 === 1;
    ctx.save(); ctx.rotate(idx * twist + t * spin); ctx.globalAlpha = clamp(d / 2.5);
    rrect(ctx, -size / 2, -size / 2, size, size, size * radius);
    ctx.fillStyle = rgba(c.planes[odd ? 0 : 1]); ctx.fill();
    ctx.strokeStyle = rgba(idx % 5 === 0 ? c.b : odd ? c.a : c.c);
    ctx.lineWidth = (odd ? 3 : 1.5) + size * (odd ? 0.03 : 0.006); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ───────────────────────────── dot sphere with orbit rings
const _sphere = new Map();
function fibonacci(n) {
  let p = _sphere.get(n);
  if (!p) { p = []; for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), ph = i * 2.399963; p.push([Math.cos(ph) * r, y, Math.sin(ph) * r]); } _sphere.set(n, p); }
  return p;
}
/**
 * A sphere of evenly spread dots (fibonacci lattice) that reads as solid: a dark disc hides what is behind it, back dots
 * are dim, front dots bright, and a latitude `band` lights up in the accent colour. Then orbit rings and a satellite with a trail.
 * opts: { yaw, tilt, count, band (−1..1 latitude, or null), pulse (0..1, swells the radius), rings, satellite (angle, or null), colors }
 */
export function dotSphere(ctx, cx, cy, R0, { yaw = 0, tilt = 0.42, count = 1300, band = null, pulse = 0, rings = true, satellite = null, colors = {} } = {}) {
  const c = { accent: [255, 106, 61], ink: [242, 237, 228], sat: [255, 181, 71], disc: [12, 12, 15], ...colors };
  const R = R0 * (1 + 0.07 * pulse), P = (x, y, z, o = {}) => project3D(x * R, y * R, z * R, { tilt, yaw, D: 1500, ...o });
  const g = ctx.createRadialGradient(cx - 60, cy - 80, 20, cx, cy, R * 1.02);
  g.addColorStop(0, 'rgba(34,26,26,0.95)'); g.addColorStop(0.85, rgba(c.disc, 0.95)); g.addColorStop(1, rgba(c.accent, 0.28));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  const pts = fibonacci(count).map(([x, y, z]) => ({ ...P(x, y, z), hi: band === null ? 0 : Math.exp(-Math.pow((y - band) / 0.07, 2)) }));
  const dot = (p, r, a, col) => { ctx.globalAlpha = a; ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, r, 0, TAU); ctx.fill(); };
  for (const p of pts) if (p.z > 0) dot(p, (1.6 + p.hi * 1.5) * p.s, 0.16 + 0.1 * (1 + (-p.z / R)), p.hi > 0.4 ? c.accent : c.ink);
  if (rings) {
    [[1.42, 0.5, 0.0, 1.0], [1.62, -0.9, 1.1, -0.7], [1.86, 0.15, 2.1, 0.5]].forEach(([rr, rx, ry, sp]) => {
      let prev = null;
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * TAU, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        const p = P(x, -z * Math.sin(rx), z * Math.cos(rx), { yaw: ry + yaw * sp * 0.6 });
        if (prev) { ctx.globalAlpha = 1; ctx.strokeStyle = rgba(c.ink, p.z < 0 ? 0.55 : 0.14); ctx.lineWidth = p.z < 0 ? 2.2 : 1.4; ctx.beginPath(); ctx.moveTo(cx + prev.x, cy + prev.y); ctx.lineTo(cx + p.x, cy + p.y); ctx.stroke(); }
        prev = p;
      }
    });
  }
  for (const p of pts) if (p.z <= 0) dot(p, (2.2 + (-p.z / R) * 1.5 + p.hi * 3.0) * p.s, 0.5 + 0.5 * (-p.z / R), p.hi > 0.35 ? c.accent : c.ink);
  if (satellite !== null) {
    for (let k = 12; k >= 0; k--) {
      const a = satellite - k * 0.05, x = Math.cos(a) * 1.42, z = Math.sin(a) * 1.42;
      const p = P(x, -z * Math.sin(0.5), z * Math.cos(0.5), { yaw: yaw * 0.6 });
      dot(p, k === 0 ? 15 : 12 * (1 - k / 14), (1 - k / 13) * (p.z < 0 ? 1 : 0.4), c.sat);
    }
  }
  ctx.globalAlpha = 1;
}

// ───────────────────────────── easing curve explained
/**
 * A cubic-bezier easing curve drawn as a graph: grid, axes, control handles, the curve drawing itself, and a ball riding it
 * with dashed projections onto both axes (linear time on X, eased value on Y). Returns the eased value at the ball.
 * (x, y) = bottom-left of the plot. s = { cp: [x1, y1, x2, y2], handles: 0..1, drawn: 0..1, ball: 0..1 or null, pop: 0..1 (ring at the end) }.
 * Animate `cp` from [.33, .33, .66, .66] (linear) to the target so the curve visibly bends into its shape.
 */
export function easingGraph(ctx, x, y, size, s, { ink = [242, 237, 228], accent = [255, 106, 61], bg = [12, 12, 14], alpha = 1 } = {}) {
  const cp = s.cp, f = cubicBezier(...cp), X = v => x + size * v, Y = v => y - size * v, hp = s.handles ?? 1;
  const bx = u => 3 * (1 - u) * (1 - u) * u * cp[0] + 3 * (1 - u) * u * u * cp[2] + u * u * u;
  const by = u => 3 * (1 - u) * (1 - u) * u * cp[1] + 3 * (1 - u) * u * u * cp[3] + u * u * u;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.strokeStyle = rgba(ink, 0.08); ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 4; i++) { ctx.moveTo(X(i / 4), Y(0)); ctx.lineTo(X(i / 4), Y(1)); ctx.moveTo(X(0), Y(i / 4)); ctx.lineTo(X(1), Y(i / 4)); }
  ctx.stroke();
  ctx.strokeStyle = rgba(ink, 0.35); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(0), Y(1.02)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(1.02), Y(0)); ctx.stroke();
  const h1 = [lerp(X(0), X(cp[0]), hp), lerp(Y(0), Y(cp[1]), hp)], h2 = [lerp(X(1), X(cp[2]), hp), lerp(Y(1), Y(cp[3]), hp)];
  ctx.strokeStyle = rgba(ink, 0.55); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(...h1); ctx.moveTo(X(1), Y(1)); ctx.lineTo(...h2); ctx.stroke();
  ctx.strokeStyle = rgba(accent); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= 90; i++) { const u = (i / 90) * (s.drawn ?? 1); i ? ctx.lineTo(X(bx(u)), Y(by(u))) : ctx.moveTo(X(bx(u)), Y(by(u))); }
  ctx.stroke();
  ctx.fillStyle = rgba(bg); ctx.strokeStyle = rgba(ink); ctx.lineWidth = 3.5;
  for (const h of [h1, h2]) { ctx.beginPath(); ctx.arc(h[0], h[1], 12 * hp, 0, TAU); ctx.fill(); ctx.stroke(); }
  let ey = null;
  if (s.ball !== null && s.ball !== undefined) {
    const tb = s.ball; ey = f(tb); const px = X(tb), py = Y(ey);
    for (let k = 9; k >= 1; k--) { const tk = clamp(tb - k * 0.022); ctx.globalAlpha = alpha * (1 - k / 10) * 0.4; ctx.fillStyle = rgba(accent); ctx.beginPath(); ctx.arc(X(tk), Y(f(tk)), 20 * (1 - k / 14), 0, TAU); ctx.fill(); }
    ctx.globalAlpha = alpha; ctx.setLineDash([9, 9]); ctx.strokeStyle = rgba(ink, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, Y(0)); ctx.moveTo(px, py); ctx.lineTo(X(0), py); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = rgba(ink); ctx.beginPath(); ctx.arc(px, Y(0), 11, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(accent); ctx.beginPath(); ctx.arc(X(0), py, 15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, 24, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(ink); ctx.lineWidth = 5; ctx.stroke();
    if (s.pop > 0 && s.pop < 1) { ctx.globalAlpha = alpha * (1 - s.pop); ctx.strokeStyle = rgba(accent); ctx.lineWidth = 6 * (1 - s.pop) + 1; ctx.beginPath(); ctx.arc(px, py, 24 + 90 * E.outExpo(s.pop), 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
  return ey;
}

// ───────────────────────────── dot grid with beat ripples
/**
 * A grid of dots that swell, push outwards and tint as ripples pass. launches = [[t0, amplitude], …] (on the beat grid).
 * Uses core's grid() and ripple(); the ring outlines are drawn too. Returns nothing.
 */
export function rippleDots(ctx, cx, cy, t, launches, { cols = 11, rows = 11, spacing = 70, base = 5.5, gain = 25, push = 0.07, from = [10, 10, 13], to = [255, 106, 61], speed = 1050, width = 120, life = 1.2, rings = true, ringWidth = 7 } = {}) {
  const opts = { speed, width, life };
  for (const p of grid(cols, rows, spacing)) {
    let G = 0; for (const [t0, amp] of launches) G += amp * ripple(p, [0, 0], t0, t, opts);
    G = clamp(G * 1.7, 0, 1.4);
    const k = 1 + G * push;
    ctx.fillStyle = rgba(mix(from, to, clamp(G * 1.4))); ctx.beginPath(); ctx.arc(cx + p.x * k, cy + p.y * k, base + gain * G, 0, TAU); ctx.fill();
  }
  if (rings) for (const [t0, amp] of launches) {
    const a = t - t0; if (a < 0 || a > life / 2) continue; const q = a / (life / 2);
    ctx.save(); ctx.strokeStyle = rgba(to); ctx.globalAlpha = (1 - q) * amp; ctx.lineWidth = ringWidth * (1 - q) + 1; ctx.beginPath(); ctx.arc(cx, cy, speed * a, 0, TAU); ctx.stroke(); ctx.restore();
  }
}
