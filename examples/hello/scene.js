// examples/hello — a 10 s tour of the engine: kinetic type, a dot field that becomes a landscape,
// shape morphing with onion skins, spring-driven UI, and a glass end card.
// 120 BPM → one bar = 2 s. Every section starts on a bar line.
import {
  TAU, clamp, lerp, prog, mix, rgba, E, EASE, spring, setFont, layout, rrect, pill, withScale, arrow, check,
  pointer, shake, vignette, chromatic, grid, ripple, project3D, SHAPES, morphPath, glassSlats, radialBlob,
} from '../../engine/core.js';

const BG = [15, 16, 18], INK = [242, 241, 236], DIM = [118, 118, 116], CARD = [26, 27, 31], LINE = [46, 47, 52];
const ORANGE = [255, 106, 61], BLUE = [91, 140, 255], YELLOW = [246, 196, 69], PAPER = [244, 244, 241], DARK = [20, 21, 24];
const SANS = 'Inter', MONO = '"JetBrains Mono"';

export default {
  draw(ctx, t, api) {
    const { W, H } = api;
    ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);
    const [dx, dy] = shake(t, [[2, 5], [8, 12]]);
    ctx.save(); ctx.translate(dx, dy);
    if (t < 2) intro(ctx, t, api);
    else if (t < 4) field(ctx, t, api);
    else if (t < 6) morph(ctx, t - 4, api);
    else if (t < 8) ui(ctx, t - 6, api);
    else end(ctx, t - 8, api);
    ctx.restore();
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, 0.25); },
};

// ───────────────────────────── bar 0 · kinetic type
function intro(ctx, u, { W, H }) {
  const X = 170;
  const comment = '// every frame is a pure function of time';
  setFont(ctx, 500, 26, MONO); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgba(DIM, 1 - prog(u, 1.5, 1.8));
  ctx.fillText(comment.slice(0, Math.floor(prog(u, 0.15, 0.85) * comment.length)), X + 6, 290);

  // "Motion": per-letter rise, 40 ms stagger
  const big = `700 220px ${SANS}`, L = layout(ctx, 'Motion', big, -9);
  setFont(ctx, 700, 220, SANS, -9);
  const out0 = E.inExpo(prog(u, 1.55, 1.9));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 490 - 235, W, 290); ctx.clip();
  ctx.fillStyle = rgba(INK);
  for (let i = 0; i < 6; i++) {
    const p = EASE.expo(prog(u, 0.05 + i * 0.04, 0.75 + i * 0.04));
    ctx.fillText('Motion'[i], X + L.xs[i], 490 + (1 - p) * 250 - out0 * 280);
  }
  ctx.restore();
  // two supporting lines rise as whole lines through their own masks
  [['is a function', 640, 0.45], ['of time.', 790, 0.7]].forEach(([s, y, t0], k) => {
    const p = EASE.expo(prog(u, t0, t0 + 0.7)), q = E.inExpo(prog(u, 1.6 + k * 0.06, 1.95 + k * 0.06));
    setFont(ctx, 500, 124, SANS, -4);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 130, W, 170); ctx.clip();
    const yy = y + (1 - p) * 150 - q * 170;
    if (k === 0) { ctx.fillStyle = rgba(INK); ctx.fillText(s, X, yy); }
    else {
      ctx.fillStyle = rgba(INK); ctx.fillText('of ', X, yy);
      ctx.fillStyle = rgba(ORANGE); ctx.fillText('time.', X + ctx.measureText('of ').width, yy);
    }
    ctx.restore();
  });
  // a dot is born where the next scene begins
  const d = E.outBack(prog(u, 1.8, 2.0), 2.4);
  if (d > 0) { ctx.fillStyle = rgba(ORANGE); ctx.beginPath(); ctx.arc(W / 2, H / 2, 12 * d, 0, TAU); ctx.fill(); }
}

// ───────────────────────────── bar 1 · dot field → ripples → 3D landscape → collapse
const G = grid(31, 17, 64);
const DMAX = Math.hypot(960, 512);
const RIPPLES = [{ t: 2.5, o: [0, 0], c: ORANGE }, { t: 2.75, o: [-448, 128], c: YELLOW }, { t: 3.0, o: [448, -128], c: BLUE }];
function field(ctx, t, { W, H }) {
  const u = t - 2;
  const tilt = 1.0 * E.inOutCubic(prog(t, 3.0, 3.6)), yaw = 0.3 * E.inOutCubic(prog(t, 3.0, 4.0));
  const amp = 80 * E.inOutCubic(prog(t, 3.0, 3.5));
  const pts = [];
  for (const p of G) {
    const ua = 0.9 * (1 - Math.cbrt(Math.max(0, 1 - p.d / 1300)));
    const s = spring(u - ua, 22, 7.5);
    if (s <= 0.001) continue;
    let x = p.x, y = p.y, z = 0, r = 3.6 * s, col = INK;
    for (const q of RIPPLES) {
      const w = ripple(p, q.o, q.t, t);
      if (w < 0.002) continue;
      const dx = p.x - q.o[0], dy = p.y - q.o[1], dd = Math.hypot(dx, dy) + 1e-3;
      r += 5.5 * w; x += (dx / dd) * 18 * w; y += (dy / dd) * 18 * w; col = mix(col, q.c, clamp(w * 1.4));
    }
    if (amp > 0) {
      const h = (Math.sin(p.d * 0.0105 - t * 7.5) + 0.45 * Math.sin(p.x * 0.0065 + p.y * 0.004 + t * 4)) * amp;
      z = -h;
      col = h > 0 ? mix(col, ORANGE, clamp(h / amp)) : mix(col, BLUE, clamp(-h / amp) * 0.7);
    }
    const v = E.inCubic(prog(t, 3.66 + 0.12 * (p.d / DMAX), 3.99));
    if (v > 0) {
      const a = v * 3, ca = Math.cos(a), sa = Math.sin(a), k = 1 - v;
      [x, y] = [(x * ca - y * sa) * k, (x * sa + y * ca) * k]; z *= k; r *= 1 - 0.5 * v; col = mix(col, ORANGE, v);
    }
    const P = project3D(x, y, z, { tilt, yaw });
    pts.push({ x: W / 2 + P.x, y: H / 2 - 50 * tilt * (1 - v) + P.y, r: r * P.s, z: P.z, col, a: clamp(0.25 + 0.75 * P.s) * (1 - prog(v, 0.85, 1)) });
  }
  pts.sort((a, b) => b.z - a.z);
  for (const o of pts) { ctx.fillStyle = rgba(o.col, o.a); ctx.beginPath(); ctx.arc(o.x, o.y, Math.max(0.1, o.r), 0, TAU); ctx.fill(); }
  const rp = prog(u, 0, 0.9);
  if (rp < 1) {
    ctx.strokeStyle = rgba(ORANGE, (1 - rp) * 0.9); ctx.lineWidth = 2 + 6 * (1 - rp);
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 1300 * E.outCubic(rp), 0, TAU); ctx.stroke();
  }
  if (u < 0.35) {
    ctx.fillStyle = rgba(ORANGE);
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 12 * (1 - prog(u, 0, 0.3)) + 30 * Math.sin(Math.PI * prog(u, 0, 0.18)), 0, TAU); ctx.fill();
  }
  const core = E.inExpo(prog(t, 3.75, 4.0));
  if (core > 0) { ctx.fillStyle = rgba(ORANGE); ctx.beginPath(); ctx.arc(W / 2, H / 2, 4 + 26 * core, 0, TAU); ctx.fill(); }
}

// ───────────────────────────── bar 2 · morph with onion skins
const MORPH = [SHAPES.circle, SHAPES.square, SHAPES.triangle, SHAPES.star];
const MCOL = [ORANGE, YELLOW, BLUE, ORANGE], MNAME = ['circle', 'square', 'triangle', 'star'];
const MT = [0.5, 1.0, 1.5], MROT = [0, Math.PI / 2, (4 * Math.PI) / 3, 2 * Math.PI];
function morphAt(u) {
  let a = 0, b = 0, e = 0;
  for (let k = 0; k < 3; k++) if (u >= MT[k]) { a = k; b = k + 1; e = prog(u, MT[k], MT[k] + 0.28); }
  return {
    A: MORPH[a], B: MORPH[b], e: E.outBack(e, 1.6), idx: e > 0.5 ? b : a,
    rot: lerp(MROT[a], MROT[b], E.inOutCubic(e)) + 4 * Math.PI * E.inCubic(prog(u, 1.62, 2.0)),
    sc: (0.15 + 0.85 * spring(u, 14, 6)) * (1 - E.inBack(prog(u, 1.7, 2.0), 2.4)),
    col: mix(MCOL[a], MCOL[b], clamp(e * 1.4)),
  };
}
function morph(ctx, u, { W, H }) {
  const cx = W / 2, cy = H / 2 - 30, R = 190;
  const la = prog(u, 0.05, 0.3) * (1 - prog(u, 1.6, 1.8));
  setFont(ctx, 700, 400, SANS, -16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = rgba(INK, 0.1 * la); ctx.lineWidth = 2; ctx.strokeText('morph', W / 2 + 60 - 80 * u, cy + 20);
  for (let k = 6; k >= 1; k--) {
    if (u - k * 0.03 < 0) continue;
    const m = morphAt(u - k * 0.03);
    morphPath(ctx, cx, cy, R * m.sc, m.A, m.B, m.e, m.rot);
    ctx.strokeStyle = rgba(m.col, 0.45 * (1 - k / 7)); ctx.lineWidth = 2; ctx.stroke();
  }
  const m = morphAt(u);
  morphPath(ctx, cx, cy, R * m.sc, m.A, m.B, m.e, m.rot);
  ctx.fillStyle = rgba(m.col); ctx.fill();
  setFont(ctx, 500, 28, MONO); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const sep = '  ›  ', full = MNAME.join(sep);
  let x = W / 2 - ctx.measureText(full).width / 2;
  MNAME.forEach((n, i) => {
    ctx.fillStyle = i === m.idx ? rgba(MCOL[i], la) : rgba(INK, 0.3 * la); ctx.fillText(n, x, H / 2 + 330); x += ctx.measureText(n).width;
    if (i < 3) { ctx.fillStyle = rgba(INK, 0.25 * la); ctx.fillText(sep, x, H / 2 + 330); x += ctx.measureText(sep).width; }
  });
}

// ───────────────────────────── bar 3 · springs for UI
const CARDS = [
  { c: ORANGE, title: 'Render queued', sub: '600 frames · 60 fps · 1920×1080' },
  { c: BLUE, title: 'Audio synthesized', sub: '48 kHz · -14 LUFS · 120 BPM' },
  { c: YELLOW, title: 'Motion blur', sub: '6 subframes · 180° shutter' },
];
const CLICK = 1.05;
function ui(ctx, u, { W, H }) {
  const cw = 860, ch = 136, gap = 26, top = H / 2 - (3 * ch + 2 * gap) / 2, x0 = W / 2 - cw / 2;
  const bx = x0 + cw - 120, by = top + ch / 2;
  CARDS.forEach((c, i) => {
    const s = spring(u - i * 0.12, 15, 8.5), out = E.inExpo(prog(u, 1.62 + i * 0.05, 1.95 + i * 0.05));
    if (s <= 0) return;
    const y = top + i * (ch + gap);
    ctx.save();
    ctx.globalAlpha = clamp(s) * (1 - out);
    ctx.translate(-out * 900, (1 - s) * 70);
    rrect(ctx, x0, y, cw, ch, 30); ctx.fillStyle = rgba(CARD); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(LINE); ctx.stroke();
    ctx.fillStyle = rgba(c.c); ctx.beginPath(); ctx.arc(x0 + 72, y + ch / 2, 30, 0, TAU); ctx.fill();
    setFont(ctx, 500, 38, SANS, -1); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(INK); ctx.fillText(c.title, x0 + 132, y + 62);
    setFont(ctx, 500, 22, MONO); ctx.fillStyle = rgba(DIM); ctx.fillText(c.sub, x0 + 134, y + 100);
    if (i === 0) {
      const done = u >= CLICK + 0.05, press = u >= CLICK ? 1 - 0.07 * Math.exp(-(u - CLICK) * 18) : 1;
      withScale(ctx, bx, by, press, () => {
        pill(ctx, bx, by, 170, 60);
        if (done) { ctx.lineWidth = 2; ctx.strokeStyle = rgba(ORANGE); ctx.stroke(); }
        else { ctx.fillStyle = rgba(ORANGE); ctx.fill(); }
        setFont(ctx, 500, 26, SANS, -0.5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = rgba(done ? ORANGE : DARK);
        if (done) { ctx.fillText('Shipped', bx - 14, by + 1); check(ctx, bx + 52, by, 8, ORANGE, 3); } else ctx.fillText('Ship it', bx, by + 1);
      });
    } else if (i === 1) {
      for (let k = 0; k < 18; k++) {
        const h = 10 + 34 * Math.abs(Math.sin(k * 0.9 + u * 9) * Math.cos(k * 0.37 + u * 5));
        ctx.fillStyle = rgba(BLUE, 0.85); ctx.fillRect(x0 + cw - 230 + k * 11, y + ch / 2 - h / 2, 6, h);
      }
    } else {
      const p = EASE.css(prog(u, 0.35, 1.35));
      rrect(ctx, x0 + cw - 250, y + ch / 2 - 6, 190, 12, 6); ctx.fillStyle = rgba(LINE); ctx.fill();
      rrect(ctx, x0 + cw - 250, y + ch / 2 - 6, 190 * p, 12, 6); ctx.fillStyle = rgba(YELLOW); ctx.fill();
    }
    ctx.restore();
  });
  const pp = EASE.css(prog(u, 0.45, 0.95)), pa = 1 - prog(u, 1.55, 1.7);
  if (u > 0.45 && pa > 0) {
    ctx.save(); ctx.globalAlpha = pa;
    pointer(ctx, lerp(W - 360, bx + 10, pp), lerp(H + 40, by + 8, pp), 1.2, u >= CLICK && u < CLICK + 0.12 ? 1 : 0);
    ctx.restore();
  }
}

// ───────────────────────────── bar 4 · glass end card
function end(ctx, u, { W, H }) {
  const reveal = EASE.expo(prog(u, 0, 0.7));
  const cursor = [lerp(W - 300, W / 2 + 250, EASE.css(prog(u, 1.0, 1.38))), lerp(H + 40, 790, EASE.css(prog(u, 1.0, 1.38)))];
  ctx.save();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 20 + 1300 * reveal, 0, TAU); ctx.clip();
  glassSlats(ctx, W, H, g => {
    g.fillStyle = rgba(PAPER); g.fillRect(0, 0, W, H);
    radialBlob(g, 360 + 80 * Math.sin(u), 260, 620, ORANGE, 0.28);
    radialBlob(g, 1600, 860 - 60 * Math.sin(u * 0.8), 660, BLUE, 0.24);
    radialBlob(g, 1500, 180, 420, YELLOW, 0.26);
    radialBlob(g, cursor[0], cursor[1], 360, ORANGE, 0.3 * prog(u, 1.0, 1.3));
  }, { drift: u * 16, width: 170 });

  const slam = 1 + 0.4 * (1 - E.outExpo(prog(u, 0.1, 0.6))), ca = u > 0.1 ? 12 * Math.exp(-(u - 0.1) * 7) : 0;
  if (u > 0.1) {
    ctx.save(); ctx.globalAlpha = prog(u, 0.1, 0.14);
    withScale(ctx, W / 2, 490, slam, () => {
      setFont(ctx, 700, 230, SANS, -10); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      chromatic(ctx, DARK, ca, (c, dx) => { ctx.fillStyle = rgba(c); ctx.fillText('ft-motion', W / 2 + dx, 560); }, { light: true });
    });
    ctx.restore();
  }
  const sp = EASE.expo(prog(u, 0.45, 1.0));
  setFont(ctx, 500, 30, MONO); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.beginPath(); ctx.rect(0, 620, W, 60); ctx.clip();
  ctx.fillStyle = rgba([88, 88, 92]); ctx.fillText('canvas 2D  ·  headless chrome  ·  ffmpeg  ·  synthesized sound', W / 2, 660 + (1 - sp) * 50);
  ctx.restore();
  const cs = spring(u - 0.8, 15, 8), click = u >= 1.45 ? Math.exp(-(u - 1.45) * 10) : 0;
  if (cs > 0) {
    withScale(ctx, W / 2, 790, cs * (1 - 0.04 * click), () => {
      ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
      pill(ctx, W / 2, 790, 540, 96); ctx.fillStyle = rgba(DARK); ctx.fill(); ctx.shadowColor = 'transparent';
      setFont(ctx, 500, 32, MONO); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(INK); ctx.fillText('node ft.mjs render', W / 2 - 230, 791);
      ctx.fillStyle = rgba(ORANGE); ctx.beginPath(); ctx.arc(W / 2 + 222, 790, 32, 0, TAU); ctx.fill();
      arrow(ctx, W / 2 + 222 + 6 * EASE.css(prog(u, 1.25, 1.45)), 790, 11, DARK, 3.5);
    });
    if (click > 0.01) { ctx.strokeStyle = rgba(ORANGE, click); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2 + 222, 790, 34 + 120 * (1 - click), 0, TAU); ctx.stroke(); }
  }
  if (u > 1.0) pointer(ctx, cursor[0], cursor[1], 1.2, click > 0.5 ? 1 : 0);
  ctx.restore();
  const fade = prog(u, 1.8, 2.0);
  if (fade > 0) { ctx.fillStyle = rgba(BG, fade); ctx.fillRect(0, 0, W, H); }
}
