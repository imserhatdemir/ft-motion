// river.js: "Akarsular nasıl oluşur", 30 s, 1080x1920 (Reels). A tabby cat who hates getting wet follows the water from one raindrop on a
// mountain top to the sea, and watches it start again. Narration timing comes from river_schedule.js (RSCHED, written by voice_river.py).
//   Shots: A summit · B slope · C creek · D valley · E river · F sky (the drop on her nose loops to A)
// Captions are a separate overlay (the only text); nothing is written on any object.
(() => {
  const S = RSCHED, SC = S.map(s => s.scene), wd = (i, k) => S[i].words[k][1];
  const C = { sky: '#CFE8EE', skyGrey: '#A9B9C5', skyDeep: '#8FA3B3', sunset: '#F6C9A0', snow: '#F5F9FC', rock: '#8E9AA6', rockDk: '#66727F', rockLt: '#B7C0C8',
              grass: '#7DB567', grassDk: '#559049', water: '#5CC7D6', waterDk: '#2D9DB9', wood: '#9A6B3F', woodDk: '#6D4A2B', sand: '#EBD7A9', dirt: '#B58A5E' };
  const WIPE = [mixCol(C.sky, PAL.teal, .45), mixCol(C.sky, PAL.sap, .35)];
  const seg3 = (a, b) => [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b];

  // ---------- small set pieces ----------
  const part = (pts, p) => {   // the first fraction p of a polyline (for water that is still arriving)
    const sg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = sg.reduce((a, b) => a + b, 0), out = [pts[0]];
    let need = tot * clamp(p);
    for (let i = 0; i < sg.length && need > 0; i++) { const k = Math.min(1, need / sg[i]); out.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]); need -= sg[i]; }
    return out;
  };
  // water: a ribbon with a light edge and highlight dashes sliding along it
  function water(P, w0, w1, t, o = {}) {
    const p = o.p ?? 1; if (p < .02) return;
    const Q = p < 1 ? part(P, p) : P; if (Q.length < 2) return;
    boilSeed('water' + (o.key ?? Math.round(P[0][0] + P[0][1])));
    paint(ribbon(Q, lerp(w0, w1, 0) * (o.grow ?? 1), lerp(w0, w1, p) * (o.grow ?? 1)), { wash: o.col || C.water, washOp: o.op ?? 240, fill: C.waterDk, fillOp: 70, bleed: .12, tex: .5, ink: o.ink === undefined ? PAL.ink : o.ink, sw: o.sw ?? .7 });
    const R = through(Q, 8), n = R.length, nd = o.dashes ?? Math.max(3, Math.round(n / 9));
    for (let i = 0; i < (n >= 6 ? nd : 0); i++) {
      const k = frac(t * (o.speed ?? .3) + i / nd + hash(i + (o.key ?? 0)) * .1), j = Math.min(n - 3, Math.floor(k * (n - 3))), a = R[j], b = R[j + 2], ww = lerp(w0, w1, j / n) * (o.grow ?? 1);
      const nx = -(b[1] - a[1]), ny = b[0] - a[0], d = Math.hypot(nx, ny) || 1, off = (hash(i * 7 + 3) - .5) * ww * .5;
      inkLine(seg3([a[0] + nx / d * off, a[1] + ny / d * off], [b[0] + nx / d * off, b[1] + ny / d * off]), .8, PAL.cream, 'inkfine', .3);
    }
  }
  const drop = (x, y, s, a = 1) => {   // a raindrop: a pointed teardrop with a shine
    boilSeed('drop' + Math.round(x * 3 + y));
    paint([[x, y - 1.3 * s], [x + .65 * s, y - .2 * s], [x + .55 * s, y + .45 * s], [x, y + .75 * s], [x - .55 * s, y + .45 * s], [x - .65 * s, y - .2 * s]], { wash: '#BDE6F4', washOp: 255 * a, ink: PAL.ink, sw: .7, curv: .6 });
    paint(ellPts(x - .2 * s, y + .1 * s, .16 * s, .26 * s, 8), { wash: PAL.cream, washOp: 255 * a, ink: null });
  };
  const splash = (x, y, k, s = 1, col = '#BDE6F4') => {   // droplets thrown up and falling back
    if (k <= 0 || k >= 1) return;
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .33 + (hash(i) - .5) * .2, v = (90 + 90 * hash(i + 4)) * s, px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + 260 * s * k * k;
      boilSeed('spl' + i); paint(ellPts(px, py, 7 * s * (1 - k * .5), 9 * s * (1 - k * .5), 8), { wash: col, washOp: 255 * (1 - k), ink: null }); }
  };
  function rain(t, k, x0, x1, y0, y1, slant = 24) {
    if (k <= .01) return;
    const n = Math.round(80 * k);
    for (let i = 0; i < n; i++) {
      boilSeed('rain' + i);
      const x = x0 + hash(i) * (x1 - x0) + (t * 90) % 1 * 0, f = frac(t * (1.5 + .5 * hash(i + 9)) + hash(i + 5)), y = lerp(y0, y1, f), len = 40 + 30 * hash(i + 3);
      inkLine(seg3([x - f * 0 + slant * f, y], [x - slant * .5 + slant * f, y - len]), .6, '#E8F6FB', 'inkfine', 0);
    }
  }
  const cloud = (x, y, s, col, a = 255) => {
    boilSeed('cloud' + Math.round(x));
    for (const [dx, dy, rx, ry] of [[0, 0, 230, 70], [-140, 20, 150, 55], [150, 18, 160, 58], [20, -45, 150, 70]]) paint(ellPts(x + dx * s, y + dy * s, rx * s, ry * s, 22, 4), { wash: col, washOp: a, fill: mixCol(col, PAL.ink, .2), fillOp: 40, bleed: .25, tex: .4, ink: null });
  };
  const skyBg = (top, bot, hy = .6) => {
    boilSeed('sky');
    paint(rectPts(-400, -700, W + 800, H + 1400), { wash: top, ink: null });
    paint(ellPts(W / 2, H * hy, W * 1.15, H * .3, 30, 10), { fill: bot, fillOp: 170, bleed: .35, tex: .5, ink: null });
  };
  const peak = (pts, col, snow = true, key = 'p') => {
    boilSeed('peak' + key);
    paint(pts, { wash: col, fill: mixCol(col, PAL.ink, .3), fillOp: 60, bleed: .08, tex: .6, ink: PAL.ink, sw: .9 });
    if (snow) { const [a, b, c] = pts; paint([[lerp(b[0], a[0], .28), lerp(b[1], a[1], .28)], b, [lerp(b[0], c[0], .26), lerp(b[1], c[1], .26)], [b[0] + 18, b[1] + 80], [b[0] - 30, b[1] + 55]], { wash: C.snow, ink: PAL.ink, sw: .6, curv: .3 }); }
  };
  const stone = (x, y, w, h, col = C.rock) => { boilSeed('stone' + Math.round(x * 3 + y)); paint(ellPts(x, y, w, h, 16, 2), { wash: col, fill: mixCol(col, PAL.ink, .35), fillOp: 70, bleed: .08, tex: .6, ink: PAL.ink, sw: .9 }); paint(ellPts(x - w * .25, y - h * .35, w * .45, h * .28, 10), { wash: mixCol(col, PAL.cream, .4), washOp: 200, ink: null }); };
  const tuft = (x, y, t, col = C.grassDk, n = 3) => { boilSeed('tuft' + Math.round(x + y * 7)); const sw = wob(t, .5, hash(x) * 3) * 5; for (let k = 0; k < n; k++) inkLine(seg3([x + (k - 1) * 8, y], [x + (k - 1) * 12 + sw, y - 26 - 10 * hash(x + k)]), .8, col, 'inkfine', .4); };

  // ---------- captions: the narration, word by word ----------
  const cap = document.createElement('canvas').getContext('2d');
  function captions(t) {
    const L = S.find(l => t >= l.voice - .2 && t < l.voice + l.dur + .45); if (!L) return;
    const a = ease(seg(t, L.voice - .2, L.voice - .05)) * (1 - ease(seg(t, L.voice + L.dur + .15, L.voice + L.dur + .45)));
    const size = 70, font = `800 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`; cap.font = font;
    const gap = cap.measureText(' ').width * 1.15, items = L.words.map(w => ({ w, wd: cap.measureText(w[0]).width })), rows = [[]]; let cur = 0;
    for (const it of items) { if (cur + it.wd > 900 && rows[rows.length - 1].length) { rows.push([]); cur = 0; } rows[rows.length - 1].push(it); cur += it.wd + gap; }
    rows.forEach((row, ri) => {
      const tot = row.reduce((q, it) => q + it.wd, 0) + gap * (row.length - 1); let x = W / 2 - tot / 2;
      for (const it of row) {
        const [txt, w0, w1] = it.w, spoken = t >= w0, now = spoken && t < w1 + .05;
        letter(txt, x, 1500 + ri * 84 + (1 - a) * 14, size, now ? PAL.clayLt : spoken ? PAL.cream : '#D9D2C2', { screen: true, font, align: 'left', alpha: a * (spoken ? 1 : .8), stroke: PAL.ink, ink: false });
        x += it.wd + gap;
      }
    });
  }
  const inWipe = (lt, cols = WIPE) => { if (lt < .3) { boilSeed('wipeIn'); brushWipe(.5 + lt / .6, cols); } };
  const outWipe = (lt, dur, cols = WIPE) => { if (lt > dur - .3) { boilSeed('wipeOut'); brushWipe((lt - (dur - .3)) / .6, cols); } };

  // ---------- Shot A: the summit and the drop on her nose ----------
  const T_DROP = wd(0, 6) + .05;
  function shotA(t, lt, dur) {
    const u = 36, cx = 540, gy = 1235, tHit = T_DROP, tFall = tHit - 1.0, k = ease(seg(lt, 1.0, 2.4));
    camBegin(540, 960, 1.0 + .06 * seg(lt, 0, dur));
    skyBg(mixCol('#D5EBF1', C.skyGrey, k), mixCol('#F2F7F4', C.skyDeep, k * .6));
    peak([[40, 1260], [260, 780], [520, 1260]], mixCol(C.rockLt, C.skyDeep, .45), true, 'a1');
    peak([[600, 1260], [830, 700], [1120, 1260]], mixCol(C.rockLt, C.skyDeep, .4), true, 'a2');
    for (const [x, y, s] of [[200, 250, 1.2], [650, 170, 1.5], [930, 380, 1.1], [420, 440, .9]]) cloud(x + wob(t, .02, x) * 24, y, s, mixCol('#FFFFFF', '#7F90A0', k), 235);
    boilSeed('summit');
    paint(ellPts(540, 1620, 820, 400, 36, 5), { wash: C.rock, fill: C.rockDk, fillOp: 90, bleed: .08, tex: .7, ink: PAL.ink, sw: 1.1, hatch: { d: 34, a: .8, o: { rand: .5 }, b: 'charcoal', c: C.rockDk, w: .7 } });
    paint(ellPts(540, 1300, 560, 90, 28, 4), { wash: mixCol(C.rock, C.rockLt, .45), ink: null });
    stone(210, 1360, 90, 40); stone(860, 1380, 110, 46, C.rockDk);
    rain(t, ease(seg(lt, 1.2, 2.2)), -40, W + 40, 0, 1420);
    // the one drop: a slow fall straight onto her nose
    const q = seg(t, tFall, tHit), noseY = gy - 5.85 * u;
    if (q > 0 && q < 1) drop(cx + 2, lerp(200, noseY - 18, easeIn(q)), 17 + 6 * q);
    const mood = lt < 1.2 ? 'calm' : t < tHit ? 'curious' : t < tHit + 1.0 ? 'surprised' : 'annoyed';
    const tk = take(t, tHit, .8), shake = t > tHit + .25 ? .08 * spring(t, tHit + .25, 4, 26) : 0;
    cat(cx, gy, u, { ...catFeel(mood, t), view: 'front', emote: mood === 'calm' ? null : mood === 'curious' ? null : undefined, emoteAge: t - tHit, rot: shake, sq: tk.sq, dy: tk.dy, lookY: t < tHit ? -.8 : -.1, lookX: 0, blush: 0 });
    splash(cx, noseY, seg(t, tHit, tHit + .55), 1);
    // trickles start where the rain lands on the rock
    const run = ease(seg(lt, 2.8, dur - .4));
    water([[330, 1330], [260, 1450], [210, 1620], [170, 1920]], 20, 30, t, { p: run, key: 1 }); water([[760, 1335], [820, 1470], [880, 1640], [930, 1920]], 20, 30, t, { p: run * .9, key: 2 });
    const eye = toScreen(cx, gy - 5 * u);
    camEnd();
    if (lt < .5) iris(...eye, lerp(0, 1700, easeIn(lt / .5)), PAL.ink);
    outWipe(lt, dur);
    captions(t);
  }

  // ---------- Shot B: the slope: the snow melts, the water runs down, she hops from dry stone to dry stone ----------
  const slopeY = x => 380 + (1150 - x);
  function shotB(t, lt, dur) {
    const u = 30, melt = ease(seg(t, wd(1, 2) - .3, wd(1, 4) + .8)), run = ease(seg(t, wd(1, 4) - .2, wd(1, 4) + 1.8));
    camBegin(540, 960 + 40 * seg(lt, 0, dur), 1.0);
    skyBg(mixCol(C.skyGrey, '#CFE8EE', ease(seg(lt, 0, 2))), '#F2F7F4');
    peak([[560, 760], [820, 260], [1100, 760]], mixCol(C.rockLt, C.skyDeep, .35), false, 'b1');
    boilSeed('slope');
    paint([[-200, slopeY(-200)], [1200, slopeY(1200)], [1200, 2300], [-200, 2300]], { wash: C.rock, fill: C.rockDk, fillOp: 80, bleed: .08, tex: .7, ink: PAL.ink, sw: 1.1, hatch: { d: 38, a: .9, o: { rand: .5 }, b: 'charcoal', c: C.rockDk, w: .7 } });
    paint([[-200, slopeY(-200) + 14], [1200, slopeY(1200) + 14], [1200, slopeY(1200) + 70], [-200, slopeY(-200) + 70]], { wash: mixCol(C.grass, C.rock, .45), ink: null });
    // the snow cap at the top of the slope, shrinking
    boilSeed('snow');
    const sr = 1 - .82 * melt; paint(ellPts(1000, 520, 260 * sr, 150 * sr, 26, 6), { wash: C.snow, fill: '#DCEAF3', fillOp: 90, bleed: .15, ink: PAL.ink, sw: .8 });
    // water threads, all downhill, bending toward one gully
    const th = [[1010, 470, 560], [940, 520, 500], [870, 575, 450], [800, 630, 400]];
    th.forEach(([x0, y0, ye], i) => {
      const P = []; for (let k = 0; k <= 9; k++) { const x = lerp(x0, 260 + i * 14, k / 9), y = slopeY(x) + 4 + i * 5 + Math.sin(k * 1.3 + i) * 9; P.push([x, y]); }
      water(P, 9, 18 + i * 3, t, { p: run * (1 - i * .08), key: 10 + i, dashes: 4 });
    });
    // the cat: hops between dry stones, away from every thread
    const xs = [880, 790, 700, 610, 520, 430], hop = .68, h0 = wd(1, 4) - .3 - 0, tt = lt - .4;
    xs.slice(1).forEach(x => stone(x - 60, slopeY(x - 60) + 2, 50, 20));
    const n = xs.length - 1, i = clamp(Math.floor(tt / hop), 0, n - 1), kk = clamp(tt / hop - i, 0, 1), done = tt >= hop * n;
    const fx = done ? xs[n] : lerp(xs[i], xs[i + 1], ease(kk)), fy = slopeY(fx) - 4 - (done ? 0 : 70 * 4 * kk * (1 - kk));
    const crouch = !done && tt > 0 && kk < .12 ? .12 * (1 - kk / .12) : 0, land = kk > .9 || done ? .1 * spring(tt, hop * (i + 1), 8, 22) * 0 : 0;
    const mood = lt < 1.2 ? 'curious' : t < wd(1, 4) + 1.5 ? 'annoyed' : 'determined';
    cat(fx, fy, u, { ...catFeel(mood, t), view: 'side', flip: true, rot: .72, sq: crouch, lookY: .5, emote: null, tail: 1.6 });
    rain(t, 1 - ease(seg(lt, 0, 1.6)), -40, W + 40, 0, 1500);
    camEnd();
    inWipe(lt); outWipe(lt, dur, [mixCol(C.grass, PAL.teal, .3), mixCol(C.water, PAL.paper, .3)]);
    captions(t);
  }

  // ---------- Shot C: the creek: the threads join; she leans over, dips a paw, shakes it ----------
  const creekP = (t, y0, y1, x0 = 640) => { const P = []; for (let k = 0; k <= 12; k++) { const y = lerp(y0, y1, k / 12); P.push([x0 + Math.sin(k * .7 + .5) * 70 - k * 4, y]); } return P; };
  function shotC(t, lt, dur) {
    const u = 34, join = ease(seg(t, wd(2, 1) - .4, wd(2, 4) + .2)), cx = 330, gy = 1290;
    camBegin(540, 960, 1.0 + .03 * seg(lt, 0, dur));
    skyBg('#CFE8EE', '#F6F4E6', .45);
    peak([[-100, 700], [180, 360], [460, 700]], mixCol(C.rockLt, C.skyDeep, .5), true, 'c1');
    boilSeed('meadow');
    paint([[-200, 820], [600, 760], [1300, 850], [1300, 2300], [-200, 2300]], { wash: C.grass, fill: C.grassDk, fillOp: 90, bleed: .1, tex: .6, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 16; i++) tuft(60 + hash(i) * 960, 900 + hash(i + 5) * 1000, t);
    for (const [x, y] of [[120, 1050], [480, 1110], [900, 1020], [980, 1500], [90, 1650]]) { boilSeed('fl' + x); paint(starPts(x, y, 14, .5, 5), { wash: PAL.cream, ink: PAL.ink, sw: .5 }); paint(ellPts(x, y, 5, 5, 8), { wash: PAL.ochre, ink: null }); }
    // four threads from the top come together into one creek
    for (let i = 0; i < 4; i++) { const x0 = 160 + i * 250, P = [[x0, 760], [lerp(x0, 640, .4), 880], [lerp(x0, 640, .8), 1000], [640, 1060]]; water(P, 9, 14, t, { p: ease(seg(lt, .1 + i * .15, 1.2 + i * .15)), key: 30 + i, dashes: 2 }); }
    water(creekP(t, 1050, 2000), 70 * join + 10, 230 * join + 20, t, { p: join, key: 40, speed: .35, dashes: 9 });
    stone(500, 1240, 46, 20); stone(560, 1560, 54, 24); stone(840, 1600, 60, 26, C.rockDk);
    // the cat: curious at the bank, a paw dipped at tDip, pulled back and shaken
    const tDip = wd(2, 4) + .5, ph = seg(t, tDip, tDip + .35), back = seg(t, tDip + .35, tDip + .9);
    const mood = t < wd(2, 4) ? 'curious' : t < tDip + .3 ? 'curious' : 'annoyed';
    const lean = .22 * ease(seg(lt, .8, 2.0)) * (1 - ease(back)), shk = t > tDip + .35 ? .12 * spring(t, tDip + .35, 5, 30) : 0;
    cat(cx + 140 * ease(seg(lt, .2, 1.3)) * 0 + lean * 40, gy, u, { ...catFeel(mood, t), view: 'side', rot: lean * .5 + shk, lookY: .6, emote: null, tail: 1.2, dx: 0 });
    splash(520, 1330, seg(t, tDip + .1, tDip + .8), 1);
    camEnd();
    inWipe(lt, [mixCol(C.grass, PAL.teal, .3), mixCol(C.water, PAL.paper, .3)]); outWipe(lt, dur);
    captions(t);
  }

  // ---------- Shot D: the valley: two creeks meet, the water grows and carves; she crosses on stones and is soaked ----------
  function shotD(t, lt, dur) {
    const u = 30, meet = ease(seg(t, wd(3, 1) - .3, wd(3, 2) + .2)), carve = ease(seg(t, wd(3, 4) - .3, SC[4])), cx0 = 540;
    camBegin(540, 960, 1.0);
    skyBg('#D6EAF0', '#F6F1E1', .5);
    // the valley: two walls that retreat as the water cuts down
    boilSeed('walls');
    const wl = lerp(250, 120, carve), wr = lerp(830, 960, carve);
    paint([[-300, 700], [wl - 100, 900], [wl, 1500], [wl + 70, 2300], [-300, 2300]], { wash: C.grass, fill: C.rockDk, fillOp: 70, bleed: .1, tex: .6, ink: PAL.ink, sw: 1.1 });
    paint([[1400, 700], [wr + 100, 900], [wr, 1500], [wr - 70, 2300], [1400, 2300]], { wash: C.grass, fill: C.rockDk, fillOp: 70, bleed: .1, tex: .6, ink: PAL.ink, sw: 1.1 });
    paint([[wl - 100, 900], [wl, 1500], [wl + 70, 2300], [wl + 150, 2300], [wl + 80, 1500], [wl + 10, 900]], { wash: C.dirt, fill: C.woodDk, fillOp: 60, bleed: .05, ink: null });
    paint([[wr + 100, 900], [wr, 1500], [wr - 70, 2300], [wr - 150, 2300], [wr - 80, 1500], [wr + 10, 900]], { wash: C.dirt, fill: C.woodDk, fillOp: 60, bleed: .05, ink: null });
    for (let i = 0; i < 6; i++) { const y = 1000 + i * 190; stone(wl + 30 - (i % 2) * 20, y, 26, 14); stone(wr - 30 + (i % 2) * 20, y + 60, 28, 15, C.rockDk); }
    // two creeks from the top corners meet in the middle, then one wide river
    const A1 = [[wl + 60, 780], [wl + 150, 960], [440, 1180], [540, 1330]], B1 = [[wr - 60, 780], [wr - 150, 960], [640, 1180], [540, 1330]];
    water(A1, 24, 40 + 30 * meet, t, { p: ease(seg(lt, .3, 1.4)), key: 50 }); water(B1, 24, 40 + 30 * meet, t, { p: ease(seg(lt, .4, 1.5)), key: 51 });
    const RV = []; for (let k = 0; k <= 10; k++) RV.push([540 + Math.sin(k * .8) * 40, lerp(1330, 2100, k / 10)]);
    water(RV, 110 + 80 * carve, 300 + 120 * carve, t, { p: meet, key: 52, speed: .4, dashes: 9 });
    // rocks tumble from the walls as the valley is cut
    for (let i = 0; i < 5; i++) { const q = seg(t, wd(3, 4) + i * .3, wd(3, 4) + i * .3 + .9); if (q > 0 && q < 1) { const p = arcPt([i % 2 ? wl + 60 : wr - 60, 1100 + i * 90], [540 + (i - 2) * 40, 1560], 120, q); stone(p[0], p[1], 20 + 6 * hash(i), 14); } }
    // stepping stones across the river; she crosses and the last one splashes her
    const sx = [250, 400, 540, 680, 830], tStart = wd(3, 4) + .2, hop = .6, SY = 1620;
    sx.forEach(x => stone(x, SY, 52, 20, C.rockDk));
    const tt = lt - (tStart - SC[3]) - 0, n = sx.length - 1, i = clamp(Math.floor(tt / hop), 0, n - 1), kk = clamp(tt / hop - i, 0, 1), done = tt >= hop * n;
    const fx = tt < 0 ? sx[0] : done ? sx[n] : lerp(sx[i], sx[i + 1], ease(kk)), fy = SY - 14 - (tt < 0 || done ? 0 : 90 * 4 * kk * (1 - kk));
    const tSplash = tStart - SC[3] + hop * (n - 1) + hop * .5, wet = ease(seg(lt, tSplash, tSplash + .6));
    const mood = tt < 0 ? 'curious' : lt < tSplash ? 'determined' : 'dizzy';
    cat(fx, fy, u, { ...catFeel(mood, t), view: 'side', rot: tt < 0 ? 0 : .08, wet, lookY: .3, tail: 1.5, ...(lt > tSplash + .3 ? { rot: .1 * spring(lt, tSplash + .3, 4, 24) } : {}) });
    splash(sx[n - 1] + 40, SY - 40, seg(lt, tSplash - .1, tSplash + .7), 1.6);
    camEnd();
    inWipe(lt); outWipe(lt, dur, [mixCol(C.water, PAL.teal, .3), mixCol(C.sunset, C.water, .4)]);
    captions(t);
  }

  // ---------- Shot E: the river carries her (on a log) to the sea ----------
  function shotE(t, lt, dur) {
    const u = 30, sea = ease(seg(t, wd(4, 5) - .2, wd(4, 5) + 1.4)), sun = ease(seg(lt, 0, dur));
    camBegin(540, 960, 1.0);
    skyBg(mixCol('#D6EAF0', C.sunset, sea * .85), mixCol('#F6F1E1', '#FFD9A8', sea), .55);
    // sun, low over the sea
    const sy = lerp(520, 780, sea), sr = 120 + 40 * sea;
    glow(540, sy, 520, '#FFD28A', .45 * sea); boilSeed('sun'); paint(ellPts(540, sy, sr, sr, 28, 2), { wash: mixCol(PAL.cream, C.sunset, .3), washOp: 255 * sea, ink: null });
    // banks slide past and spread apart as the river meets the sea
    const sc = lt * 260, spread = sea;
    for (const sg of [-1, 1]) {
      boilSeed('bank' + sg);
      const xin = lerp(150, -300, spread), P = []; for (let k = 0; k <= 8; k++) { const y = lerp(700, 2300, k / 8); P.push([sg < 0 ? lerp(xin + Math.sin((k * 1.3 + sc * .004)) * 30, -300, spread) : lerp(W - xin + Math.sin((k * 1.1 + sc * .004)) * 30, W + 300, spread), y]); }
      paint([...P, [sg < 0 ? -400 : W + 400, 2300], [sg < 0 ? -400 : W + 400, 700]], { wash: C.grass, fill: C.grassDk, fillOp: 80, bleed: .1, tex: .6, ink: PAL.ink, sw: 1 });
    }
    boilSeed('sea');
    paint(rectPts(-300, 900 - 130 * sea, W + 600, 1500), { wash: mixCol(C.water, C.waterDk, .3), washOp: 255, fill: C.waterDk, fillOp: 60, bleed: .1, tex: .5, ink: null });
    for (let i = 0; i < 12; i++) { const y = 960 + i * 80 + ((sc * .6 + i * 70) % 80), x = hash(i) * W; inkLine(seg3([x - 60, y], [x + 60, y]), .8, PAL.cream, 'inkfine', .5); }
    // the log with the cat on it, bobbing; scared on the river, proud at the sea
    const bob = Math.sin(t * 2.2) * 8, lx = 540, ly = 1250 + bob, tilt = Math.sin(t * 1.6) * .04;
    push(); translate(lx, ly); rotate(tilt);
    boilSeed('log'); paint(rrPts(-250, -26, 500, 70, 34, 2), { wash: C.wood, fill: C.woodDk, fillOp: 90, bleed: .05, tex: .7, ink: PAL.ink, sw: 1.1 });
    paint(ellPts(250, 9, 26, 36, 14, 1), { wash: C.dirt, ink: PAL.ink, sw: .8 }); inkLine(seg3([240, 8], [262, 8]), .6, C.woodDk, 'inkfine', .4);
    inkLine(seg3([-160, -8], [-60, -6]), .7, C.woodDk, 'inkfine', .5);
    const mood = t < wd(4, 5) - .3 ? 'scared' : sea > .6 ? 'proud' : 'surprised';
    cat(0, -22, u, { ...catFeel(mood, t), view: 'front', emoteK: 1, noShadow: true, tail: 1.6, lookX: .2 });
    pop();
    water([[-100, 1330], [200, 1310], [540, 1330], [880, 1305], [1200, 1330]], 30, 30, t, { col: '#9ADCE8', op: 140, ink: null, key: 60, speed: .5, dashes: 5 });
    camEnd();
    inWipe(lt, [mixCol(C.water, PAL.teal, .3), mixCol(C.sunset, C.water, .4)]);
    captions(t);
    void sun;
  }

  // ---------- Shot F: the sun lifts the water into a cloud; a drop falls on her nose (loops to A) ----------
  function shotF(t, lt, dur) {
    const u = 36, cx = 540, gy = 1480, mist = ease(seg(t, wd(5, 1) - .2, wd(5, 3))), cl = ease(seg(t, wd(5, 1), wd(5, 3) + .2)), tHit = SC[5] + dur - 1.0, tFall = tHit - 1.3;
    camBegin(540, 960, 1.0 + .05 * seg(lt, 0, dur));
    skyBg(mixCol(C.sunset, '#D5EBF1', ease(seg(lt, 0, dur))), mixCol('#FFD9A8', '#F2F7F4', ease(seg(lt, 0, dur))), .55);
    glow(540, 900, 460, '#FFD28A', .4 * (1 - ease(seg(lt, 0, dur))));
    boilSeed('fsea'); paint(rectPts(-300, 1050, W + 600, 1400), { wash: mixCol(C.water, C.waterDk, .3), fill: C.waterDk, fillOp: 60, bleed: .1, tex: .5, ink: null });
    paint(ellPts(540, 1760, 900, 330, 32, 5), { wash: C.sand, fill: C.dirt, fillOp: 70, bleed: .1, tex: .6, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 9; i++) { const y = 1100 + i * 60; inkLine(seg3([hash(i) * W - 70, y], [hash(i) * W + 70, y]), .8, PAL.cream, 'inkfine', .5); }
    // mist rises in soft columns and gathers into a cloud above her
    for (let i = 0; i < 7; i++) {
      const f = frac(t * .18 + hash(i)), x = 140 + i * 130 + Math.sin(t + i) * 20, y = lerp(1060, 520, f * mist);
      boilSeed('mist' + i); paint(ellPts(x, y, 70 + 40 * f, 30 + 16 * f, 16, 3), { fill: PAL.cream, fillOp: 150 * mist * (1 - f * .5), bleed: .3, tex: .3, ink: null });
    }
    cloud(540, 430 + 40 * (1 - cl), .9 + .5 * cl, mixCol('#FFFFFF', '#A5B4C2', .35 * cl), 255 * cl);
    // the drop from the cloud onto her nose
    const q = seg(t, tFall, tHit), noseY = gy - 5.85 * u;
    if (q > 0 && q < 1) drop(cx + 2, lerp(520, noseY - 18, easeIn(q)), 17 + 6 * q);
    const mood = t < tHit ? 'curious' : 'surprised', tk = take(t, tHit, .8);
    cat(cx, gy, u, { ...catFeel(mood, t), view: 'front', emote: null, sq: tk.sq, dy: tk.dy, lookY: t < tHit ? -.8 : -.1, blush: 0 });
    splash(cx, noseY, seg(t, tHit, tHit + .5), 1);
    const eye = toScreen(cx, noseY);
    camEnd();
    inWipe(lt);
    const close = seg(lt, dur - .75, dur - .02); if (close > 0) iris(...eye, lerp(1800, 0, easeIn(close)), PAL.ink);
    captions(t);
  }
  shots([[SC[0], shotA], [SC[1], shotB], [SC[2], shotC], [SC[3], shotD], [SC[4], shotE], [SC[5], shotF]]);
})();
