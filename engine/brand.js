// ft-motion brand kit: what a "brandable" scene needs on top of core.js.
// A scene declares three colours, a display font, an optional logo and a copy dictionary; brandApi()
// turns them into a palette with guaranteed contrast, a safe area for the canvas' aspect ratio,
// text-fitting helpers and a logo asset (a monogram stands in when there is no logo file).
// The examples chat-commerce and motion-principles use it; so can any scene.
import { clamp, lerp, rgba, setFont } from './core.js';

// ───────────────────────────── safe areas (px at the reference size of each aspect ratio)
/** 9:16 keeps copy clear of the TikTok / Reels / Shorts caption, buttons and status bar. */
export const SAFE = {
  '16x9': { W: 1920, H: 1080, t: 64, b: 64, l: 110, r: 110 },
  '9x16': { W: 1080, H: 1920, t: 230, b: 430, l: 70, r: 150 },
  '1x1': { W: 1080, H: 1080, t: 70, b: 70, l: 70, r: 70 },
  '4x5': { W: 1080, H: 1350, t: 70, b: 70, l: 70, r: 70 },
};
/** Geometry for any canvas: the closest known aspect ratio decides the safe margins. */
export function formatInfo(W, H) {
  const ar = W / H;
  const [id, F] = Object.entries(SAFE).reduce((a, e) => (Math.abs(Math.log(e[1].W / e[1].H / ar)) < Math.abs(Math.log(a[1].W / a[1].H / ar)) ? e : a));
  const k = Math.min(W / F.W, H / F.H);
  const s = { x: F.l * k, y: F.t * k, r: W - F.r * k, b: H - F.b * k };
  return {
    id, W, H, ar, u: Math.min(W, H) / 1080,
    safe: { ...s, w: s.r - s.x, h: s.b - s.y, cx: (s.x + s.r) / 2, cy: (s.y + s.b) / 2 },
    landscape: ar > 1.2, portrait: ar < 0.85, square: ar >= 0.85 && ar <= 1.2, tall: ar < 0.7,
  };
}

// ───────────────────────────── colour
export const hexRgb = h => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
/** WCAG relative luminance */
export function lum([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const LIGHT = [247, 247, 243], DARK = [15, 16, 20];
export const onColor = c => (contrast(c, LIGHT) >= contrast(c, DARK) ? LIGHT : DARK);
export const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** The palette a scene paints with, derived from three brand colours (text colours picked for contrast). */
export function palette({ bg, main, accent }) {
  const B = hexRgb(bg), M = hexRgb(main), A = hexRgb(accent), text = onColor(B), dark = lum(B) < 0.4;
  return {
    bg: B, main: M, accent: A, text, dark,
    sub: mixRgb(text, B, 0.42), line: mixRgb(text, B, 0.82), card: mixRgb(B, text, dark ? 0.07 : 0.05),
    onMain: onColor(M), onAccent: onColor(A),
    pop: contrast(M, B) >= 1.8 ? M : contrast(A, B) >= 1.8 ? A : text,
  };
}

// ───────────────────────────── text fitting
/** Largest px (≤ max) at which `text` fits `width`. tracking in em. */
export function fit(ctx, text, { family, weight = 700, max = 120, min = 10, width, tracking = 0 }) {
  setFont(ctx, weight, 100, family, tracking * 100);
  const w = ctx.measureText(text).width || 1;
  return Math.max(min, Math.min(max, Math.floor((width / w) * 100)));
}
/** Fit on up to `lines` balanced lines; wraps only when that buys `gain`× the size. → { size, lines } */
export function fitLines(ctx, text, { family, weight = 700, max = 120, min = 10, width, lines = 2, tracking = 0, gain = 1.3 }) {
  const ws = text.split(' ').filter(Boolean);
  setFont(ctx, weight, 100, family, tracking * 100);
  const m = s => ctx.measureText(s).width;
  const sizeFor = ls => Math.max(min, Math.min(max, Math.floor((width / Math.max(1, ...ls.map(m))) * 100)));
  let best = { size: sizeFor([text]), lines: [text] };
  if (lines >= 2 && ws.length >= 2) {
    let b2 = null;
    for (let i = 1; i < ws.length; i++) { const ls = [ws.slice(0, i).join(' '), ws.slice(i).join(' ')], s = sizeFor(ls); if (!b2 || s > b2.s) b2 = { s, ls }; }
    if (b2.s >= best.size * gain) best = { size: b2.s, lines: b2.ls };
  }
  return best;
}
/** Locale-aware upper case (Turkish i → İ). */
export const upper = (s, lang) => s.toLocaleUpperCase(lang === 'tr' ? 'tr-TR' : 'en-US');

// ───────────────────────────── assets
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
/** Load an image (PNG/JPG/WebP/SVG/data:) as a trimmed canvas asset { cv, w, h }. */
export async function loadImage(url, maxSide = 1400) {
  const img = new Image();
  img.src = url;
  await img.decode();
  let w = img.naturalWidth || 1024, h = img.naturalHeight || 1024;
  const k = /\.svg(\?|$)/i.test(url) || url.startsWith('data:image/svg') ? maxSide / Math.max(w, h) : Math.min(1, maxSide / Math.max(w, h));
  w = Math.round(w * k); h = Math.round(h * k);
  const cv = canvas(w, h), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return { cv, w, h };
  const out = canvas(x1 - x0 + 5, y1 - y0 + 5);
  out.getContext('2d').drawImage(cv, x0 - 2, y0 - 2, out.width, out.height, 0, 0, out.width, out.height);
  return { cv: out, w: out.width, h: out.height };
}
/** Initials on a rounded tile, for brands without a logo file. */
export function monogram(name, { family, weight, main, onMain, size = 600 }) {
  const cv = canvas(size, size), g = cv.getContext('2d');
  const initials = (name || 'A').split(/\s+/).filter(Boolean).slice(0, 2).map(w => [...w][0]).join('').toLocaleUpperCase('tr-TR') || 'A';
  g.fillStyle = rgba(main); g.beginPath(); g.roundRect(0, 0, size, size, size * 0.28); g.fill();
  const hl = g.createLinearGradient(0, 0, size, size);
  hl.addColorStop(0, 'rgba(255,255,255,0.22)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)'); hl.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = hl; g.fill();
  const px = fit(g, initials, { family, weight, max: size * 0.52, width: size * 0.66 });
  setFont(g, weight, px, family, -px * 0.02);
  g.fillStyle = rgba(onMain); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const m = g.measureText(initials), capH = m.actualBoundingBoxAscent - m.actualBoundingBoxDescent;
  g.fillText(initials, size / 2, size / 2 + capH / 2);
  return { cv, w: size, h: size };
}
/** Draw an asset contained in a box centred on (cx, cy). */
export function drawAsset(ctx, asset, cx, cy, boxW, boxH = boxW, { alpha = 1 } = {}) {
  if (!asset || alpha <= 0.002) return null;
  const k = Math.min(boxW / asset.w, boxH / asset.h), w = asset.w * k, h = asset.h * k;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(asset.cv, cx - w / 2, cy - h / 2, w, h); ctx.restore();
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
export const assetBox = (asset, boxW, boxH = boxW) => { const k = Math.min(boxW / asset.w, boxH / asset.h); return { w: asset.w * k, h: asset.h * k }; };
/** Points sampled from an asset's opaque pixels at display width w, centred on 0,0: {x, y, c}. */
export function samplePoints(asset, w, step, threshold = 110) {
  const k = w / asset.w, sw = Math.round(asset.w * k), sh = Math.round(asset.h * k);
  const cv = canvas(sw, sh), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(asset.cv, 0, 0, sw, sh);
  const d = g.getImageData(0, 0, sw, sh).data, out = [];
  for (let y = step / 2; y < sh; y += step) for (let x = step / 2; x < sw; x += step) {
    const i = ((y | 0) * sw + (x | 0)) * 4;
    if (d[i + 3] > threshold) out.push({ x: x - sw / 2, y: y - sh / 2, c: [d[i], d[i + 1], d[i + 2]] });
  }
  return out;
}

// ───────────────────────────── the brand api
/**
 * brandApi(api, { brand, copy, base }) → a scene-facing object:
 *   W, H, u, fmt (safe area…), P (copy), colors (palette), font { display, weight, caps, ui },
 *   assets.logo (always present), text(key), lang, bpm, beat, fps, duration (= base, the scene clock).
 * brand = { bg, main, accent, font, weight, caps, logo (URL, optional), name }.
 */
export async function brandApi(api, { brand, copy, base }) {
  const fmt = formatInfo(api.W, api.H), colors = palette(brand);
  const family = /\s/.test(brand.font) ? `"${brand.font}"` : brand.font, weight = brand.weight ?? 700;
  let logo = null;
  if (brand.logo) logo = await loadImage(brand.logo).catch(e => { console.warn(`[brand] logo: ${e.message}`); return null; });
  const tile = colors.pop === colors.text ? colors.main : colors.pop;
  logo ??= monogram(brand.name ?? copy.title ?? 'A', { family, weight, main: tile, onMain: onColor(tile) });
  return {
    W: api.W, H: api.H, u: fmt.u, fmt, P: copy, colors, lang: api.lang, fps: api.fps,
    bpm: api.bpm, beat: api.beat, bar: api.bar, duration: base ?? api.duration,
    font: { display: family, weight, caps: !!brand.caps, ui: 'Inter' },
    assets: { logo },
    text: k => (brand.caps ? upper(copy[k] ?? '', api.lang) : copy[k] ?? ''),
  };
}
