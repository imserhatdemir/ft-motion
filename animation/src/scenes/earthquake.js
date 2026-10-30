// earthquake.js: "Deprem nasıl oluşur", 30 s, Clawd. One idea: Clawd bends a stick to show why the ground snaps.
//   A field in cross-section: grass on top, strata below, two plates side by side. The ground bends like the stick, snaps with it,
//   and the shock runs out through everything. Narration timing comes from earthquake_schedule.js (QSCHED, from voice.py).
//   Shots: A plates · B the edges lock, the stick bends · C the snap · D waves · E seismograph · F x32 (twig, branch, log) · G Türkiye · H the field at dawn
// Captions are a separate overlay (the only text in the film), requested for this video; nothing is written on any object.
(() => {
  const S = QSCHED, SC = S.map(s => s.scene), T_SNAP = Math.round((S[2].words[S[2].words.length - 1][1] - .03) / .25) * .25;
  const GY = 620, FX = 960;                                    // ground line (world y) and the fault (world x)
  const C = { skyDay: '#BFE3E0', skyCold: '#9DB1BF', skyDawn: '#F3D6A0', grass: '#86AA70', grassDk: '#5F8A55', stick: '#8B5E3C', stickLt: '#C79A6B',
              layers: ['#B98A5E', '#C99567', '#A97D6C', '#8B6670'], depth: [0, 150, 330, 600, 1700], fault: '#E27A92', wall: '#E9E1CF', wood: '#B98A5E', steel: '#7C93A6' };
  const FIELD_WIPE = [mixCol(C.skyDay, PAL.teal, .35), mixCol(C.skyDay, PAL.sap, .3)];

  // ---------- the state of the ground at time t: a shear that bends and slips, plus a wave that runs out from the fault ----------
  function ground(t) {
    let A;
    if (t < SC[1]) A = 38 * ease(seg(t, 2.8, SC[1])); else if (t < T_SNAP) A = 38 + 22 * seg(t, SC[1], T_SNAP); else A = 60 + (t > SC[7] ? 5 * (t - SC[7]) : 0);
    let lock = 0;
    if (t >= SC[1] && t < T_SNAP) lock = ease(seg(t, SC[1], SC[1] + .6));
    else if (t >= T_SNAP && t < SC[1] + 99) lock = Math.exp(-(t - T_SNAP) * 9) * Math.cos((t - T_SNAP) * 14);   // lets go, overshoots, settles
    return { A, lock };
  }
  // vertical offset of the ground at world x: the shear (left plate down, right plate up) and the travelling wave
  function dOf(x, g, t) {
    const dx = x - FX, shear = -Math.sign(dx) * g.A * (1 - g.lock * Math.exp(-Math.abs(dx) / 120));
    let w = 0;
    if (t > T_SNAP) { const a = t - T_SNAP - Math.abs(dx) / 420; if (a > 0) w = 20 * Math.exp(-a * 1.9) * Math.sin(a * 17) * Math.min(1, a * 9) / (1 + Math.abs(dx) / 1100); }
    return shear + w;
  }
  const XS = [0, 6, 20, 45, 80, 130, 200, 300, 450, 700, 1000, 1400];   // samples away from the fault: dense where the ground bends
  const skyAt = t => t < SC[1] ? C.skyDay : t < 11 ? C.skyDay : t < 13 ? mixCol(C.skyDay, C.skyCold, ease(seg(t, T_SNAP, 13))) : t < 26.5 ? mixCol(C.skyCold, C.skyDay, .35 * ease(seg(t, 13, 24)) + .65 * ease(seg(t, 18, 22)) * 0)
    : mixCol(mixCol(C.skyCold, C.skyDay, .35), C.skyDawn, ease(seg(t, 26.5, 28.5)));

  function sky(t, cloudK = 1) {
    boilSeed('sky');
    paint(rectPts(-700, -900, W + 1400, GY + 900), { wash: skyAt(t), ink: null });
    for (let i = 0; i < 5; i++) {
      boilSeed('cloud' + i);
      const x = ((hash(i) * (W + 600) + t * (8 + 6 * hash(i + 9))) % (W + 600)) - 300, y = 120 + 230 * hash(i + 4) + wob(t, .05, i) * 8, s = 1 + hash(i + 7);
      paint(ellPts(x, y, 150 * s, 38 * s, 20, 4), { fill: PAL.cream, fillOp: 150 * cloudK, bleed: .3, tex: .4, ink: null });
      paint(ellPts(x + 70 * s, y - 18 * s, 90 * s, 30 * s, 20, 4), { fill: PAL.cream, fillOp: 120 * cloudK, bleed: .3, tex: .4, ink: null });
    }
  }
  // the ground itself: strata in two halves (they can slip past each other), grass on top, a jagged crack between them
  function groundCut(t, g) {
    const dOfx = x => dOf(x, g, t);
    for (const sg of [-1, 1]) {
      const xs = XS.map(v => FX + sg * v); if (sg < 0) xs.reverse();
      xs.unshift(sg < 0 ? -500 : 0); // placeholder replaced below
      xs.shift();
      const ext = sg < 0 ? [-500].concat(xs) : xs.concat([2500]);
      for (let k = 0; k < 4; k++) {
        boilSeed('band' + sg + k);
        const top = ext.map(x => [x, GY + C.depth[k] + dOfx(x)]), bot = ext.map(x => [x, GY + C.depth[k + 1] + dOfx(x)]).reverse();
        const col = C.layers[k];
        paint([...top, ...bot], { wash: col, washOp: 255, fill: mixCol(col, PAL.ink, .35), fillOp: 55, bleed: .06, tex: .7, border: .4, ink: PAL.ink, sw: .9,
          hatch: k === 2 ? { d: 46, a: .7, o: { rand: .5 }, b: 'charcoal', c: mixCol(col, PAL.ink, .4), w: .7 } : undefined });
      }
      boilSeed('grass' + sg);
      const top = ext.map(x => [x, GY + dOfx(x) - 3]), bot = ext.map(x => [x, GY + dOfx(x) + 24]).reverse();
      paint([...top, ...bot], { wash: C.grass, washOp: 255, fill: C.grassDk, fillOp: 70, bleed: .06, tex: .6, ink: PAL.ink, sw: .9 });
    }
    boilSeed('crack');
    const P = []; for (let y = GY - 4; y < 1900; y += 34) P.push([FX + (hash(y / 34) - .5) * 20, y + Math.max(dOfx(FX - 1), dOfx(FX + 1)) * 0]);
    inkLine(P, 1.3, mixCol(PAL.ink, C.fault, .15 + .6 * clamp(Math.abs(g.lock) * (t > T_SNAP ? 0 : 0))), 'inkfine', .2);
    for (let i = 0; i < 46; i++) {   // grass tufts, swaying, riding the ground
      boilSeed('tuft' + i);
      const x = hash(i + 50) * 2300 - 200, y = GY + dOfx(x), sw = wob(t, .6, hash(i) * 3) * 4;
      if (Math.abs(x - FX) < 14) continue;
      for (const k of [-1, 0, 1]) inkLine([[x + k * 7, y + 2], [x + k * 11 + sw, y - 20 - 9 * hash(i + k)]], .7, C.grassDk, 'inkfine', .4);
    }
  }
  const plateArrow = (x, y, up, k) => {   // a painted push arrow on a plate: a ribbon with a head
    const s = up ? -1 : 1, bob = wob(T, .9) * 10 * s;
    boilSeed('arrow' + x);
    paint(ribbon([[x, y - 70 * s + bob], [x, y + 20 * s + bob]], 26, 26), { wash: PAL.cream, washOp: 255 * k, ink: PAL.ink, sw: .9 });
    paint([[x - 44, y + 20 * s + bob], [x + 44, y + 20 * s + bob], [x, y + 86 * s + bob]], { wash: PAL.cream, washOp: 255 * k, ink: PAL.ink, sw: .9 });
  };
  const tree = (x, t, g) => {   // a tree on the right plate that sways when the wave reaches it
    const y = GY + dOf(x, g, t), sway = t > T_SNAP ? .09 * Math.exp(-(t - T_SNAP - Math.abs(x - FX) / 420 - .25) * 1.6) * Math.sin((t - T_SNAP) * 15) * (t > T_SNAP + Math.abs(x - FX) / 420 ? 1 : 0) : 0;
    boilSeed('tree' + x);
    push(); translate(x, y); rotate(sway);
    paint(ribbon([[0, 6], [4, -120], [-2, -220]], 40, 22), { wash: C.stick, ink: PAL.ink, sw: 1 });
    for (const [cx, cy, r] of [[-70, -250, 90], [70, -260, 95], [0, -330, 105]]) paint(ellPts(cx, cy, r, r * .85, 22, 3), { wash: C.grass, fill: C.grassDk, fillOp: 90, bleed: .1, tex: .6, ink: PAL.ink, sw: 1 });
    pop();
  };

  // ---------- captions: the only text. Word by word, the spoken word lit. ----------
  const cap = document.createElement('canvas').getContext('2d');
  function captions(t) {
    const L = S.find(l => t >= l.voice - .2 && t < l.voice + l.dur + .45); if (!L) return;
    const a = ease(seg(t, L.voice - .2, L.voice - .05)) * (1 - ease(seg(t, L.voice + L.dur + .15, L.voice + L.dur + .45)));
    const size = 66, font = `800 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`; cap.font = font;
    const gap = cap.measureText(' ').width * 1.15, ws = L.words.map(w => ({ w, wd: cap.measureText(w[0]).width }));
    let total = ws.reduce((q, it) => q + it.wd, 0) + gap * (ws.length - 1), x = W / 2 - total / 2;
    for (const it of ws) {
      const [txt, w0, w1] = it.w, spoken = t >= w0, now = spoken && t < w1 + .05;
      letter(txt, x, 985 + (1 - a) * 14, size, now ? PAL.clayLt : spoken ? PAL.cream : '#D9D2C2', { screen: true, font, align: 'left', alpha: a * (spoken ? 1 : .8), stroke: PAL.ink, ink: false });
      x += it.wd + gap;
    }
  }

  // ---------- the stick (the motif) ----------
  // held at both arm tips, bowed upward by b (0 = straight); drawn in body-local space from Clawd's draw hook
  const stickHook = (b, thick = .5, col = C.stick) => (u, sw) => {
    const y = -4.5 * u, P = [[-7.1 * u, y], [-3.5 * u, y + b * 1.3 * u], [0, y + b * 2 * u], [3.5 * u, y + b * 1.3 * u], [7.1 * u, y]];
    paint(ribbon(P, thick * u, thick * u), { wash: col, fill: C.stickLt, fillOp: 70, bleed: .05, ink: PAL.ink, sw: sw * (thick < .6 ? .45 : .9) });
    if (b > .75) for (let i = 0; i < 4; i++) inkLine([[(i - 1.5) * .35 * u, y + b * 2 * u - .3 * u], [(i - 1.5) * .35 * u + jit(2), y + b * 2 * u + .35 * u]], sw * .5, PAL.cream, 'inkfine', 0);
  };
  // the two halves after the snap: they leave the break on arcs, spinning
  function halves(t, t0, cx, cy, u, col = C.stick, thick = .5, len = 3.6) {
    const a = t - t0; if (a < 0 || a > 1.6) return;
    for (const s of [-1, 1]) {
      const x = cx + s * (3.6 * u + 5 * u * a * (1 + .3 * s) + 0 * a), y = cy - 4.5 * u + (-9 * u * a + 22 * u * a * a), rot = s * (.5 + 5 * a);
      push(); translate(x, y); rotate(rot);
      paint(ribbon([[-len / 2 * u, 0], [0, -.15 * u], [len / 2 * u, 0]], thick * u, thick * u), { wash: col, ink: PAL.ink, sw: .9 });
      pop();
    }
  }

  // ---------- Shot A: solid ground … or not (0 – SC[1]) ----------
  function shotA(t, lt, dur) {
    const g = ground(t), u = 26, cx = 640, cyOf = kf(t, [[0, 470], [1.4, 470], [2.8, 1010], [3.7, 1010], [dur, 700]]);
    camBegin(960, cyOf, 1);
    sky(t);
    groundCut(t, g);
    // Clawd bounces to the beat on the grass, then looks down at what he found
    const gy = GY + dOf(cx, g, t) - 2;
    const mood = emotions(t, [[0, 'happy'], [3.7, 'confused', { lookY: .9, lookX: .3 }]]);
    const bounce = t < 3.6 ? move('bounce', t, 1) : {};
    clawd(cx, gy, u, { ...mood, ...bounce, dy: (mood.dy || 0) * .5 + (bounce.dy || 0) });
    if (t > 2.8) { const k = ease(seg(t, 2.8, 3.2)); plateArrow(560, GY + 380 + dOf(560, g, t), false, k); plateArrow(1370, GY + 380 + dOf(1370, g, t), true, k); }
    const eye = toScreen(cx, gy - 4 * u);
    camEnd();
    if (lt < .5) iris(...eye, lerp(0, 1500, easeIn(lt / .5)));
    boilSeed('wipeA');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, FIELD_WIPE);
    captions(t);
  }

  // ---------- Shot B: the edges lock, the ground and the stick bend (SC[1] – SC[2]) ----------
  function shotB(t, lt, dur) {
    const g = ground(t), u = 26, cx = 600, strain = seg(t, SC[1] + 1.2, T_SNAP - .5);
    camBegin(960, 585, 1.02 + .04 * seg(lt, 0, dur));
    sky(t);
    groundCut(t, g);
    // little sparks where the plates catch on each other
    boilSeed('sparks');
    if (lt > .1 && lt < 2.2) for (let i = 0; i < 5; i++) { const k = seg(lt, .1 + i * .3, .5 + i * .3); if (k > 0 && k < 1) paint(starPts(FX + (hash(i) - .5) * 40, GY + 120 + i * 90, 14 * (1 - k * .5), .3, 4, k * 3), { wash: PAL.cream, washOp: 255 * (1 - k), ink: null }); }
    const gy = GY + dOf(cx, g, t) - 2, shk = .08 * strain * Math.sin(t * 40);
    const mood = emotions(t, [[SC[1], 'determined'], [T_SNAP - 2.1, 'nervous']]);
    const b = .15 + 1.05 * ease(strain);
    clawd(cx, gy, u, { ...mood, dx: shk, aL: .05, aR: .05, sq: (mood.sq || 0) + .03 * strain * Math.abs(Math.sin(t * 5)), draw: stickHook(b) });
    if (t < SC[1] + 1.4) { const k = 1 - seg(t, SC[1] + .9, SC[1] + 1.4); if (k > 0) { plateArrow(560, GY + 380 + dOf(560, g, t), false, k); plateArrow(1370, GY + 380 + dOf(1370, g, t), true, k); } }
    camEnd();
    if (lt < .3) brushWipe(.5 + lt / .6, FIELD_WIPE);
    captions(t);
  }

  // ---------- Shot C: the snap (SC[2] – SC[3]) ----------
  function shotC(t, lt, dur) {
    const g = ground(t), u = 26, cx = 600, pre = t < T_SNAP, a = t - T_SNAP, strain = 1 - .02 * seg(t, SC[2], T_SNAP);
    const sh = a > 0 ? shakeXY(t, 22 * Math.exp(-a * 5)) : shakeXY(t, 2.5 * seg(t, SC[2] + 1, T_SNAP));
    const zoom = kf(t, [[SC[2], 1.06], [T_SNAP, 1.4], [T_SNAP + .25, 1.28], [T_SNAP + 1.3, 1.08], [dur + SC[2], 1.04]]);
    camBegin(kf(t, [[SC[2], 960], [T_SNAP, 900], [T_SNAP + 1.3, 960]]) + sh[0], kf(t, [[SC[2], 585], [T_SNAP, 720], [T_SNAP + 1.3, 600]]) + sh[1], zoom);
    sky(t);
    groundCut(t, g);
    // cracks creep out from the contact before the snap
    boilSeed('cracks');
    const cr = seg(t, SC[2] + .2, T_SNAP);
    for (let i = 0; i < 5; i++) { const L = 160 * cr * (.5 + hash(i)), y = GY + 70 + i * 120, s = i % 2 ? 1 : -1; inkLine([[FX, y], [FX + s * L * .5, y + 20], [FX + s * L, y - 10 + hash(i + 3) * 30]], 1.1, PAL.ink, 'inkfine', .3); }
    const gy = GY + dOf(cx, g, t) - 2;
    if (pre) {
      const mood = emotions(t, [[0, 'nervous']]);
      clawd(cx, gy, u, { ...mood, dx: .1 * Math.sin(t * 45), aL: .05, aR: .05, draw: stickHook(1.2) });
    } else {
      const fly = ease(seg(a, 0, .35)), land = seg(a, .35, .75);
      const rot = -1.45 * ease(seg(a, 0, .55)) + .08 * spring(a, .6, 5, 16);
      const mood = emotions(a + 1, [[0, 'surprised'], [1.35, 'dizzy']]);
      const lift = -3.5 * 4 * fly * (1 - fly) * (1 - land) - 0.6 * (1 - land);
      clawd(cx - 5 * u * ease(seg(a, 0, .5)), gy, u, { ...mood, rot, dy: lift, aL: 1.2, aR: 1.2, view: 'front', noLegs: false, sq: -.18 * Math.exp(-a * 9) * Math.cos(a * 18) });
      halves(t, T_SNAP, cx, gy, u);
      for (let i = 0; i < 9; i++) { const k = seg(a, 0, .5 + hash(i) * .3); if (k > 0 && k < 1) paint(starPts(cx + 40 * (i - 4) * k * 1.6, gy - 100 - 140 * k * (.5 + hash(i)), 16 * (1 - k * .6), .3, 4, k * 4), { wash: PAL.cream, washOp: 255 * (1 - k * k), ink: null }); }
    }
    camEnd();
    if (a >= 0 && a < .5) { flash(.9 * Math.exp(-a * 22)); boilSeed('shock'); paint(ellPts(...toScreen(FX, GY + 200, null), 0, 0, 4), { ink: null }); }
    captions(t);
  }

  // ---------- Shot D: the shock runs out (SC[3] – SC[4]) ----------
  function shotD(t, lt, dur) {
    const g = ground(t), u = 26, cx = 620, a = t - T_SNAP, H0 = [FX, GY + 250];
    const settle = kf(lt, [[0, 1.12], [dur, 1.0]], ease);
    camBegin(960, 560, settle);
    sky(t);
    groundCut(t, g);
    tree(1500, t, g);
    // rings leave the focus through the rock: one every .55 s, alternating teal and rose, only below the ground line
    for (let i = 0; i < 5; i++) {
      const age = (a - 1.6) - i * .6 + (t - SC[3]) * 0; const ai = t - SC[3] - .35 - i * .6; if (ai < 0 || ai > 2.6) continue;
      boilSeed('ring' + i);
      const r = 90 + 560 * easeOut(ai / 2.6); let run = [];
      const flushRun = () => { if (run.length > 3) inkLine(run, 2.4 * (1 - ai / 3), i % 2 ? PAL.teal : C.fault, 'ink', .4); run = []; };
      for (let k = 0; k <= 72; k++) { const th = k / 72 * TAU, x = H0[0] + Math.cos(th) * r, y = H0[1] + Math.sin(th) * r; if (y > GY + 30 + dOf(x, g, t)) run.push([x, y]); else flushRun(); }
      flushRun();
    }
    const f0 = 1 - seg(t, SC[3], SC[3] + 1.4); glow(H0[0], H0[1], 70 + 150 * f0, '#FFC9A8', .45 * f0 + .1);
    boilSeed('focus'); paint(starPts(H0[0], H0[1], 22 + 16 * f0, .45, 5, t * 2), { wash: PAL.cream, ink: PAL.ink, sw: .8 });
    // Clawd stands on the left plate; the wave reaches him about a second after the snap
    const arr = T_SNAP + Math.abs(cx - FX) / 420, gy = GY + dOf(cx, g, t) - 2, hit = Math.max(0, t - arr);
    const mood = emotions(t, [[SC[3] - 1, 'dizzy'], [SC[3] + .5, 'neutral'], [arr - .05, 'surprised', { lookX: .9 }], [arr + 1.4, 'nervous']]);
    clawd(cx, gy, u, { ...mood, rot: .09 * Math.exp(-hit * 1.5) * Math.sin(hit * 14) * (t > arr ? 1 : 0), aL: t > arr ? 1.1 : .2, aR: t > arr ? 1.1 : .2 });
    const eye = toScreen(H0[0], H0[1]);
    camEnd();
    if (lt < .5) iris(...eye, lerp(0, 1900, easeIn(lt / .5)));
    boilSeed('wipeD'); if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, [mixCol(PAL.paper, PAL.teal, .3), PAL.cream]);
    captions(t);
  }

  // ---------- a seismograph: a paper chart scrolls left under a pen; the trace is the history of the signal ----------
  const burst = (t, t0, amp, f, dec) => t < t0 ? 0 : amp * Math.min(1, (t - t0) / .09) * Math.exp(-(t - t0) / dec) * Math.sin((t - t0) * f);
  const quake = t => 3 * Math.sin(t * 61) * Math.sin(t * 7.3) + burst(t, SC[4] + 1.0, 18, 70, .45) + burst(t, SC[4] + 1.45, 70, 38, .75) + burst(t, SC[4] + 1.9, 135, 21, 1.0);
  const tests = t => burst(t, SC[5] + .7, 26, 60, .35) + burst(t, SC[5] + 1.8, 105, 36, .55) + burst(t, SC[5] + 2.85, 330, 22, .9) + 2 * Math.sin(t * 61) * Math.sin(t * 7.3);
  const CH = { x0: 330, x1: 1590, y0: 90, y1: 450, pen: 1500, spd: 300 };
  function chart(t, sig, shk = [0, 0]) {
    const mid = (CH.y0 + CH.y1) / 2, lim = (CH.y1 - CH.y0) / 2 - 12, sq = v => Math.max(-lim, Math.min(lim, v));
    push(); translate(shk[0], shk[1]);
    boilSeed('chartframe');
    paint(rrPts(CH.x0 - 40, CH.y0 - 40, CH.x1 - CH.x0 + 80, CH.y1 - CH.y0 + 80, 30, 2), { wash: C.steel, fill: PAL.ink, fillOp: 40, ink: PAL.ink, sw: 1.2 });
    paint(rectPts(CH.x0, CH.y0, CH.x1 - CH.x0, CH.y1 - CH.y0, 1), { wash: PAL.cream, ink: PAL.ink, sw: .9 });
    boilSeed('chartgrid');
    for (let k = 0; k < 24; k++) { const x = CH.x0 + ((k * 60 - t * CH.spd) % (CH.x1 - CH.x0) + (CH.x1 - CH.x0)) % (CH.x1 - CH.x0); inkLine([[x, CH.y0 + 6], [x, CH.y1 - 6]], .5, mixCol(PAL.cream, PAL.ink, .22), 'inkfine', 0); }
    for (const dy of [-1, 0, 1]) inkLine([[CH.x0 + 6, mid + dy * lim * .6], [CH.x1 - 6, mid + dy * lim * .6]], .5, mixCol(PAL.cream, PAL.ink, dy ? .22 : .4), 'inkfine', 0);
    boilSeed('trace');
    const pts = [], span = (CH.pen - CH.x0) / CH.spd;
    for (let k = 0; k <= 130; k++) { const tau = t - span * (1 - k / 130); pts.push([CH.pen - CH.spd * (t - tau), mid - sq(sig(tau))]); }
    inkLine(pts, 1.6, '#2F3C7A', 'ink', .2);
    const py = mid - sq(sig(t)), pv = [CH.pen + 150, CH.y0 - 70];
    inkLine([pv, [CH.pen, py]], 1.6, PAL.ink, 'ink', 0);
    paint(ellPts(CH.pen, py, 9, 9, 10), { wash: PAL.rose, ink: PAL.ink, sw: .7 });
    pop();
  }
  const room = (t, wallCol = C.wall) => {
    boilSeed('room');
    paint(rectPts(-100, -100, W + 200, 1000), { wash: wallCol, fill: mixCol(wallCol, PAL.teal, .5), fillOp: 50, bleed: .2, tex: .5, ink: null });
    paint(rectPts(-100, 880, W + 200, 400), { wash: C.wood, fill: mixCol(C.wood, PAL.ink, .4), fillOp: 70, bleed: .05, tex: .6, ink: null });
    inkLine([[-100, 880], [W / 2, 876], [W + 100, 882]], 1.2, PAL.ink, 'ink', .4);
    for (let i = 0; i < 6; i++) inkLine([[100 + i * 340, 900], [140 + i * 340, 1060]], .6, mixCol(C.wood, PAL.ink, .35), 'inkfine', 0);
  };

  // ---------- Shot E: the seismograph (SC[4] – SC[5]) ----------
  function shotE(t, lt, dur) {
    const u = 30, w = stroll(t, SC[4] + .1, SC[4] + 1.0, -160, 520, u), x = t < SC[4] + .1 ? -160 : w.x;
    camBegin(960 + 12 * Math.sin(lt * .6), 540, 1.02);
    room(t);
    chart(t, quake);
    const mood = emotions(t, [[SC[4], 'neutral'], [SC[4] + 1.15, 'surprised', { lookY: -.8, lookX: .5 }], [SC[4] + 2.3, 'starstruck']]);
    const walking = t < SC[4] + 1.0;
    clawd(x, 960, u, { ...mood, ...(walking ? { view: 'side', walk: w.walk, dy: w.dy } : {}), hat: 'headphones' });
    camEnd();
    boilSeed('wipeE'); if (lt < .3) brushWipe(.5 + lt / .6, [mixCol(PAL.teal, PAL.paper, .3), mixCol(PAL.sap, PAL.paper, .3)]);
    captions(t);
  }

  // ---------- Shot F: each step is 32 times more: a twig, a branch, a log (SC[5] – SC[6]) ----------
  const SNAPS = [[SC[5] + .7, 26, .42, 6.2, 'twig'], [SC[5] + 1.8, 105, .75, 6.6, 'branch'], [SC[5] + 2.85, 330, 1.7, 5.0, 'log']];
  function shotF(t, lt, dur) {
    const u = 30, cx = 1330, gy = 960, shk = t > SNAPS[2][0] ? shakeXY(t, 12 * Math.exp(-(t - SNAPS[2][0]) * 5)) : [0, 0];
    camBegin(960 + shk[0], 540 + shk[1], 1.0);
    room(t);
    chart(t, tests, shk);
    let cl = {}, idx = SNAPS.findIndex(s => t < s[0]); if (idx < 0) idx = 2;
    const prev = idx > 0 ? SNAPS[idx - 1][0] : SC[5], cur = SNAPS[idx];
    const arrive = backOut(seg(t, prev + .25, prev + .6)), bend = ease(seg(t, prev + .5, cur[0]));
    const moods = emotions(t, [[SC[5], 'determined'], [SNAPS[0][0] + .05, 'smug'], [SNAPS[1][0] + .05, 'surprised'], [SNAPS[2][0] + .05, 'scared'], [SNAPS[2][0] + 1.0, 'dizzy']]);
    const done = t >= SNAPS[2][0];
    if (!done) {
      cl = { ...moods, flip: true, aL: .05, aR: .05, dx: .1 * bend * Math.sin(t * 40), draw: (uu, sw) => { if (arrive < .02) return; push(); scale(arrive, arrive); stickHook(bend * 1.1, cur[2], cur[4] === 'log' ? '#6B4A31' : C.stick)(uu, sw); pop(); } };
      for (const k of [SNAPS[0][0], SNAPS[1][0]]) if (t > k && t < k + .6) Object.assign(cl, take(t, k, k === SNAPS[0][0] ? .4 : .9));
    } else {
      const a = t - SNAPS[2][0], rot = -1.35 * ease(seg(a, 0, .5));
      cl = { ...moods, flip: true, rot, dy: -2.5 * 4 * ease(seg(a, 0, .35)) * (1 - ease(seg(a, .35, .7))), aL: 1.2, aR: 1.2 };
    }
    clawd(cx - (done ? 4 * u * ease(seg(t - SNAPS[2][0], 0, .5)) : 0), gy, u, cl);
    for (const [t0, , th, , name] of SNAPS) halves(t, t0, cx, gy, u, name === 'log' ? '#6B4A31' : C.stick, th, 3.6);
    camEnd();
    flash(t > SNAPS[2][0] ? .5 * Math.exp(-(t - SNAPS[2][0]) * 18) : 0);
    captions(t);
  }

  // ---------- Shot G: Türkiye and its two big fault systems (SC[6] – SC[7]) ----------
  const LL = ([lon, lat]) => [620 + (lon - 26) * 60.5, 250 + (42.2 - lat) * 78];
  const TR = [[26.05, 40.75], [26.35, 41.72], [27.0, 42.0], [28.0, 41.98], [28.95, 41.25], [29.1, 41.2], [30.3, 41.2], [31.5, 41.1], [33.0, 41.95], [34.9, 42.0], [36.2, 41.3], [38.0, 40.95], [39.7, 41.0],
    [41.5, 41.5], [42.5, 41.45], [43.4, 41.1], [44.8, 39.6], [44.5, 38.4], [44.2, 37.3], [42.3, 37.2], [40.0, 36.9], [38.0, 36.8], [36.7, 36.6], [36.0, 35.95], [36.0, 36.7], [35.0, 36.8],
    [34.0, 36.2], [32.5, 36.1], [31.0, 36.8], [29.5, 36.2], [29.1, 36.6], [28.2, 36.7], [27.4, 37.0], [27.25, 37.9], [26.4, 38.4], [26.7, 39.3], [26.05, 39.5], [26.2, 40.05],
    [27.0, 40.4], [28.0, 40.4], [29.1, 40.43], [29.5, 40.72], [29.9, 40.75], [29.3, 40.78], [29.05, 40.98], [28.95, 40.98], [28.0, 40.98], [27.5, 40.97], [27.1, 40.6], [26.65, 40.4], [26.2, 40.1], [26.4, 40.55]].map(LL);
  const NAF = [[41.0, 39.3], [39.5, 39.75], [38.0, 40.1], [36.9, 40.5], [35.5, 40.75], [33.6, 41.0], [32.3, 40.85], [31.0, 40.75], [30.0, 40.72], [29.0, 40.75], [28.0, 40.8], [27.0, 40.6], [26.3, 40.5]].map(LL);
  const EAF = [[41.0, 39.3], [40.2, 38.85], [39.2, 38.5], [38.3, 38.0], [37.4, 37.55], [36.8, 37.0], [36.3, 36.5]].map(LL);
  function part(pts, p) {
    const seg2 = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = seg2.reduce((a, b) => a + b, 0), out = [pts[0]];
    let need = tot * p;
    for (let i = 0; i < seg2.length && need > 0; i++) { const k = Math.min(1, need / seg2[i]); out.push([lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]); need -= seg2[i]; }
    return out;
  }
  function shotG(t, lt, dur) {
    const u = 32, cx = 270, h = 700 * backOut(seg(lt, .2, 1.0)), fill = ease(seg(lt, .9, 1.5));
    camBegin(960, 540, 1.0);
    room(t, mixCol(C.wall, PAL.sky, .25));
    boilSeed('rod');
    paint(rrPts(500, 50, 1400, 34, 14, 1), { wash: C.wood, ink: PAL.ink, sw: 1 });
    paint(rectPts(540, 78, 1320, Math.max(4, h), 1), { wash: PAL.cream, fill: C.skyDay, fillOp: 90, bleed: .15, tex: .5, ink: PAL.ink, sw: 1 });
    if (h > 650) {
      boilSeed('map');
      paint(TR, { wash: mixCol('#CFE3B8', PAL.cream, .2), washOp: 255 * fill, fill: C.grass, fillOp: 110 * fill, bleed: .12, tex: .6, ink: PAL.ink, sw: 1.2 });
      const pn = ease(seg(lt, 1.5, 2.6)), pe = ease(seg(lt, 2.1, 3.0));
      boilSeed('faults');
      for (const [pts, p] of [[NAF, pn], [EAF, pe]]) { const d = part(pts, p); if (d.length > 2) paint(ribbon(d, 11, 11), { wash: C.fault, ink: PAL.ink, sw: .5 }); }
    }
    const mood = emotions(lt, [[0, 'neutral'], [1.3, 'thinking'], [2.6, 'determined']]);
    clawd(cx, 985, u, { ...mood, view: 'q', aR: .85, aL: .2, armR: (uu, sw) => paint(ribbon([[0, 0], [9.5 * uu, 0]], .35 * uu, .25 * uu), { wash: C.stick, ink: PAL.ink, sw: sw * .8 }) });
    camEnd();
    if (lt < .3) brushWipe(.5 + lt / .6, [mixCol(PAL.teal, PAL.paper, .3), mixCol(PAL.sap, PAL.paper, .3)]);
    boilSeed('wipeG'); if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, FIELD_WIPE);
    captions(t);
  }

  // ---------- Shot H: the same field at dawn; the ground never stops (SC[7] – end) ----------
  function shotH(t, lt, dur) {
    const g = ground(t), u = 26, cx = 640, cy = kf(lt, [[0, 520], [dur, 700]]);
    camBegin(960, cy, 1);
    sky(t, .8);
    const sunK = ease(seg(lt, 0, 2));
    glow(1500, GY - 60 - 20 * sunK, 340, '#FFD28A', .55 * sunK + .2);
    boilSeed('sun'); paint(ellPts(1500, GY - 60 - 20 * sunK, 66, 66, 24, 1.5), { wash: PAL.cream, fill: PAL.ochre, fillOp: 50, ink: PAL.ink, sw: .8 });
    groundCut(t, g);
    const gy = GY + dOf(cx, g, t) - 2;
    const mood = emotions(t, [[SC[7] - .3, 'neutral'], [SC[7] + .6, 'sleepy']]);
    clawd(cx, gy, u, { ...mood, dy: (mood.dy || 0) * .7, sq: (mood.sq || 0) + .02 * Math.sin(t * 2.1) });
    const k = ease(seg(lt, 1.3, 1.8)); if (k > 0) { plateArrow(560, GY + 380 + dOf(560, g, t), false, k * .9); plateArrow(1370, GY + 380 + dOf(1370, g, t), true, k * .9); }
    const eye = toScreen(cx, gy - 4 * u);
    camEnd();
    if (lt < .3) brushWipe(.5 + lt / .6, FIELD_WIPE);
    const close = seg(lt, dur - 1.0, dur - .05); if (close > 0) iris(...eye, lerp(1900, 0, easeIn(close)));
    captions(t);
  }
  shots([[SC[0], shotA], [SC[1], shotB], [SC[2], shotC], [SC[3], shotD], [SC[4], shotE], [SC[5], shotF], [SC[6], shotG], [SC[7], shotH]]);
})();
