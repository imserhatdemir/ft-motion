// examples/cat-crossing — a ginger cat tries to cross a busy street to reach a fish.
// A three.js world with cel shading and ink lines (engine/three.js), re-posed from t every frame.
// 120 BPM → one bar = 2 s, one step = 125 ms; 12 bars = 24 s. Every cut lands on a beat.
import { TAU, clamp, lerp, prog, E, spring, wobble, hash, noise1, shake, setFont, layout, rgba, vignette } from '../../engine/core.js';
import { THREE, createGL, toon, ink, Sweep } from '../../engine/three.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const COPY = {
  tr: { title: 'Karşıya Geçiş', sub: 'Önce yeşili bekle.', shop: 'BALIKÇI' },
  en: { title: 'The Crossing', sub: 'Wait for the green.', shop: 'FISH' },
};

// ───────────────────────────── world layout (units ≈ metres; the cat is cartoon-sized)
const LANE = 2.5, ROAD = 5.1, FRONT = 9, KERB = 0.2;      // lane centres z = ±2.5, kerbs at ±5.1, facades at ±9
const FISH = new THREE.Vector3(0, KERB, -7.9);
const SIGNAL = new THREE.Vector3(2.9, KERB, -5.7);
const INK = 0x2e1e17;
const PAL = {
  skyTop: 0x6fb9ea, skyLow: 0xfde6c4, road: 0x646b7d, paint: 0xfbf6ea, centre: 0xf5c84a, walk: 0xeadcc4, kerb: 0xcfc6b8,
  fur: 0xf39a46, stripe: 0xc9601f, cream: 0xfff0dc, pink: 0xf59fab, iris: 0x74c96a, glass: 0xbfe5f4,
};
const CAR_COLS = [0xe8544b, 0xf5c542, 0x3db3a6, 0x4b8fe0, 0xf08a3a, 0xee7fa6, 0x86c86a, 0x9d7ddb];
const HOUSE_COLS = [0xf4b389, 0xf6d88f, 0x9ed7c8, 0xf3a3a0, 0xc8b5e6, 0xa9cbf1, 0xf7c9a1, 0xb7dca0];

// ───────────────────────────── timing helpers
const EIO = E.inOutCubic, EO = E.outCubic, EI = E.inCubic, LIN = E.linear;
/** Keyframes [[time, value, easeIntoThisKey?], …] → value at t. */
function key(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, e = EIO] = ks[i];
    if (t < t1) { const [t0, v0] = ks[i - 1]; return lerp(v0, v1, e((t - t0) / (t1 - t0))); }
  }
  return ks[ks.length - 1][1];
}
const blink = (t, times, w = 0.16) => Math.max(0, ...times.map(b => 1 - Math.abs(t - b) / (w / 2)));
const smooth = x => x * x * (3 - 2 * x);

function timeline(at) {
  return {
    smell: at(0, 4), notice: at(1), closeup: at(1, 4),
    stand: at(2), step: at(2, 3), kerb: at(2, 8), lookL: at(2, 8), lookR: at(3), face: at(3, 4),
    whoosh: at(3, 8), back: at(3, 12),
    crouch: at(4), pounce: at(4, 4), land: at(4, 8), mid: at(4, 10),
    closeE: at(6), yellow: at(7), red: at(7, 4), cutG: at(7, 8), peek: at(7, 10), stopped: at(7, 12),
    strut: at(8), glance: at(8, 8), hop: at(9, 5), up: at(9, 8), fish: at(9, 14),
    bend: at(10), grab: at(10, 3), lift: at(10, 6), green: at(10, 8), turn: at(10, 10), go: at(10, 12), sit: at(10, 14),
    title: at(11), sub: at(11, 4), end: at(12),
  };
}

let gl, scene, camera, sun, T, copy, cat, cars, signal, ribbon, clouds = [];

export default {
  async setup(api) {
    copy = COPY[api.lang] ?? COPY.en;
    T = timeline(api.at);
    ZK = [[0, 6.8], [T.step, 6.8], [T.kerb, 5.4], [T.whoosh, 5.4], [T.whoosh + 0.45, 5.95, EO], [T.crouch, 5.95], [T.pounce, 5.55],
      [T.land, 0.35, LIN], [T.mid, 0, EO], [T.strut, 0], [T.up, -5.3, LIN], [T.fish, -7.25, EO]];
    HOPS = [[T.whoosh, T.whoosh + 0.45, 0.75], [T.pounce, T.land, 1.0], [T.hop, T.up, 0.4]];
    gl = createGL(api);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(PAL.skyLow, 45, 150);
    camera = new THREE.PerspectiveCamera(38, api.W / api.H, 0.05, 400);
    lights();
    world();
    cat = makeCat();
    scene.add(cat.root);
    cars = traffic().map((spec, i) => makeCar(spec, i));
    ribbon = makeRibbon();
  },
  draw(ctx, t, api) {
    poseCars(t);
    poseCat(t);
    poseSignal(t);
    poseRibbon(t);
    clouds.forEach((c, i) => { c.position.x = c.userData.x0 + t * (0.25 + 0.1 * i); });
    poseCamera(t, api);
    gl.render(ctx, scene, camera);
    titles(ctx, t, api);
  },
  post(ctx, t, { W, H }) { vignette(ctx, W, H, 0.2); },
};

// ───────────────────────────── materials & small builders
const texCache = new Map();
function canvasTex(name, w, h, paint, repeat) {
  if (texCache.has(name)) return texCache.get(name);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 8;
  if (repeat) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(...repeat); }
  texCache.set(name, tx);
  return tx;
}
/** Paint a texture pixel by pixel: fn(u, v) → [r, g, b] with v = 1 at the top (three.js UV convention). */
function pixelTex(name, w, h, fn) {
  return canvasTex(name, w, h, (g) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = fn((x + 0.5) / w, 1 - (y + 0.5) / h), k = (y * w + x) * 4;
      img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
const rgb = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

const SPHERE = new THREE.SphereGeometry(1, 28, 18);
function blob(mat, [sx, sy, sz], [x, y, z] = [0, 0, 0], inkW = 0.012, geo = SPHERE) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  if (inkW) ink(m, inkW, INK);
  return m;
}
function rbox(w, h, d, r, mat, inkW = 0.03) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat);
  m.castShadow = true; m.receiveShadow = true;
  if (inkW) ink(m, inkW, INK);
  return m;
}

// ───────────────────────────── lights, sky, street
function lights() {
  scene.add(new THREE.HemisphereLight(0xd6ecff, 0xf2d4ae, 1.35));
  sun = new THREE.DirectionalLight(0xfff0d6, 2.6);
  sun.position.set(-14, 22, 12);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 20, bottom: -20, near: 1, far: 80 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
  scene.add(sun, sun.target);
}

function world() {
  // sky dome: warm horizon → blue zenith
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(PAL.skyTop) }, low: { value: new THREE.Color(PAL.skyLow) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top, low; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y * 2.2, 0., 1.); gl_FragColor = vec4(mix(low, top, pow(h, .7)), 1.);\n#include <colorspace_fragment>\n}',
  }));
  scene.add(sky);

  // clouds: toon puffs far behind the skyline, drifting in draw()
  const cloudMat = toon(0xffffff, { rim: 0.25 });
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const r = 2.2 + hash(i * 9 + k) * 2.2;
      g.add(blob(cloudMat, [r * 1.25, r * 0.85, r], [(k - 2) * 2.6, (k % 2) * 0.9 + hash(i + k) * 0.8, hash(k * 3 + i) * 2], 0));
    }
    g.userData.x0 = -70 + i * 26 + hash(i * 4.1) * 10;
    g.position.set(g.userData.x0, 20 + hash(i * 2.7) * 9, -85 - hash(i * 5.3) * 30);
    clouds.push(g); scene.add(g);
  }

  // road + markings
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, ROAD * 2), toon(PAL.road));
  road.rotation.x = -Math.PI / 2; road.receiveShadow = true;
  scene.add(road);
  const paint = toon(PAL.paint), yellow = toon(PAL.centre);
  const mark = (w, d, x, z, mat) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.receiveShadow = true; scene.add(m);
  };
  for (let x = -100; x < 100; x += 3.2) if (Math.abs(x + 0.8) > 3.2) mark(1.6, 0.16, x + 0.8, 0, yellow); // centre dashes
  for (const s of [-1, 1]) mark(200, 0.14, 0, s * (ROAD - 0.35), paint);                                     // edge lines
  for (let z = -4.5; z <= 4.51; z += 0.9) mark(3.0, 0.5, 0, z, paint);                                        // zebra
  mark(0.35, ROAD - 0.4, -2.35, (ROAD - 0.4) / 2 + 0.05, paint);                                             // stop lines
  mark(0.35, ROAD - 0.4, 2.35, -(ROAD - 0.4) / 2 - 0.05, paint);

  // sidewalks: tiled top, kerb-coloured sides
  const tiles = canvasTex('tiles', 256, 256, (g, w, h) => {
    g.fillStyle = '#eadcc4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d4c3a8'; g.lineWidth = 6;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * w / 2, 0); g.lineTo(i * w / 2, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 2); g.lineTo(w, i * h / 2); g.stroke(); }
  }, [100, 3]);
  const depth = FRONT - ROAD + 4;
  for (const s of [-1, 1]) {
    const kerbMat = toon(PAL.kerb);
    const walk = new THREE.Mesh(new THREE.BoxGeometry(200, KERB, depth), [kerbMat, kerbMat, toon(0xffffff, { map: tiles }), kerbMat, kerbMat, kerbMat]);
    walk.position.set(0, KERB / 2, s * (ROAD + depth / 2));
    walk.receiveShadow = true;
    scene.add(walk);
  }

  buildings(-1); buildings(1);
  skyline();
  for (const x of [-27, -13, 13, 27]) for (const s of [-1, 1]) tree(x + s * 2, s * 7.4);
  for (const x of [-9, 9]) for (const s of [-1, 1]) lamp(x, s * 5.7);
  hydrant(-3.4, 6.3);
  fishShop();
  signal = trafficLight();
}

function buildings(side) {
  const winFrames = [], winGlass = [];
  let x = -64;
  let i = side > 0 ? 100 : 0;
  while (x < 64) {
    const shop = side < 0 && x < 3.5 && x + 9 > -3.5;
    const w = shop ? 7 : 5.5 + hash(i * 3.3) * 3.5;
    const x0 = shop ? -3.5 : x;
    if (shop && x < x0) { x = x0; }
    const h = shop ? 6.6 : 5 + Math.floor(hash(i * 7.7) * 4) * 1.6;
    const col = shop ? 0x9fd7cf : HOUSE_COLS[Math.floor(hash(i * 5.1) * HOUSE_COLS.length)];
    const b = rbox(w - 0.1, h, 7, 0.12, toon(col, { rim: 0.12 }), 0.045);
    b.position.set(x0 + w / 2, h / 2, side * (FRONT + 3.5));
    scene.add(b);
    const cor = rbox(w + 0.2, 0.35, 7.4, 0.08, toon(new THREE.Color(col).multiplyScalar(0.82)), 0.035);
    cor.position.set(x0 + w / 2, h + 0.1, side * (FRONT + 3.5));
    scene.add(cor);
    // upper-floor windows
    const cols = Math.max(2, Math.floor((w - 1) / 1.7));
    for (let f = 1; 2.2 + f * 1.6 < h - 0.4; f++) for (let c = 0; c < cols; c++) {
      const wx = x0 + (c + 0.5) * (w / cols), wy = 1.2 + f * 1.6;
      winFrames.push([wx, wy, side * (FRONT - 0.04)]);
      winGlass.push([wx, wy, side * (FRONT - 0.08)]);
    }
    if (!shop) {
      // ground floor: a door and a shop window, sometimes a striped awning
      const door = rbox(1.0, 2.0, 0.2, 0.08, toon(new THREE.Color(col).multiplyScalar(0.55)), 0.025);
      door.position.set(x0 + w * 0.25, KERB + 1.0, side * (FRONT - 0.05));
      scene.add(door);
      const shopWin = rbox(w * 0.45, 1.5, 0.16, 0.08, toon(0x8fc4e6, { rim: 0.3 }), 0.025);
      shopWin.position.set(x0 + w * 0.66, KERB + 1.35, side * (FRONT - 0.04));
      scene.add(shopWin);
      if (hash(i * 2.9) > 0.45) awning(x0 + w * 0.62, side, w * 0.6, CAR_COLS[Math.floor(hash(i * 8.1) * CAR_COLS.length)]);
    }
    x = x0 + w;
    i++;
  }
  const inst = (list, geo, mat) => {
    const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
    list.forEach((p, k) => { o.position.set(...p); o.updateMatrix(); m.setMatrixAt(k, o.matrix); });
    m.receiveShadow = true; scene.add(m);
  };
  inst(winFrames, new RoundedBoxGeometry(1.05, 1.25, 0.12, 2, 0.05), toon(0xfdf7ec));
  inst(winGlass, new RoundedBoxGeometry(0.8, 1.0, 0.12, 2, 0.04), toon(0x6d9fcf, { rim: 0.35 }));
}

function awning(cx, side, w, col) {
  const tex = canvasTex(`awning${col}`, 256, 64, (g, W, H) => {
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#fdf7ec' : '#' + col.toString(16).padStart(6, '0'); g.fillRect(k * W / 8, 0, W / 8, H); }
  });
  const a = rbox(w, 0.08, 1.3, 0.03, toon(0xffffff, { map: tex }), 0.02);
  a.rotation.x = side * 0.32;
  a.position.set(cx, KERB + 2.75, side * (FRONT - 0.62));
  scene.add(a);
}

function skyline() {
  for (let k = 0; k < 16; k++) {
    const w = 7 + hash(k * 1.7) * 7, h = 12 + hash(k * 3.1) * 16;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), toon(mixHex(0xbfd6ee, HOUSE_COLS[k % 8], 0.25)));
    b.position.set(-90 + k * 12 + hash(k) * 4, h / 2, -32 - hash(k * 2.3) * 10);
    scene.add(b);
  }
}
const mixHex = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);

function tree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 2.6, 12), toon(0x9a6a45));
  trunk.position.y = 1.3; trunk.castShadow = true; ink(trunk, 0.03, INK);
  g.add(trunk);
  const leaf = toon(0x6fbf57, { rim: 0.3, rimColor: 0xf6ffd0 });
  [[1.25, 0, 3.2, 0], [0.95, 0.75, 2.85, 0.3], [0.95, -0.7, 2.95, -0.3], [0.85, 0.1, 3.95, 0.2]].forEach(([r, dx, y, dz]) => g.add(blob(leaf, [r, r * 0.92, r], [dx, y, dz], 0.05)));
  g.position.set(x, KERB, z);
  scene.add(g);
}
function lamp(x, z) {
  const g = new THREE.Group(), m = toon(0x335e55);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 4.2, 10), m);
  pole.position.y = 2.1; pole.castShadow = true; ink(pole, 0.025, INK);
  g.add(pole, blob(toon(0xfff3c9, { emissive: 0x8a7a50 }), [0.26, 0.3, 0.26], [0, 4.35, 0], 0.03));
  g.position.set(x, KERB, z);
  scene.add(g);
}
function hydrant(x, z) {
  const g = new THREE.Group(), red = toon(0xe0473f, { rim: 0.3 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.6, 16), red);
  body.position.y = 0.3; body.castShadow = true; ink(body, 0.02, INK);
  g.add(body, blob(red, [0.18, 0.14, 0.18], [0, 0.62, 0], 0.02), blob(red, [0.08, 0.08, 0.1], [0.17, 0.38, 0], 0.015), blob(red, [0.08, 0.08, 0.1], [-0.17, 0.38, 0], 0.015));
  g.position.set(x, KERB, z);
  scene.add(g);
}

function makeFish(scale = 1) {
  const g = new THREE.Group();
  const scaleMat = toon(0x8fb7dc, { rim: 0.6, rimColor: 0xffffff });
  g.add(blob(scaleMat, [0.27, 0.11, 0.065], [0, 0, 0], 0.012));
  g.add(blob(toon(0xe9f2fa), [0.2, 0.05, 0.058], [0.02, -0.045, 0], 0));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 4), scaleMat);
  tail.rotation.z = Math.PI / 2; tail.scale.set(1, 1, 0.35); tail.position.x = -0.32; ink(tail, 0.012, INK);
  g.add(tail);
  g.add(blob(new THREE.MeshBasicMaterial({ color: 0xffffff }), [0.03, 0.03, 0.02], [0.17, 0.02, 0.05], 0.006));
  g.add(blob(new THREE.MeshBasicMaterial({ color: 0x1b1b22 }), [0.016, 0.016, 0.012], [0.176, 0.022, 0.064], 0));
  g.scale.setScalar(scale);
  return g;
}

function fishShop() {
  const sign = canvasTex('sign', 1024, 256, (g, w, h) => {
    g.fillStyle = '#20486b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fdf7ec'; g.lineWidth = 14; g.strokeRect(18, 18, w - 36, h - 36);
    g.fillStyle = '#fdf7ec'; g.font = '600 150px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(copy.shop, w / 2, h / 2 + 8);
  });
  const board = rbox(5.2, 1.3, 0.25, 0.1, [toon(0x20486b), toon(0x20486b), toon(0x20486b), toon(0x20486b), toon(0xffffff, { map: sign }), toon(0x20486b)], 0.04);
  board.position.set(0, 4.2, -FRONT + 0.1);
  scene.add(board);
  awning(0, -1, 6.2, 0x3b7fc4);
  const door = rbox(1.3, 2.2, 0.2, 0.1, toon(0x2f6f8f), 0.03);
  door.position.set(-1.9, KERB + 1.1, -FRONT + 0.05);
  const win = rbox(3.0, 1.7, 0.16, 0.1, toon(0x8fc4e6, { rim: 0.3 }), 0.03);
  win.position.set(1.1, KERB + 1.45, -FRONT + 0.04);
  scene.add(door, win);
  // an ice crate of fish by the door, and one fish on a plate: the prize
  const crate = rbox(1.4, 0.5, 0.8, 0.06, toon(0xb98552), 0.03);
  crate.position.set(2.4, KERB + 0.25, -8.35);
  const ice = rbox(1.25, 0.1, 0.65, 0.04, toon(0xeef7fb), 0);
  ice.position.set(2.4, KERB + 0.52, -8.35);
  scene.add(crate, ice);
  [-0.35, 0.05, 0.4].forEach((dx, k) => { const f = makeFish(0.8); f.position.set(2.4 + dx, KERB + 0.62, -8.35 + (k - 1) * 0.12); f.rotation.set(0, 0.5 + k, Math.PI / 2 * 0 + 0.2); scene.add(f); });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.06, 32), toon(0xf6fbff, { rim: 0.2 }));
  plate.position.copy(FISH).add(new THREE.Vector3(0, 0.03, 0));
  plate.castShadow = plate.receiveShadow = true; ink(plate, 0.015, INK);
  scene.add(plate);
}

function trafficLight() {
  const g = new THREE.Group(), dark = toon(0x2e3d39);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.1, 12), toon(0x335e55));
  pole.position.y = 1.55; pole.castShadow = true; ink(pole, 0.025, INK);
  const head = rbox(0.55, 1.45, 0.45, 0.14, dark, 0.03);
  head.position.y = 3.55;
  g.add(pole, head);
  const lamps = [[0xff4b3e, 0.45], [0xffcf3a, 0], [0x46de78, -0.45]].map(([c, dy]) => {
    const on = new THREE.Color(c), off = new THREE.Color(c).multiplyScalar(0.22);
    const m = new THREE.MeshBasicMaterial({ color: off });
    const lampMesh = blob(m, [0.15, 0.15, 0.08], [0, 3.55 + dy, 0.22], 0.012);
    const halo = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(0.34); halo.position.set(0, 3.55 + dy, 0.3);
    g.add(lampMesh, halo);
    return { m, on, off, halo };
  });
  g.position.copy(SIGNAL);
  g.rotation.y = -0.5;
  scene.add(g);
  return { lamps };
}
function poseSignal(t) {
  // 0 = red, 1 = yellow, 2 = green
  const state = t < T.yellow ? 2 : t < T.red ? 1 : t < T.green ? 0 : 2;
  signal.lamps.forEach((l, i) => {
    const on = i === state;
    const since = on ? t - (i === 0 ? T.red : i === 1 ? T.yellow : t < T.yellow ? -1 : T.green) : 0;
    const k = on ? clamp(since / 0.06) : 0;
    l.m.color.copy(l.off).lerp(l.on, k);
    l.halo.material.opacity = 0.35 * k * (1 + 0.6 * wobble(since, 30, 9));
  });
}

// ───────────────────────────── traffic
function traffic() {
  const near = [[0.9, 12], [2.9, 13], [4.4, 12], [5.7, 14], [T.whoosh, 26, 'bubble'], [9.75, 14], [10.625, 15], [11.625, 13], [12.5, 15], [13.5, 14]];
  const far = [[0.3, 12], [1.9, 14], [3.6, 12], [5.1, 13], [6.3, 14], [8.3, 13], [9.375, 15], [10.125, 14], [11.0, 16], [12.0, 14], [13.0, 15]];
  const list = [];
  near.forEach(([tp, v, kind]) => list.push({ lane: 1, tp, v, kind }));
  far.forEach(([tp, v, kind]) => list.push({ lane: -1, tp, v, kind }));
  // the cars that stop for the red light, and the ones queueing behind them
  for (const lane of [1, -1]) {
    list.push({ lane, v: 12, stop: { xs: -lane * 4.75, t: T.stopped, Tb: 1.0, go: T.go, acc: 5 }, kind: lane > 0 ? 'sedan' : 'van' });
    list.push({ lane, v: 12, stop: { xs: -lane * 10.3, t: T.stopped + 0.4, Tb: 1.2, go: T.go + 0.45, acc: 5 } });
  }
  return list;
}
function carX(c, t) {
  if (!c.stop) return c.lane * c.v * (t - c.tp);
  const { xs, t: ts, Tb, go, acc } = c.stop, d = c.lane, v = c.v, tb = ts - Tb;
  if (t < tb) return xs - d * (v * Tb / 2 + v * (tb - t));
  if (t < ts) { const u = t - tb; return xs - d * (v * Tb / 2 - (v * u - v * u * u / (2 * Tb))); }
  if (t < go) return xs;
  return xs + d * 0.5 * acc * (t - go) ** 2;
}
function makeCar(spec, i) {
  const kind = spec.kind ?? ['sedan', 'bubble', 'sedan', 'van'][Math.floor(hash(i * 7.3) * 4)];
  const D = {
    sedan: { len: 4.1, bh: 0.72, cl: 2.2, ch: 0.72, w: 1.9, cx: -0.15 },
    bubble: { len: 3.3, bh: 0.78, cl: 2.0, ch: 0.86, w: 1.8, cx: -0.05 },
    van: { len: 4.6, bh: 1.15, cl: 3.3, ch: 0.72, w: 2.0, cx: -0.4 },
  }[kind];
  const col = CAR_COLS[(i * 3) % CAR_COLS.length], R = 0.38;
  const paint = toon(col, { rim: 0.35 });
  const root = new THREE.Group(), shell = new THREE.Group();
  root.add(shell);
  shell.position.y = R;
  const lower = rbox(D.len, D.bh, D.w, 0.3, paint, 0.035);
  lower.position.y = D.bh / 2 + 0.05;
  // painted cabin with two crossing glass bands: side windows and wind/rear screens, pillars stay painted
  const cabin = rbox(D.cl, D.ch, D.w * 0.84, 0.3, paint, 0.03);
  cabin.position.set(D.cx, D.bh + D.ch / 2 - 0.02, 0);
  const glassMat = toon(PAL.glass, { rim: 0.5, rimColor: 0xffffff });
  const side = rbox(D.cl * 0.78, D.ch * 0.6, D.w * 0.84 + 0.05, 0.12, glassMat, 0.015);
  const screen = rbox(D.cl + 0.05, D.ch * 0.6, D.w * 0.84 * 0.8, 0.12, glassMat, 0.015);
  side.position.set(D.cx, D.bh + D.ch * 0.52, 0);
  screen.position.copy(side.position);
  shell.add(lower, cabin, side, screen);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff6d2 }), tailMat = new THREE.MeshBasicMaterial({ color: 0xd8342c });
  for (const s of [-1, 1]) {
    shell.add(blob(lightMat, [0.09, 0.15, 0.15], [D.len / 2 - 0.04, D.bh * 0.62 + 0.05, s * D.w * 0.3], 0.02));
    shell.add(blob(tailMat, [0.06, 0.1, 0.14], [-D.len / 2 + 0.03, D.bh * 0.66 + 0.05, s * D.w * 0.32], 0.015));
  }
  const bumper = toon(0xd9dde3);
  for (const s of [-1, 1]) { const b = rbox(0.24, 0.24, D.w * 0.96, 0.1, bumper, 0.025); b.position.set(s * (D.len / 2 + 0.02), 0.2, 0); shell.add(b); }
  const wheels = [];
  const tyre = toon(0x2b2b33), hub = toon(0xe6e8ec);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wg = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.34, 24), tyre);
    w.rotation.x = Math.PI / 2; w.castShadow = true; ink(w, 0.03, INK);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.36, 5), hub);
    h.rotation.x = Math.PI / 2;
    wg.add(w, h);
    wg.position.set(sx * D.len * 0.31, R, sz * D.w * 0.45);
    root.add(wg); wheels.push(wg);
  }
  root.rotation.y = spec.lane > 0 ? 0 : Math.PI;
  root.position.z = spec.lane * LANE;
  scene.add(root);
  return { spec, root, shell, wheels, seed: i, D };
}
function poseCars(t) {
  const h = 1 / 240;
  for (const c of cars) {
    const x = carX(c.spec, t);
    c.root.visible = Math.abs(x) < 75;
    if (!c.root.visible) continue;
    c.root.position.x = x;
    const d = c.spec.lane * x;                                           // distance along the car's own heading
    const v = c.spec.lane * (carX(c.spec, t + h) - carX(c.spec, t - h)) / (2 * h);
    const a = c.spec.lane * (carX(c.spec, t + h) - 2 * x + carX(c.spec, t - h)) / (h * h);
    for (const w of c.wheels) w.rotation.z = -d / 0.38;
    const sp = clamp(v / 26);
    let pitch = clamp(a * 0.012, -0.1, 0.1);                            // braking dips the nose, pulling away lifts it
    if (c.spec.stop) pitch += -0.07 * wobble(t - c.spec.stop.t, 13, 4.5);
    c.shell.rotation.z = pitch;
    c.shell.scale.set(1 + 0.12 * sp * sp, 1 - 0.05 * sp, 1);            // cartoon stretch at speed
    c.shell.position.y = 0.38 + 0.025 * Math.sin(d * 1.9 + c.seed) * clamp(v / 6);
  }
}

// ───────────────────────────── the cat
function makeCat() {
  const base = rgb(PAL.fur), dark = rgb(PAL.stripe), cream = rgb(PAL.cream);
  // torso sphere is rotated so its poles run nose→tail: v bands wrap the body, u = 0.75 is the spine
  const torsoTex = pixelTex('torso', 256, 256, (u, v) => {
    const back = -Math.sin(TAU * u);
    if (back < -0.35) return mixc(base, cream, smooth(clamp((-back - 0.35) / 0.3)));
    const band = ((v * 8 + 0.12 * Math.sin(u * 40)) % 1 + 1) % 1;
    const on = v > 0.12 && v < 0.93 && band < 0.32 * smooth(clamp((back + 0.1) / 0.6));
    return on ? dark : base;
  });
  const headTex = pixelTex('head', 256, 256, (u, v) => {
    const dz = Math.abs(u - 0.25);
    for (const c of [-0.035, 0, 0.035]) if (Math.abs(u - 0.25 - c) < 0.009 * (1 - Math.abs(c) * 8) && v > 0.66 && v < 0.84 - Math.abs(c) * 2) return dark; // the tabby "M"
    for (const c of [0.07, 0.43]) if (Math.abs(u - c) < 0.05 && Math.abs(v - 0.55 - Math.abs(u - c) * 0.6) < 0.018) return dark; // cheek stripes
    return dz < 0.12 && v < 0.42 ? mixc(base, cream, 0.6) : base;
  });
  const tailTex = pixelTex('tail', 256, 32, (u) => ((u * 6.5) % 1 < 0.34 && u > 0.1) || u > 0.9 ? dark : base);

  const fur = toon(0xffffff, { map: torsoTex, rim: 0.4 }), furHead = toon(0xffffff, { map: headTex, rim: 0.4 });
  const furPlain = toon(PAL.fur, { rim: 0.4 }), creamM = toon(PAL.cream, { rim: 0.3 }), pinkM = toon(PAL.pink);
  const white = toon(0xffffff, { ramp: undefined }), irisM = toon(PAL.iris), black = new THREE.MeshBasicMaterial({ color: 0x15100d });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff }), mouthM = toon(0x7a2b2b);

  const root = new THREE.Group(), squash = new THREE.Group(), rig = new THREE.Group(), hip = new THREE.Group();
  root.add(squash); squash.add(rig); rig.add(hip);
  hip.position.set(0, 0.44, -0.2);

  const torsoGeo = SPHERE.clone().rotateX(Math.PI / 2);
  const torso = blob(fur, [0.27, 0.25, 0.42], [0, 0.06, 0.2], 0.012, torsoGeo);
  const chest = blob(creamM, [0.19, 0.2, 0.15], [0, 0.0, 0.5], 0.012);
  hip.add(torso, chest);

  // head
  const head = new THREE.Group();
  head.position.set(0, 0.36, 0.64);
  hip.add(head);
  const skull = blob(furHead, [0.32, 0.28, 0.285], [0, 0, 0], 0.012);
  head.add(skull);
  for (const s of [-1, 1]) head.add(blob(creamM, [0.12, 0.095, 0.105], [s * 0.085, -0.1, 0.2], 0.01));
  head.add(blob(creamM, [0.07, 0.05, 0.06], [0, -0.165, 0.2], 0.008));
  head.add(blob(pinkM, [0.045, 0.032, 0.03], [0, -0.035, 0.3], 0.008));
  for (const s of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0065, 6, 16, Math.PI), black);
    arc.rotation.z = Math.PI; arc.position.set(s * 0.03, -0.085, 0.305);
    head.add(arc);
  }
  const mouth = blob(mouthM, [0.05, 0.05, 0.03], [0, -0.12, 0.285], 0.008);
  head.add(mouth);
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0x5b3c2c });
  for (const s of [-1, 1]) for (const a of [-0.18, 0.02, 0.2]) {
    const wsk = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.003, 0.3, 5), whiskerMat);
    wsk.rotation.set(0, -s * 0.35, Math.PI / 2 + s * a);
    wsk.position.set(s * 0.29, -0.09 + a * 0.12, 0.22);
    head.add(wsk);
  }
  const ears = [-1, 1].map(s => {
    const e = new THREE.Group();
    e.position.set(s * 0.165, 0.19, -0.02);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 20), furPlain);
    outer.position.y = 0.1; outer.castShadow = true; ink(outer, 0.012, INK);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 20), pinkM);
    inner.position.set(0, 0.075, 0.045); inner.scale.z = 0.6;
    e.add(outer, inner);
    head.add(e);
    return { g: e, s };
  });
  const eyes = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * 0.118, 0.035, 0.228);
    g.rotation.y = s * 0.3;
    const whiteBall = blob(white, [0.1, 0.125, 0.075], [0, 0, 0], 0.01);
    const look = new THREE.Group();
    const iris = blob(irisM, [0.068, 0.085, 0.024], [0, 0, 0.058], 0);
    const pupil = blob(black, [0.037, 0.058, 0.014], [0, 0, 0.072], 0);
    look.add(iris, pupil);
    const hi1 = blob(shine, [0.021, 0.021, 0.01], [-0.026, 0.036, 0.084], 0), hi2 = blob(shine, [0.01, 0.01, 0.006], [0.02, -0.03, 0.083], 0);
    const upper = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), furPlain);
    upper.scale.set(0.108, 0.133, 0.083);
    const lower = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, Math.PI / 2, Math.PI / 2), furPlain);
    lower.scale.set(0.107, 0.132, 0.082);
    g.add(whiteBall, look, hi1, hi2, upper, lower);
    head.add(g);
    return { g, look, pupil, upper, lower, hi: [hi1, hi2] };
  });
  const heldFish = makeFish(0.85);
  heldFish.position.set(0, -0.14, 0.33);
  heldFish.rotation.set(0, 0, -0.12);
  head.add(heldFish);

  // legs: a pivot at the shoulder/hip, capsule + paw hanging down 0.44
  const leg = (parent, x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.3, 6, 14), furPlain);
    l.position.y = -0.21; l.castShadow = true; ink(l, 0.012, INK);
    g.add(l, blob(creamM, [0.085, 0.055, 0.11], [0, -0.4, 0.035], 0.01));
    parent.add(g);
    return g;
  };
  const front = [-1, 1].map(s => leg(hip, s * 0.13, -0.02, 0.44));
  const back = [-1, 1].map(s => leg(rig, s * 0.14, 0.42, -0.26));
  const thighs = [-1, 1].map(s => { const th = blob(furPlain, [0.11, 0.16, 0.17], [s * 0.17, 0.4, -0.25], 0.012); rig.add(th); return th; });

  const tailGeo = new Sweep(26, 12);
  const tail = new THREE.Mesh(tailGeo, toon(0xffffff, { map: tailTex, rim: 0.4 }));
  tail.castShadow = true; tail.frustumCulled = false;
  ink(tail, 0.012, INK);
  tail.children[0].frustumCulled = false;
  rig.add(tail);

  root.traverse(o => { if (o.isMesh && o.name !== 'ink' && o.material !== black && o.material !== shine) o.castShadow = true; });
  return { root, squash, rig, hip, head, torso, chest, ears, eyes, mouth, heldFish, front, back, thighs, tail, tailGeo, nose: new THREE.Vector3() };
}

// the cat's walk along the zebra (z only; x stays 0) and its hops [t0, t1, height] on top of the ground
let ZK, HOPS;
const zAt = t => key(t, ZK);
const ground = z => (Math.abs(z) > ROAD ? KERB : 0);
function catPath(t) {
  const z = zAt(t);
  let y = ground(z);
  for (const [a, b, h] of HOPS) if (t > a && t < b) { const p = (t - a) / (b - a); y = lerp(ground(zAt(a)), ground(zAt(b)), p) + h * 4 * p * (1 - p); }
  return { z, y };
}
function airborne(t) {
  for (const [a, b] of HOPS) if (t > a && t < b) return Math.sin(Math.PI * (t - a) / (b - a));
  return 0;
}
/** Cumulative distance walked (drives the gait) — pure in t. */
function walked(t) {
  let d = 0;
  for (let k = 0; k < 120; k++) { const a = (t * k) / 120, b = (t * (k + 1)) / 120; d += Math.abs(zAt(b) - zAt(a)); }
  return d;
}

function poseCat(t) {
  const { root, squash, rig, hip, head, ears, eyes, mouth, heldFish, front, back, thighs } = cat;
  const { z, y } = catPath(t);
  const air = airborne(t);
  const speed = Math.abs(zAt(t + 0.03) - zAt(t - 0.03)) / 0.06;
  const walkAmt = clamp(speed / 1.2) * (1 - air);
  const phase = (walked(t) / 0.9) * TAU;

  // cars close to the cat: head tracking, wind and flinches while it's stranded in the middle
  let gust = 0, yawSum = 0, wSum = 0;
  const stranded = prog(t, T.land, T.land + 0.25) * (1 - prog(t, T.stopped, T.stopped + 0.5));
  for (const c of cars) {
    if (!c.root.visible) continue;
    const dx = c.root.position.x, dz = c.spec.lane * LANE - z;
    gust += Math.exp(-((dx / 2.6) ** 2)) * Math.exp(-((dz / 3.2) ** 2)) * clamp(Math.abs(c.spec.v) / 10);
    if (dz * -1 > 0) { const w = Math.exp(-((dx / 7) ** 2)); yawSum += w * clamp(Math.atan2(dx, -dz), -1.2, 1.2); wSum += w; }
  }
  gust *= stranded;
  const track = wSum > 0 ? yawSum / (wSum + 0.25) : 0;

  const sit = key(t, [[0, 1], [T.stand, 1], [T.step, 0], [T.turn, 0], [T.sit, 1]]);
  const crouch = clamp(key(t, [[0, 0], [T.crouch, 0], [T.crouch + 0.3, 0.75, EO], [T.pounce - 0.05, 0.85], [T.pounce + 0.08, 0, EO], [T.land, 0], [T.land + 0.12, 0.55, EO],
    [T.mid + 0.4, 0.3], [T.closeE, 0.5], [T.yellow, 0.8], [T.peek, 0.8], [T.stopped + 0.2, 0.05], [T.bend, 0], [T.grab, 0.2], [T.lift, 0]]) + 0.25 * gust);
  const puff = key(t, [[0, 0], [T.whoosh, 0], [T.whoosh + 0.05, 1, EO], [T.back + 0.2, 0.55], [T.crouch, 0.1], [T.land, 0.2], [T.mid + 0.2, 0.45], [T.stopped, 0.45], [T.strut, 0]]) + 0.4 * gust;
  const heading = key(t, [[0, Math.PI], [T.lift, Math.PI], [T.turn + 0.15, Math.PI * 1.5, EIO]]);

  root.position.set(0, y, z);
  root.rotation.y = heading;

  // squash & stretch: landings wobble, hops stretch along the arc
  const land = [T.whoosh + 0.45, T.land, T.up].reduce((s, tl) => s + 0.22 * wobble(t - tl, 16, 7), 0);
  const stretch = 0.16 * air;
  const sq = land - stretch;
  squash.scale.set(1 + sq * 0.5 + puff * 0.1, 1 - sq + puff * 0.12, 1 + sq * 0.3 + stretch * 0.6);

  // body: crouch lowers it, sitting drops the rear and tips the front up, shivers when scared
  const shiver = (stranded * 0.6 + gust) * (t < T.stopped ? 1 : 0);
  const wiggle = Math.sin((t - T.crouch) * TAU * 5) * prog(t, T.crouch + 0.1, T.crouch + 0.2) * (1 - prog(t, T.pounce - 0.12, T.pounce - 0.02));
  rig.position.set(0.012 * Math.sin(t * 90) * shiver + 0.04 * wiggle, -0.2 * sit - 0.17 * crouch + 0.025 * Math.abs(Math.cos(phase)) * walkAmt, 0);
  rig.rotation.set(0, 0.12 * wiggle, 0.18 * wiggle - 0.12 * gust * Math.sign(Math.sin(t * 2)));
  const lean = key(t, [[T.pounce - 0.05, 0], [T.pounce + 0.1, -0.35, EO], [T.land - 0.15, 0.3], [T.land + 0.1, 0]]);
  const bendDown = key(t, [[T.fish, 0], [T.bend + 0.25, 0.32], [T.grab + 0.05, 0.35], [T.lift + 0.1, 0]]);
  const sitPitch = -0.6 * sit;
  hip.rotation.x = sitPitch + lean + bendDown - 0.05 * crouch;

  // legs: shoulders stay planted, gait swings diagonal pairs, airborne legs reach
  const shoulderY = 0.44 + (-0.02 * Math.cos(hip.rotation.x) - 0.44 * Math.sin(hip.rotation.x));
  const rigY = rig.position.y;
  const frontLen = clamp((shoulderY + rigY) / 0.44, 0.45, 1.3);
  front.forEach((g, k) => {
    const sw = Math.sin(phase + (k ? Math.PI : 0)) * 0.55 * walkAmt;
    const paw = k === 1 ? key(t, [[T.face, 0], [T.face + 0.2, -0.9, EO], [T.whoosh, -0.9], [T.whoosh + 0.08, 0, EO]]) : 0;
    g.rotation.x = -hip.rotation.x + sw - 0.9 * air + paw;
    g.scale.y = frontLen * (1 - 0.3 * Math.max(0, -paw));
  });
  back.forEach((g, k) => {
    const sw = Math.sin(phase + (k ? 0 : Math.PI)) * 0.55 * walkAmt;
    g.rotation.x = sw + 0.8 * air - 1.35 * sit;
    g.scale.y = clamp((0.42 + rigY) / 0.42, 0.4, 1.2) * (1 - 0.35 * sit);
    g.position.y = 0.42;
  });
  thighs.forEach(th => { th.scale.set(0.11 + 0.02 * sit, 0.16, 0.17 + 0.05 * sit); th.position.y = 0.4 - 0.1 * sit; th.position.z = -0.25 + 0.06 * sit; });

  // head: looks, sniffs, tracks cars, glances at the stopped car, bends for the fish
  const look = key(t, [[0, 0], [T.lookL, 0], [T.lookL + 0.3, 0.95, EO], [T.lookR - 0.1, 0.95], [T.lookR + 0.3, -0.95], [T.face - 0.05, -0.95], [T.face + 0.2, 0],
    [T.glance, 0], [T.glance + 0.25, -0.75], [T.glance + 1.0, -0.75], [T.glance + 1.3, 0], [T.turn, 0]]);
  head.rotation.y = look + track * stranded * 0.9 + 0.03 * noise1(t * 1.3);
  head.rotation.x = -hip.rotation.x * 0.85
    + key(t, [[0, 0.05], [T.notice, 0.05], [T.notice + 0.2, -0.3, EO], [T.stand, -0.1], [T.step, 0], [T.glance + 0.3, 0], [T.glance + 0.5, 0.25], [T.glance + 0.7, -0.05], [T.glance + 1.0, 0]])
    + 0.25 * bendDown + 0.3 * crouch * (1 - stranded * 0.5);
  head.rotation.z = key(t, [[T.closeup, 0], [T.closeup + 0.3, 0.22], [T.stand - 0.2, 0.22], [T.stand, 0]]) + 0.08 * gust;

  // ears: perk when interested, flatten when scared or in the wind
  const flat = clamp(key(t, [[0, 0], [T.notice, 0], [T.notice + 0.15, -0.35, EO], [T.stand, -0.1], [T.whoosh, -0.1], [T.whoosh + 0.05, 1, EO], [T.back + 0.3, 0.5], [T.crouch, 0.2],
    [T.land, 0.6], [T.mid, 0.7], [T.peek, 0.7], [T.peek + 0.25, -0.2, EO], [T.strut, -0.15], [T.sit, -0.1]]) + 0.6 * gust, -0.4, 1.2);
  ears.forEach(({ g, s }) => {
    g.rotation.set(-1.0 * Math.max(0, flat) + 0.35 * Math.min(0, flat) * -1, 0, -s * (0.32 + 0.7 * Math.max(0, flat)) + s * 0.05 * Math.sin(t * 6) * gust);
  });

  // eyes
  const eyeS = key(t, [[0, 1], [T.notice, 1], [T.notice + 0.15, 1.18, EO], [T.stand, 1.05], [T.whoosh, 1.05], [T.whoosh + 0.06, 1.38, EO], [T.back + 0.35, 1.1], [T.crouch, 1], [T.land, 1.15], [T.peek + 0.3, 1.05], [T.strut, 1]]);
  const pupil = key(t, [[0, 1.05], [T.notice, 1.05], [T.notice + 0.2, 1.5, EO], [T.stand, 1.15], [T.whoosh, 1.15], [T.whoosh + 0.05, 0.42, EO], [T.back + 0.4, 0.75], [T.crouch, 0.9],
    [T.land, 0.6], [T.stopped, 0.65], [T.peek + 0.3, 1.1], [T.strut, 1.05], [T.lift, 0.95]]);
  const lid = clamp(blink(t, [1.25, 4.1, 5.8, 11.6, 16.9, 19.55]) + key(t, [[T.back, 0], [T.back + 0.2, 0.42], [T.pounce, 0.42], [T.pounce + 0.08, 0], [T.lift, 0], [T.lift + 0.2, 0.35]]));
  const happy = key(t, [[T.lift, 0], [T.lift + 0.2, 1, EO]]);
  const gazeX = -clamp(track * stranded * 0.5, -0.4, 0.4) * 0.04;
  eyes.forEach(e => {
    e.g.scale.setScalar(eyeS);
    e.pupil.scale.set(0.037 * pupil, 0.058 * Math.max(0.6, pupil), 0.014);
    e.look.position.set(gazeX + 0.008 * noise1(t * 2 + 7), 0.005 - 0.01 * crouch, 0);
    e.upper.rotation.x = lerp(-1.35, 1.62, lid);
    e.lower.rotation.x = lerp(1.35, 0.22, happy);                        // happy: lower lid rises into a smile
    e.hi.forEach(h => (h.visible = lid < 0.8));
  });
  const open = key(t, [[0, 0], [T.notice + 0.05, 0], [T.notice + 0.25, 0.55, EO], [T.closeup + 0.8, 0.55], [T.closeup + 1.1, 0.1], [T.whoosh, 0], [T.whoosh + 0.06, 1, EO], [T.back + 0.25, 0.15], [T.back + 0.45, 0],
    [T.bend + 0.1, 0], [T.grab - 0.05, 0.8], [T.grab, 0.25]]);
  mouth.visible = open > 0.03;
  mouth.scale.set(0.05 + 0.015 * open, 0.05 * open, 0.03);
  heldFish.visible = t >= T.grab;
  heldFish.rotation.z = -0.12 + 0.1 * wobble(t - T.grab, 12, 5);

  // tail: a sweep through a blend of "resting, wrapped around the paws" and "up like a question mark"
  const up = clamp(key(t, [[0, 0], [T.notice, 0], [T.notice + 0.3, 1, EO], [T.stand, 0.85], [T.kerb, 0.55], [T.whoosh, 0.55], [T.whoosh + 0.05, 1, EO], [T.back + 0.4, 0.9],
    [T.crouch, 0.25], [T.land, 0.5], [T.mid + 0.3, 0.1], [T.peek, 0.1], [T.peek + 0.3, 0.6], [T.strut, 1], [T.turn, 0.9], [T.sit, 0.05]]));
  const wave = 0.18 + 0.2 * key(t, [[T.strut, 0], [T.strut + 0.3, 1], [T.fish, 1], [T.fish + 0.4, 0.4]]) + 0.15 * sit;
  const bristle = 1 + 0.9 * puff;
  const baseY = 0.44 + rigY + 0.1 * Math.cos(hip.rotation.x) + 0.2 * Math.sin(hip.rotation.x);
  const baseZ = -0.2 + 0.1 * Math.sin(hip.rotation.x) - 0.2 * Math.cos(hip.rotation.x);
  const n = cat.tailGeo.n, pts = [];
  const tipCurl = 1.9 + 0.6 * Math.sin(t * 2.2);
  let uy = baseY, uz = baseZ;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    // resting: back, down to the ground, then around the side towards the front paws
    const th = s * 2.5;
    const rx = -0.32 * (1 - Math.cos(th)) * (0.4 + 0.6 * sit), rz = baseZ - 0.32 * Math.sin(th) * (1 - 0.3 * sit) + 0.1 * sit * s;
    const ry = lerp(baseY, 0.07, smooth(clamp(s / 0.38)));
    // up: integrate a direction that tilts back, rises, then hooks forward at the tip
    if (i > 0) {
      const ds = 0.8 / (n - 1), dir = -0.35 + tipCurl * smooth(clamp((s - 0.55) / 0.45)); // angle from vertical, + = forward
      uy += Math.cos(dir) * ds; uz += Math.sin(dir) * ds;
    }
    const w = wave * Math.sin(s * 3.2 - t * (2.6 + 2 * puff)) * s ** 1.3 + 0.1 * noise1(t * 0.9 + s) * s;
    pts.push(new THREE.Vector3(lerp(rx, 0, up) + w * (0.5 + 0.5 * up), lerp(ry, uy, up), lerp(rz, uz, up)));
  }
  cat.tailGeo.update(pts, s => (0.058 - 0.022 * s) * bristle * (s > 0.9 ? Math.sqrt(1 - ((s - 0.9) / 0.1) ** 2) * 0.7 + 0.3 : 1));

  root.updateMatrixWorld(true);
  cat.nose.set(0, -0.035, 0.32);
  head.localToWorld(cat.nose);
}

// ───────────────────────────── the smell ribbon (fish → nose), a classic cartoon lure
function makeRibbon() {
  const geo = new Sweep(60, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  scene.add(m);
  return { geo, mat, m };
}
function poseRibbon(t) {
  const grow = EO(prog(t, T.smell, T.notice));
  const fade = 1 - prog(t, T.closeup + 0.5, T.stand - 0.2);
  ribbon.m.visible = grow > 0.01 && fade > 0;
  if (!ribbon.m.visible) return;
  ribbon.mat.opacity = 0.8 * fade;
  const a = FISH.clone().add(new THREE.Vector3(0, 0.25, 0)), b = cat.nose.clone().add(new THREE.Vector3(0, 0, -0.05));
  const n = ribbon.geo.n, pts = [];
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * grow;
    const p = a.clone().lerp(b, s);
    p.y += 1.6 * Math.sin(Math.PI * s) * (1 - 0.3 * s);
    p.x += 0.45 * Math.sin(s * 11 - t * 4) * Math.sin(Math.PI * s);
    p.y += 0.12 * Math.sin(s * 17 - t * 5);
    pts.push(p);
  }
  ribbon.geo.update(pts, u => 0.05 * Math.sqrt(Math.sin(Math.PI * clamp(u, 0.001, 0.999))) * (0.6 + 0.4 * Math.sin(u * 30 - t * 6)));
}

// ───────────────────────────── camera: one function per shot, hard cuts on beats
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function shots() {
  const cz = t => catPath(t).z;
  return [
    [T.closeup, t => { const p = EIO(prog(t, 0, T.notice - 0.1)); return [V(9, 11, 3).lerp(V(1.0, 1.3, 8.7), p), V(0, 0, -1).lerp(V(-0.35, 0.55, 0.5), p), lerp(40, 46, p)]; }],
    [T.stand, t => { const p = prog(t, T.closeup, T.stand); return [V(0.95, 0.88, 4.55).lerp(V(0.8, 0.9, 4.85), p), V(0, 0.98, 6.75), 30]; }],
    [T.face, t => [V(3.4, 0.95, 5.95), V(0, 0.68, lerp(6.3, 5.5, EIO(prog(t, T.stand, T.kerb)))), 36]],
    [T.crouch, t => { const p = prog(t, T.face, T.crouch); return [V(-0.62, 0.72, 1.0).lerp(V(-0.5, 0.74, 1.25), p), V(0, 0.72 + 0.7 * (catPath(t).y - KERB), 5.6), 29]; }],
    [T.closeE, t => { const p = EIO(prog(t, T.crouch, T.closeE)); return [V(6.4, 4.3, 8.4).lerp(V(5.2, 3.3, 7.2), p), V(0, 0.3, 2.4).lerp(V(0, 0.3, 0.3), EIO(prog(t, T.crouch, T.mid + 0.3))), 40]; }],
    [T.yellow, t => { const p = prog(t, T.closeE, T.yellow); return [V(2.7, 0.62, -1.3).lerp(V(2.4, 0.58, -1.2), p), V(0, 0.42, 0), 32]; }],
    [T.cutG, t => { const p = prog(t, T.yellow, T.cutG); return [V(1.2, 3.0, -2.9).lerp(V(1.5, 3.15, -3.35), p), V(2.9, 3.6, -5.7), 30]; }],
    [T.strut, t => { const p = prog(t, T.cutG, T.strut); return [V(-0.55, 1.05, -4.55).lerp(V(-0.45, 0.95, -4.3), p), V(0.2, 0.5, 0.5), 40]; }],
    [T.bend, t => { const z = cz(t); return [V(-3.1, 1.05, z - 0.9), V(0, 0.55, z - 0.6), 36]; }],
    [Infinity, t => { const p = E.inOutCubic(prog(t, T.sit - 0.25, T.end - 0.3)); return [V(-3.0, 0.95, -6.3).lerp(V(-5.2, 3.2, -3.4), p), V(0, 0.55, -7.35).lerp(V(0, 1.2, -7.1), p), lerp(36, 40, p)]; }],
  ];
}
let SHOTS;
function poseCamera(t, api) {
  SHOTS ??= shots();
  const [pos, look, fov] = SHOTS.find(([end]) => t < end)[1](t);
  const [sx, sy] = shake(t, [[T.whoosh, 0.05], [T.land, 0.035]], 7);
  camera.position.copy(pos).add(V(sx, sy, 0));
  camera.fov = fov;
  camera.aspect = api.W / api.H;
  camera.updateProjectionMatrix();
  camera.lookAt(look);
}

// ───────────────────────────── title card (2D over the 3D frame)
function titles(ctx, t, { W }) {
  if (t < T.title) return;
  const size = 150;
  const font = `600 ${size}px Fredoka`;
  const L = layout(ctx, copy.title, font, 1);
  setFont(ctx, 600, size, 'Fredoka', 1);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  const x0 = (W - L.total) / 2, base = 210;
  for (let i = 0; i < copy.title.length; i++) {
    const ch = copy.title[i];
    if (ch === ' ') continue;
    const s = spring(t - T.title - i * 0.045, 15, 6);
    if (s <= 0) continue;
    const cx = x0 + (L.xs[i] + L.xs[i + 1]) / 2, w = L.xs[i + 1] - L.xs[i];
    ctx.save();
    ctx.translate(cx, base);
    ctx.rotate(0.06 * Math.sin(i * 1.7) * (1 - clamp(t - T.title - i * 0.045)));
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(46,30,23,0.35)'; ctx.fillText(ch, -w / 2 + 6, 10);
    ctx.lineWidth = 16; ctx.strokeStyle = rgba([46, 30, 23]); ctx.strokeText(ch, -w / 2, 0);
    ctx.fillStyle = rgba([255, 214, 102]); ctx.fillText(ch, -w / 2, 0);
    ctx.restore();
  }
  const p = spring(t - T.sub, 12, 7);
  if (p > 0) {
    setFont(ctx, 600, 64, 'Fredoka', 0.5);
    ctx.textAlign = 'center';
    ctx.save();
    ctx.globalAlpha = clamp(p);
    ctx.translate(W / 2, 310 + (1 - p) * 30);
    ctx.lineWidth = 10; ctx.strokeStyle = rgba([46, 30, 23]); ctx.strokeText(copy.sub, 0, 0);
    ctx.fillStyle = rgba([255, 250, 240]); ctx.fillText(copy.sub, 0, 0);
    ctx.restore();
  }
}
