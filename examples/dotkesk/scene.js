// examples/dotkesk — a 15 s showreel for Dotkesk, an AI conversational-commerce platform.
// Idea: the logo's orbit of dots is the visual system. The old click-path collapses into one dot,
// the dot becomes a conversation, channels orbit it, and everything finally assembles into the logo.
// 128 BPM → bar = 1.875 s, step = 117 ms; 8 bars = 15 s. Every section starts on a beat.
import {
  TAU, clamp, lerp, prog, mix, rgba, E, EASE, spring, wobble, hash, noise1, setFont, layout, rrect, pill,
  withScale, check, pointer, shake, vignette, chromatic, grid, ripple, sampleDrawing, radialBlob,
} from '../../engine/core.js';

const COPY = {
  tr: {
    today: '// bugün e-ticaret:',
    steps: ['Kategori', 'Filtre', 'Ürün', 'Varyasyon', 'Sepet', 'Ödeme'],
    query: '1.500 TL altında siyah bir çanta arıyorum.',
    agent: 'Dotkesk Agent', online: 'çevrimiçi',
    found: '1.500 TL altında 3 çanta buldum:',
    catalog: 'katalog · ikas',
    products: [['Mini Tote', '1.249 TL'], ['Lina Omuz', '1.390 TL'], ['Mara Çapraz', '1.499 TL']],
    add: 'Sepete ekle', added: 'Eklendi',
    ask: 'İkincisinin siyah rengi var mı?',
    reply: 'Var, stokta. Sepete ekleyeyim mi?',
    inbox: 'Tek inbox. Her kanal.',
    channels: ['WhatsApp', 'Instagram DM', 'Messenger', 'Telegram', 'E-posta', 'Web Chat'],
    tiles: [['Sepet kurtarma', 'abandoned cart agent'], ['Segmentler', 'customer segmentation'], ['Otomasyonlar', 'growth automations'], ['Bilgi Bankası', 'knowledge base · RAG']],
    flow: ['olay', 'bekle', 'mesaj'],
    placeholder: 'Mesaj yaz…',
  },
  en: {
    today: '// e-commerce today:',
    steps: ['Category', 'Filter', 'Product', 'Variant', 'Cart', 'Checkout'],
    query: 'A black bag under 1,500 TL, please.',
    agent: 'Dotkesk Agent', online: 'online',
    found: 'Found 3 bags under 1,500 TL:',
    catalog: 'catalog · ikas',
    products: [['Mini Tote', '1,249 TL'], ['Lina Shoulder', '1,390 TL'], ['Mara Crossbody', '1,499 TL']],
    add: 'Add to cart', added: 'Added',
    ask: 'Does the second one come in black?',
    reply: 'Yes, in stock. Add it to your cart?',
    inbox: 'One inbox. Every channel.',
    channels: ['WhatsApp', 'Instagram DM', 'Messenger', 'Telegram', 'Email', 'Web Chat'],
    tiles: [['Cart recovery', 'abandoned cart agent'], ['Segments', 'customer segmentation'], ['Automations', 'growth automations'], ['Knowledge Base', 'knowledge base · RAG']],
    flow: ['event', 'wait', 'message'],
    placeholder: 'Type a message…',
  },
};
const FORMULA = ['Commerce', 'Conversations', 'AI Agents', 'Automation'];
const BRAND = { name: 'Dotkesk', tagline: 'AI Commerce Operating System' };

// palette: the logo's night navy and lime gradient, plus neutrals
const BG = [13, 13, 26], INK = [245, 246, 240], DIM = [136, 138, 164], CARD = [23, 23, 41], CARD2 = [33, 33, 56], LINE = [48, 49, 74];
const WHITE = [255, 255, 255], LIME = [168, 232, 76], LIME_T = [218, 237, 74], LIME_B = [92, 220, 78], NAVY = [13, 13, 26];
const SANS = 'Inter', DISP = 'Sora', MONO = '"JetBrains Mono"';
const CHANNEL_COLS = [[37, 211, 102], [225, 48, 108], [0, 132, 255], [39, 167, 231], [245, 166, 35], LIME];

// ───────────────────────────── the logo, rebuilt from measurements of the supplied 1024 px file
// sphere R = 192 px; ring plane rotated 29.9°, foreshortened to 0.630; three rows of dots
// [radius / R, count, phase°, screen length / R, screen width / R]: dots are screen-space ellipses laid along the orbit's tangent
const LOGO = { rot: 0.5214, k: 0.6304, rows: [[1.22, 16, 7, 0.3, 0.128], [1.54, 20, -6, 0.335, 0.132], [1.885, 23, 8, 0.35, 0.14]] };
// the designer spaced the dots evenly along the *drawn* ellipse, so place them by screen arc length
const ARC = LOGO.rows.map(([rr]) => {
  const n = 720, c = Math.cos(LOGO.rot), s = Math.sin(LOGO.rot), psi = [], len = [0];
  for (let j = 0; j <= n; j++) {
    psi.push((j / n) * TAU);
    if (j) {
      const f = a => [Math.cos(a) * rr * c - Math.sin(a) * rr * LOGO.k * s, Math.cos(a) * rr * s + Math.sin(a) * rr * LOGO.k * c];
      const [x0, y0] = f(psi[j - 1]), [x1, y1] = f(psi[j]);
      len.push(len[j - 1] + Math.hypot(x1 - x0, y1 - y0));
    }
  }
  const total = len[n];
  const toPsi = u => { u = ((u % 1) + 1) % 1 * total; let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (len[m] < u) lo = m; else hi = m; } return lerp(psi[lo], psi[hi], (u - len[lo]) / (len[hi] - len[lo] || 1)); };
  const toU = a => { const j = Math.round((((a % TAU) + TAU) % TAU) / TAU * n); return len[j] / total; };
  return { toPsi, toU };
});
/** Every ring dot at (cx, cy, R): screen centre, the two projected semi-axes, and whether it's in front of the sphere. */
function ringDots(cx, cy, R, spin = 0) {
  const c = Math.cos(LOGO.rot), s = Math.sin(LOGO.rot), k = LOGO.k, out = [];
  const M = (x, y) => [x * c - y * k * s, x * s + y * k * c];               // plane → screen (affine)
  LOGO.rows.forEach(([rr, n, ph, L, Wd], row) => {
    const u0 = ARC[row].toU((ph * Math.PI) / 180);
    for (let i = 0; i < n; i++) {
      const phi = ARC[row].toPsi(u0 + i / n + spin / TAU);
      const px = Math.cos(phi) * rr * R, py = Math.sin(phi) * rr * R;
      const persp = 1 + 0.08 * Math.sin(phi);                               // the near side reads slightly larger
      const [x, y] = M(px, py);
      const [tx, ty] = M(-Math.sin(phi), Math.cos(phi)), tl = Math.hypot(tx, ty);
      const a = [(tx / tl) * (L / 2) * R * persp, (ty / tl) * (L / 2) * R * persp];
      const b = [(-ty / tl) * (Wd / 2) * R * persp, (tx / tl) * (Wd / 2) * R * persp];
      out.push({ x: cx + x, y: cy + y, a, b, front: Math.sin(phi) > 0, row, i });
    }
  });
  return out;
}
// The model above is how the ring moves. At rest, every visible dot sits exactly where it is in the
// supplied file: [x, y, length, width, angle, behind?], in sphere radii from the sphere's centre.
const MEASURED = [[-0.9236,-1.3058,0.3353,0.1371,2.899], [-0.4804,-1.3110,0.3568,0.1372,3.087], [-1.3271,-1.1994,0.3359,0.1488,2.586], [-0.0438,-1.2406,0.3558,0.1343,-3.045], [0.3708,-1.0976,0.3585,0.1360,-2.881], [-0.7985,-1.0794,0.3067,0.1252,2.962], [-0.4277,-1.0586,0.3244,0.1255,3.112], [-1.6440,-0.9791,0.2998,0.1580,2.194], [-1.1595,-0.9793,0.3044,0.1369,2.604], [0.7477,-0.8981,0.3588,0.1385,-2.740], [-0.7501,-0.8335,0.3064,0.1244,2.926], [-1.4344,-0.7520,0.2789,0.1484,2.039], [-1.0785,-0.7190,0.2631,0.1301,2.431], [-1.8135,-0.6438,0.3001,0.1571,1.539], [1.0965,-0.6237,0.3600,0.1384,-2.586], [-1.2148,-0.4445,0.2569,0.1308,1.419], [-1.5139,-0.3957,0.3101,0.1464,1.289], [1.3831,-0.3175,0.3473,0.1370,-2.416], [1.0580,-0.2964,0.3390,0.1337,-2.429], [-1.7903,-0.2551,0.3487,0.1532,1.111], [-1.1243,-0.1027,0.3292,0.1386,0.971], [-1.3958,-0.0301,0.3316,0.1357,0.925], [1.5984,0.0132,0.3263,0.1366,0.962], [1.3018,0.0357,0.3204,0.1347,0.934], [-1.6227,0.1227,0.3761,0.1509,0.826], [-0.8735,0.2436,0.3518,0.1347,-2.467], [-1.1567,0.3105,0.3582,0.1357,-2.441], [1.7398,0.3962,0.3026,0.1414,1.256], [1.4518,0.3964,0.2903,0.1366,1.272], [1.1574,0.4337,0.2880,0.1383,1.326], [-1.3722,0.4580,0.3774,0.1450,-2.487], [-0.5401,0.5386,0.3639,0.1363,-2.677], [-0.8470,0.6136,0.3622,0.1384,-2.584], [1.4283,0.7327,0.2692,0.1386,1.767], [1.0352,0.7404,0.2600,0.1324,2.169], [1.7034,0.7903,0.2948,0.1439,1.797], [-1.0482,0.7615,0.3675,0.1420,-2.610], [-0.1552,0.7571,0.3569,0.1370,-2.880], [-0.4671,0.8622,0.3641,0.1392,-2.750], [0.6765,0.8749,0.3297,0.1369,2.895], [0.2629,0.8753,0.3456,0.1365,-3.113], [1.1900,0.9579,0.2894,0.1402,2.262], [-0.7008,1.0442,0.3767,0.1454,-2.727], [-0.0361,1.0237,0.3536,0.1388,-2.966], [1.4924,1.0882,0.2922,0.1439,2.177], [0.8287,1.0875,0.3479,0.1437,2.864], [0.3923,1.1144,0.3541,0.1409,3.098], [-0.2396,1.2121,0.3574,0.1441,-2.918], [1.1677,1.2651,0.3456,0.1548,2.550], [0.1839,1.3224,0.3822,0.1523,-3.132], [0.7120,1.3417,0.4225,0.1679,2.955],
  // three dots peeking out from behind the sphere, fitted to their visible slivers (flag 1 = behind)
  [-0.0489,-0.9792,0.3450,0.1370,0.05,1], [0.8155,-0.5017,0.3450,0.1370,0.48,1], [0.9875,0.0782,0.3450,0.1370,0.75,1]];
// pair each measured dot with the nearest model dot (greedy on distance); unpaired model dots hide behind the sphere
const PAIR = (() => {
  const model = ringDots(0, 0, 1), pairs = [];
  MEASURED.forEach((m, j) => model.forEach((d, i) => pairs.push([Math.hypot(d.x - m[0], d.y - m[1]), i, j])));
  pairs.sort((a, b) => a[0] - b[0]);
  const byModel = new Map(), used = new Set();
  for (const [, i, j] of pairs) if (!byModel.has(i) && !used.has(j)) { byModel.set(i, j); used.add(j); }
  return byModel;
})();
/** Ring dots that settle (0 → 1) from the moving model onto the measured logo. */
function logoDots(cx, cy, R, spin = 0, settle = 1) {
  return ringDots(cx, cy, R, spin).map((d, i) => {
    if (!PAIR.has(i)) { const k = 1 - settle; return { ...d, a: d.a.map(v => v * k), b: d.b.map(v => v * k), front: false }; } // not in the logo
    const [mx, my, L, S, ang, behind] = MEASURED[PAIR.get(i)];
    let a = [Math.cos(ang) * L / 2 * R, Math.sin(ang) * L / 2 * R];
    if (a[0] * d.a[0] + a[1] * d.a[1] < 0) a = a.map(v => -v);         // an ellipse's axis has no direction: take the closer one
    const b = [-a[1] * S / L, a[0] * S / L];
    return {
      x: lerp(d.x, cx + mx * R, settle), y: lerp(d.y, cy + my * R, settle),
      a: [lerp(d.a[0], a[0], settle), lerp(d.a[1], a[1], settle)], b: [lerp(d.b[0], b[0], settle), lerp(d.b[1], b[1], settle)],
      front: behind ? settle < 0.5 && d.front : settle > 0.5 || d.front,
    };
  });
}

function dot(ctx, x, y, a, b, col, alpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.transform(a[0], a[1], b[0], b[1], 0, 0);
  ctx.fillStyle = rgba(col, alpha); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
}
function sphere(ctx, cx, cy, r, tint = c => c) {
  if (r <= 0.5) return;
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, rgba(tint(LIME_T))); g.addColorStop(1, rgba(tint(LIME_B)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
}
/** The full mark. sphereK scales the sphere, dotK the dots; alpha dims the dots only. */
export function drawLogo(ctx, cx, cy, R, { spin = 0, sphereK = 1, dotK = 1, alpha = 1, col = WHITE } = {}) {
  const dots = logoDots(cx, cy, R, spin, 1);
  const sc = v => [v[0] * dotK, v[1] * dotK];
  for (const d of dots) if (!d.front) dot(ctx, d.x, d.y, sc(d.a), sc(d.b), col, alpha);
  sphere(ctx, cx, cy, R * sphereK);
  for (const d of dots) if (d.front) dot(ctx, d.x, d.y, sc(d.a), sc(d.b), col, alpha);
}

// ───────────────────────────── timing
let T, c, RIPS, HOOK, PARTS, W, H;
const key = (t, ks) => {
  if (t <= ks[0][0]) return ks[0].slice(1);
  for (let i = 1; i < ks.length; i++) if (t < ks[i][0]) {
    const [t0, ...a] = ks[i - 1], [t1, ...b] = ks[i], e = EASE.css((t - t0) / (t1 - t0));
    return a.map((v, j) => lerp(v, b[j], e));
  }
  return ks[ks.length - 1].slice(1);
};

export default {
  setup(api) {
    ({ W, H } = api);
    c = COPY[api.lang] ?? COPY.en;
    const at = api.at;
    T = {
      chips: [0, 1, 2, 3, 4, 5].map(i => at(0, 2 * i)), strike: at(0, 12), suck: at(0, 14),
      dot: at(1), input: at(1, 2), type0: at(1, 3), type1: at(1, 10), send: at(1, 11), chat: at(1, 12), typing: at(1, 13),
      stream: at(2), cards: at(2, 2), ask: at(2, 8), reply: at(2, 11), swatch: at(2, 12), cart: at(3), badge: at(3, 1),
      omni: at(3, 4), inbox: at(3, 6), grid: at(4, 8), tiles: [0, 1, 2, 3].map(i => at(4, 8 + 2 * i)),
      eq: at(5, 8), terms: [0, 1, 2, 3].map(i => at(5, 8 + 4 * i)), swirl: at(6, 8), sphere: at(6, 12), lock: at(7), tag: at(7, 1), end: at(8),
    };
    // hook layout: six chips in a row
    const m = document.createElement('canvas').getContext('2d');
    setFont(m, 600, 40, SANS);
    const ws = c.steps.map(s => m.measureText(s).width + 56), gap = 60;
    const total = ws.reduce((a, b) => a + b, 0) + gap * 5;
    let x = (W - total) / 2;
    HOOK = ws.map(w => { const r = { x, w, cx: x + w / 2 }; x += w + gap; return r; });
    HOOK.total = total;
    // the formula, sampled into particles that will become the logo's dots
    PARTS = sampleDrawing(W, H, g => drawFormula(g, 99), 9, 120).map((p, i) => ({ ...p, h: hash(i * 1.37) }));
    // each particle heads for the ring dot at the same angle, so paths never cross the mark
    const slotOrder = ringDots(0, 0, 1).map((d, i) => [Math.atan2(d.y, d.x), i]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
    PARTS.map((p, i) => [Math.atan2(p.y - 520, p.x - (FX + 430)), i]).sort((a, b) => a[0] - b[0])
      .forEach(([, i], rank) => { PARTS[i].slot = slotOrder[Math.floor((rank / PARTS.length) * slotOrder.length)]; });
    // ripples in the background grid, launched by every interaction
    RIPS = [...T.chips.map((t0, i) => [t0 + 0.12, HOOK[i].cx + hookShift(t0 + 0.12), H / 2]), [T.send, 1420, 540], [T.cart, 0, 0, 'cart'], [T.sphere, 0, 0, 'logo'], [T.lock, 0, 0, 'logo']];
  },
  draw(ctx, t) {
    background(ctx, t);
    const [sx, sy] = shake(t, [[T.cart, 4], [T.lock, 10]], 10);
    ctx.save(); ctx.translate(sx, sy);
    if (t < T.dot + 0.02) hook(ctx, t);
    if (t >= T.dot && t < T.grid + 0.05) conversation(ctx, t);
    if (t >= T.grid - 0.1 && t < T.eq + 0.35) tiles(ctx, t);
    if (t >= T.eq && t < T.swirl + 0.05) formula(ctx, t);
    if (t >= T.swirl) lockup(ctx, t);
    cursor(ctx, t);
    ctx.restore();
  },
  post(ctx, t, api) { vignette(ctx, api.W, api.H, 0.35); },
};

// ───────────────────────────── background: a quiet dot grid that answers every interaction
const GRID = grid(41, 23, 48);
function background(ctx, t) {
  ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);
  const glow = 0.5 + 0.5 * Math.sin(t * 0.6);
  radialBlob(ctx, W * 0.5, H * 0.55, 900, [40, 60, 40], 0.18 + 0.05 * glow);
  const origin = r => (r[3] === 'cart' ? cartButtonPos(T.cart) : r[3] === 'logo' ? LOCK.logo : [r[1], r[2]]);
  const rips = RIPS.map(r => [r[0], ...origin(r)]);
  for (const p of GRID) {
    const x = p.x + W / 2, y = p.y + H / 2;
    let w = 0;
    for (const [t0, ox, oy] of rips) w += ripple({ x, y }, [ox, oy], t0, t, { speed: 1500, width: 70, life: 1.0 });
    w = clamp(w);
    ctx.fillStyle = rgba(mix(DIM, LIME, w), 0.12 + 0.6 * w);
    ctx.beginPath(); ctx.arc(x, y, 1.7 + 2.6 * w, 0, TAU); ctx.fill();
  }
}

// ───────────────────────────── bar 0 · the old way: six clicks to buy a bag
/** The row slides so the chips shown so far stay centred. */
function hookShift(t) {
  let sh = W / 2 - (HOOK[0].x + HOOK[0].x + HOOK[0].w) / 2;
  for (let i = 1; i < 6; i++) {
    const target = W / 2 - (HOOK[0].x + HOOK[i].x + HOOK[i].w) / 2;
    sh = lerp(sh, target, EASE.expo(prog(t, T.chips[i] - 0.03, T.chips[i] + 0.3)));
  }
  return sh;
}
function hook(ctx, t) {
  const y = H / 2;
  ctx.save(); ctx.translate(hookShift(t), 0);
  const suck = prog(t, T.suck, T.dot);
  const dim = 1 - 0.6 * EASE.expo(prog(t, T.strike, T.strike + 0.2));
  const push = 1 + 0.05 * EASE.expo(prog(t, 0, T.suck));
  withScale(ctx, W / 2, y, push, () => {
    // label typed in
    setFont(ctx, 500, 28, MONO); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(DIM, 1 - suck);
    ctx.fillText(c.today.slice(0, Math.ceil(prog(t, 0.02, 0.45) * c.today.length)), HOOK[0].x, y - 110);
    HOOK.forEach((ch, i) => {
      const t0 = T.chips[i], s = spring(t - t0, 20, 9);
      if (s <= 0) return;
      // chips are sucked into the centre, the ones nearest the middle first
      const order = Math.abs(ch.cx - W / 2) / (HOOK.total / 2);
      const q = E.inExpo(clamp((suck - order * 0.25) / 0.75));
      const cx = lerp(ch.cx, W / 2, q), sc = s * (1 - q);
      const active = clamp(1 - (t - t0 - 0.12) / 0.35) * (t > t0 + 0.12 ? 1 : 0);
      ctx.save(); ctx.translate(cx, y); ctx.scale(sc, sc);
      pill(ctx, 0, 0, ch.w, 84);
      ctx.fillStyle = rgba(mix(CARD, [44, 60, 30], active)); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(mix(LINE, LIME, active)); ctx.stroke();
      setFont(ctx, 600, 40, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(INK, dim); ctx.fillText(c.steps[i], 0, 3);
      ctx.restore();
      if (i < 5 && t > T.chips[i + 1] - 0.05) {                    // the chevron to the next step
        const ax = lerp(ch.x + ch.w + 30, W / 2, q), k = EASE.expo(prog(t, T.chips[i + 1] - 0.05, T.chips[i + 1] + 0.15)) * (1 - q);
        ctx.save(); ctx.strokeStyle = rgba(DIM, dim * k); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(ax - 8, y - 14); ctx.lineTo(ax + 6, y); ctx.lineTo(ax - 8, y + 14); ctx.stroke(); ctx.restore();
      }
    });
    // strike-through: the old way, crossed out
    const p = EASE.expo(prog(t, T.strike, T.strike + 0.22)) * (1 - E.inExpo(suck));
    if (p > 0) {
      const x0 = HOOK[0].x - 30, x1 = HOOK[0].x + HOOK.total + 30;
      ctx.fillStyle = rgba(INK); ctx.fillRect(lerp(W / 2, x0, 1 - suck), y - 3, (x1 - x0) * p * (1 - suck), 6);
    }
  });
  ctx.restore();
}

// ───────────────────────────── bars 1–4 · one dot becomes a conversation, then an inbox for every channel
const PANEL = { x: 470, y: 72, w: 980, h: 936 };
function chatLayout(t) {
  const top = PANEL.y + 104, bottom = PANEL.y + PANEL.h - 120;
  const items = [
    { kind: 'user', t0: T.chat, h: 88, text: c.query },
    { kind: 'agent', t0: T.typing, h: 88, text: c.found, stream: T.stream },
    { kind: 'chip', t0: T.stream + 0.28, h: 40 },
    { kind: 'cards', t0: T.cards, h: 372 },
    { kind: 'user', t0: T.ask, h: 88, text: c.ask },
    { kind: 'agent', t0: T.reply - 0.12, h: 88, text: c.reply, stream: T.reply },
  ];
  let y = top + 26;
  for (const it of items) { const e = EASE.expo(prog(t, it.t0, it.t0 + 0.4)); it.y = y; it.e = e; y += (it.h + 20) * e; }
  const scroll = Math.max(0, y - bottom);
  for (const it of items) it.y -= scroll;
  return { top, bottom, items };
}
function cardRect(i, L) {
  const it = L.items[3];
  return { x: PANEL.x + 36 + i * 306, y: it.y, w: 290, h: 372 };
}
function cartButtonPos(t) {
  const L = chatLayout(t), r = cardRect(1, L);
  return [r.x + r.w / 2, r.y + 336];
}

function conversation(ctx, t) {
  // the dot is born where the old path collapsed, then stretches into the message box
  const born = spring(t - T.dot, 18, 8), grow = EASE.expo(prog(t, T.input, T.input + 0.5));
  const toChat = EASE.expo(prog(t, T.chat, T.chat + 0.5));
  const shrink = EASE.expo(prog(t, T.omni, T.omni + 0.6));
  const exit = E.inBack(prog(t, T.grid - 0.25, T.grid), 1.8);

  if (t < T.chat + 0.6) {
    // the input pill: centre of the screen → the bottom of the chat panel
    const w = lerp(34 * born, 1120, grow), h = lerp(34 * born, 116, grow);
    const cx = W / 2, cy = lerp(H / 2, PANEL.y + PANEL.h - 64, toChat);
    const ww = lerp(w, PANEL.w - 48, toChat), hh = lerp(h, 84, toChat);
    radialBlob(ctx, cx, cy, 380 * born * (1 - toChat), LIME, 0.22);
    ctx.save();
    ctx.globalAlpha = 1 - clamp((t - T.chat - 0.4) / 0.2);
    pill(ctx, cx, cy, ww, hh);
    ctx.fillStyle = rgba(mix(LIME, CARD, grow)); ctx.fill();
    if (grow > 0.02) { ctx.lineWidth = 2; ctx.strokeStyle = rgba(LIME, 0.6 * grow); ctx.stroke(); }
    const typed = c.query.slice(0, Math.floor(prog(t, T.type0, T.type1) * c.query.length));
    if (grow > 0.5 && toChat < 0.05) {
      setFont(ctx, 500, 40, SANS); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(INK); ctx.fillText(typed, cx - ww / 2 + 48, cy + 2);
      const caretOn = t < T.type1 || Math.floor(t * 4) % 2 === 0;
      if (caretOn && t < T.send) ctx.fillRect(cx - ww / 2 + 50 + ctx.measureText(typed).width, cy - 22, 3, 44);
      const sb = spring(t - (T.type1 - 0.1), 18, 8), press = prog(t, T.send, T.send + 0.05) * (1 - prog(t, T.send + 0.05, T.send + 0.15));
      if (sb > 0) {
        const bx = cx + ww / 2 - 60;
        ctx.save(); ctx.translate(bx, cy); ctx.scale(sb * (1 - 0.1 * press), sb * (1 - 0.1 * press));
        ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(NAVY); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -14); ctx.moveTo(-11, -3); ctx.lineTo(0, -14); ctx.lineTo(11, -3); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }
  if (t < T.chat) return;

  // the panel: full size during the demo, then shrunk into the centre of the channel orbit
  const tc = Math.min(t, T.omni);
  const sc = lerp(lerp(0.94, 1, toChat), 0.36, shrink) * (1 - exit);
  const cy = lerp(H / 2, ORBIT.cy, shrink);
  if (t >= T.omni) orbit(ctx, t, false, exit);
  ctx.save();
  ctx.translate(W / 2, cy); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
  ctx.globalAlpha = toChat;
  chatPanel(ctx, tc, t);
  ctx.restore();
  if (t >= T.omni) orbit(ctx, t, true, exit);
}

function chatPanel(ctx, t, tReal) {
  const P = PANEL;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  rrect(ctx, P.x, P.y, P.w, P.h, 40); ctx.fillStyle = rgba(CARD); ctx.fill();
  ctx.restore();
  rrect(ctx, P.x, P.y, P.w, P.h, 40); ctx.lineWidth = 2; ctx.strokeStyle = rgba(LINE); ctx.stroke();
  // header: the mark, the agent's name, online status, a cart that fills up
  drawLogo(ctx, P.x + 62, P.y + 54, 13);
  setFont(ctx, 600, 30, SANS); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(INK); ctx.fillText(c.agent, P.x + 118, P.y + 50);
  ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(P.x + 124, P.y + 70, 6, 0, TAU); ctx.fill();
  setFont(ctx, 500, 22, SANS); ctx.fillStyle = rgba(DIM); ctx.fillText(c.online, P.x + 138, P.y + 78);
  cartIcon(ctx, P.x + P.w - 70, P.y + 54, spring(t - T.badge, 20, 7));
  ctx.fillStyle = rgba(LINE); ctx.fillRect(P.x, P.y + 104, P.w, 2);

  const L = chatLayout(t);
  ctx.save();
  ctx.beginPath(); ctx.rect(P.x, L.top + 2, P.w, L.bottom - L.top + 10); ctx.clip();
  for (const it of L.items) {
    if (t < it.t0) continue;
    const pop = spring(t - it.t0, 16, 8);
    if (it.kind === 'user') bubble(ctx, it.text, P.x + P.w - 36, it.y, pop, true, 1);
    if (it.kind === 'agent') {
      if (t < it.stream) typingDots(ctx, P.x + 36, it.y, pop, t);
      else {
        const words = it.text.split(' '), n = Math.min(words.length, Math.floor((t - it.stream) / 0.045) + 1);
        bubble(ctx, words.slice(0, n).join(' '), P.x + 36, it.y, 1, false, 1, it.text);
      }
    }
    if (it.kind === 'chip') {
      ctx.save(); ctx.globalAlpha = it.e;
      setFont(ctx, 500, 20, MONO); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(c.catalog).width + 44;
      pill(ctx, P.x + 36 + w / 2, it.y + 16, w, 34); ctx.fillStyle = rgba(CARD2); ctx.fill();
      ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(P.x + 54, it.y + 16, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(DIM); ctx.fillText(c.catalog, P.x + 66, it.y + 17);
      ctx.restore();
    }
    if (it.kind === 'cards') for (let i = 0; i < 3; i++) productCard(ctx, i, cardRect(i, L), t, tReal);
  }
  ctx.restore();
  // the input bar the first message came from
  pill(ctx, W / 2, P.y + P.h - 64, P.w - 48, 84);
  ctx.fillStyle = rgba(CARD2); ctx.fill();
  setFont(ctx, 500, 28, SANS); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(DIM); ctx.fillText(c.placeholder, P.x + 70, P.y + P.h - 62);
  ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(P.x + P.w - 76, P.y + P.h - 64, 28, 0, TAU); ctx.fill();
}

function bubble(ctx, text, x, y, pop, user, alpha, full = text) {
  setFont(ctx, 500, 32, SANS); ctx.textBaseline = 'middle';
  const w = ctx.measureText(full).width + 56, h = 76;
  const bx = user ? x - w : x;
  ctx.save();
  ctx.translate(user ? x : bx, y + h); ctx.scale(pop, pop); ctx.translate(user ? -x : -bx, -(y + h));
  ctx.globalAlpha = alpha * clamp(pop * 2);
  rrect(ctx, bx, y, w, h, [28, 28, user ? 8 : 28, user ? 28 : 8]);
  ctx.fillStyle = rgba(user ? LIME : CARD2); ctx.fill();
  ctx.fillStyle = rgba(user ? NAVY : INK); ctx.textAlign = 'left';
  ctx.fillText(text, bx + 28, y + h / 2 + 2);
  ctx.restore();
}
function typingDots(ctx, x, y, pop, t) {
  ctx.save(); ctx.translate(x, y + 76); ctx.scale(pop, pop);
  rrect(ctx, 0, -76, 124, 76, [28, 28, 28, 8]); ctx.fillStyle = rgba(CARD2); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const b = Math.max(0, Math.sin((t * 9 - i * 0.9)));
    ctx.fillStyle = rgba(INK, 0.45 + 0.55 * b); ctx.beginPath(); ctx.arc(34 + i * 28, -38 - 7 * b, 8, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function cartIcon(ctx, x, y, badge) {
  ctx.save(); ctx.strokeStyle = rgba(INK); ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 24, y - 16); ctx.lineTo(x - 16, y - 16); ctx.lineTo(x - 10, y + 10); ctx.lineTo(x + 18, y + 10); ctx.lineTo(x + 23, y - 8); ctx.lineTo(x - 13, y - 8); ctx.stroke();
  ctx.fillStyle = rgba(INK); for (const dx of [-6, 14]) { ctx.beginPath(); ctx.arc(x + dx, y + 19, 3.5, 0, TAU); ctx.fill(); }
  if (badge > 0) {
    ctx.translate(x + 20, y - 18); ctx.scale(badge, badge);
    ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
    setFont(ctx, 700, 20, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(NAVY); ctx.fillText('1', 0, 1);
  }
  ctx.restore();
}

const BAGS = [
  { col: [34, 34, 38], bg: [60, 58, 80], shape: 0 },
  { col: [170, 140, 116], bg: [74, 64, 72], shape: 1 },
  { col: [40, 38, 44], bg: [58, 70, 76], shape: 2 },
];
const SWATCH = [[26, 26, 30], [170, 140, 116], [236, 226, 206]];
function productCard(ctx, i, r, t, tReal) {
  const p = spring(t - (T.cards + i * 0.09), 15, 8);
  if (p <= 0) return;
  const focus = i === 1 ? EASE.expo(prog(t, T.swatch, T.swatch + 0.35)) : 0;
  const others = EASE.expo(prog(t, T.swatch, T.swatch + 0.35)) * (i === 1 ? 0 : 1);
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h); ctx.scale(p * (1 + 0.04 * focus), p * (1 + 0.04 * focus)); ctx.translate(-(r.x + r.w / 2), -(r.y + r.h));
  ctx.globalAlpha = clamp(p * 2) * (1 - 0.45 * others);
  rrect(ctx, r.x, r.y, r.w, r.h, 26); ctx.fillStyle = rgba(CARD2); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = rgba(mix(LINE, LIME, focus)); ctx.stroke();
  // photo area with a drawn bag; the second bag turns black when the variant is picked
  rrect(ctx, r.x + 12, r.y + 12, r.w - 24, 168, 18); ctx.fillStyle = rgba(BAGS[i].bg); ctx.fill();
  const col = i === 1 ? mix(BAGS[1].col, [30, 30, 34], EASE.expo(prog(t, T.swatch + 0.1, T.swatch + 0.4))) : BAGS[i].col;
  drawBag(ctx, r.x + r.w / 2, r.y + 108, BAGS[i].shape, col);
  const [name, price] = c.products[i];
  setFont(ctx, 600, 26, SANS); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(INK); ctx.fillText(name, r.x + 20, r.y + 216);
  setFont(ctx, 700, 28, SANS); ctx.fillStyle = rgba(LIME); ctx.fillText(price, r.x + 20, r.y + 252);
  // colour swatches; on the focused card the ring slides to black
  const sel = i === 1 ? 1 - EASE.expo(prog(t, T.swatch, T.swatch + 0.3)) : 0;
  SWATCH.forEach((s, k) => {
    ctx.fillStyle = rgba(s); ctx.beginPath(); ctx.arc(r.x + 32 + k * 34, r.y + 284, 11, 0, TAU); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(LINE); ctx.stroke();
  });
  const ringX = r.x + 32 + (i === 1 ? sel : 0) * 34;
  ctx.lineWidth = 3; ctx.strokeStyle = rgba(i === 1 ? mix(INK, LIME, focus) : INK, 0.9); ctx.beginPath(); ctx.arc(ringX, r.y + 284, 17, 0, TAU); ctx.stroke();
  // add-to-cart: outlined everywhere, filled and clicked on the focused card
  const press = prog(tReal, T.cart, T.cart + 0.05) * (1 - prog(tReal, T.cart + 0.05, T.cart + 0.2));
  const done = i === 1 && tReal >= T.cart + 0.08;
  const bx = r.x + r.w / 2, by = r.y + 336, bs = 1 - 0.08 * (i === 1 ? press : 0);
  ctx.save(); ctx.translate(bx, by); ctx.scale(bs, bs);
  pill(ctx, 0, 0, r.w - 36, 48);
  ctx.fillStyle = rgba(mix(CARD2, LIME, focus)); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = rgba(mix(LINE, LIME, focus)); ctx.stroke();
  setFont(ctx, 600, 22, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(focus > 0.5 ? NAVY : INK);
  if (done) { check(ctx, -52, 1, 9, NAVY, 3.5); ctx.fillText(c.added, 12, 1); } else ctx.fillText(c.add, 0, 1);
  ctx.restore();
  ctx.restore();
}
function drawBag(ctx, x, y, shape, col) {
  ctx.save(); ctx.translate(x, y);
  const hi = mix(col, [255, 255, 255], 0.18), lo = mix(col, [0, 0, 0], 0.25);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (shape === 0) {             // tote: two handles, tapered body
    ctx.strokeStyle = rgba(lo); ctx.lineWidth = 7;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 18, -30, 20, Math.PI, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-56, -30); ctx.lineTo(56, -30); ctx.lineTo(66, 48); ctx.quadraticCurveTo(66, 56, 58, 56); ctx.lineTo(-58, 56); ctx.quadraticCurveTo(-66, 56, -66, 48); ctx.closePath();
    ctx.fillStyle = rgba(col); ctx.fill();
    ctx.fillStyle = rgba(hi); ctx.fillRect(-50, -26, 100, 5);
  } else if (shape === 1) {      // shoulder bag: long strap, rounded body, flap
    ctx.strokeStyle = rgba(lo); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-48, -6); ctx.quadraticCurveTo(0, -120, 48, -6); ctx.stroke();
    rrect(ctx, -62, -12, 124, 72, 24); ctx.fillStyle = rgba(col); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-62, 4); ctx.quadraticCurveTo(0, 40, 62, 4); ctx.lineTo(62, -2); ctx.quadraticCurveTo(62, -12, 50, -12); ctx.lineTo(-50, -12); ctx.quadraticCurveTo(-62, -12, -62, -2); ctx.closePath();
    ctx.fillStyle = rgba(hi); ctx.fill();
    ctx.fillStyle = rgba(LIME_T); ctx.beginPath(); ctx.arc(0, 20, 6, 0, TAU); ctx.fill();
  } else {                       // crossbody: small box, chain strap
    ctx.strokeStyle = rgba([200, 190, 160]); ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(-40, -14); ctx.quadraticCurveTo(0, -110, 40, -14); ctx.stroke(); ctx.setLineDash([]);
    rrect(ctx, -54, -16, 108, 70, 12); ctx.fillStyle = rgba(col); ctx.fill();
    rrect(ctx, -54, -16, 108, 34, 12); ctx.fillStyle = rgba(hi); ctx.fill();
    ctx.fillStyle = rgba([200, 190, 160]); ctx.fillRect(-10, 12, 20, 10);
  }
  ctx.restore();
}

// channels ride an orbit with the logo's own tilt; messages fly from each channel into the inbox
const ORBIT = { cx: 960, cy: 625, R: 258 };                  // R in "sphere radii": the outer row sits at 1.885 R
function orbit(ctx, t, front, exit) {
  const u = t - T.omni, grow = EASE.expo(prog(t, T.omni, T.omni + 0.7)) * (1 - exit);
  if (grow <= 0) return;
  const R = ORBIT.R * (0.6 + 0.4 * grow);
  const spin = u * 0.35 + (1 - grow) * -1.2 + E.inExpo(exit) * 2;
  // the logo's dot ring, huge and faint, as a halo
  if (!front) {
    for (const d of ringDots(ORBIT.cx, ORBIT.cy, R, spin * 0.6)) dot(ctx, d.x, d.y, d.a, d.b, INK, 0.1 * grow);
  }
  const cs = Math.cos(LOGO.rot), sn = Math.sin(LOGO.rot);
  c.channels.forEach((name, i) => {
    const phi = spin + (i / 6) * TAU + 0.4;
    const isFront = Math.sin(phi) > 0;
    if (isFront !== front) return;
    const px = Math.cos(phi) * R * 2.05, py = Math.sin(phi) * R * 2.05 * LOGO.k;
    const x = ORBIT.cx + px * cs - py * sn, y = ORBIT.cy + px * sn + py * cs;
    const depth = 0.84 + 0.16 * Math.sin(phi);
    const pop = spring(t - (T.omni + 0.12 + i * 0.06), 16, 8) * (1 - exit);
    if (pop <= 0) return;
    // a message leaves this channel on every beat and lands in the inbox
    if (front || true) for (let k = 0; k < 4; k++) {
      const t0 = T.omni + 0.35 + i * 0.07 + k * 0.47, q = prog(t, t0, t0 + 0.42);
      if (q <= 0 || q >= 1 || exit > 0) continue;
      const e = E.inCubic(q), mx = lerp(x, ORBIT.cx, e), my = lerp(y, ORBIT.cy - 40, e) - Math.sin(Math.PI * q) * 60;
      ctx.fillStyle = rgba(CHANNEL_COLS[i], 0.9 * (1 - q * 0.3)); ctx.beginPath(); ctx.arc(mx, my, 7 * depth, 0, TAU); ctx.fill();
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(pop * depth, pop * depth);
    ctx.globalAlpha = 0.55 + 0.45 * depth;
    setFont(ctx, 600, 30, SANS); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(name).width + 76;
    pill(ctx, 0, 0, w, 64); ctx.fillStyle = rgba(CARD2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(LINE); ctx.stroke();
    ctx.fillStyle = rgba(CHANNEL_COLS[i]); ctx.beginPath(); ctx.arc(-w / 2 + 30, 0, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(INK); ctx.fillText(name, -w / 2 + 50, 2);
    ctx.restore();
  });
  // the headline sits above the orbit
  if (front) {
    const inn = EASE.expo(prog(t, T.inbox, T.inbox + 0.6)), out = E.inExpo(prog(t, T.grid - 0.3, T.grid));
    setFont(ctx, 600, 84, DISP, -2); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.save(); ctx.beginPath(); ctx.rect(0, 40, W, 132); ctx.clip();
    ctx.fillStyle = rgba(INK); ctx.fillText(c.inbox, W / 2, 142 + (1 - inn) * 110 - out * 120);
    ctx.restore();
  }
}

// ───────────────────────────── bar 4½ · breadth: four capabilities in one grid
function tiles(ctx, t) {
  const TW = 760, TH = 330, G = 32, x0 = (W - 2 * TW - G) / 2, y0 = (H - 2 * TH - G) / 2 + 10;
  const out = prog(t, T.eq - 0.12, T.eq + 0.3);
  c.tiles.forEach(([title, sub], i) => {
    const t0 = T.tiles[i], p = spring(t - t0, 15, 8);
    if (p <= 0) return;
    const x = x0 + (i % 2) * (TW + G), y = y0 + Math.floor(i / 2) * (TH + G);
    const o = E.inBack(clamp((out - i * 0.08) / 0.6), 1.6);
    const s = p * (1 - o);
    if (s <= 0.01) return;
    ctx.save();
    ctx.translate(x + TW / 2, y + TH / 2); ctx.scale(s, s); ctx.translate(-(x + TW / 2), -(y + TH / 2));
    ctx.globalAlpha = clamp(p * 2);
    rrect(ctx, x, y, TW, TH, 30); ctx.fillStyle = rgba(CARD); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(LINE); ctx.stroke();
    setFont(ctx, 600, 50, DISP, -1); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(INK); ctx.fillText(title, x + 44, y + TH - 84);
    setFont(ctx, 500, 22, MONO); ctx.fillStyle = rgba(DIM); ctx.fillText(sub, x + 46, y + TH - 44);
    const u = t - t0, ix = x + TW - 190, iy = y + 120;
    [cartTile, segmentTile, flowTile, ragTile][i](ctx, ix, iy, u, x, y, TW);
    ctx.restore();
  });
}
function cartTile(ctx, x, y, u) {
  const back = EASE.expo(prog(u, 0.35, 0.7));
  ctx.save(); ctx.translate(x, y); ctx.scale(2.1, 2.1);
  ctx.setLineDash(back < 0.5 ? [5, 5] : []);
  ctx.strokeStyle = rgba(mix(DIM, LIME, back)); ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-24, -16); ctx.lineTo(-16, -16); ctx.lineTo(-10, 10); ctx.lineTo(18, 10); ctx.lineTo(23, -8); ctx.lineTo(-13, -8); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = rgba(mix(DIM, LIME, back)); for (const dx of [-6, 14]) { ctx.beginPath(); ctx.arc(dx, 19, 3.5, 0, TAU); ctx.fill(); }
  const s = spring(u - 0.6, 18, 8);
  if (s > 0) { ctx.translate(26, -24); ctx.scale(s, s); ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); check(ctx, 0, 0, 6, NAVY, 3); }
  ctx.restore();
  const r = prog(u, 0.6, 1.2);
  if (r > 0 && r < 1) { ctx.strokeStyle = rgba(LIME, 1 - r); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 60 + 90 * r, 0, TAU); ctx.stroke(); }
}
function segmentTile(ctx, x, y, u) {
  const e = EASE.expo(prog(u, 0.15, 0.75)), cols = [LIME, INK, DIM], centres = [[-80, -30], [20, 40], [100, -40]];
  for (let i = 0; i < 36; i++) {
    const g = i % 3, a = hash(i * 3.1) * TAU, rr = 18 + hash(i * 7.7) * 34;
    const sx = (hash(i * 1.9) - 0.5) * 300, sy = (hash(i * 4.3) - 0.5) * 170;
    const tx = centres[g][0] + Math.cos(a) * rr, ty = centres[g][1] + Math.sin(a) * rr * 0.8;
    ctx.fillStyle = rgba(mix(DIM, cols[g], e)); ctx.beginPath(); ctx.arc(x + lerp(sx, tx, e), y + lerp(sy, ty, e), 7, 0, TAU); ctx.fill();
  }
}
function flowTile(ctx, x, y, u) {
  const xs = [-170, -10, 150];
  ctx.strokeStyle = rgba(LINE); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + xs[0], y); ctx.lineTo(x + xs[2], y); ctx.stroke();
  const pulse = prog(u, 0.15, 0.95);
  xs.forEach((dx, i) => {
    const lit = pulse >= i / 2 ? 1 : 0, s = spring(u - 0.05 - i * 0.06, 18, 8);
    ctx.save(); ctx.translate(x + dx, y); ctx.scale(s, s);
    rrect(ctx, -58, -30, 116, 60, 16); ctx.fillStyle = rgba(lit ? [44, 60, 30] : CARD2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(lit ? LIME : LINE); ctx.stroke();
    setFont(ctx, 500, 20, MONO); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(lit ? INK : DIM); ctx.fillText(c.flow[i], 0, 1);
    ctx.restore();
  });
  if (pulse > 0 && pulse < 1) { ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(x + lerp(xs[0], xs[2], pulse), y - 44, 7, 0, TAU); ctx.fill(); }
}
function ragTile(ctx, x, y, u) {
  for (let k = 2; k >= 0; k--) {
    const s = spring(u - k * 0.06, 18, 8), dx = x - 120 + k * 36, dy = y - 70 + k * 18;
    ctx.save(); ctx.globalAlpha *= clamp(s);
    rrect(ctx, dx, dy, 150, 180, 14); ctx.fillStyle = rgba(k ? CARD2 : [44, 44, 70]); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(LINE); ctx.stroke();
    for (let l = 0; l < 6; l++) { ctx.fillStyle = rgba(DIM, 0.6); ctx.fillRect(dx + 20, dy + 26 + l * 24, 110 - (l % 3) * 24, 8); }
    ctx.restore();
  }
  const scan = prog(u, 0.2, 0.9);
  if (scan > 0 && scan < 1) { ctx.fillStyle = rgba(LIME, 0.9); ctx.fillRect(x - 128, y - 64 + scan * 170, 166, 4); }
  for (let i = 0; i < 5; i++) {
    const q = prog(u, 0.45 + i * 0.07, 0.8 + i * 0.07);
    if (q <= 0 || q >= 1) continue;
    ctx.fillStyle = rgba(LIME); ctx.beginPath(); ctx.arc(x + lerp(0, 150, E.inCubic(q)), y + lerp(20, -40, q) + Math.sin(q * Math.PI) * -30, 6, 0, TAU); ctx.fill();
  }
  const b = spring(u - 0.8, 16, 8);
  if (b > 0) { ctx.save(); ctx.translate(x + 150, y - 50); ctx.scale(b, b); rrect(ctx, -34, -24, 68, 48, [16, 16, 16, 4]); ctx.fillStyle = rgba(LIME); ctx.fill(); ctx.restore(); }
}

// ───────────────────────────── bar 5½ · the formula, one term per beat
const FX = 600, FY = [300, 440, 580, 720];
function drawFormula(ctx, t) {
  FORMULA.forEach((term, i) => {
    const t0 = T.terms[i];
    setFont(ctx, 700, 112, DISP, -3); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const L = layout(ctx, term, `700 112px ${DISP}`, -3);
    setFont(ctx, 700, 112, DISP, -3);
    ctx.save(); ctx.beginPath(); ctx.rect(0, FY[i] - 118, W, 150); ctx.clip();
    for (let k = 0; k < term.length; k++) {
      const p = EASE.expo(prog(t, t0 + k * 0.022, t0 + 0.5 + k * 0.022));
      ctx.fillStyle = rgba(INK); ctx.fillText(term[k], FX + L.xs[k], FY[i] + (1 - p) * 140);
    }
    ctx.restore();
    if (i > 0) {
      const s = E.outBack(prog(t, t0 - 0.02, t0 + 0.25), 2.2);
      if (s > 0) {
        ctx.save(); ctx.translate(FX - 90, FY[i] - 40); ctx.rotate((1 - s) * -1.2); ctx.scale(s, s);
        ctx.fillStyle = rgba(LIME); ctx.fillRect(-28, -7, 56, 14); ctx.fillRect(-7, -28, 14, 56);
        ctx.restore();
      }
    }
  });
}
function formula(ctx, t) {
  const hide = t >= T.swirl ? 1 : 0;
  if (!hide) drawFormula(ctx, t);
}

// ───────────────────────────── bars 6½–8 · the formula dissolves into dots that assemble the logo
const LOCK = { R: 116, logo: [0, 0], word: 0 };
function lockup(ctx, t) {
  // layout: mark + wordmark, centred as a group
  setFont(ctx, 700, 150, DISP, -5);
  const L = layout(ctx, BRAND.name, `700 150px ${DISP}`, -5);
  const markW = 2 * (1.885 + 0.22) * LOCK.R, gap = 70, total = markW + gap + L.total, x0 = (W - total) / 2;
  const slide = EASE.expo(prog(t, T.lock - 0.05, T.lock + 0.5));
  const lx = lerp(W / 2, x0 + markW / 2, slide), ly = H / 2 - 10;
  LOCK.logo = [lx, ly];
  const u = t - T.swirl;
  const settle = EASE.expo(prog(t, T.swirl, T.lock));
  const spin = -1.4 * (1 - settle);
  const slots = logoDots(lx, ly, LOCK.R, spin, EASE.expo(prog(t, T.sphere, T.lock + 0.25)));
  const arrive = (i, x) => clamp((u - 0.02 - ((x - FX) / 900) * 0.22 - hash(i * 2.3) * 0.08) / 0.42);
  // the chromatic hit on the downbeat of the lockup
  const hit = Math.exp(-Math.max(0, t - T.lock) * 12) * (t >= T.lock ? 1 : 0);
  chromatic(ctx, [255, 255, 255], 9 * hit, (col, dx) => {
    const tint = b => [b[0] * col[0] / 255, b[1] * col[1] / 255, b[2] * col[2] / 255];   // one channel per pass
    ctx.save(); ctx.translate(dx, 0);
    // back dots, sphere, front dots
    const sph = LOCK.R * spring(t - T.sphere, 13, 6);
    const drawSlots = front => slots.forEach((d, i) => {
      if (d.front !== front) return;
      const a = EASE.expo(clamp((u - 0.35 - hash(i * 5.1) * 0.2) / 0.3));
      if (a > 0) dot(ctx, d.x, d.y, d.a.map(v => v * a), d.b.map(v => v * a), tint(WHITE));
    });
    drawSlots(false);
    sphere(ctx, lx, ly, sph, tint);
    drawSlots(true);
    // wordmark and tagline
    setFont(ctx, 700, 150, DISP, -5); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const wx = x0 + markW + gap + (1 - slide) * 120;
    ctx.save(); ctx.beginPath(); ctx.rect(wx - 20, ly - 150, L.total + 60, 196); ctx.clip();
    for (let k = 0; k < BRAND.name.length; k++) {
      const p = EASE.expo(prog(t, T.lock + k * 0.03, T.lock + 0.55 + k * 0.03));
      ctx.fillStyle = rgba(tint(INK)); ctx.fillText(BRAND.name[k], wx + L.xs[k], ly + 40 + (1 - p) * 180);
    }
    ctx.restore();
    const tp = EASE.expo(prog(t, T.tag, T.tag + 0.6));
    setFont(ctx, 500, 40, SANS, 0); ctx.save(); ctx.beginPath(); ctx.rect(wx - 10, ly + 62, 1200, 70); ctx.clip();
    ctx.fillStyle = rgba(tint(DIM)); ctx.fillText(BRAND.tagline, wx + 6, ly + 108 + (1 - tp) * 60);
    ctx.restore();
    ctx.restore();
  });
  // particles in flight: every sampled pixel of the formula heads for a ring dot, swirling around the mark
  for (const p of PARTS) {
    const q = arrive(p.slot, p.x);
    if (q >= 1) continue;
    const s = slots[p.slot], e = E.inOutCubic(q);
    const ang = Math.sin(Math.PI * e) * 0.5 * (p.h > 0.5 ? 1 : -1);
    const dx = p.x - lx, dy = p.y - ly;
    const rx = lx + (dx * Math.cos(ang) - dy * Math.sin(ang)), ry = ly + (dx * Math.sin(ang) + dy * Math.cos(ang));
    const x = lerp(rx, s.x, e), y = lerp(ry, s.y, e);
    ctx.fillStyle = rgba(p.c[1] > 200 && p.c[0] < 200 ? LIME : INK, 1 - q * 0.5);
    ctx.beginPath(); ctx.arc(x, y, 3.2 * (1 - q * 0.4), 0, TAU); ctx.fill();
  }
}

// ───────────────────────────── the cursor: clicks the old path, sends the message, adds to cart
function cursor(ctx, t) {
  let pos, press = 0;
  if (t < T.suck) {
    const ks = [[0, W * 0.55, H * 0.8]];
    T.chips.forEach((t0, i) => { ks.push([t0 + 0.02, HOOK[i].cx + 10, H / 2 + 14]); ks.push([t0 + 0.2, HOOK[i].cx + 10, H / 2 + 14]); });
    pos = key(t, ks);
    pos[0] += hookShift(t);
    for (const t0 of T.chips) press = Math.max(press, prog(t, t0 + 0.1, t0 + 0.13) * (1 - prog(t, t0 + 0.15, t0 + 0.22)));
  } else if (t > T.type1 - 0.5 && t < T.chat) {
    pos = key(t, [[T.type1 - 0.5, W * 0.9, H * 0.9], [T.send - 0.04, W / 2 + 560 - 60 + 8, H / 2 + 12]]);
    press = prog(t, T.send, T.send + 0.04) * (1 - prog(t, T.send + 0.06, T.send + 0.14));
  } else if (t > T.swatch - 0.1 && t < T.omni) {
    const [bx, by] = cartButtonPos(T.cart);
    pos = key(t, [[T.swatch - 0.1, W * 0.86, H * 0.95], [T.cart - 0.06, bx + 30, by + 8]]);
    press = prog(t, T.cart, T.cart + 0.04) * (1 - prog(t, T.cart + 0.06, T.cart + 0.14));
  }
  if (pos) pointer(ctx, pos[0], pos[1], 1.25, press);
}
