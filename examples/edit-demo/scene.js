// examples/edit-demo: "an edit request, the real diff, and the two renders side by side" (1080×1350, 4:5).
// Everything on screen comes from case/: meta.json (prompt, steps, which hunks to show, labels) and change.patch
// (a real `git diff`). Diff lines are read from the patch, so they cannot drift from what was actually changed.
// The BEFORE / AFTER videos are laid over the two slots by compose.mjs; this scene only draws the frame around them.
import { clamp, lerp, prog, rgba, E, setFont, rrect, wrap } from '../../engine/core.js';

const BG = [10, 10, 13], INK = [242, 237, 228], DIM = [142, 142, 152], PANEL = [19, 19, 24], GREEN = [92, 214, 140], RED = [255, 107, 107], AMBER = [255, 181, 71];
const MONO = "'JetBrains Mono'", SANS = 'Inter', DISP = "'Barlow Condensed'";
const SLOT = 510, SLOT_Y = 800, SLOT_X = [20, 550];

let META, HUNKS, STAT, TL;

/** git diff → { files: [{ name, runs: [{ minus: [...], plus: [...] }] }], add, del } */
function parsePatch(txt) {
  const files = []; let f = null, run = null, add = 0, del = 0;
  for (const ln of txt.split('\n')) {
    if (ln.startsWith('+++ ')) { f = { name: ln.slice(6), runs: [] }; files.push(f); run = null; continue; }
    if (!f || ln.startsWith('--- ') || ln.startsWith('diff ') || ln.startsWith('index ')) continue;
    if (ln.startsWith('@@')) { run = null; continue; }
    if (ln[0] === '-') { if (!run || run.plus.length) { run = { minus: [], plus: [] }; f.runs.push(run); } run.minus.push(ln.slice(1)); del++; }
    else if (ln[0] === '+') { if (!run) { run = { minus: [], plus: [] }; f.runs.push(run); } run.plus.push(ln.slice(1)); add++; }
    else run = null;
  }
  return { files, add, del };
}
/** Keep a long single-line change readable: window around the first difference, with ellipses. */
function crop(minus, plus, max = 62) {
  if (minus.length !== 1 || plus.length !== 1) return [minus, plus];
  const a = minus[0], b = plus[0];
  if (Math.max(a.length, b.length) <= max) return [minus, plus];
  let p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let s = 0; while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  const start = Math.max(0, p - 30), cut = (x) => { const end = Math.min(x.length, x.length - s + 14); let out = x.slice(start, end); if (out.length > max) out = out.slice(0, max - 1) + '…'; return (start > 0 ? '…' : '') + out + (end < x.length && out.length < max ? '…' : ''); };
  return [[cut(a)], [cut(b)]];
}

/** T: every time constant of the choreography, computed once from the case file. */
function timeline(meta) {
  const t = { prompt0: 0.5, promptDur: 2.9, steps0: 3.8, stepGap: 0.6, hunk: 0.95 };
  t.diff0 = t.steps0 + meta.steps.length * t.stepGap + 0.4;
  t.render0 = t.diff0 + meta.pick.length * t.hunk + 0.2;
  t.v0 = meta.videoStart;
  if (t.v0 < t.render0 + 1.2) console.warn(`videoStart ${t.v0} is too early: the render phase needs ${t.render0.toFixed(1)} → ${(t.render0 + 1.2).toFixed(1)}`);
  return t;
}

// ───────────── drawing helpers
function T(ctx, s, x, y, { f = SANS, w = 500, size = 24, fill = INK, a = 'left', ls = 0, alpha = 1 } = {}) {
  setFont(ctx, w, size, f, ls); ctx.textAlign = a; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
}
const box = (ctx, x, y, w, h, r = 18, fill = PANEL, stroke = 'rgba(242,237,228,0.10)') => {
  ctx.fillStyle = rgba(fill); rrect(ctx, x, y, w, h, r); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, r); ctx.stroke(); }
};
const typed = (s, t, t0, dur) => s.slice(0, Math.floor(clamp((t - t0) / dur) * s.length));
const rise = (t, t0, d = 0.3) => E.outExpo(prog(t, t0, t0 + d));

function header(ctx, W, t) {
  const p = rise(t, 0, 0.5);
  ctx.save(); ctx.globalAlpha = p;
  ctx.fillStyle = rgba(PANEL); rrect(ctx, 30, 26, 232, 48, 24); ctx.fill();
  ctx.fillStyle = rgba(AMBER); ctx.beginPath(); ctx.arc(58, 50, 7, 0, 7); ctx.fill();
  T(ctx, 'Claude Code', 78, 58, { w: 700, size: 22 });
  T(ctx, `${META.repo} · ${META.project}`, W - 30, 58, { f: MONO, size: 20, fill: DIM, a: 'right' });
  ctx.restore();
}
function prompt(ctx, W, t) {
  const p = rise(t, TL.prompt0 - 0.2, 0.4); if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = p; ctx.translate(0, 14 * (1 - p));
  T(ctx, 'YOU', 40, 116, { f: MONO, w: 700, size: 15, fill: DIM, ls: 3 });
  box(ctx, 30, 128, W - 60, 152);
  const s = typed(META.prompt, t, TL.prompt0, TL.promptDur);
  setFont(ctx, 500, 32, SANS);
  const lines = wrap(ctx, s, W - 120);
  lines.forEach((l, i) => T(ctx, l, 56, 190 + i * 44, { size: 32 }));
  if (s.length < META.prompt.length || Math.floor(t * 3.4) % 2 === 0) {
    const last = lines[lines.length - 1] || '', x = 56 + ctx.measureText(last).width + 6, y = 190 + (lines.length - 1) * 44;
    ctx.fillStyle = rgba(INK); ctx.fillRect(x, y - 27, 3, 34);
  }
  ctx.restore();
}
function steps(ctx, W, t, tFrame) {
  META.steps.forEach((st, i) => {
    const ts = TL.steps0 + i * TL.stepGap, p = rise(t, ts, 0.25); if (p <= 0) return;
    const y = 322 + i * 38, done = t > ts + 0.5, verbCol = st.verb === 'Read' ? DIM : st.verb === 'Edit' ? AMBER : GREEN;
    ctx.save(); ctx.globalAlpha = p; ctx.translate(14 * (1 - p), 0);
    if (done) T(ctx, '✓', 40, y, { f: MONO, w: 700, size: 22, fill: GREEN });
    else { ctx.strokeStyle = rgba(INK); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); const a = tFrame * 9; ctx.arc(48, y - 8, 8, a, a + 4.2); ctx.stroke(); }
    T(ctx, st.verb, 76, y, { f: MONO, w: 700, size: 22, fill: verbCol });
    T(ctx, st.path, 76 + 82, y, { f: MONO, size: 22, fill: INK });
    if (st.note) { setFont(ctx, 500, 22, MONO); const x = 76 + 82 + ctx.measureText(st.path).width + 22; T(ctx, st.note, x, y, { f: MONO, size: 22, fill: DIM }); }
    ctx.restore();
  });
}

// ───────────── the lower-left "screen": diff → render → takeaway share one panel
const PX = 30, PY = 506, PW = 1020, PH = 250;
function diffPanel(ctx, t, tFrame) {
  if (t < TL.diff0 - 0.2) return;
  const p = rise(t, TL.diff0 - 0.2, 0.4); ctx.save(); ctx.globalAlpha = p; box(ctx, PX, PY, PW, PH);
  if (t < TL.render0) diffView(ctx, t); else if (t < TL.v0 + 0.7) renderView(ctx, t, tFrame); else takeaway(ctx, t);
  ctx.restore();
}
function diffView(ctx, t) {
  const k = clamp(Math.floor((t - TL.diff0) / TL.hunk), 0, HUNKS.length - 1), lt = t - TL.diff0 - k * TL.hunk, h = HUNKS[k];
  const env = Math.min(1, lt / 0.14) * Math.min(1, (TL.hunk - lt) / 0.12), c = clamp((t - TL.diff0) / 1.2);
  T(ctx, 'git diff', PX + 26, PY + 40, { f: MONO, w: 700, size: 21, fill: DIM });
  const stat = `${STAT.files} files changed`, sx = PX + PW - 26;
  T(ctx, `−${Math.round(STAT.del * c)}`, sx, PY + 40, { f: MONO, w: 700, size: 21, fill: RED, a: 'right' });
  T(ctx, `+${Math.round(STAT.add * c)}`, sx - 84, PY + 40, { f: MONO, w: 700, size: 21, fill: GREEN, a: 'right' });
  T(ctx, stat, sx - 172, PY + 40, { f: MONO, size: 21, fill: DIM, a: 'right' });
  ctx.save(); ctx.globalAlpha *= env;
  T(ctx, h.file, PX + 26, PY + 82, { f: MONO, w: 700, size: 22, fill: INK });
  const rows = [...h.minus.map(l => ['-', l]), ...h.plus.map(l => ['+', l])];
  rows.forEach(([sg, l], i) => {
    const y = PY + 118 + i * 30, a = rise(lt, 0.1 + i * 0.07, 0.2), col = sg === '-' ? RED : GREEN;
    ctx.fillStyle = rgba(col, 0.13 * a); ctx.fillRect(PX + 14, y - 22, PW - 28, 28);
    T(ctx, sg, PX + 26, y, { f: MONO, w: 700, size: 22, fill: col, alpha: a });
    T(ctx, l, PX + 58 + 10 * (1 - a), y, { f: MONO, size: 22, fill: INK, alpha: a });
  });
  T(ctx, '→ ' + h.title, PX + 26, PY + PH - 20, { size: 22, w: 500, fill: AMBER });
  ctx.restore();
}
function renderView(ctx, t, tFrame) {
  const u = tFrame - TL.render0, span = TL.v0 - TL.render0, pr = E.inOutCubic(clamp(u / (span - 0.2))), frames = Math.round(META.after.seconds * 60);
  T(ctx, '$ node ft.mjs render examples/reel --lang en', PX + 26, PY + 60, { f: MONO, w: 700, size: 24 });
  T(ctx, `▸ frame ${String(Math.round(frames * pr)).padStart(3, '0')} / ${frames}`, PX + 26, PY + 108, { f: MONO, size: 22, fill: DIM });
  ctx.fillStyle = 'rgba(242,237,228,0.14)'; rrect(ctx, PX + 26, PY + 132, PW - 52, 16, 8); ctx.fill();
  ctx.fillStyle = rgba(INK); if (pr > 0) { rrect(ctx, PX + 26, PY + 132, Math.max(16, (PW - 52) * pr), 16, 8); ctx.fill(); }
  if (pr >= 1) T(ctx, `✓ reel-en.mp4 · ${META.after.seconds.toFixed(1)} s · ${META.after.bpm} BPM`, PX + 26, PY + 196, { f: MONO, w: 700, size: 22, fill: GREEN });
}
function takeaway(ctx, t) {
  const a = rise(t, TL.v0 + 0.7, 0.5); ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, 12 * (1 - a));
  let y = PY + 58; setFont(ctx, 700, 27, SANS);
  META.takeaway.forEach((s, i) => { wrap(ctx, s, PW - 76).forEach(l => { T(ctx, l, PX + 30, y, { w: 700, size: 27, fill: i === 0 ? INK : DIM }); y += 38; }); y += 20; });
  ctx.restore();
}

// ───────────── the two slots: labels, colour keyed outlines, a 32-beat strip that shows each video's own tempo
function slots(ctx, t) {
  [META.before, META.after].forEach((v, i) => {
    const x = SLOT_X[i], on = t >= TL.v0, col = v.color, beat = 60 / v.bpm, tv = t - TL.v0;
    T(ctx, v.label, x + 2, 784, { f: DISP, w: 800, size: 42, fill: INK, ls: 2 });
    T(ctx, `${v.bpm} BPM · ${v.seconds.toFixed(1)} s · ${v.detail}`, x + SLOT, 782, { f: MONO, w: 700, size: 18, fill: DIM, a: 'right' });
    ctx.fillStyle = rgba(PANEL); rrect(ctx, x - 6, SLOT_Y - 6, SLOT + 12, SLOT + 12, 14); ctx.fill();
    ctx.strokeStyle = rgba(col, on ? 0.9 : 0.35); ctx.lineWidth = 3; rrect(ctx, x - 6, SLOT_Y - 6, SLOT + 12, SLOT + 12, 14); ctx.stroke();
    const cw = (SLOT - 31 * 3) / 32;
    for (let n = 0; n < 32; n++) {
      const age = tv - n * beat, lit = on && age >= 0, pulse = lit ? Math.exp(-age * 7) : 0;
      ctx.fillStyle = rgba(lit ? col : INK, lit ? 0.35 + 0.65 * pulse : 0.1);
      ctx.fillRect(x + n * (cw + 3), SLOT_Y + SLOT + 16, cw, 12);
    }
  });
}

export default {
  async setup() {
    const base = new URL('case/', import.meta.url);
    META = await (await fetch(new URL('meta.json', base))).json();
    const patch = parsePatch(await (await fetch(new URL('change.patch', base))).text());
    STAT = { files: patch.files.length, add: patch.add, del: patch.del };
    HUNKS = META.pick.map(pk => {
      const f = patch.files.find(x => x.name.endsWith(pk.file)), run = f && f.runs.find(r => [...r.minus, ...r.plus].some(l => l.includes(pk.key)));
      if (!run) throw new Error(`hunk not found in change.patch: ${pk.file} ~ ${pk.key}`);
      // a run can hold several unrelated lines: keep only the -/+ pair the pick is about
      let mi = run.minus, pl = run.plus;
      if (!pk.whole && mi.length === pl.length && mi.length > 1) { const i = mi.findIndex(l => l.includes(pk.key)); if (i >= 0) { mi = [mi[i]]; pl = [pl[i]]; } }
      const [minus, plus] = crop(mi, pl);
      return { file: f.name, title: pk.title, minus, plus };
    });
    TL = timeline(META);
  },
  draw(ctx, t, api) {
    const { W, H } = api, tFrame = api.frameT ?? t;
    ctx.fillStyle = rgba(BG); ctx.fillRect(0, 0, W, H);
    header(ctx, W, t); prompt(ctx, W, t); steps(ctx, W, t, tFrame); diffPanel(ctx, t, tFrame); slots(ctx, t);
  },
};
