// cat.js: a tabby cat (tekir) for src/scenes/river.js. Original design, drawn with the kit's paint() / inkLine(): flat wash + a clean ink line
// (anime-style cel look), tabby stripes, big glossy eyes. Same conventions as clawd(): (x, y) = the ground point under the body, u = size unit
// (a sitting cat is ~10u tall, a walking one ~9u tall and ~11u long), everything is a pure function of the options you pass.
//
//   cat(x, y, u, { view: 'side' | 'front', flip, dx, dy (in u; -dy = up), sq, rot, walk (leg phase), sit,
//                  eyes, mouth, lookX, lookY, blush, wet 0..1, tail (extra sway, in u), ears (0..1 flatten),
//                  emote, emoteK, emoteAge, draw(u, sw) (body-local hook, over everything), seed })
//   catFeel(name, t, over): options for a mood, alive (blinks, ear twitch, tail sway)
//   eyes: open, wide, narrow, happy, closed, sleepy, sparkle, swirl, squint      mouth: smile, o, O, flat, frown, grin, yum, wail, null
//   moods: calm, happy, curious, surprised, annoyed, scared, proud, sleepy, dizzy, love, determined
(() => {
  const FUR = '#E2A15A', STRIPE = '#8B5A2B', CREAM = '#FFF3DE', PINK = '#F2A3A0', IRIS = '#63B876';
  const wetCol = (c, w) => mixCol(c, '#6B5C58', .5 * clamp(w));

  function eye(cx, cy, w, h, type, look, sw, blinkK, fur) {
    const [lx, ly] = look, bl = clamp(blinkK || 0);
    const lidLine = (y0, k = 1) => inkLine([[cx - w * .6, y0 + h * .07], [cx, y0 - h * .07 * k], [cx + w * .6, y0 + h * .07]], sw * 1.5, PAL.ink, 'ink', .8);
    if (type === 'happy') { inkLine([[cx - w * .6, cy + h * .2], [cx, cy - h * .35], [cx + w * .6, cy + h * .2]], sw * 1.9, PAL.ink, 'ink', .9); return; }
    if (type === 'closed' || bl > .85) { inkLine([[cx - w * .6, cy], [cx, cy + h * .22], [cx + w * .6, cy]], sw * 2.2, PAL.ink, 'ink', .9); return; }
    if (type === 'swirl') {
      paint(ellPts(cx, cy, w * .62, h * .62, 18), { wash: PAL.cream, ink: PAL.ink, sw: sw * .9 });
      const P = []; for (let i = 0; i <= 26; i++) { const a = i / 26 * TAU * 2.1, r = (i / 26) * w * .5; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      inkLine(P, sw * 1.2, PAL.ink, 'inkfine', .6); return;
    }
    const wide = type === 'wide', ih = h * (wide ? .72 : 1), iw = w * (wide ? .72 : 1);
    if (wide) paint(ellPts(cx, cy, w * .62, h * .62, 18), { wash: PAL.cream, ink: PAL.ink, sw: sw * 1.1 });
    const ox = lx * w * .16, oy = ly * h * .14;
    paint(ellPts(cx + ox, cy + oy, iw * .52, ih * .52, 22), { wash: IRIS, fill: '#2F7F57', fillOp: 90, bleed: .05, tex: .3, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(cx + ox, cy + oy - ih * .16, iw * .44, ih * .22, 14), { wash: '#2F7F57', washOp: 140, ink: null });            // iris shade under the lid
    paint(ellPts(cx + ox, cy + oy + ih * .04, iw * .2, ih * (wide ? .26 : .36), 14), { wash: PAL.ink, ink: null });             // pupil
    if (type === 'sparkle') { paint(starPts(cx + ox - iw * .16, cy + oy - ih * .16, iw * .2, .3, 4), { wash: PAL.cream, ink: null }); paint(starPts(cx + ox + iw * .14, cy + oy + ih * .14, iw * .12, .3, 4), { wash: PAL.cream, ink: null }); }
    else { paint(ellPts(cx + ox - iw * .17, cy + oy - ih * .17, iw * .17, ih * .17, 10), { wash: PAL.cream, ink: null }); paint(ellPts(cx + ox + iw * .14, cy + oy + ih * .15, iw * .08, ih * .08, 8), { wash: PAL.cream, ink: null }); }
    // lids: a polygon of fur colour over the top of the eye, with an ink line on its edge
    const lid = type === 'narrow' ? .46 : type === 'sleepy' ? .62 : type === 'squint' ? .5 : 0, cover = Math.max(lid, bl);
    if (cover > .02) {
      const yE = cy - h * .5 + h * cover, tilt = type === 'narrow' ? h * .16 : type === 'sleepy' ? -h * .06 : 0;
      paint([[cx - w * .66, cy - h * .9], [cx + w * .66, cy - h * .9], [cx + w * .66, yE - tilt], [cx - w * .66, yE + tilt]], { wash: fur, ink: null });
      inkLine([[cx - w * .62, yE + tilt], [cx + w * .62, yE - tilt]], sw * 1.6, PAL.ink, 'ink', .2);
    } else lidLine(cy - h * .46, 1);
  }
  const seg3 = (a, b) => [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b];
  function mouth(cx, cy, s, type, sw) {
    const L = (P, k = 1.2) => inkLine(P.length < 3 ? seg3(P[0], P[1]) : P, sw * k, PAL.ink, 'inkfine', .8);
    if (type == null) return;
    if (type === 'smile') { L([[cx - s * .55, cy], [cx - s * .27, cy + s * .22], [cx, cy], [cx + s * .27, cy + s * .22], [cx + s * .55, cy]]); }
    else if (type === 'grin') { paint([[cx - s * .6, cy - s * .08], [cx + s * .6, cy - s * .08], [cx + s * .42, cy + s * .5], [cx - s * .42, cy + s * .5]], { wash: '#6B2B34', ink: PAL.ink, sw: sw * .9 }); paint(ellPts(cx, cy + s * .42, s * .24, s * .1, 8), { wash: PINK, ink: null }); }
    else if (type === 'o' || type === 'O') paint(ellPts(cx, cy + s * .2, s * (type === 'O' ? .32 : .2), s * (type === 'O' ? .42 : .26), 14), { wash: '#6B2B34', ink: PAL.ink, sw: sw * .9 });
    else if (type === 'frown') L([[cx - s * .5, cy + s * .3], [cx, cy], [cx + s * .5, cy + s * .3]]);
    else if (type === 'wail') { paint([[cx - s * .55, cy - s * .1], [cx + s * .55, cy - s * .1], [cx + s * .35, cy + s * .75], [cx - s * .35, cy + s * .75]], { wash: '#6B2B34', ink: PAL.ink, sw: sw * .9 }); }
    else if (type === 'yum') { L([[cx - s * .5, cy], [cx, cy + s * .2], [cx + s * .5, cy]]); paint(ellPts(cx + s * .12, cy + s * .42, s * .2, s * .26, 10), { wash: PINK, ink: PAL.ink, sw: sw * .7 }); }
    else L([[cx - s * .4, cy + s * .08], [cx + s * .4, cy + s * .08]]);
  }
  // p5.brush splines need 3+ points: seg3 (above) adds a midpoint to a 2-point line
  const whisk = (x, y, dir, u, sw, spread = 1) => { for (const k of [-1, 0, 1]) inkLine(seg3([x, y + k * .25 * u], [x + dir * 2.3 * u, y + k * .6 * u * spread - .1 * u]), sw * .7, PAL.ink, 'inkfine', .5); };
  // a short tick across a ribbon's path at fraction k (the rings of a tabby tail)
  const ringAt = (P, k, w, col, sw) => { const C = through(P), i = Math.max(1, Math.min(C.length - 2, Math.round(k * (C.length - 1)))), a = C[i - 1], b = C[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    inkLine(seg3([C[i][0] - dy / d * w, C[i][1] + dx / d * w], [C[i][0] + dy / d * w, C[i][1] - dx / d * w]), sw, col, 'ink', .3); };
  const stripes = (P, w, col) => { for (const L of P) inkLine(L.length < 3 ? seg3(L[0], L[1]) : L, w, col, 'ink', .7); };

  function cat(x, y, u, o = {}) {
    const id = o.boilKey ?? ('cat' + (o.seed ?? 0)), rs = part => boilSeed(`${id} ${part}`);
    x += (o.dx || 0) * u;
    const sw = clamp(u / 15, .45, 2.4) * .8, wet = o.wet || 0, fur = wetCol(FUR, wet), str = wetCol(STRIPE, wet), cr = wetCol(CREAM, wet * .6);
    const dy = (o.dy || 0) * u, sq = o.sq || 0, view = o.view || 'side', look = [o.lookX || 0, o.lookY || 0];
    const blinkK = (() => { const ph = frac(T * .33 + hash((o.seed || 0) + 3)); return ph < .035 ? 1 - Math.abs(ph / .035 * 2 - 1) : 0; })();
    const tw = Math.sin(T * 2.6 + (o.seed || 0)) * (o.tail ?? 0) + Math.sin(T * 1.7 + 1) * .5, ear = (o.ears || 0), twitch = Math.max(0, Math.sin(T * 1.3 + 2) - .93) * 12;
    rs('shadow');
    if (!o.noShadow) paint(ellPts(x, y + u * .12, u * (view === 'side' ? 5 : 3.8), u * .8, 22), { fill: PAL.ink, fillOp: 70, bleed: .25, tex: .3, border: .1, ink: null });
    push(); translate(x, y + dy); if (o.rot) rotate(o.rot); scale((o.flip ? -1 : 1) * (1 + sq * .55), 1 - sq);

    if (view === 'side') {
      const ph = (o.walk ?? 0) * TAU, moving = o.walk != null, bob = moving ? -Math.abs(Math.sin(ph)) * .25 * u : 0;
      const leg = (lx, far, k) => {
        const s = moving ? Math.sin(ph + k) * 1.0 * u : 0, lift = moving ? Math.max(0, Math.cos(ph + k)) * .8 * u : 0;
        rs('leg' + k);
        paint(rrPts(lx * u + s - .5 * u, -2.6 * u + bob, u, 2.7 * u - lift, .4 * u, 0), { wash: far ? mixCol(fur, PAL.ink, .22) : fur, ink: PAL.ink, sw: sw * .9 });
        paint(ellPts(lx * u + s + .1 * u, -.2 * u - lift + bob, .75 * u, .42 * u, 12), { wash: far ? mixCol(cr, PAL.ink, .15) : cr, ink: PAL.ink, sw: sw * .8 });
      };
      leg(-1.7, true, Math.PI); leg(1.6, true, 0);
      // tail: a ribbon that sways, with rings
      rs('tail');
      const t1 = tw * .8 * u;
      const TP = [[-4 * u, -3.6 * u + bob], [-5.8 * u, -4.8 * u + t1 * .3], [-6.3 * u, -7.2 * u + t1], [-5.2 * u, -9 * u + t1 * 1.3]];
      paint(ribbon(TP, 1.2 * u, .85 * u), { wash: fur, ink: PAL.ink, sw: sw });
      for (const k of [.4, .58, .76, .92]) ringAt(TP, k, .55 * u, str, sw * 2.0);
      rs('body');
      const body = ellPts(-.2 * u, -3.6 * u + bob, 4.5 * u, 2.3 * u, 28);
      paint(body, { wash: fur, fill: str, fillOp: 40, bleed: .1, tex: .5, ink: PAL.ink, sw: sw * 1.1 });
      paint(ellPts(.2 * u, -2.5 * u + bob, 3.2 * u, .9 * u, 18), { wash: cr, washOp: 255, ink: null });                       // pale belly
      for (let i = 0; i < 5; i++) { const sx = (-3 + i * 1.4) * u; stripes([[[sx, -5.9 * u + bob], [sx + .3 * u, -4.9 * u + bob], [sx - .1 * u, -4.1 * u + bob]]], sw * 2.1, str); }
      leg(-2.7, false, 0); leg(2.5, false, Math.PI);
      // head: 3/4, big, with ears, stripes, muzzle, whiskers
      rs('head');
      const hx = 3.9 * u, hy = -5.9 * u + bob, ew = 1 - .3 * ear;
      for (const [ex, flip] of [[3.0, 0], [4.9, 1]]) {
        const tilt = flip ? twitch * .01 : 0;
        paint([[(ex - .9) * u, hy - 1.7 * u], [(ex + .1 + tilt * 20) * u, hy - (3.7 - 1.1 * ear) * u], [(ex + 1.0) * u, hy - 1.8 * u]], { wash: fur, ink: PAL.ink, sw: sw });
        paint([[(ex - .45) * u, hy - 1.9 * u], [(ex + .1 + tilt * 20) * u, hy - (3.1 - 1.0 * ear) * u], [(ex + .55) * u, hy - 1.95 * u]], { wash: PINK, ink: null });
      }
      paint(ellPts(hx, hy, 3.0 * u, 2.7 * u, 28), { wash: fur, fill: str, fillOp: 30, bleed: .1, tex: .5, ink: PAL.ink, sw: sw * 1.1 });
      stripes([[[hx - .9 * u, hy - 2.3 * u], [hx - .9 * u, hy - 1.3 * u]], [[hx, hy - 2.4 * u], [hx, hy - 1.1 * u]], [[hx + .9 * u, hy - 2.3 * u], [hx + .9 * u, hy - 1.3 * u]],
        [[hx - 2.5 * u, hy + .1 * u], [hx - 1.7 * u, hy + .2 * u]], [[hx - 2.4 * u, hy + .6 * u], [hx - 1.7 * u, hy + .6 * u]]], sw * 1.8, str);
      paint(ellPts(hx + 1.6 * u, hy + .95 * u, 1.4 * u, 1.05 * u, 16), { wash: cr, ink: null });                                  // muzzle
      if (o.blush) paint(ellPts(hx - .2 * u, hy + .9 * u, .6 * u, .32 * u, 10), { wash: PINK, washOp: 160 * o.blush, ink: null });
      eye(hx - 1.0 * u, hy - .2 * u, 1.1 * u, 1.5 * u, o.eyes || 'open', look, sw, blinkK, fur);
      eye(hx + 1.25 * u, hy - .2 * u, 1.2 * u, 1.6 * u, o.eyes || 'open', look, sw, blinkK, fur);
      paint([[hx + 2.2 * u, hy + .4 * u], [hx + 2.75 * u, hy + .45 * u], [hx + 2.45 * u, hy + .8 * u]], { wash: PINK, ink: PAL.ink, sw: sw * .7 });
      mouth(hx + 1.95 * u, hy + 1.1 * u, .9 * u, o.mouth === undefined ? 'smile' : o.mouth, sw);
      whisk(hx + 2.3 * u, hy + .8 * u, 1, u, sw);
    } else {
      // front view: a sitting cat facing the viewer
      const sit = o.sit !== false, bob = 0;
      rs('tail');
      const t1 = tw * .7 * u;
      const TP = [[2.6 * u, -1.0 * u], [4.7 * u, -1.5 * u], [5.3 * u + t1 * .4, -3.6 * u], [4.4 * u + t1, -5.4 * u]];
      paint(ribbon(TP, 1.2 * u, .85 * u), { wash: fur, ink: PAL.ink, sw: sw });
      for (const k of [.4, .58, .76, .92]) ringAt(TP, k, .55 * u, str, sw * 2.0);
      rs('body');
      paint(ellPts(0, -2.9 * u, 3.5 * u, 3.0 * u, 28), { wash: fur, fill: str, fillOp: 40, bleed: .1, tex: .5, ink: PAL.ink, sw: sw * 1.1 });
      paint(ellPts(0, -2.4 * u, 1.9 * u, 2.3 * u, 22), { wash: cr, ink: null });                                                  // chest
      stripes([[[-3.2 * u, -3.8 * u], [-2.4 * u, -3.6 * u]], [[-3.3 * u, -2.7 * u], [-2.5 * u, -2.6 * u]], [[3.2 * u, -3.8 * u], [2.4 * u, -3.6 * u]], [[3.3 * u, -2.7 * u], [2.5 * u, -2.6 * u]]], sw * 2.0, str);
      for (const s of [-1, 1]) { rs('paw' + s); paint(ellPts(s * 1.25 * u, -.7 * u, .95 * u, .62 * u, 14), { wash: cr, ink: PAL.ink, sw: sw * .9 }); paint(rrPts(s * 1.25 * u - .55 * u, -2.7 * u, 1.1 * u, 2.0 * u, .4 * u, 0), { wash: fur, ink: PAL.ink, sw: sw * .9 }); paint(ellPts(s * 1.25 * u, -.65 * u, .98 * u, .62 * u, 14), { wash: cr, ink: PAL.ink, sw: sw * .9 }); }
      rs('head');
      const hy = -6.6 * u + bob;
      for (const s of [-1, 1]) {
        const tilt = s > 0 ? twitch * .02 * u : 0;
        paint([[s * 0.6 * u, hy - 2.3 * u], [s * 2.1 * u + tilt, hy - (4.7 - 1.4 * ear) * u], [s * 3.1 * u, hy - 1.7 * u]], { wash: fur, ink: PAL.ink, sw: sw });
        paint([[s * 1.15 * u, hy - 2.5 * u], [s * 2.1 * u + tilt, hy - (4.0 - 1.2 * ear) * u], [s * 2.65 * u, hy - 1.9 * u]], { wash: PINK, ink: null });
      }
      paint(ellPts(0, hy, 3.2 * u, 2.7 * u, 30), { wash: fur, fill: str, fillOp: 30, bleed: .1, tex: .5, ink: PAL.ink, sw: sw * 1.1 });
      stripes([[[-1.2 * u, hy - 2.6 * u], [-1.1 * u, hy - 1.5 * u]], [[0, hy - 2.7 * u], [0, hy - 1.3 * u]], [[1.2 * u, hy - 2.6 * u], [1.1 * u, hy - 1.5 * u]],
        [[-3.1 * u, hy - .2 * u], [-2.3 * u, hy - .1 * u]], [[-3.0 * u, hy + .5 * u], [-2.3 * u, hy + .45 * u]], [[3.1 * u, hy - .2 * u], [2.3 * u, hy - .1 * u]], [[3.0 * u, hy + .5 * u], [2.3 * u, hy + .45 * u]]], sw * 1.8, str);
      paint(ellPts(0, hy + 1.1 * u, 1.7 * u, 1.15 * u, 18), { wash: cr, ink: null });
      if (o.blush) for (const s of [-1, 1]) paint(ellPts(s * 2.1 * u, hy + .9 * u, .65 * u, .34 * u, 10), { wash: PINK, washOp: 170 * o.blush, ink: null });
      eye(-1.45 * u, hy - .1 * u, 1.2 * u, 1.65 * u, o.eyes || 'open', look, sw, blinkK, fur);
      eye(1.45 * u, hy - .1 * u, 1.2 * u, 1.65 * u, o.eyes || 'open', look, sw, blinkK, fur);
      paint([[-.38 * u, hy + .75 * u], [.38 * u, hy + .75 * u], [0, hy + 1.2 * u]], { wash: PINK, ink: PAL.ink, sw: sw * .7 });
      mouth(0, hy + 1.45 * u, 1.1 * u, o.mouth === undefined ? 'smile' : o.mouth, sw);
      whisk(-1.5 * u, hy + 1.1 * u, -1, u, sw); whisk(1.5 * u, hy + 1.1 * u, 1, u, sw);
    }
    if (o.draw) o.draw(u, sw);
    pop();
    if (o.emote) { const hy = (view === 'side' ? -9.2 : -10) * u; emote(o.emote, x + (o.flip ? -1 : 1) * (view === 'side' ? 4.4 : 3.6) * u, y + dy + hy, u * .9, o.emoteK ?? 1, o.emoteAge ?? T); }
    if (wet > .3) for (let i = 0; i < 4; i++) { const k = frac(T * .8 + i * .27), px = x + (hash(i + 9) - .5) * 6 * u, py = y + dy - 6 * u + k * 6 * u; paint(ellPts(px, py, .22 * u, .34 * u, 8), { wash: '#BFE6F5', washOp: 200 * wet * (1 - k), ink: null }); }
  }

  const MOODS = {
    calm: { eyes: 'open', mouth: 'smile' }, happy: { eyes: 'happy', mouth: 'grin', blush: .7 }, curious: { eyes: 'open', mouth: 'o', lookY: -.6, ears: 0, emote: '?' },
    surprised: { eyes: 'wide', mouth: 'O', emote: '!' }, annoyed: { eyes: 'narrow', mouth: 'frown', ears: .8, emote: 'anger' }, scared: { eyes: 'wide', mouth: 'wail', ears: 1, emote: 'sweat' },
    proud: { eyes: 'sparkle', mouth: 'grin', blush: .5 }, sleepy: { eyes: 'sleepy', mouth: 'flat', emote: 'zzz' }, dizzy: { eyes: 'swirl', mouth: 'wail', emote: 'swirl' },
    love: { eyes: 'sparkle', mouth: 'yum', blush: 1, emote: 'hearts' }, determined: { eyes: 'narrow', mouth: 'smile', ears: .2 }
  };
  window.catFeel = (name, t, over = {}) => ({ ...(MOODS[name] || MOODS.calm), tail: 1.4, emoteAge: t, ...over });
  window.cat = cat;

  // ---------- the character sheet ----------
  LOOPS.cat = t => {
    boilSeed('sheet');
    paint(rectPts(-20, -20, W + 40, H + 40), { wash: '#DCEBE3', ink: null });
    const cols = 2, rows = 4, cw = W / cols, ch = H / rows;
    const cells = [
      ['side', { ...catFeel('calm', t), walk: t * 1.2 }], ['front', catFeel('happy', t)],
      ['front', catFeel('surprised', t)], ['front', catFeel('annoyed', t, { wet: 1 })],
      ['side', catFeel('determined', t, { walk: t * 1.6 })], ['front', catFeel('sleepy', t)],
      ['front', catFeel('dizzy', t)], ['front', catFeel('love', t)]];
    cells.forEach(([view, o], i) => {
      const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch + ch - 70, u = view === 'side' ? 26 : 30;
      boilSeed('floor' + i); inkLine([[cx - 220, cy + 6], [cx, cy + 3], [cx + 220, cy + 7]], .7, mixCol(PAL.paper, PAL.ink, .4), 'inkfine', .5);
      cat(cx, cy, u, { ...o, view, seed: i });
    });
  };
  LOOPS.cat.len = 4;
})();
