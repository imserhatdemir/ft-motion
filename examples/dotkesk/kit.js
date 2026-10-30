// examples/dotkesk: the shared kit of the dotkesk daily series (1080x1920 Reels / Shorts, English, one narrator).
// Everything here comes from dotkesk.com, in its two looks:
//   light (default): the hero's radial white → mint (#FFFFFF → #DAF2E0), gray-900 ink, white cards with the nav's soft shadow,
//                    chat bubbles gray-100 (customer) and green-50 (AI), the logo on a dark disc like the site's header badge;
//   dark: the app tokens (--c-bg #0C0E14, --c-card, --c-b1, --c-t1…).
// Both: Inter, the green pill CTA (#16A34A) with a white disc and an arrow that turns -45° on hover, and the orbit logo rebuilt
// from the 6440 px PNG (see DASHES). Pick the look with setTheme() in an episode's setup (project.json "theme").
// Episodes import: C (the current palette), bg, T, drawLogo / logoDashes (the orbit dots double as the series' particles),
// captions, bubble, endCard, camera. Times are scene seconds; schedules come from each episode's voice.py.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, hash, setFont, rrect, pill, pointer, check, wrap } from '../../engine/core.js';
import { flash } from '../../engine/fx.js';

const BRAND = { green: [22, 163, 74], limeTop: [219, 237, 73], limeBot: [92, 221, 79], white: [255, 255, 255], dash: [255, 255, 255] };
const THEMES = {
  light: {
    light: true, bg: [255, 255, 255], bg2: [218, 242, 224], night: [228, 232, 238], panel: [249, 250, 251], card: [255, 255, 255],
    b1: [229, 231, 235], b2: [243, 244, 246], ink: [16, 24, 40], t1: [30, 41, 57], t2: [106, 114, 130], t3: [153, 161, 175], t4: [209, 213, 220],
    inBg: [243, 244, 246], inInk: [54, 65, 83], outBg: [240, 253, 244], outLine: [187, 247, 208], outInk: [30, 41, 57],
    hi: [22, 163, 74], chipBg: [220, 252, 231], chipInk: [21, 128, 61], disc: [16, 24, 40], loose: [153, 161, 175],
    shadow: 'rgba(15,23,42,0.10)', capShadow: 'rgba(255,255,255,0.9)', ring: [16, 24, 40],
  },
  dark: {
    light: false, bg: [12, 14, 20], bg2: [12, 14, 20], night: [12, 14, 20], panel: [15, 17, 23], card: [22, 27, 39],
    b1: [30, 37, 53], b2: [37, 42, 58], ink: [255, 255, 255], t1: [226, 232, 240], t2: [148, 163, 184], t3: [100, 116, 139], t4: [71, 85, 105],
    inBg: [30, 37, 53], inInk: [226, 232, 240], outBg: [22, 163, 74], outLine: null, outInk: [255, 255, 255],
    hi: [219, 237, 73], chipBg: [20, 83, 45], chipInk: [74, 222, 128], disc: [12, 14, 20], loose: [255, 255, 255],
    shadow: 'rgba(0,0,0,0.35)', capShadow: 'rgba(0,0,0,0.55)', ring: [255, 255, 255],
  },
};
/** the current palette (brand colours + the theme's roles); setTheme swaps the roles in place */
export const C = { ...BRAND, ...THEMES.light };
export function setTheme(name = 'light') { Object.assign(C, THEMES[name] ?? THEMES.light); }
/** reads "theme" from the episode's project.json (next to its scene.js) */
export async function themeFrom(sceneUrl) {
  try { setTheme((await (await fetch(new URL('./project.json', sceneUrl))).json()).theme); } catch { setTheme('light'); }
}
export const F = 'Inter';

// ───────────── text
export function T(ctx, s, x, y, { w = 700, size = 60, a = 'left', fill = C.t1, ls = 0, alpha = 1, base = 'alphabetic' } = {}) {
  if (alpha <= 0.002) return 0;
  setFont(ctx, w, size, F, ls); ctx.textAlign = a; ctx.textBaseline = base;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
  return ctx.measureText(s).width;
}
/** a line rising out of a mask; the box leaves room for descenders */
export function rise(ctx, s, x, base, size, p, o = {}) {
  if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 1.1, 1080, size * 1.45); ctx.clip();
  T(ctx, s, x, base + (1 - p) * size * 1.15, { size, ...o }); ctx.restore();
}
/** a card with the theme's soft shadow (the site's nav: 0 8px 30px rgba(15,23,42,.08)) */
export function card(ctx, x, y, w, h, r, { fill = C.card, line = C.b1, shadow = true } = {}) {
  ctx.save();
  if (shadow) { ctx.shadowColor = C.shadow; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12; }
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = rgba(fill); ctx.fill(); ctx.restore();
  if (line) { rrect(ctx, x, y, w, h, r); ctx.strokeStyle = rgba(line); ctx.lineWidth = 2; ctx.stroke(); }
}

// ───────────── background
// light: the hero's radial white → mint, dimmed to a cool grey at night; dark: near-black with a green glow.
// Behind everything, the logo's rings at giant scale turn slowly, so no frame is ever still.
export function bg(ctx, W, H, t, { glow = 0.5, gx = 540, gy = 820, night = 0, rings = 1 } = {}) {
  if (C.light) {
    const g = ctx.createRadialGradient(540, 0, 0, 540, 0, 2300);
    g.addColorStop(0, rgba(mix(C.bg, C.night, night))); g.addColorStop(1, rgba(mix(mix(C.bg2, C.bg, 0.35 * (1 - glow)), C.night, night)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (glow > 0) {
      const r = ctx.createRadialGradient(gx, gy, 0, gx, gy, 760);
      r.addColorStop(0, rgba(C.bg2, 0.9 * glow)); r.addColorStop(1, rgba(C.bg2, 0));
      ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H);
    if (glow > 0) {
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 900);
      g.addColorStop(0, rgba(C.green, 0.16 * glow)); g.addColorStop(0.5, rgba(C.green, 0.05 * glow)); g.addColorStop(1, rgba(C.green, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  if (rings > 0) {
    ctx.save(); ctx.globalAlpha = (C.light ? 0.035 : 0.04) * rings;
    for (const d of logoDashes(540, 900, 2300, t * 0.05)) dashFill(ctx, d, C.ring, 1);
    ctx.restore();
  }
}
// ───────────── the landing hero's glass (kesk-main-frontend src/pages/landing/HeroShader.tsx), rebuilt for Canvas 2D:
//   <Swirl colorA="#ffffff" colorB="#daf2e0" detail={1.7}/>   → soft white / mint blobs turning slowly
//   <ChromaFlow … #16A34A momentum={13} radius={3.5}/>        → green light that follows the cursor; here it follows `focus`
//   <FlutedGlass angle={31} frequency={8} refraction={4} aberration={0.61} highlight={0.12} lightAngle={-90} shape="rounded" speed={0.15}/>
//   <FilmGrain strength={0.05}/>
// Backdrop and flutes are soft, so they are built at quarter resolution and scaled up once; the flute edges, fringes and grain
// are drawn at full size. focusAt(t) → [x, y] (canvas px) is where the green flow sits; it trails behind like the site's momentum.
const GQ = 4, FLUTE_ANGLE = -(90 - 31) * Math.PI / 180, FLUTES = 6.4, SUB = 7;   // 6.4 here gives the ~8 slats per width seen on the site
const glassBufs = {};
const buf = (k, w, h) => { const c = glassBufs[k] ??= document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c; };
function grainTile(i) {
  const c = buf(`grain${i}`, 256, 256);
  if (!c._done) {
    const g = c.getContext('2d'), im = g.createImageData(256, 256);
    for (let p = 0; p < 256 * 256; p++) { const v = hash(p * 0.731 + i * 9137.3) * 255; im.data[p * 4] = im.data[p * 4 + 1] = im.data[p * 4 + 2] = v; im.data[p * 4 + 3] = 255; }
    g.putImageData(im, 0, 0); c._done = true;
  }
  return c;
}
function glassLayer(ctx, W, H, t, { focusAt = null, flow = 1, night = 0, frame = 0, base = [255, 255, 255], swirl = [218, 242, 224] } = {}) {
  const w = Math.round(W / GQ), h = Math.round(H / GQ);
  // 1 · backdrop: swirl + chroma flow
  const back = buf('back', w, h), b = back.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  b.fillStyle = rgba(base); b.fillRect(0, 0, w, h);
  const blob = (x, y, r, col, a) => { const g = b.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); b.fillStyle = g; b.fillRect(x - r, y - r, r * 2, r * 2); };
  for (let i = 0; i < 11; i++) {                                 // the swirl: blobs on slow orbits, mint and white in turn
    const a = t * (0.07 + 0.03 * hash(i)) * (i % 2 ? 1 : -1) + hash(i * 3.3) * TAU, rr = (0.18 + 0.3 * hash(i * 5.1)) * h;
    const x = w * (0.2 + 0.6 * hash(i * 7.9)) + Math.cos(a) * rr * 0.6, y = h * (0.1 + 0.8 * hash(i * 2.3)) + Math.sin(a) * rr;
    blob(x, y, w * (0.3 + 0.3 * hash(i * 4.4)), i % 2 ? base : swirl, i % 2 ? 0.9 : 1);
  }
  if (focusAt && flow > 0) for (let k = 3; k >= 0; k--) {        // chroma flow: the green light and its trail
    const [fx, fy] = focusAt(t - k * 0.18), x = fx / GQ + Math.sin(t * 0.9 + k) * 6, y = fy / GQ + Math.cos(t * 0.7 + k) * 6;
    blob(x, y, w * (0.4 - 0.05 * k), C.green, flow * (k ? 0.07 : 0.22));
  }
  // 2 · fluted glass: each flute is a rounded lens; strips across it show the backdrop shifted and mirrored (refraction)
  const glass = buf('glass', w, h), g = glass.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.drawImage(back, 0, 0);
  const fw = w / FLUTES * Math.abs(Math.sin(FLUTE_ANGLE)), dx = Math.cos(FLUTE_ANGLE), dy = Math.sin(FLUTE_ANGLE), nx = -dy, ny = dx, L = Math.hypot(w, h);
  const drift = (t * 0.15 * fw * 1.2) % fw, n = Math.ceil(L / fw) + 2, edges = [];
  for (let i = -n; i <= n; i++) {
    const o = i * fw + drift, cx = w / 2 + nx * o, cy = h / 2 + ny * o;
    for (let s = 0; s < SUB; s++) {
      const u0 = s / SUB - 0.5, u1 = (s + 1) / SUB - 0.5, um = (u0 + u1) / 2;
      const q = (u, sgn) => [cx + nx * u * fw + dx * L * sgn, cy + ny * u * fw + dy * L * sgn];
      g.save(); g.beginPath(); g.moveTo(...q(u0, -1)); g.lineTo(...q(u0, 1)); g.lineTo(...q(u1 + 0.002, 1)); g.lineTo(...q(u1 + 0.002, -1)); g.closePath(); g.clip();
      const k = -um * fw * 0.62 + (hash(i * 1.3) - 0.5) * fw * 0.5;         // rounded: each flute magnifies its strip of the backdrop
      g.drawImage(back, nx * k, ny * k);
      g.restore();
    }
    // light from the top (lightAngle -90): a bright band on the upper edge, a soft shade on the lower one
    const e0 = [cx - nx * fw / 2, cy - ny * fw / 2], e1 = [cx + nx * fw / 2, cy + ny * fw / 2];
    const gr = g.createLinearGradient(e0[0], e0[1], e1[0], e1[1]);
    gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.22, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)');
    gr.addColorStop(0.9, 'rgba(16,24,40,0.035)'); gr.addColorStop(1, 'rgba(16,24,40,0.06)');
    g.save(); g.beginPath(); g.moveTo(e0[0] - dx * L, e0[1] - dy * L); g.lineTo(e0[0] + dx * L, e0[1] + dy * L); g.lineTo(e1[0] + dx * L, e1[1] + dy * L); g.lineTo(e1[0] - dx * L, e1[1] - dy * L); g.closePath(); g.clip();
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore();
    edges.push(e0);
  }
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(glass, 0, 0, W, H);
  // 3 · full size: the sharp edge of every flute with its chromatic fringe (aberration)
  for (const [ex, ey] of edges) {
    const X = ex * GQ, Y = ey * GQ, LL = Math.hypot(W, H);
    for (const [off, col, lw] of [[-4, 'rgba(255,214,120,0.2)', 4], [0, 'rgba(255,255,255,0.4)', 2], [4.5, 'rgba(170,150,255,0.16)', 4]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(X + nx * off - dx * LL, Y + ny * off - dy * LL); ctx.lineTo(X + nx * off + dx * LL, Y + ny * off + dy * LL); ctx.stroke();
    }
  }
  // 4 · night: a cool grey wash over the glass while the store sleeps
  if (night > 0) { ctx.fillStyle = rgba([214, 220, 230], 0.6 * night); ctx.fillRect(0, 0, W, H); }
  // 5 · film grain (one of four tiles, shifted every frame)
  const tile = grainTile(frame % 4), ox = Math.floor(hash(frame * 1.7) * 256), oy = Math.floor(hash(frame * 2.9) * 256);
  ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
  for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(tile, x, y);
  ctx.restore();
}
/** The glass changes slowly, so it is built once per output frame and reused by that frame's motion-blur subframes. */
export function heroGlass(ctx, W, H, t, o = {}) {
  const full = buf('full', W, H), frame = o.frame ?? 0;
  if (full._key !== frame) {
    const g = full.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    glassLayer(g, W, H, t, o); full._key = frame;
  }
  ctx.drawImage(full, 0, 0);
}

/** a slow push-in through each section: [[start, end], …] → transform around (cx, cy). Captions stay outside it. */
export function camera(ctx, t, sections, { cx = 540, cy = 860, amount = 0.035 } = {}) {
  const s = sections.find(([a, b]) => t >= a && t < b); if (!s) return;
  const k = 1 + amount * EASE.css(prog(t, s[0], s[1]));
  ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
}

// ───────────── the orbit logo
// 54 dashes measured from dotkesk-orbit-logo.png (centre, length, width in sphere radii, angle in degrees), relative to the sphere
// centre. The last three sit partly behind the sphere. The rings are concentric ellipses: centre RING_C, tilt RING_TH, squash RING_K.
const DASHES = [
  [-1.8105, -0.6441, 0.2962, 0.1530, 88.3], [-1.7872, -0.2559, 0.3444, 0.1495, 63.7], [-1.6409, -0.9783, 0.2958, 0.1543, 125.7], [-1.6195, 0.1214, 0.3716, 0.1476, 47.2],
  [-1.5112, -0.3965, 0.3051, 0.1428, 73.6], [-1.4319, -0.7521, 0.2757, 0.1441, 116.8], [-1.3936, -0.0313, 0.3262, 0.1323, 53.1], [-1.3696, 0.4562, 0.3735, 0.1409, -142.5],
  [-1.3246, -1.1984, 0.3319, 0.1447, 148.2], [-1.2131, -0.4454, 0.2534, 0.1268, 81.3], [-1.1578, -0.9789, 0.3000, 0.1329, 149.3], [-1.1543, 0.3089, 0.3540, 0.1319, -139.8],
  [-1.1220, -0.1032, 0.3249, 0.1348, 55.6], [-1.0767, -0.7185, 0.2585, 0.1262, 139.3], [-1.0466, 0.7588, 0.3629, 0.1383, -149.4], [-0.9220, -1.3048, 0.3310, 0.1332, 166.2],
  [-0.8722, 0.2419, 0.3476, 0.1300, -141.4], [-0.8457, 0.6118, 0.3578, 0.1345, -148.0], [-0.7971, -1.0789, 0.3032, 0.1211, 169.8], [-0.7489, -0.8335, 0.3013, 0.1214, 167.6],
  [-0.6994, 1.0412, 0.3716, 0.1419, -156.4], [-0.5390, 0.5364, 0.3591, 0.1316, -153.3], [-0.4799, -1.3099, 0.3527, 0.1332, 176.8], [-0.4665, 0.8597, 0.3581, 0.1351, -157.6],
  [-0.4268, -1.0585, 0.3195, 0.1220, 178.3], [-0.2390, 1.2093, 0.3550, 0.1403, -167.2], [-0.1550, 0.7543, 0.3518, 0.1326, -164.9], [-0.0441, -1.2399, 0.3518, 0.1310, -174.4],
  [-0.0364, 1.0208, 0.3502, 0.1342, -170.1], [0.1834, 1.3188, 0.3792, 0.1479, -179.5], [0.2629, 0.8732, 0.3409, 0.1316, -178.4], [0.3696, -1.0974, 0.3553, 0.1323, -165.1],
  [0.3917, 1.1115, 0.3508, 0.1367, 177.4], [0.6744, 0.8725, 0.3262, 0.1326, 166.0], [0.7105, 1.3383, 0.4173, 0.1639, 169.3], [0.7460, -0.8978, 0.3553, 0.1342, -157.1],
  [0.8272, 1.0843, 0.3431, 0.1399, 164.1], [1.0332, 0.7380, 0.2553, 0.1284, 124.2], [1.0559, -0.2971, 0.3351, 0.1297, -139.0], [1.0949, -0.6236, 0.3550, 0.1351, -148.3],
  [1.1550, 0.4316, 0.2834, 0.1345, 76.1], [1.1655, 1.2617, 0.3431, 0.1508, 145.9], [1.1875, 0.9550, 0.2856, 0.1364, 129.7], [1.2990, 0.0342, 0.3176, 0.1307, 53.3],
  [1.3808, -0.3182, 0.3422, 0.1335, -138.4], [1.4259, 0.7304, 0.2668, 0.1348, 101.0], [1.4489, 0.3942, 0.2853, 0.1329, 72.7], [1.4898, 1.0850, 0.2885, 0.1399, 124.8],
  [1.5952, 0.0121, 0.3224, 0.1332, 55.4], [1.7000, 0.7879, 0.2914, 0.1399, 102.7], [1.7364, 0.3942, 0.2997, 0.1367, 72.0],
  [-0.0473, -0.9805, 0.3163, 0.1310, 180.0], [0.8058, -0.5390, 0.3195, 0.1310, 52.0], [1.0383, 0.1070, 0.2556, 0.1278, 67.6],
];
const RING_C = [-0.0305, 0.0145], RING_TH = 26.99 * Math.PI / 180, RING_K = 0.6035;
/** the logo's width in sphere radii (bounding box of the PNG) */
export const LOGO_W = 3.706;
const toRing = (x, y) => { const c = Math.cos(RING_TH), s = Math.sin(RING_TH), dx = x - RING_C[0], dy = y - RING_C[1]; return [dx * c + dy * s, (-dx * s + dy * c) / RING_K]; };
const fromRing = (u, v) => { const c = Math.cos(RING_TH), s = Math.sin(RING_TH), w = v * RING_K; return [RING_C[0] + u * c - w * s, RING_C[1] + u * s + w * c]; };
const RING_INFO = DASHES.map(([x, y]) => { const [u, v] = toRing(x, y); return { r: Math.hypot(u, v), a: Math.atan2(v, u) }; });

/**
 * The dashes at logo centre (cx, cy) and logo width w, orbiting by `spin` radians (0 = the exact logo; inner rings turn faster).
 * Returns [{x, y, ang, hl, hw, front, i}] in canvas pixels. front = drawn over the sphere.
 */
export function logoDashes(cx, cy, w, spin = 0) {
  const R = w / LOGO_W;
  return DASHES.map(([x, y, L, Wd, deg], i) => {
    const { r, a } = RING_INFO[i];
    const da = spin * (r < 1.4 ? 1.35 : r < 1.75 ? 1.1 : 0.9);
    let px = x, py = y, ang = deg * Math.PI / 180, hl = L / 2;
    if (da) {
      const [u, v] = toRing(x, y), c = Math.cos(da), s = Math.sin(da);
      [px, py] = fromRing(u * c - v * s, u * s + v * c);
      // carry the dash direction through the same map (so dashes foreshorten at the sides like the original)
      const [du, dv] = (() => { const [a1, b1] = toRing(x + Math.cos(ang) * 0.01, y + Math.sin(ang) * 0.01); return [(a1 - u) * c - (b1 - v) * s, (a1 - u) * s + (b1 - v) * c]; })();
      const [qx, qy] = fromRing(u * c - v * s + du, u * s + v * c + dv);
      ang = Math.atan2(qy - py, qx - px); hl *= Math.hypot(qx - px, qy - py) / 0.01;
    }
    return { x: cx + px * R, y: cy + py * R, ang, hl: hl * R, hw: Wd / 2 * R, front: Math.sin(a + da) > 0, i };
  });
}
/** The sphere: the logo's top-to-bottom lime gradient. lit 0 = a dim grey sphere (the store asleep). */
export function sphere(ctx, cx, cy, r, { lit = 1, alpha = 1 } = {}) {
  if (r <= 0.5 || alpha <= 0.002) return;
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, rgba(mix([58, 63, 88], C.limeTop, lit), alpha)); g.addColorStop(1, rgba(mix([37, 42, 58], C.limeBot, lit), alpha));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
}
function dashFill(ctx, d, col, a) {
  ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.ang); ctx.scale(Math.max(d.hl, 0.01), Math.max(d.hw, 0.01));
  ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
}
/** the dark disc the logo sits on in the light look (the site's header badge); diameter = 1.32 × logo width */
export const DISC = 0.66;
/**
 * The full logo. o.spin orbits the dashes, o.gather (0..1) flies them in from o.from (per-dash start points, or scattered),
 * o.grow scales the sphere, o.lit lights it. o.badge (default: light theme) puts it on the dark disc, grown by o.disc;
 * dashes that are still outside the disc take the loose-dot colour and turn white as they land.
 */
export function drawLogo(ctx, cx, cy, w, { spin = 0, gather = 1, grow = 1, lit = 1, alpha = 1, from = null, scatter = 1.6, seed = 0, badge = C.light, disc = 1 } = {}) {
  if (alpha <= 0.002) return;
  const R = w / LOGO_W, ds = logoDashes(cx, cy, w, spin);
  if (gather < 1) for (const d of ds) {
    const k = d.i, e = clamp(gather * 1.25 - hash(k + seed) * 0.25);
    const f = from ? from[k % from.length] : { x: cx + (hash(k * 3.1 + seed) - 0.5) * w * scatter * 2, y: cy + (hash(k * 7.7 + seed) - 0.5) * w * scatter * 3.4, ang: hash(k) * TAU };
    d.x = lerp(f.x, d.x, e); d.y = lerp(f.y, d.y, e); d.ang = lerp(f.ang ?? d.ang, d.ang, e); d.e = e;
  }
  ctx.save(); ctx.globalAlpha *= alpha;
  const dr = w * DISC * disc;
  if (badge && dr > 0.5) { ctx.fillStyle = rgba(C.disc); ctx.beginPath(); ctx.arc(cx, cy, dr, 0, TAU); ctx.fill(); }
  const col = d => (badge && d.e !== undefined ? mix(C.loose, C.dash, EASE.expo(d.e)) : C.dash);
  for (const d of ds) if (!d.front) dashFill(ctx, d, col(d), 1);
  sphere(ctx, cx, cy, R * grow, { lit });
  for (const d of ds) if (d.front) dashFill(ctx, d, col(d), 1);
  ctx.restore();
}

// ───────────── captions: the narration word by word, in the Reels-safe band (centre 860 px, above the bottom UI)
export function captions(ctx, t, schedule, { skip = ['end'], y = 1450, size = 70, max = 860, page = 2 } = {}) {
  const s = schedule.find(l => !skip.includes(l.key) && t >= l.voice - 0.15 && t < l.end - 0.05); if (!s) return;
  const a0 = s.scene <= 0 ? -1 : s.voice - 0.15;                        // the first line is up on frame 0 (it is the thumbnail)
  const a = E.outExpo(prog(t, a0, a0 + 0.25)) * (1 - E.inCubic(prog(t, s.end - 0.3, s.end - 0.05)));
  setFont(ctx, 800, size, F, -1);
  const sp = ctx.measureText(' ').width, ws = s.words.map(w => ({ w, width: ctx.measureText(w[0]).width }));
  const rows = [[]]; let cur = 0;
  for (const it of ws) { if (cur + it.width > max && rows[rows.length - 1].length) { rows.push([]); cur = 0; } rows[rows.length - 1].push(it); cur += it.width + sp; }
  // long lines are shown `page` rows at a time: the page that holds the word being spoken (keeps the band out of the Reels UI)
  const spoken = ws.filter(it => t >= it.w[1] - 0.04).length, pi = Math.floor(rows.findIndex((r, i) => rows.slice(0, i + 1).flat().length >= Math.max(1, spoken)) / page);
  rows.splice(0, Math.max(0, pi) * page); rows.splice(page);
  const lh = size * 1.18, y0 = y - (rows.length - 1) * lh / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 16);
  ctx.shadowColor = C.capShadow; ctx.shadowBlur = 18; ctx.shadowOffsetY = C.light ? 0 : 4;
  rows.forEach((row, ri) => {
    const wTot = row.reduce((q, it) => q + it.width, 0) + sp * (row.length - 1); let x = 540 - wTot / 2;
    for (const it of row) {
      const [txt, w0, w1] = it.w, on = t >= w0 - 0.04, now = on && t < w1 + 0.06, pop = E.outBack(prog(t, w0 - 0.04, w0 + 0.12), 2.5);
      ctx.save(); ctx.translate(x + it.width / 2, y0 + ri * lh); const k = on ? 0.94 + 0.06 * pop : 0.94; ctx.scale(k, k);
      T(ctx, txt, -it.width / 2, 0, { w: 800, size, ls: -1, fill: now ? C.hi : on ? C.ink : C.light ? C.t2 : C.t3 });
      ctx.restore();
      x += it.width + sp;
    }
  });
  ctx.restore();
}

// ───────────── UI pieces (the site's inbox look)
/** a chat bubble; side 'in' (customer, left) or 'out' (the AI agent, right). Returns its height. */
export function bubble(ctx, x0, x1, y, text, { side = 'in', p = 1, size = 36, maxW = 640, measure = false } = {}) {
  setFont(ctx, 500, size, F); const lines = wrap(ctx, text, maxW), lh = size * 1.32, pad = size * 0.62;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2, h = lines.length * lh + pad * 1.45;
  if (measure || p <= 0) return h;
  const x = side === 'in' ? x0 : x1 - w, s = 0.6 + 0.4 * spring(p * 0.6, 16, 7), ox = side === 'in' ? x : x + w;
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(ox, y + h); ctx.scale(s, s); ctx.translate(-ox, -(y + h));
  rrect(ctx, x, y, w, h, [32, 32, side === 'in' ? 32 : 8, side === 'in' ? 8 : 32]);
  ctx.fillStyle = rgba(side === 'in' ? C.inBg : C.outBg); ctx.fill();
  if (side === 'out' && C.outLine) { ctx.strokeStyle = rgba(C.outLine); ctx.lineWidth = 2; ctx.stroke(); }
  lines.forEach((l, i) => T(ctx, l, x + pad, y + pad * 0.72 + size * 0.98 + i * lh, { w: 500, size, fill: side === 'in' ? C.inInk : C.outInk }));
  ctx.restore();
  return h;
}
/** three typing dots in an AI bubble */
export function typingDots(ctx, x1, y, t, a = 1) {
  if (a <= 0) return 0;
  const w = 130, h = 72; ctx.save(); ctx.globalAlpha *= a; rrect(ctx, x1 - w, y, w, h, [32, 32, 8, 32]); ctx.fillStyle = rgba(C.outBg); ctx.fill();
  if (C.outLine) { ctx.strokeStyle = rgba(C.outLine); ctx.lineWidth = 2; ctx.stroke(); }
  const dot = C.light ? C.green : C.white;
  for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(t * 9 - i * 0.9)); ctx.fillStyle = rgba(dot, 0.45 + 0.55 * b); ctx.beginPath(); ctx.arc(x1 - w + 36 + i * 29, y + h / 2 - b * 7, 8, 0, TAU); ctx.fill(); }
  ctx.restore(); return h;
}
/** the site's CTA: a green pill, label, and a white disc with an arrow that turns -45° on hover */
export function ctaPill(ctx, cx, cy, label, { p = 1, hover = 0, press = 0, size = 44 } = {}) {
  if (p <= 0) return;
  setFont(ctx, 600, size, F); const tw = ctx.measureText(label).width, h = size * 2.3, w = tw + size * 1.4 + h * 0.86;
  const s = (0.7 + 0.3 * spring(p * 0.7, 15, 7)) * (1 - 0.04 * press);
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.shadowColor = rgba(C.green, C.light ? 0.3 : 0.45); ctx.shadowBlur = 40; ctx.shadowOffsetY = C.light ? 10 : 0;
  pill(ctx, 0, 0, w, h); ctx.fillStyle = rgba(mix(C.green, [21, 128, 61], hover * 0.35)); ctx.fill(); ctx.shadowColor = 'transparent';
  T(ctx, label, -w / 2 + size * 0.85, size * 0.36, { w: 600, size, fill: C.white });
  const dx = w / 2 - h / 2, r = h * 0.36; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx, 0, r, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(dx, 0); ctx.rotate(-Math.PI / 4 * EASE.css(hover)); ctx.strokeStyle = rgba(C.green); ctx.lineWidth = size * 0.11; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const a = r * 0.45; ctx.beginPath(); ctx.moveTo(-a, 0); ctx.lineTo(a, 0); ctx.moveTo(a * 0.1, -a * 0.85); ctx.lineTo(a, 0); ctx.lineTo(a * 0.1, a * 0.85); ctx.stroke(); ctx.restore();
  ctx.restore();
}

// ───────────── end card (same in every episode): the logo assembles, Follow @dotkesk gets tapped, the demo CTA, the URL
// The logo never stops: it whirls into the exact pose, then keeps orbiting slowly; the CTA breathes until the last frame.
export const END_LEN = 4.75;
export function endCard(ctx, t, t0, { handle = '@dotkesk', name = 'dotkesk', tagline = 'AI Commerce OS', cta = 'Book a free demo', url = 'dotkesk.com', from = null } = {}) {
  const d = t - t0; if (d < 0) return null;
  const LX = 540, LY = 630, LW = C.light ? 460 : 600;
  const g = EASE.expo(prog(d, 0, 1.0)), spin = -1.4 * (1 - EASE.expo(prog(d, 0, 1.5))) + 0.1 * Math.max(0, d - 1.2);
  drawLogo(ctx, LX, LY, LW, { gather: g, spin, grow: spring(d - 0.12, 13, 6.5), lit: 1, from, disc: spring(d, 12, 7) });
  rise(ctx, name, 540, 1060, 124, EASE.expo(prog(d, 0.4, 1.1)), { w: 700, a: 'center', ls: -5, fill: C.ink });
  T(ctx, tagline, 540, 1122, { w: 500, size: 38, a: 'center', fill: C.t2, alpha: E.outExpo(prog(d, 0.7, 1.2)) });
  // follow row
  const fp = EASE.expo(prog(d, 0.9, 1.5)), tap = 2.05, done = prog(d, tap, tap + 0.12);
  let bx = 0, by = 0, bw = 236;
  if (fp > 0) {
    const y = 1262 + (1 - fp) * 60, x0 = 150, w = 780, h = 134;
    by = y; bx = x0 + w - 28 - bw;
    ctx.save(); ctx.globalAlpha = fp;
    card(ctx, x0, y - h / 2, w, h, h / 2);
    drawLogo(ctx, x0 + 67, y, 74, { spin: d * 0.6, badge: true });
    T(ctx, handle, x0 + 136, y + 16, { w: 700, size: 46, fill: C.ink });
    const bh = 82, press = Math.exp(-Math.pow((d - tap) / 0.07, 2));
    ctx.save(); ctx.translate(bx + bw / 2, y); ctx.scale(1 - 0.06 * press, 1 - 0.06 * press);
    pill(ctx, 0, 0, bw, bh); ctx.fillStyle = rgba(mix(C.green, C.b2, done)); ctx.fill();
    if (done < 0.5) T(ctx, 'Follow', 0, 13, { w: 700, size: 38, a: 'center', fill: C.white, alpha: 1 - done * 2 });
    else { T(ctx, 'Following', 18, 13, { w: 700, size: 34, a: 'center', fill: C.t1, alpha: done * 2 - 1 }); check(ctx, -82, 0, 11, C.light ? C.green : [74, 222, 128], 5); }
    ctx.restore();
    // the tap: a ring of orbit dashes bursts from the button
    const bd = d - tap;
    if (bd > 0 && bd < 0.8) for (let k = 0; k < 14; k++) {
      const a = k / 14 * TAU + 0.2, r = 70 + 150 * EASE.expo(bd / 0.8);
      ctx.save(); ctx.translate(bx + bw / 2 + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 0.8); ctx.rotate(a);
      ctx.scale(15, 6); ctx.fillStyle = rgba(k % 2 ? (C.light ? C.green : C.limeTop) : (C.light ? C.ink : C.white), 1 - bd / 0.8); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  // demo CTA (breathes after the hover so the hold never freezes) and URL
  const hover = prog(d, 2.95, 3.35), breathe = d > 3.35 ? 0.025 * Math.sin((d - 3.35) * 4.2) : 0;
  ctx.save(); ctx.translate(540, 1420); ctx.scale(1 + breathe, 1 + breathe); ctx.translate(-540, -1420);
  ctaPill(ctx, 540, 1420, cta, { p: prog(d, 1.6, 2.6), hover });
  ctx.restore();
  T(ctx, url, 540, 1545, { w: 600, size: 44, a: 'center', fill: C.t1, alpha: E.outExpo(prog(d, 2.0, 2.5)), ls: 0.5 });
  // the pointer comes in, taps Follow, then rests on the demo button and drifts a little
  const pa = prog(d, 1.45, 1.95), pb = prog(d, 2.55, 3.1);
  if (pa > 0 && fp > 0) {
    const px = lerp(lerp(980, bx + bw / 2 + 10, EASE.expo(pa)), 760, EASE.expo(pb)) + 6 * Math.sin(d * 1.7) * pb;
    const py = lerp(lerp(1650, by + 8, EASE.expo(pa)), 1420, EASE.expo(pb)) + 4 * Math.cos(d * 1.3) * pb;
    ctx.save(); ctx.globalAlpha = clamp(pa * 4) * (1 - prog(d, 3.9, 4.3)); pointer(ctx, px, py, 1.9, Math.exp(-Math.pow((d - tap) / 0.07, 2))); ctx.restore();
  }
  return { tap: t0 + tap, cta: t0 + 1.6, hover: t0 + 2.95 };
}

// ───────────── shared episode pieces (episodes 02+). Every episode: hook → turn (the logo forms on "dotkesk") → proof → payoff → end card.
/** keyframes [[t, x, y], …] → (t) => [x, y], easing between keys; used for the glass's green light */
export function track(keys) {
  return t => {
    const i = keys.findIndex(k => k[0] > t);
    if (i === 0) return keys[0].slice(1);
    if (i < 0) return keys[keys.length - 1].slice(1);
    const [a, b] = [keys[i - 1], keys[i]], e = EASE.css(prog(t, a[0], a[0] + Math.min(0.9, b[0] - a[0])));
    return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
  };
}
/** the turn: dots fly in from `from` (or scatter), orbit, the disc and sphere grow, the sphere lights on `name`;
 *  from `move.t` the logo travels to `move.at` (e.g. a chat avatar) and stops drawing at `until` */
export function turnLogo(ctx, t, { t0, name, at = [540, 820, 600], from = null, move = null, until = Infinity, seed = 3 }) {
  if (t < t0 || t >= until) return;
  const m = move ? EASE.expo(prog(t, move.t, move.t + 0.6)) : 0, to = move?.at ?? at;
  drawLogo(ctx, lerp(at[0], to[0], m), lerp(at[1], to[1], m), lerp(at[2], to[2], m), {
    from, gather: EASE.expo(prog(t, t0, name + 0.05)), spin: -2.4 * (1 - EASE.expo(prog(t, t0, name + 0.9))) + (t - t0) * 0.15,
    grow: spring(t - t0 - 0.05, 12, 7), lit: EASE.expo(prog(t, name - 0.05, name + 0.3)), seed, disc: spring(t - t0, 11, 7),
  });
}
/** a notification / DM card: channel dot + app line, bold name, message. p = time since arrival (s), gone = leaving (0..1) */
export function notifCard(ctx, x, y, w, n, { p = 1, gone = 0, h = 168, now = 'now' } = {}) {
  if (p <= 0 || gone >= 1) return;
  const sp = spring(p, 15, 8), yy = y - (1 - sp) * 70;
  ctx.save(); ctx.globalAlpha *= clamp(p * 6) * (1 - gone);
  ctx.translate(x + w / 2, yy + h / 2); const k = 1 - 0.04 * gone; ctx.scale(k, k); ctx.translate(-(x + w / 2), -(yy + h / 2));
  card(ctx, x, yy, w, h, 40);
  ctx.fillStyle = rgba(n.dot); ctx.beginPath(); ctx.arc(x + 46, yy + 50, 10, 0, TAU); ctx.fill();
  T(ctx, `${n.app} · ${now}`, x + 70, yy + 61, { size: 30, w: 600, fill: C.t2 });
  const nw = n.name ? T(ctx, `${n.name}:`, x + 40, yy + 124, { size: 40, w: 700, fill: C.ink }) : -14;
  T(ctx, n.msg, x + 40 + nw + 14, yy + 124, { size: 40, w: 500, fill: C.t1 });
  ctx.restore();
}
/** an on/off switch; on 0..1 */
export function toggle(ctx, cx, cy, on, { w = 112, h = 64 } = {}) {
  pill(ctx, cx, cy, w, h); ctx.fillStyle = rgba(mix(C.light ? [209, 213, 220] : C.b2, C.green, on)); ctx.fill();
  const kx = lerp(cx - w / 2 + h / 2, cx + w / 2 - h / 2, EASE.expo(on));
  ctx.save(); ctx.shadowColor = 'rgba(15,23,42,0.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(kx, cy, h / 2 - 6, 0, TAU); ctx.fill(); ctx.restore();
}
/** a small rounded label: optional dot + text, in the theme's green chip colours (or neutral). Returns its width. */
export function tag(ctx, x, y, label, { green = true, size = 30, alpha = 1, dot = null } = {}) {
  setFont(ctx, 600, size, F); const tw = ctx.measureText(label).width, pad = size * 0.6, d = dot ? size * 0.8 : 0, w = tw + pad * 2 + d, h = size * 1.75;
  if (alpha <= 0.002) return w;
  ctx.save(); ctx.globalAlpha *= alpha; pill(ctx, x + w / 2, y, w, h); ctx.fillStyle = rgba(green ? C.chipBg : C.b2); ctx.fill();
  if (dot) { ctx.fillStyle = rgba(dot); ctx.beginPath(); ctx.arc(x + pad + size * 0.22, y, size * 0.22, 0, TAU); ctx.fill(); }
  T(ctx, label, x + pad + d, y + size * 0.36, { size, w: 600, fill: green ? C.chipInk : C.t1 }); ctx.restore();
  return w;
}
/**
 * The chat window from the site's inbox, with the logo as the avatar. items: [{ at, side: 'in'|'out', text, ty? (typing from) }
 * | { at, h, side, draw(ctx, X0, X1, y, p) }]. Slots grow in as they arrive; the list scrolls once it reaches the bottom.
 */
export function chatCard(ctx, t, tFrame, { box = { x: 60, y: 330, w: 960, h: 960 }, title = 'Your store', sub = 'AI agent · online', t0, t1, items, avatar = true }) {
  const inn = EASE.expo(prog(t, t0 + 0.1, t0 + 0.6)), out = E.inCubic(prog(t, t1 - 0.1, t1 + 0.25));
  if (inn <= 0 || out >= 1) return;
  const { x, y, w: cw, h } = box, k = (0.94 + 0.06 * inn) * (1 - 0.06 * out);
  ctx.save(); ctx.globalAlpha = inn * (1 - out);
  ctx.translate(x + cw / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + cw / 2), -(y + h / 2));
  card(ctx, x, y, cw, h, 48);
  ctx.fillStyle = rgba(C.disc); ctx.beginPath(); ctx.arc(x + 92, y + 92, 56, 0, TAU); ctx.fill();
  if (avatar) drawLogo(ctx, x + 92, y + 92, 84, { spin: t * 0.15, badge: false });
  T(ctx, title, x + 172, y + 84, { size: 42, w: 700, fill: C.ink });
  ctx.fillStyle = rgba(C.chipInk); ctx.beginPath(); ctx.arc(x + 182, y + 120, 8, 0, TAU); ctx.fill();
  T(ctx, sub, x + 200, y + 131, { size: 32, w: 500, fill: C.chipInk });
  ctx.fillStyle = rgba(C.b1); ctx.fillRect(x, y + 184, cw, 2);
  const X0 = x + 40, X1 = x + cw - 40, top = y + 220, bottom = y + h - 40;
  let total = 0;
  const slots = items.map(it => {
    const full = it.h ?? bubble(ctx, X0, X1, 0, it.text, { measure: true });
    const hh = it.ty !== undefined && t < it.at ? 72 * EASE.expo(prog(t, it.ty, it.ty + 0.25)) : lerp(it.ty !== undefined ? 72 : 0, full, EASE.expo(prog(t, it.at, it.at + 0.35)));
    const slot = { it, y: total, hh }; total += hh + (hh > 0 ? 24 : 0); return slot;
  });
  const scroll = Math.max(0, top + total - bottom);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y + 186, cw, h - 188); ctx.clip();
  for (const { it, y: sy, hh } of slots) {
    if (hh <= 0.5) continue;
    const yy = top + sy - scroll;
    if (it.ty !== undefined && t < it.at) { typingDots(ctx, X1, yy, tFrame, clamp((t - it.ty) * 5)); continue; }
    const p = prog(t, it.at, it.at + 0.6);
    if (it.draw) {
      const s = 0.7 + 0.3 * spring(p * 0.6, 15, 7), ox = it.side === 'in' ? X0 : X1;
      ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(ox, yy + it.h); ctx.scale(s, s); ctx.translate(-ox, -(yy + it.h)); it.draw(ctx, X0, X1, yy, p); ctx.restore();
    } else bubble(ctx, X0, X1, yy, it.text, { side: it.side, p });
  }
  ctx.restore();
  ctx.restore();
}
/** the payoff: a green check springs up inside a ring of orbit dashes, a title rises under it */
export const BURST = 18;
export function burstAt(k, t, t0, { cx = 540, cy = 760 } = {}) {
  const a = k / BURST * TAU + (t - t0) * 0.35, r = 175 + 170 * EASE.expo(prog(t, t0 + 0.12, t0 + 1.1));
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.86, ang: a + Math.PI / 2 };
}
export function payoff(ctx, t, t0, t1, { title, sub = '', top = '', cx = 540, cy = 760 }) {
  const out = E.inCubic(prog(t, t1 - 0.05, t1 + 0.3));
  if (t < t0 || out >= 1) return;
  const d = t - t0, sp = spring(d - 0.02, 13, 7);
  ctx.save(); ctx.globalAlpha = 1 - out;
  if (top) T(ctx, top, cx, 300, { w: 300, size: 96, a: 'center', ls: -3, fill: C.t3, alpha: E.outExpo(prog(d, 0.3, 0.8)) });
  const ba = E.outExpo(prog(d, 0.1, 0.4));
  for (let k = 0; k < BURST; k++) {
    const b = burstAt(k, t, t0, { cx, cy });
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang); ctx.scale(24, 10);
    ctx.fillStyle = rgba(k % 2 ? (C.light ? C.limeBot : C.limeTop) : (C.light ? C.ink : C.white), ba); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.shadowColor = rgba(C.green, C.light ? 0.35 : 0.6); ctx.shadowBlur = 60;
  ctx.fillStyle = rgba(C.green); ctx.beginPath(); ctx.arc(cx, cy, 140 * sp, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  const cp = EASE.expo(prog(d, 0.18, 0.6));
  if (cp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(cx - 80, cy - 160, 160 * cp, 320); ctx.clip(); check(ctx, cx, cy + 5, 62, C.white, 20); ctx.restore(); }
  rise(ctx, title, cx, cy + 390, 84, EASE.expo(prog(d, 0.25, 0.85)), { w: 700, a: 'center', ls: -2, fill: C.ink });
  if (sub) T(ctx, sub, cx, cy + 455, { size: 38, w: 500, a: 'center', fill: C.t2, alpha: E.outExpo(prog(d, 0.5, 1.0)) });
  ctx.restore();
}
/** the end card's dots start where the payoff's ring is when the card begins */
export const payoffDots = (t0, tEnd, o) => Array.from({ length: BURST }, (_, k) => burstAt(k, tEnd, t0, o));
/**
 * One frame of an episode: the glass (or dark) background, a slow push-in, the episode's own drawing, the end card, captions,
 * and the flash on "dotkesk". lit (0..1) is the light coming on at the turn; night dims the glass before it.
 * content(tFrame, { S, name, lit }) draws the episode. Returns { S, name, lit }.
 */
export function stage(ctx, t, api, { schedule, focusAt, content, endFrom = null, night = 0.6 }) {
  const S = Object.fromEntries(schedule.map(s => [s.key, s])), name = S.turn.words.find(w => /dotkesk/i.test(w[0]))?.[1] ?? S.turn.voice;
  const lit = E.outExpo(prog(t, name - 0.05, name + 0.6)), tFrame = api.frameT ?? t;
  if (C.light) heroGlass(ctx, api.W, api.H, t, { focusAt, flow: lit, night: night * (1 - lit), frame: Math.round(tFrame * api.fps) });
  else bg(ctx, api.W, api.H, t, { glow: lit });
  ctx.save(); camera(ctx, t, schedule.map(s => [s.scene, s.end]));
  content(tFrame, { S, name, lit });
  endCard(ctx, t, S.end.scene, { from: endFrom });
  ctx.restore();
  captions(ctx, t, schedule);
  flash(ctx, api.W, api.H, t, name, C.light ? 0.45 : 0.35, 0.09, C.light ? C.white : C.limeTop);
  return { S, name, lit };
}
/** simple product art for placeholder products: 'shirt' or 'shoe', on a tinted tile */
export function productArt(ctx, kind, x, y, s, col) {
  rrect(ctx, x, y, s, s, s * 0.13); ctx.fillStyle = rgba(mix(col, C.white, 0.6)); ctx.fill();
  ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.scale(s / 192, s / 192); ctx.fillStyle = rgba(col); ctx.beginPath();
  if (kind === 'shirt') {
    ctx.moveTo(-26, -62); ctx.lineTo(-74, -38); ctx.lineTo(-60, -6); ctx.lineTo(-42, -14); ctx.lineTo(-42, 66); ctx.lineTo(42, 66); ctx.lineTo(42, -14);
    ctx.lineTo(60, -6); ctx.lineTo(74, -38); ctx.lineTo(26, -62); ctx.quadraticCurveTo(0, -40, -26, -62);
  } else {
    ctx.moveTo(-78, 34); ctx.lineTo(-74, -6); ctx.quadraticCurveTo(-60, -40, -30, -42); ctx.lineTo(-10, -20); ctx.quadraticCurveTo(20, 0, 60, 6);
    ctx.quadraticCurveTo(84, 12, 82, 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(C.white, 0.85); ctx.beginPath(); ctx.rect(-80, 34, 164, 14);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
/** a browser window: traffic-light dots and a URL bar */
export function browserFrame(ctx, x, y, w, h, url) {
  card(ctx, x, y, w, h, 36);
  [[255, 95, 87], [254, 188, 46], [40, 200, 64]].forEach((c, i) => { ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.arc(x + 44 + i * 30, y + 46, 9, 0, TAU); ctx.fill(); });
  pill(ctx, x + w / 2 + 40, y + 46, w - 260, 50); ctx.fillStyle = rgba(C.b2); ctx.fill();
  T(ctx, url, x + w / 2 + 40, y + 57, { size: 28, w: 500, a: 'center', fill: C.t2 });
  ctx.fillStyle = rgba(C.b1); ctx.fillRect(x, y + 92, w, 2);
}
