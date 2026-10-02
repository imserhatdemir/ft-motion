// examples/dotkesk-agents: a 64 s, 120 BPM English launch film for dotkesk's AI agent builder.
//   3:12 a.m., the store is closed and messages rain in → the dotkesk mark takes orbit and answers every one → dive into
//   the sphere, white wave, lockup → the real AI Agents page in a window → "New Agent" → the flow editor: nodes dragged in
//   and connected, Search Knowledge Base and Generate Reply configured, Active, Save → a test chat runs through the flow →
//   the mark pops out and floods the frame → six feature cards → "Try it at dotkesk.com" → end card.
// The app UI is redrawn from screenshots of app.dotkesk.com in screenshot pixels (APP scale), so layout matches 1:1.
// Bars are 2 s; every cut and hit sits on the grid via A(bar, step). Captions double as a VO script.
import { TAU, clamp, lerp, prog, rgba, mix, E, EASE, spring, wobble, hash, noise1, setFont, layout, rrect, pill, check, radialBlob, shake } from '../../engine/core.js';
import { shockRing, fitFont, discCover } from '../../engine/fx.js';
import { dkLogo, SPHERE_OFFSET } from './logo.js';

const COPY = {
  en: {
    caps: [
      "It's 3:12 a.m.", 'Your store is closed.', "Your customers aren't.", 'dotkesk answers every one',
      'on WhatsApp, Instagram and Telegram.', 'Meet dotkesk.', "Here's how you build an agent.", 'Drag in the steps',
      'and connect them.', 'Point it at your knowledge base.', 'Hybrid search, built in.', 'Set the tone.', 'Switch it on.',
      'Every message runs through your flow.', 'Day and night.',
    ],
    closed: 'Closed', unread: n => `${n} unread`, allDone: 'All answered',
    messages: [
      ['Is this in stock?', 0], ["Where's my order?", 1], ['Do you ship to Izmir?', 2], ['Can I return this?', 0],
      ['What sizes do you have?', 1], ['Is the blue one available?', 0], ['How long is delivery?', 2], ['Any discount today?', 1],
      ['Can I change my order?', 0], ['Hello?', 2], ['Is it waterproof?', 1], ['Open tomorrow?', 0],
    ],
    channels: ['WhatsApp', 'Instagram', 'Telegram'],
    tagline: 'AI COMMERCE OS', name: 'dotkesk', cta: ['Try it at', 'dotkesk.com'], url: 'dotkesk.com',
    // app UI (English labels)
    ws: 'Serhat', wsSub: 'AI COMMERCE OS', quick: 'Quick Create', workspace: 'WORKSPACE', page: 'AI Agents',
    search: 'Search leads, tasks, contacts...', user: 'Serhat', initials: 'SD',
    nav: [['SETUP', [['AI Agents', 'robot'], ['Contact Channels', 'link'], ['Stores', 'store'], ['Knowledge Base', 'book'], ['Copilot', 'spark']]],
      ['WORKSPACE', [['Customers', 'users'], ['Inbox', 'inbox'], ['Automations', 'bolt'], ['Requests', 'headset'], ['Reports', 'chart']]],
      ['MANAGEMENT', [['Settings', 'gear']]]],
    pageSub: 'Manage AI agents that auto-reply on your WhatsApp, Instagram and Telegram channels',
    templates: 'Templates', newAgent: 'New Agent',
    card: { title: 'Welcome Assistant (General)', sub: 'Optimized by the platform', active: 'Active',
      desc: ['Sends a greeting on the first message, then understands what the', 'customer needs and answers from the knowledge base or hands off to a human.'],
      runs: '0 Runs', rag: 'RAG active', chip: '@mystore', connect: 'Connect Channel', edit: 'Edit' },
    agentName: 'Order Assistant', settings: 'Settings', evaluation: 'Evaluation', activeLbl: 'Active', save: 'Save', saved: 'Saved',
    nodesLbl: 'NODES',
    nodeList: [['Fixed Message', 'msg', 0], ['Classify Intent', 'tag', 1], ['Search Store', 'search', 2], ['Track Shipment', 'truck', 3],
      ['Template Reply', 'chat', 4], ['Condition', 'branch', 2], ['Generate Reply', 'chat', 2], ['Send Message', 'send', 5],
      ['Hand Off to Human', 'headset', 6], ['Return Request', 'undo', 6], ['Order Change', 'box', 7], ['Search Knowledge Base', 'book', 5],
      ['Route to Agent', 'route', 8]],
    flow: [
      { t: 'Message Received', s: 'Starts this flow when a me…', icon: 'bolt', c: 7, list: -1 },
      { t: 'Fixed Message', s: 'Sends a ready-made mess…', icon: 'msg', c: 0, list: 0, extra: ['“Hi, welcome! How can I help?”'], chip: 'First message only' },
      { t: 'Search Knowledge', t2: 'Base', s: 'Finds the matching article i…', icon: 'book', c: 5, list: 11 },
      { t: 'Generate Reply', s: 'Creates a reply with AI', icon: 'chat', c: 2, list: 6, extra: ['Tone: Friendly and inviting · Max 300', 'characters'] },
      { t: 'Send Message', s: 'Delivers the reply to the ch…', icon: 'send', c: 5, list: 7 },
    ],
    kb: { title: 'Search Knowledge Base', sub: ['Finds the matching article in the', 'FAQ/knowledge base'], info: ['Hybrid RAG: embedding similarity', 'plus keyword matching.'],
      fields: [['Number of results', '5'], ['Minimum confidence score', '0.18'], ['Context token budget', '1800']] },
    gen: { title: 'Generate Reply', sub: ['Creates a reply with AI'], fields: [['Tone', 'Friendly and inviting'], ['Max characters', '300']] },
    test: { title: 'Test chat', channel: 'WhatsApp', ask: 'Hi! Do you ship to Izmir?', hello: 'Hi, welcome! How can I help?',
      answer: ['Yes! We ship across Turkey,', 'usually within 2–3 business days.'] },
    features: [['Flow', 'Builder'], ['Hybrid', 'RAG'], ['Track', 'Shipment'], ['Hand Off', 'to Human'], ['Agent', 'Templates'], ['Built-in', 'Evaluation']],
    cards: ['Flow Builder', 'Hybrid RAG', 'Track Shipment', 'Hand Off to Human', 'Templates', 'Evaluation'],
  },
};
const CAP_AT = [
  [[0, 4], [1, 15]], [[2, 0], [2, 15]], [[3, 0], [3, 15]], [[4, 0], [5, 0]], [[5, 1], [6, 4]], [[6, 8], [7, 15]],
  [[8, 0], [9, 3]], [[9, 4], [10, 15]], [[11, 0], [12, 15]], [[13, 2], [14, 15]], [[15, 0], [15, 15]], [[16, 0], [16, 15]],
  [[17, 0], [17, 15]], [[18, 2], [19, 15]], [[20, 0], [21, 12]],
];

// palette: the logo's lime → green on a light ground, navy ink
const BG = [248, 250, 244], WHITE = [255, 255, 255], NAVY = [12, 13, 23], INK = [24, 26, 38], SUB = [118, 122, 134];
const LIME = [214, 236, 74], GREEN = [90, 219, 76], GREEN_D = [30, 140, 60], MINT = [234, 247, 224], SKY = [228, 242, 214];
const UI_GREEN = [26, 160, 72], UI_LINE = [229, 231, 235], UI_CANVAS = [247, 247, 245];
const NODE_C = [[139, 92, 246], [59, 130, 246], [34, 197, 94], [249, 115, 22], [20, 184, 166], [6, 182, 212], [239, 68, 68], [245, 158, 11], [168, 85, 247]];
const CH_C = [[37, 211, 102], [225, 48, 108], [42, 171, 238]];
const SANS = 'Inter';
// the browser window and the app inside it (drawn in screenshot px at APP scale)
const WX = 150, WY = 70, WW = 1620, WH = 890, BAR = 46, APP = 0.815, AX = WX, AY = WY + BAR;

let W = 1920, H = 1080, A = (bar, step = 0) => bar * 2 + step * 0.125, TX = COPY.en, CAPS = [], FT = 0;

// ───────────────────────────── helpers
function T(ctx, s, x, y, { w = 600, size = 40, a = 'left', fill = INK, alpha = 1, ls = 0 } = {}) {
  setFont(ctx, w, size, SANS, ls); ctx.textAlign = a; ctx.textBaseline = 'alphabetic';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = rgba(fill); ctx.fillText(s, x, y); ctx.restore();
}
const fill = (ctx, col) => { ctx.fillStyle = rgba(col); ctx.fillRect(-80, -80, W + 160, H + 160); };
const circle = (ctx, x, y, r, col, a = 1) => { if (r <= 0) return; ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const tint = (c, k = 0.86) => mix(c, WHITE, k);
function vgrad(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(top)); g.addColorStop(1, rgba(bottom));
  ctx.fillStyle = g; ctx.fillRect(-80, -80, W + 160, H + 160);
}
/** The mark on its navy badge (as in the app's sidebar), so the white orbit dots read on light grounds. */
function badge(ctx, x, y, d, { spin = 0, sphere = 1, rings = 1, scale = 1 } = {}) {
  if (scale <= 0) return;
  circle(ctx, x, y, d / 2 * scale, NAVY);
  dkLogo(ctx, x, y, d * 0.92 * scale, { spin, sphere, rings });
}
function cursor(ctx, x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - 0.14 * press), s * (1 - 0.14 * press));
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 38); ctx.lineTo(9, 29); ctx.lineTo(16, 44); ctx.lineTo(23, 41); ctx.lineTo(16, 26); ctx.lineTo(28, 26); ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  ctx.fillStyle = rgba(NAVY); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(WHITE); ctx.stroke();
  ctx.restore();
}
const pressAt = (t, t0) => clamp(1 - Math.abs(t - t0 - 0.05) / 0.08);
function caption(ctx, t) {
  CAPS.forEach(([a, b], i) => {
    const s = TX.caps[i];
    if (!s || t < a || t > b) return;
    const pin = spring(t - a, 20, 11), out = prog(t, b - 0.12, b), k = lerp(0.88, 1, clamp(pin, 0, 1.2));
    setFont(ctx, 600, 40, SANS, -0.3);
    const w = ctx.measureText(s).width + 56;
    ctx.save(); ctx.globalAlpha = prog(t, a, a + 0.06) * (1 - out);
    ctx.translate(W / 2, H - 70 + out * 10); ctx.scale(k, k);
    ctx.fillStyle = rgba(NAVY, 0.94); rrect(ctx, -w / 2, -32, w, 64, 18); ctx.fill();
    ctx.fillStyle = rgba(WHITE); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, 0, 14);
    ctx.restore();
  });
}

// ───────────────────────────── tiny line icons (stroke, centred on x, y, size s)
function icon(ctx, kind, x, y, s, col, lw = 2) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24); ctx.strokeStyle = ctx.fillStyle = rgba(col); ctx.lineWidth = lw * 24 / s; ctx.lineCap = ctx.lineJoin = 'round';
  const P = pts => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); };
  switch (kind) {
    case 'robot': rrect(ctx, -9, -5, 18, 13, 3); ctx.stroke(); P([[0, -5], [0, -9]]); ctx.stroke(); ctx.beginPath(); ctx.arc(-4, 1, 1.6, 0, TAU); ctx.arc(4, 1, 1.6, 0, TAU); ctx.fill(); break;
    case 'msg': rrect(ctx, -9, -8, 18, 13, 3); ctx.stroke(); P([[-4, 5], [-6, 9], [0, 5]]); ctx.stroke(); break;
    case 'chat': rrect(ctx, -10, -8, 14, 10, 3); ctx.stroke(); rrect(ctx, -3, -1, 13, 10, 3); ctx.stroke(); break;
    case 'search': ctx.beginPath(); ctx.arc(-2, -2, 6, 0, TAU); ctx.stroke(); P([[3, 3], [8, 8]]); ctx.stroke(); break;
    case 'truck': rrect(ctx, -10, -6, 12, 10, 1.5); ctx.stroke(); P([[2, -2], [7, -2], [10, 2], [10, 4], [2, 4]]); ctx.stroke(); ctx.beginPath(); ctx.arc(-6, 6, 2, 0, TAU); ctx.arc(6, 6, 2, 0, TAU); ctx.fill(); break;
    case 'bolt': P([[2, -10], [-6, 2], [0, 2], [-2, 10], [6, -2], [0, -2]]); ctx.closePath(); ctx.fill(); break;
    case 'send': P([[-9, 1], [9, -8], [3, 9], [0, 3]]); ctx.closePath(); ctx.stroke(); break;
    case 'book': rrect(ctx, -8, -9, 16, 18, 2); ctx.stroke(); P([[-4, -4], [4, -4]]); ctx.stroke(); P([[-4, 0], [4, 0]]); ctx.stroke(); break;
    case 'branch': ctx.beginPath(); ctx.arc(-5, -7, 2.5, 0, TAU); ctx.arc(-5, 7, 2.5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(6, -4, 2.5, 0, TAU); ctx.stroke(); P([[-5, -4], [-5, 4]]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6, -1); ctx.quadraticCurveTo(6, 4, -3, 5); ctx.stroke(); break;
    case 'headset': ctx.beginPath(); ctx.arc(0, 1, 8, Math.PI, TAU); ctx.stroke(); rrect(ctx, -10, 0, 4, 7, 2); ctx.fill(); rrect(ctx, 6, 0, 4, 7, 2); ctx.fill(); break;
    case 'undo': ctx.beginPath(); ctx.arc(1, 1, 7, Math.PI * 1.1, Math.PI * 2.75); ctx.stroke(); P([[-8, -6], [-7, 0], [-1, -2]]); ctx.stroke(); break;
    case 'box': rrect(ctx, -9, -6, 18, 15, 2); ctx.stroke(); P([[-9, -2], [9, -2]]); ctx.stroke(); P([[-3, 2], [3, 2]]); ctx.stroke(); break;
    case 'route': ctx.beginPath(); ctx.arc(-7, 6, 2.5, 0, TAU); ctx.arc(7, -6, 2.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-7, 6); ctx.bezierCurveTo(0, 6, 0, -6, 7, -6); ctx.stroke(); break;
    case 'tag': P([[-9, -9], [1, -9], [9, -1], [-1, 9], [-9, 1]]); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(-4, -4, 1.6, 0, TAU); ctx.fill(); break;
    case 'link': ctx.beginPath(); ctx.arc(-3, 3, 4.5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(3, -3, 4.5, 0, TAU); ctx.stroke(); break;
    case 'store': P([[-9, -3], [-7, -9], [7, -9], [9, -3]]); ctx.stroke(); rrect(ctx, -8, -3, 16, 12, 1.5); ctx.stroke(); break;
    case 'spark': P([[0, -9], [2, -2], [9, 0], [2, 2], [0, 9], [-2, 2], [-9, 0], [-2, -2]]); ctx.closePath(); ctx.stroke(); break;
    case 'users': ctx.beginPath(); ctx.arc(-3, -3, 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(-3, 10, 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); break;
    case 'inbox': rrect(ctx, -9, -7, 18, 15, 2); ctx.stroke(); P([[-9, 2], [-3, 2], [-2, 5], [2, 5], [3, 2], [9, 2]]); ctx.stroke(); break;
    case 'chart': P([[-8, -8], [-8, 8], [8, 8]]); ctx.stroke(); P([[-4, 4], [-4, 0]]); ctx.stroke(); P([[0, 4], [0, -4]]); ctx.stroke(); P([[4, 4], [4, -1]]); ctx.stroke(); break;
    case 'gear': ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, TAU); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; P([[Math.cos(a) * 6, Math.sin(a) * 6], [Math.cos(a) * 9, Math.sin(a) * 9]]); ctx.stroke(); } break;
    case 'db': ctx.beginPath(); ctx.ellipse(0, -6, 7, 3, 0, 0, TAU); ctx.stroke(); P([[-7, -6], [-7, 6]]); ctx.stroke(); P([[7, -6], [7, 6]]); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 6, 7, 3, 0, 0, Math.PI); ctx.stroke(); break;
    case 'pencil': P([[-7, 7], [-7, 3], [5, -9], [9, -5], [-3, 7]]); ctx.closePath(); ctx.stroke(); break;
    case 'trash': P([[-7, -6], [7, -6]]); ctx.stroke(); rrect(ctx, -5, -6, 10, 14, 2); ctx.stroke(); break;
    case 'plus': P([[-7, 0], [7, 0]]); ctx.stroke(); P([[0, -7], [0, 7]]); ctx.stroke(); break;
    case 'back': P([[8, 0], [-7, 0]]); ctx.stroke(); P([[-1, -6], [-7, 0], [-1, 6]]); ctx.stroke(); break;
    case 'chev': P([[-3, -6], [3, 0], [-3, 6]]); ctx.stroke(); break;
    case 'moon': ctx.beginPath(); ctx.arc(0, 0, 8, 0.6, TAU - 0.6 + 0.0001); ctx.arc(5, -4, 6, TAU - 1.1, 1.9, true); ctx.closePath(); ctx.stroke(); break;
    case 'bell': ctx.beginPath(); ctx.moveTo(-7, 5); ctx.lineTo(-6, -2); ctx.arc(0, -2, 6, Math.PI, TAU); ctx.lineTo(7, 5); ctx.closePath(); ctx.stroke(); P([[-2, 8], [2, 8]]); ctx.stroke(); break;
    case 'save': rrect(ctx, -8, -8, 16, 16, 2); ctx.stroke(); P([[-4, -8], [-4, -3], [4, -3], [4, -8]]); ctx.stroke(); break;
    case 'wand': P([[-8, 8], [5, -5]]); ctx.stroke(); P([[6, -9], [7, -7], [9, -6], [7, -5], [6, -3], [5, -5], [3, -6], [5, -7]]); ctx.closePath(); ctx.fill(); break;
    case 'play': P([[-4, -6], [6, 0], [-4, 6]]); ctx.closePath(); ctx.fill(); break;
    case 'x': P([[-5, -5], [5, 5]]); ctx.stroke(); P([[5, -5], [-5, 5]]); ctx.stroke(); break;
    default: rrect(ctx, -7, -7, 14, 14, 3); ctx.stroke();
  }
  ctx.restore();
}
function tile(ctx, x, y, s, col, kind) {
  ctx.fillStyle = rgba(tint(col, 0.85)); rrect(ctx, x, y, s, s, s * 0.25); ctx.fill();
  icon(ctx, kind, x + s / 2, y + s / 2, s * 0.55, col, 2.2);
}

// ───────────────────────────── 1 · 3:12 a.m. (bars 0–3), the mark answers (bars 4–5), the dive (bar 6)
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: hash(i * 3.1), y: hash(i * 7.7 + 1) * 0.6, z: 0.4 + 0.6 * hash(i * 1.3 + 5) }));
function sky(ctx, t) {
  vgrad(ctx, SKY, BG);
  for (const s of STARS) circle(ctx, s.x * W, s.y * H, 2.2 * s.z, NAVY, (0.15 + 0.25 * (0.5 + 0.5 * Math.sin(t * 2 + s.x * 40))) * s.z);
}
function shop(ctx, cx, base, s) {
  ctx.save(); ctx.translate(cx, base); ctx.scale(s, s);
  ctx.fillStyle = rgba(WHITE); rrect(ctx, -170, -190, 340, 190, 10); ctx.fill(); ctx.strokeStyle = rgba(NAVY); ctx.lineWidth = 5; ctx.stroke();
  for (let i = 0; i < 6; i++) {                                     // awning
    ctx.fillStyle = rgba(i % 2 ? WHITE : LIME); ctx.beginPath(); ctx.moveTo(-190 + i * 63.3, -230); ctx.lineTo(-190 + (i + 1) * 63.3, -230);
    ctx.lineTo(-190 + (i + 1) * 63.3, -190); ctx.arc(-190 + (i + 0.5) * 63.3, -190, 31.6, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.strokeStyle = rgba(NAVY); ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.strokeStyle = rgba(NAVY); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-190, -230); ctx.lineTo(190, -230); ctx.stroke();
  ctx.fillStyle = rgba(NAVY); rrect(ctx, -40, -110, 80, 110, [10, 10, 0, 0]); ctx.fill();
  ctx.fillStyle = rgba(SKY); rrect(ctx, -140, -130, 80, 70, 8); ctx.fill(); rrect(ctx, 60, -130, 80, 70, 8); ctx.fill();
  ctx.strokeStyle = rgba(NAVY); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-14, -110); ctx.lineTo(0, -128); ctx.lineTo(14, -110); ctx.stroke();
  ctx.fillStyle = rgba(WHITE); rrect(ctx, -34, -104, 68, 26, 6); ctx.fill();
  T(ctx, TX.closed, 0, -85, { w: 700, size: 16, fill: NAVY, a: 'center' });
  ctx.restore();
}
function bubble(ctx, x, y, s, text, ch, answered, a = 1) {
  if (s <= 0.01) return;
  setFont(ctx, 600, 26, SANS, -0.2);
  const w = Math.max(ctx.measureText(text).width, 120) + 40, h = 84;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.fillStyle = rgba(WHITE); rrect(ctx, -w / 2, -h / 2, w, h, 18); ctx.fill();
  ctx.strokeStyle = rgba(answered > 0 ? mix(NAVY, GREEN_D, answered) : NAVY); ctx.lineWidth = 3; ctx.stroke();
  circle(ctx, -w / 2 + 24, -h / 2 + 24, 6, CH_C[ch]);
  T(ctx, TX.channels[ch], -w / 2 + 38, -h / 2 + 30, { w: 600, size: 16, fill: SUB });
  T(ctx, text, -w / 2 + 20, h / 2 - 18, { w: 600, size: 26, fill: INK, ls: -0.2 });
  if (answered > 0) {
    const k = spring(answered * 0.6, 18, 8);
    circle(ctx, w / 2 - 6, -h / 2 + 6, 17 * k, GREEN_D); check(ctx, w / 2 - 6, -h / 2 + 6, 7 * k, WHITE, 3);
  }
  ctx.restore();
}
// resting spots for the 12 bubbles (left and right of the shop)
const SPOTS = [[360, 320], [1570, 330], [560, 480], [1380, 490], [320, 640], [1600, 650], [700, 270], [1230, 260], [520, 770], [1430, 790], [300, 470], [1640, 470]];
const MSG_T = k => A(2) + k * 0.25;
const ANS_T = k => A(4, 4) + k * 0.14;
const ORBIT = [W / 2, 400], ORB_D = 300;
function night(ctx, t) {
  sky(ctx, t);
  const dive = E.inExpo(prog(t, A(6), A(6, 8)));
  const fx = ORBIT[0] + SPHERE_OFFSET.x * ORB_D * 0.92, fy = ORBIT[1] + SPHERE_OFFSET.y * ORB_D * 0.92;
  const z = 1 + 30 * dive;
  ctx.save(); ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy);
  // clock: 03:11 → 03:12 flips on bar 1, then floats up and out of the way
  const up = EASE.expo(prog(t, A(2), A(2, 8)));
  const cs = lerp(1, 0.42, up), cy = lerp(430, 120, up), cx = lerp(W / 2, 220, up);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(cs, cs);
  setFont(ctx, 800, 240, SANS, -8); ctx.textAlign = 'center'; ctx.fillStyle = rgba(NAVY);
  const flip = prog(t, A(1) - 0.12, A(1) + 0.12), digit = flip < 0.5 ? '1' : '2', sy = Math.abs(Math.cos(flip * Math.PI));
  const head = '03:1', L = layout(ctx, head + '2', `800 240px ${SANS}`, -8), x0 = -L.total / 2;
  ctx.textAlign = 'left'; ctx.fillText(head, x0, 0);
  ctx.save(); ctx.translate(x0 + L.xs[4], -84); ctx.scale(1, Math.max(0.02, sy)); ctx.fillText(digit, 0, 84); ctx.restore();
  T(ctx, 'AM', L.total / 2 + 24, -10, { w: 700, size: 56, fill: GREEN_D });
  ctx.restore();
  // the store-planet
  const R = 640, rise = EASE.expo(prog(t, 0, A(1)));
  const pcy = H + 430 + (1 - rise) * 500;
  const g = ctx.createLinearGradient(0, pcy - R, 0, pcy + R); g.addColorStop(0, rgba(LIME)); g.addColorStop(0.5, rgba(GREEN));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, pcy, R, 0, TAU); ctx.fill();
  shop(ctx, W / 2, pcy - R + 14, 0.9 * spring(t - 0.3, 14, 9));
  // unread badge
  const nIn = TX.messages.filter((_, k) => FT >= MSG_T(k)).length, nAns = TX.messages.filter((_, k) => FT >= ANS_T(k)).length;
  const unread = Math.round(nIn * 47 / 12) - Math.round(nAns * 47 / 12);
  if (t > MSG_T(0)) {
    const bs = spring(t - MSG_T(0), 16, 8), done = t > ANS_T(11) + 0.2, label = done ? TX.allDone : TX.unread(unread);
    setFont(ctx, 700, 26, SANS); const bw = ctx.measureText(label).width + 48;
    ctx.save(); ctx.translate(W / 2, pcy - R - 250); ctx.scale(bs, bs);
    ctx.fillStyle = rgba(done ? GREEN_D : NAVY); pill(ctx, 0, 0, bw, 52); ctx.fill();
    T(ctx, label, 0, 9, { w: 700, size: 26, fill: WHITE, a: 'center' });
    ctx.restore();
  }
  // replies: a green arc from the mark to each bubble, then a check
  TX.messages.forEach(([text, ch], k) => {
    const a = t - MSG_T(k);
    if (a < 0) return;
    const fly = EASE.expo(clamp(a / 0.6)), [tx, ty] = SPOTS[k], from = tx < W / 2 ? -300 : W + 300;
    const x = lerp(from, tx, fly), y = lerp(-120, ty, fly) + Math.sin(t * 1.5 + k) * 6;
    const r = t - ANS_T(k);
    if (r > 0 && r < 0.5) {
      const p = EASE.expo(clamp(r / 0.35)), q = clamp((r - 0.25) / 0.25);
      ctx.strokeStyle = rgba(GREEN_D, 1 - q); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      const mx = (ORBIT[0] + x) / 2, my = Math.min(ORBIT[1], y) - 160;
      for (let i = Math.floor(q * 24); i <= Math.floor(p * 24); i++) {
        const u = i / 24, bx = (1 - u) * (1 - u) * ORBIT[0] + 2 * (1 - u) * u * mx + u * u * x, by = (1 - u) * (1 - u) * ORBIT[1] + 2 * (1 - u) * u * my + u * u * y;
        i === Math.floor(q * 24) ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }
    bubble(ctx, x, y, 0.92 * spring(a, 15, 9) * (1 - 0.5 * dive), text, ch, clamp(r / 0.35));
  });
  // the mark arrives and takes orbit
  const arr = t - A(4);
  if (arr > -0.6) {
    const e = EASE.expo(prog(t, A(4) - 0.6, A(4) + 0.2));
    const x = lerp(W + 300, ORBIT[0], e), y = lerp(-300, ORBIT[1], e) + Math.sin(t * 2) * 6 * e;
    badge(ctx, x, y, ORB_D, { spin: t * 0.06, rings: clamp(arr / 0.8 + 0.6) });
    shockRing(ctx, ORBIT[0], ORBIT[1], t, A(4) + 0.2, { color: GREEN_D, life: 0.6, radius: 320, width: 10 });
  }
  ctx.restore();
}

// ───────────────────────────── 2 · lockup on light (bars 6–7)
function wave(ctx, t, t0, t1, col, ph) {
  const p = E.inOutCubic(prog(t, t0, t1));
  if (p <= 0) return;
  const by = lerp(H + 150, -190, p);
  ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.moveTo(-80, H + 80);
  for (let x = -80; x <= W + 80; x += 24) ctx.lineTo(x, by + Math.sin(x * 0.0042 + t * 4 + ph) * 70 + noise1(x * 0.003 + t * 1.5 + ph) * 50);
  ctx.lineTo(W + 80, H + 80); ctx.closePath(); ctx.fill();
}
function lockupGeom(ctx, cx, base, size) {
  const font = `800 ${size}px ${SANS}`, L = layout(ctx, TX.name, font, -size * 0.04), d = size * 1.25, gap = size * 0.3;
  const x0 = cx - (d + gap + L.total) / 2;
  return { font, L, size, base, d, bx: x0 + d / 2, by: base - size * 0.36, tx: x0 + d + gap, ls: -size * 0.04 };
}
function nameLetters(ctx, g, lt, col = NAVY) {
  if (lt <= 0) return;
  ctx.save(); ctx.font = g.font; ctx.letterSpacing = `${g.ls}px`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = rgba(col);
  ctx.beginPath(); ctx.rect(g.tx - 40, g.base - g.size * 1.05, g.L.total + 80, g.size * 1.35); ctx.clip();
  for (let i = 0; i < TX.name.length; i++) ctx.fillText(TX.name[i], g.tx + g.L.xs[i], g.base + (1 - EASE.expo(prog(lt, 0.05 + i * 0.04, 0.65 + i * 0.04))) * g.size * 1.1);
  ctx.restore();
}
function lockup(ctx, t) {
  vgrad(ctx, LIME, GREEN);
  wave(ctx, t, A(6, 8), A(7), BG, 0.7);
  if (t < A(7)) return;
  const lt = t - A(7), g = lockupGeom(ctx, W / 2, 560, 150);
  badge(ctx, g.bx, g.by, g.d, { spin: t * 0.06, sphere: clamp(spring(lt, 14, 8), 0, 1.2), rings: clamp(lt / 0.8) });
  nameLetters(ctx, g, lt - 0.2);
  const e = EASE.expo(prog(lt, 0.6, 1.2));
  T(ctx, TX.tagline, g.tx + 4, 640 + (1 - e) * 20, { w: 700, size: 30, fill: GREEN_D, ls: 5, alpha: e });
}

// ───────────────────────────── 3 · the app (bars 8–21), redrawn from screenshots at APP scale
function windowChrome(ctx, url) {
  ctx.save(); ctx.shadowColor = 'rgba(20,40,10,0.18)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 16;
  ctx.fillStyle = rgba(WHITE); rrect(ctx, WX, WY, WW, WH, 20); ctx.fill(); ctx.restore();
  ctx.save(); rrect(ctx, WX, WY, WW, WH, 20); ctx.clip(); ctx.fillStyle = 'rgb(242,243,240)'; ctx.fillRect(WX, WY, WW, BAR); ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 2; rrect(ctx, WX, WY, WW, WH, 20); ctx.stroke();
  [[255, 95, 87], [254, 188, 46], [40, 200, 64]].forEach((c, i) => circle(ctx, WX + 24 + i * 22, WY + 23, 6.5, c));
  ctx.fillStyle = rgba(WHITE); rrect(ctx, WX + 360, WY + 9, WW - 720, 28, 14); ctx.fill();
  T(ctx, url, WX + WW / 2, WY + 29, { w: 500, size: 15, fill: SUB, a: 'center' });
}
function halo(ctx, t, a) {
  if (a <= 0) return;
  [[0, 0], [0.5, -0.05], [1, 0], [1.05, 0.5], [1, 1], [0.5, 1.05], [0, 1], [-0.05, 0.5]].forEach(([u, v], i) => {
    radialBlob(ctx, WX + u * WW + noise1(t * 0.4 + i * 7) * 70, WY + v * WH + noise1(t * 0.4 + i * 3 + 50) * 70, 430, i % 2 ? GREEN : LIME, 0.45 * a);
  });
}
// the header bar shared by both app pages (x0 = left edge of the header)
function appHeader(ctx, x0) {
  T(ctx, TX.workspace, x0, 33, { w: 700, size: 11, fill: GREEN_D, ls: 1.6 });
  T(ctx, TX.page, x0, 60, { w: 700, size: 17, fill: INK });
  const sx = x0 + 190;
  ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 1.5; rrect(ctx, sx, 21, 672, 44, 22); ctx.stroke();
  icon(ctx, 'search', sx + 27, 43, 18, SUB, 2);
  T(ctx, TX.search, sx + 52, 48, { w: 400, size: 14, fill: SUB });
  ctx.fillStyle = 'rgb(243,244,246)'; rrect(ctx, sx + 625, 33, 32, 20, 5); ctx.fill(); T(ctx, '⌘K', sx + 641, 47, { w: 500, size: 10, fill: SUB, a: 'center' });
  ctx.strokeStyle = rgba(UI_LINE); ctx.beginPath(); ctx.arc(1658, 43, 22, 0, TAU); ctx.stroke(); icon(ctx, 'moon', 1658, 43, 18, INK, 2);
  rrect(ctx, 1689, 21, 88, 44, 10); ctx.stroke(); T(ctx, 'EN', 1740, 48, { w: 700, size: 14, fill: INK, a: 'center' });
  ctx.fillStyle = 'rgb(200,16,46)'; ctx.fillRect(1702, 35, 22, 15); ctx.fillStyle = rgba(WHITE); ctx.fillRect(1702, 41, 22, 3); ctx.fillRect(1711, 35, 4, 15);
  ctx.beginPath(); ctx.arc(1808, 43, 22, 0, TAU); ctx.stroke(); icon(ctx, 'bell', 1808, 43, 18, INK, 2);
  rrect(ctx, 1845, 21, 126, 44, 22); ctx.stroke(); circle(ctx, 1867, 43, 18, [16, 185, 129]);
  T(ctx, TX.initials, 1867, 49, { w: 700, size: 14, fill: WHITE, a: 'center' }); T(ctx, TX.user, 1896, 48, { w: 600, size: 14, fill: INK });
  ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(0, 88, 2000, 1.5);
}
function agentsPage(ctx, t, lt) {
  ctx.fillStyle = 'rgb(251,251,250)'; ctx.fillRect(0, 0, 2000, 1040);
  // sidebar
  ctx.fillStyle = rgba(WHITE); ctx.fillRect(0, 0, 290, 1040); ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(290, 0, 1.5, 1040);
  badge(ctx, 47, 44, 46, { spin: t * 0.05 });
  T(ctx, TX.ws, 84, 40, { w: 700, size: 15, fill: INK }); T(ctx, TX.wsSub, 84, 60, { w: 700, size: 11, fill: GREEN_D, ls: 1.5 });
  ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(247, 43, 20, 0, TAU); ctx.stroke(); rrect(ctx, 240, 36, 14, 14, 2); ctx.stroke();
  ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(0, 88, 290, 1.5);
  ctx.fillStyle = rgba([17, 20, 34]); rrect(ctx, 19, 107, 253, 56, 28); ctx.fill(); circle(ctx, 56, 135, 18, [74, 222, 128]); icon(ctx, 'plus', 56, 135, 16, NAVY, 3);
  T(ctx, TX.quick, 84, 140, { w: 600, size: 15, fill: WHITE }); icon(ctx, 'chev', 246, 135, 12, [150, 150, 160], 2);
  let y = 204;
  TX.nav.forEach(([sec, items]) => {
    T(ctx, sec, 28, y, { w: 600, size: 11, fill: SUB, ls: 1.8 });
    y += 47;
    items.forEach(([label, ic], i) => {
      const active = sec === 'SETUP' && i === 0;
      if (active) { ctx.fillStyle = rgba([17, 20, 34]); rrect(ctx, 14, y - 30, 257, 48, 12); ctx.fill(); icon(ctx, 'chev', 247, y - 6, 12, WHITE, 2); }
      icon(ctx, ic, 38, y - 6, 18, active ? WHITE : [90, 94, 106], 1.8);
      T(ctx, label, 62, y, { w: active ? 600 : 500, size: 16, fill: active ? WHITE : INK });
      y += 53;
    });
    y += 3;
  });
  appHeader(ctx, 321);
  // page header card
  ctx.fillStyle = rgba(WHITE); rrect(ctx, 333, 118, 1625, 108, 18); ctx.fill(); ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = rgba([74, 222, 128]); rrect(ctx, 357, 116, 46, 4, 2); ctx.fill();
  T(ctx, TX.page, 357, 168, { w: 700, size: 28, fill: INK, ls: -0.6 });
  T(ctx, TX.pageSub, 357, 199, { w: 400, size: 16, fill: [80, 84, 96] });
  rrect(ctx, 1643, 151, 136, 42, 12); ctx.stroke(); icon(ctx, 'wand', 1670, 172, 16, INK, 2); T(ctx, TX.templates, 1688, 178, { w: 500, size: 16, fill: INK });
  const press = pressAt(t, A(8, 10)), hover = prog(t, A(8, 6), A(8, 9)), bs = 1 - 0.05 * press;
  ctx.save(); ctx.translate(1862, 172); ctx.scale(bs, bs);
  ctx.fillStyle = rgba(mix(UI_GREEN, [20, 130, 60], hover)); rrect(ctx, -72, -21, 145, 42, 12); ctx.fill();
  icon(ctx, 'plus', -50, 0, 14, WHITE, 2.4); T(ctx, TX.newAgent, -34, 6, { w: 600, size: 16, fill: WHITE });
  ctx.restore();
  shockRing(ctx, 1862, 172, t, A(8, 10), { color: UI_GREEN, life: 0.45, radius: 140, width: 8 });
  // agent card
  const c = TX.card;
  ctx.fillStyle = rgba(WHITE); rrect(ctx, 333, 257, 528, 283, 22); ctx.fill(); ctx.strokeStyle = rgba(UI_LINE); ctx.stroke();
  tile(ctx, 357, 281, 46, [22, 163, 74], 'robot');
  T(ctx, c.title, 417, 300, { w: 700, size: 17, fill: INK }); T(ctx, c.sub, 417, 321, { w: 400, size: 14, fill: [90, 94, 106] });
  ctx.strokeStyle = rgba([134, 239, 172]); pill(ctx, 803, 296, 67, 28); ctx.stroke(); ctx.fillStyle = 'rgba(220,252,231,0.6)'; ctx.fill(); T(ctx, c.active, 803, 301, { w: 500, size: 14, fill: UI_GREEN, a: 'center' });
  c.desc.forEach((s, i) => T(ctx, s, 357, 355 + i * 19, { w: 400, size: 13.5, fill: [70, 74, 86] }));
  ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(357, 393, 480, 1.5);
  icon(ctx, 'play', 363, 407, 12, [90, 94, 106]); T(ctx, c.runs, 372, 412, { w: 400, size: 14, fill: [90, 94, 106] });
  icon(ctx, 'db', 442, 407, 13, UI_GREEN, 2.2); T(ctx, c.rag, 453, 412, { w: 500, size: 14, fill: UI_GREEN });
  ctx.strokeStyle = rgba(UI_LINE); rrect(ctx, 357, 432, 155, 30, 15); ctx.stroke(); icon(ctx, 'chat', 376, 447, 15, INK, 2); T(ctx, c.chip, 392, 452, { w: 500, size: 14, fill: INK }); icon(ctx, 'x', 498, 447, 10, INK, 2);
  rrect(ctx, 521, 432, 145, 30, 15); ctx.stroke(); icon(ctx, 'plus', 538, 447, 10, INK, 2); T(ctx, c.connect, 550, 452, { w: 500, size: 14, fill: INK });
  rrect(ctx, 357, 481, 428, 35, 17); ctx.stroke(); icon(ctx, 'pencil', 543, 498, 14, INK, 2); T(ctx, c.edit, 556, 503, { w: 500, size: 15, fill: INK });
  ctx.beginPath(); ctx.arc(816, 498, 20, 0, TAU); ctx.stroke(); icon(ctx, 'trash', 816, 498, 14, INK, 2);
}
// flow layout in app px (from the screenshot)
const NODE_X = [476, 724, 972, 1220, 1468], NODE_Y = 537, NODE_W = 208, NODE_H = [63, 121, 73, 115, 85];
const LIST_Y = [223, 286, 349, 412, 475, 538, 601, 664, 727, 790, 853, 916, 985];
// editor timeline
const DROP_T = k => A(9, 4) + k * 1.0;                 // node k lands
const KB_CLICK = A(13, 2), KB_FIELD = [A(14), A(14, 8), A(15)];
const GEN_CLICK = A(16, 2), ACTIVE_T = A(17, 4), SAVE_T = A(17, 10);
const TEST_T = A(18), ASK_T = A(18, 4), PULSE_T = A(18, 10), HELLO_T = A(19, 4), ANSWER_T = A(20, 6);
function node(ctx, k, x, y, { sel = 0, glow = 0 } = {}) {
  const n = TX.flow[k], h = NODE_H[k], col = NODE_C[n.c];
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.07)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
  ctx.fillStyle = rgba(WHITE); rrect(ctx, x, y, NODE_W, h, 10); ctx.fill(); ctx.restore();
  ctx.strokeStyle = rgba(mix(UI_LINE, col, Math.max(sel, glow))); ctx.lineWidth = 1.5 + 1.5 * Math.max(sel, glow); rrect(ctx, x, y, NODE_W, h, 10); ctx.stroke();
  if (glow > 0) { ctx.save(); ctx.shadowColor = rgba(col, 0.6 * glow); ctx.shadowBlur = 24 * glow; ctx.strokeStyle = rgba(col, glow); ctx.lineWidth = 3; rrect(ctx, x, y, NODE_W, h, 10); ctx.stroke(); ctx.restore(); }
  tile(ctx, x + 14, y + 14, 34, col, n.icon);
  T(ctx, n.t, x + 60, y + 27, { w: 600, size: 13, fill: INK });
  if (n.t2) T(ctx, n.t2, x + 60, y + 43, { w: 600, size: 13, fill: INK });
  T(ctx, n.s, x + 60, y + (n.t2 ? 59 : 44), { w: 400, size: 10.5, fill: SUB });
  if (n.extra) {
    ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(x + 14, y + 62, NODE_W - 28, 1);
    n.extra.forEach((s, i) => T(ctx, s, x + 14, y + 82 + i * 15, { w: 400, size: 10.5, fill: [70, 74, 86] }));
    if (n.chip) { ctx.fillStyle = 'rgba(139,92,246,0.12)'; rrect(ctx, x + 14, y + 92, 88, 17, 8); ctx.fill(); T(ctx, n.chip, x + 58, y + 104, { w: 500, size: 9, fill: [124, 58, 237], a: 'center' }); }
  }
}
function edge(ctx, k, p, pulse = -1) {
  const col = NODE_C[TX.flow[k].c], ncol = NODE_C[TX.flow[k + 1].c];
  const x0 = NODE_X[k] + NODE_W + 8, y0 = NODE_Y + 42, x1 = NODE_X[k + 1] - 8, y1 = NODE_Y + 62;
  circle(ctx, x0 - 2, y0, 4, col);
  if (p <= 0) return;
  ctx.strokeStyle = 'rgb(176,178,188)'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i <= 20 * p; i++) {
    const u = i / 20, bx = (1 - u) ** 3 * x0 + 3 * (1 - u) ** 2 * u * (x0 + 18) + 3 * (1 - u) * u * u * (x1 - 18) + u ** 3 * x1;
    const by = (1 - u) ** 3 * y0 + 3 * (1 - u) ** 2 * u * y0 + 3 * (1 - u) * u * u * y1 + u ** 3 * y1;
    i ? ctx.lineTo(bx, by) : ctx.moveTo(bx, by);
  }
  ctx.stroke();
  if (p >= 1) circle(ctx, x1 + 2, y1, 4, ncol);
  if (pulse >= 0 && pulse <= 1) circle(ctx, lerp(x0, x1, pulse), lerp(y0, y1, E.inOutCubic(pulse)), 7, GREEN_D);
}
function field(ctx, x, y, label, value, typed, focus) {
  T(ctx, label, x, y, { w: 600, size: 14, fill: INK });
  ctx.fillStyle = rgba(WHITE); rrect(ctx, x, y + 8, 296, 43, 12); ctx.fill();
  ctx.strokeStyle = rgba(focus > 0 ? mix(UI_LINE, UI_GREEN, focus) : UI_LINE); ctx.lineWidth = 1.5 + focus; ctx.stroke();
  const s = value.slice(0, Math.round(value.length * typed));
  T(ctx, s, x + 14, y + 36, { w: 500, size: 16, fill: INK });
  if (focus > 0.5 && typed < 1.001 && Math.floor(FT * 3) % 2 === 0) { setFont(ctx, 500, 16, SANS); ctx.fillStyle = rgba(INK); ctx.fillRect(x + 16 + ctx.measureText(s).width, y + 20, 2, 20); }
}
function sidePanel(ctx, t, which) {
  const x = 1663;
  ctx.fillStyle = rgba(WHITE); ctx.fillRect(x, 158, 337, 900); ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(x, 158, 1.5, 900);
  if (which === 'kb') {
    const P = TX.kb;
    tile(ctx, 1684, 190, 40, NODE_C[5], 'book');
    T(ctx, P.title, 1739, 202, { w: 700, size: 17, fill: INK }); P.sub.forEach((s, i) => T(ctx, s, 1739, 222 + i * 19, { w: 400, size: 13, fill: SUB }));
    icon(ctx, 'trash', 1970, 211, 15, [90, 94, 106], 2);
    ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(x, 260, 337, 1.5);
    ctx.fillStyle = 'rgb(236,246,253)'; rrect(ctx, 1684, 279, 296, 73, 10); ctx.fill();
    icon(ctx, 'db', 1704, 300, 14, [14, 116, 144], 2.2); P.info.forEach((s, i) => T(ctx, s, 1718 - (i ? 21 : 0), 305 + i * 22, { w: 400, size: 13.5, fill: [14, 70, 100] }));
    P.fields.forEach(([label, value], i) => {
      const t0 = KB_FIELD[i], typed = prog(t, t0 + 0.15, t0 + 0.15 + value.length * 0.09), focus = clamp(prog(t, t0, t0 + 0.1) * (1 - prog(t, t0 + 0.9, t0 + 1.0)));
      field(ctx, 1684, 383 + i * 82, label, value, typed, focus);
    });
  } else if (which === 'gen') {
    const P = TX.gen;
    tile(ctx, 1684, 190, 40, NODE_C[2], 'chat');
    T(ctx, P.title, 1739, 202, { w: 700, size: 17, fill: INK }); T(ctx, P.sub[0], 1739, 222, { w: 400, size: 13, fill: SUB });
    icon(ctx, 'trash', 1970, 211, 15, [90, 94, 106], 2);
    ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(x, 260, 337, 1.5);
    P.fields.forEach(([label, value], i) => {
      const t0 = GEN_CLICK + 0.5 + i * 0.6, typed = prog(t, t0, t0 + 0.4), focus = clamp(prog(t, t0 - 0.05, t0) * (1 - prog(t, t0 + 0.5, t0 + 0.6)));
      field(ctx, 1684, 300 + i * 82, label, value, typed, focus);
      if (i === 0) icon(ctx, 'chev', 1955, 330, 11, SUB, 2);
    });
  } else {
    // test chat
    const P = TX.test;
    T(ctx, P.title, 1684, 202, { w: 700, size: 17, fill: INK });
    circle(ctx, 1690, 229, 5, CH_C[0]); T(ctx, P.channel, 1702, 234, { w: 500, size: 13, fill: SUB });
    ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(x, 260, 337, 1.5);
    ctx.fillStyle = 'rgb(239,234,226)'; ctx.fillRect(x + 1.5, 261.5, 336, 800);
    const msg = (t0, lines, mine, y) => {
      const a = t - t0;
      if (a < 0) return;
      const s = spring(a, 18, 9);
      setFont(ctx, 500, 14, SANS); const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 28, h = 16 + lines.length * 19;
      const bx = mine ? 1980 - w : 1684;
      ctx.save(); ctx.translate(mine ? 1980 : 1684, y); ctx.scale(s, s); ctx.translate(-(mine ? 1980 : 1684), -y);
      ctx.fillStyle = mine ? 'rgb(217,253,211)' : 'rgb(255,255,255)'; rrect(ctx, bx, y, w, h, 10); ctx.fill();
      lines.forEach((l, i) => T(ctx, l, bx + 14, y + 23 + i * 19, { w: 500, size: 14, fill: INK }));
      ctx.restore();
    };
    msg(ASK_T, [P.ask], true, 290);
    msg(HELLO_T, [P.hello], false, 350);
    if (t > HELLO_T + 0.3 && t < ANSWER_T) {                          // typing indicator
      ctx.fillStyle = rgba(WHITE); rrect(ctx, 1684, 410, 64, 32, 10); ctx.fill();
      for (let i = 0; i < 3; i++) circle(ctx, 1702 + i * 14, 426, 4, SUB, 0.4 + 0.6 * Math.max(0, Math.sin(t * 8 - i)));
    }
    msg(ANSWER_T, P.answer, false, 410);
  }
}
function editorPage(ctx, t) {
  ctx.fillStyle = rgba(WHITE); ctx.fillRect(0, 0, 2000, 1040);
  // collapsed sidebar
  ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(90, 0, 1.5, 1040);
  ctx.strokeStyle = rgba([59, 130, 246]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(45, 43, 21, 0, TAU); ctx.stroke(); icon(ctx, 'box', 45, 43, 14, INK, 2);
  circle(ctx, 45, 133, 30, [17, 20, 34]); circle(ctx, 45, 133, 20, [74, 222, 128]); icon(ctx, 'plus', 45, 133, 16, NAVY, 3);
  ctx.fillStyle = rgba([17, 20, 34]); rrect(ctx, 14, 191, 61, 47, 12); ctx.fill(); icon(ctx, 'robot', 45, 215, 18, WHITE, 2);
  ['link', 'store', 'book', 'spark', 'users', 'inbox', 'bolt', 'headset', 'chart', 'gear', 'box'].forEach((k, i) => icon(ctx, k, 45, [266, 318, 369, 421, 491, 543, 594, 645, 697, 766, 818][i], 18, [90, 94, 106], 1.8));
  appHeader(ctx, 119);
  // top bar
  icon(ctx, 'back', 122, 122, 20, INK, 2.2); tile(ctx, 150, 104, 36, [22, 163, 74], 'robot');
  T(ctx, TX.agentName, 201, 130, { w: 700, size: 20, fill: INK, ls: -0.3 });
  ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 1.5;
  rrect(ctx, 1488, 104, 115, 40, 12); ctx.stroke(); icon(ctx, 'gear', 1512, 124, 16, INK, 2); T(ctx, TX.settings, 1526, 130, { w: 500, size: 16, fill: INK });
  rrect(ctx, 1618, 104, 132, 40, 12); ctx.stroke(); icon(ctx, 'chart', 1641, 124, 16, INK, 2); T(ctx, TX.evaluation, 1656, 130, { w: 500, size: 16, fill: INK });
  T(ctx, TX.activeLbl, 1765, 130, { w: 500, size: 14, fill: SUB });
  const on = EASE.expo(prog(t, ACTIVE_T, ACTIVE_T + 0.3));
  ctx.fillStyle = rgba(mix([209, 213, 219], [34, 197, 94], on)); pill(ctx, 1840, 124, 46, 25); ctx.fill(); circle(ctx, 1828 + 23 * on, 124, 10, WHITE);
  const sp = pressAt(t, SAVE_T), ss = 1 - 0.05 * sp;
  ctx.save(); ctx.translate(1926, 123); ctx.scale(ss, ss); ctx.fillStyle = rgba(UI_GREEN); rrect(ctx, -49, -21, 99, 42, 10); ctx.fill();
  icon(ctx, 'save', -24, 0, 16, WHITE, 2.2); T(ctx, TX.save, -10, 7, { w: 600, size: 18, fill: WHITE }); ctx.restore();
  shockRing(ctx, 1926, 123, t, SAVE_T, { color: UI_GREEN, life: 0.45, radius: 120, width: 6 });
  ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(90, 158, 1910, 1.5);
  // node list
  T(ctx, TX.nodesLbl, 110, 189, { w: 600, size: 13, fill: SUB, ls: 1.5 });
  ctx.fillStyle = rgba(UI_LINE); ctx.fillRect(348, 158, 1.5, 900);
  TX.nodeList.forEach(([label, ic, c], i) => {
    const y = LIST_Y[i], h = i === 11 ? 62 : 56, picked = TX.flow.findIndex(f => f.list === i), hot = picked > 0 ? clamp(1 - Math.abs(t - (DROP_T(picked) - 0.55)) / 0.25) : 0;
    ctx.fillStyle = rgba(mix(WHITE, tint(NODE_C[c], 0.92), hot)); rrect(ctx, 106, y, 225, h, 16); ctx.fill();
    ctx.strokeStyle = rgba(mix(UI_LINE, NODE_C[c], hot)); ctx.lineWidth = 1.5; ctx.stroke();
    tile(ctx, 121, y + (h - 32) / 2, 32, NODE_C[c], ic);
    if (i === 11) { T(ctx, 'Search Knowledge', 165, y + 27, { w: 500, size: 15, fill: INK }); T(ctx, 'Base', 165, y + 46, { w: 500, size: 15, fill: INK }); }
    else T(ctx, label, 165, y + h / 2 + 5, { w: 500, size: 15, fill: INK });
  });
  // canvas
  ctx.save(); ctx.beginPath(); ctx.rect(350, 160, 1650, 900); ctx.clip();
  ctx.fillStyle = rgba(UI_CANVAS); ctx.fillRect(350, 160, 1650, 900);
  ctx.fillStyle = 'rgb(222,222,218)';
  for (let gx = 360; gx < 2000; gx += 22) for (let gy = 170; gy < 1050; gy += 22) ctx.fillRect(gx, gy, 1.6, 1.6);
  const selKB = t >= KB_CLICK && t < GEN_CLICK ? 1 : 0, selGen = t >= GEN_CLICK && t < TEST_T ? 1 : 0;
  for (let k = 0; k < 5; k++) {
    const d = t - DROP_T(k);
    if (k < 4) {
      const p = clamp((t - DROP_T(k + 1) - 0.05) / 0.3), pulse = (t - PULSE_T - k * 0.42 - 0.28) / 0.14;
      if (d > 0) edge(ctx, k, p, t > PULSE_T ? pulse : -1);
    }
    if (d < 0 && TX.flow[k].list < 0) continue;
    if (d < -0.6) continue;
    let x = NODE_X[k], y = NODE_Y, s = 1;
    if (TX.flow[k].list >= 0 && d < 0) {                            // being dragged from the list
      const e = EASE.expo(prog(d, -0.45, 0)), ly = LIST_Y[TX.flow[k].list];
      x = lerp(120, NODE_X[k], e); y = lerp(ly - 4, NODE_Y, e); s = lerp(0.95, 1.04, e);
      if (d < -0.45) continue;
    } else s = d < 0.4 ? 1 + 0.04 * wobble(d, 20, 9) : 1;
    if (TX.flow[k].list < 0) s = spring(d + 0.0001, 16, 8);
    const glow = t > PULSE_T ? clamp(1 - Math.abs(t - PULSE_T - k * 0.42) / 0.3) : 0;
    ctx.save(); ctx.translate(x + NODE_W / 2, y + NODE_H[k] / 2); ctx.scale(s, s); ctx.translate(-x - NODE_W / 2, -y - NODE_H[k] / 2);
    node(ctx, k, x, y, { sel: (k === 2 ? selKB : 0) + (k === 3 ? selGen : 0), glow });
    ctx.restore();
  }
  // zoom controls + minimap
  ctx.fillStyle = rgba(WHITE); rrect(ctx, 1950, 318, 32, 122, 6); ctx.fill(); ctx.strokeStyle = rgba(UI_LINE); ctx.stroke();
  ['plus', 'x', 'box', 'save'].forEach((k, i) => icon(ctx, k === 'x' ? 'back' : k, 1966, 334 + i * 31, 12, INK, 2));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 16; ctx.fillStyle = rgba(WHITE); rrect(ctx, 1707, 776, 278, 174, 6); ctx.fill(); ctx.restore();
  [[245, 158, 11], [139, 92, 246], [6, 182, 212], [34, 197, 94], [6, 182, 212]].forEach((c, i) => {
    if (t < DROP_T(i)) return;
    ctx.fillStyle = rgba(c); ctx.fillRect(1734 + i * 40, 855, 34, i === 1 || i === 3 ? 18 : 12);
  });
  ctx.restore();
  // side panel
  const panel = t >= TEST_T ? 'test' : t >= GEN_CLICK ? 'gen' : t >= KB_CLICK ? 'kb' : null;
  if (panel) {
    const t0 = panel === 'kb' ? KB_CLICK : panel === 'gen' ? GEN_CLICK : TEST_T, inn = panel === 'kb' ? EASE.expo(prog(t, t0 + 0.1, t0 + 0.6)) : 1;
    const sw = panel === 'kb' ? 1 : EASE.expo(prog(t, t0, t0 + 0.35));
    ctx.save(); ctx.translate((1 - inn) * 340, 0); ctx.beginPath(); ctx.rect(1663, 158, 337, 900); ctx.clip();
    if (sw < 1) { ctx.save(); ctx.globalAlpha = 1 - sw; sidePanel(ctx, t, panel === 'gen' ? 'kb' : 'gen'); ctx.restore(); }
    ctx.globalAlpha = sw; sidePanel(ctx, t, panel); ctx.restore();
  }
  // "Saved" toast
  const ta = prog(t, SAVE_T + 0.1, SAVE_T + 0.3) * (1 - prog(t, SAVE_T + 1.6, SAVE_T + 1.8));
  if (ta > 0) {
    ctx.save(); ctx.globalAlpha = ta; ctx.translate(0, (1 - ta) * -10);
    ctx.fillStyle = rgba([17, 20, 34]); rrect(ctx, 1810, 172, 160, 44, 12); ctx.fill(); circle(ctx, 1836, 194, 11, [74, 222, 128]); check(ctx, 1836, 194, 5, NAVY, 2.5);
    T(ctx, TX.saved, 1858, 200, { w: 600, size: 15, fill: WHITE }); ctx.restore();
  }
}
// app-space camera: [t, fx, fy, zoom] keys in app px; eased between keys (expo), so moves land on the beat
const CAM = [
  [A(8), 1000, 520, 1], [A(9, 2), 1000, 520, 1], [A(9, 6), 960, 560, 1.36], [A(10, 12), 960, 560, 1.36], [A(11, 6), 1076, 585, 1.78], [A(12, 12), 1076, 585, 1.84],
  [A(13, 4), 1400, 520, 1.4], [A(13, 12), 1411, 430, 2.0], [A(15, 14), 1411, 470, 2.0],
  [A(16, 4), 1400, 520, 1.5], [A(16, 14), 1411, 400, 2.0], [A(17, 2), 1439, 140, 2.1], [A(17, 15), 1439, 140, 2.1],
  [A(18, 4), 1307, 500, 1.7], [A(19, 4), 1307, 500, 1.72], [A(20, 4), 1363, 440, 1.85], [A(21, 15), 1380, 440, 1.9],
];
function appCam(t) {
  let i = 0;
  while (i < CAM.length - 1 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)], e = a === b ? 0 : EASE.expo(prog(t, a[0], b[0]));
  return { fx: lerp(a[1], b[1], e), fy: lerp(a[2], b[2], e), z: lerp(a[3], b[3], e) };
}
/** Pointer path in app px: [t, x, y] keys; clicks happen where the timeline says. */
const PTR = () => [
  [A(8, 2), 1500, 900], [A(8, 9), 1880, 186],
  [A(9, 3), 1300, 500], ...[1, 2, 3, 4].flatMap(k => [[DROP_T(k) - 0.6, 230, LIST_Y[TX.flow[k].list] + 28], [DROP_T(k), NODE_X[k] + 110, NODE_Y + 30]]),
  [KB_CLICK - 0.4, 1150, 640], [KB_CLICK, 1080, 575], [KB_FIELD[0] - 0.2, 1830, 430], [KB_FIELD[1] - 0.1, 1830, 512], [KB_FIELD[2] - 0.1, 1830, 594],
  [GEN_CLICK - 0.4, 1400, 640], [GEN_CLICK, 1320, 585], [GEN_CLICK + 0.5, 1830, 345],
  [ACTIVE_T - 0.4, 1800, 180], [ACTIVE_T, 1846, 128], [SAVE_T, 1930, 128], [TEST_T + 0.3, 1500, 760],
];
function pointerAt(t) {
  const P = PTR();
  let i = 0;
  while (i < P.length - 1 && t >= P[i + 1][0]) i++;
  const a = P[i], b = P[Math.min(i + 1, P.length - 1)], e = a === b ? 1 : EASE.expo(prog(t, a[0] + (b[0] - a[0]) * 0.35, b[0]));
  return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
}
function app(ctx, t, { out = 0 } = {}) {
  vgrad(ctx, BG, MINT); halo(ctx, t, 1);
  const enter = EASE.expo(prog(t, A(8), A(8, 5)));
  const c = appCam(Math.min(t, A(22))), z = lerp(c.z, 0.5, out);
  const wx = AX + c.fx * APP, wy = AY + c.fy * APP, cx = lerp(wx, AX + 1000 * APP, out), cy = lerp(wy, AY + 520 * APP, out);
  ctx.save();
  ctx.translate(W / 2, H / 2 + (1 - enter) * 700); ctx.scale(z, z); ctx.translate(-cx, -cy);
  const editor = t >= A(9);
  windowChrome(ctx, editor ? 'app.dotkesk.com/agents/7212…cb33' : 'app.dotkesk.com/agents');
  ctx.save(); rrect(ctx, WX, AY, WW, WH - BAR, [0, 0, 20, 20]); ctx.clip();
  ctx.translate(AX, AY); ctx.scale(APP, APP);
  const sw = EASE.expo(prog(t, A(9) - 0.25, A(9) + 0.2));
  if (!editor || sw < 1) { ctx.save(); ctx.globalAlpha = editor ? 1 - sw : 1; agentsPage(ctx, t, t - A(8)); ctx.restore(); }
  if (editor) { ctx.save(); ctx.globalAlpha = sw; ctx.translate((1 - sw) * 60, 0); editorPage(ctx, t); ctx.restore(); }
  const [px, py] = pointerAt(t);
  const press = Math.max(pressAt(t, A(8, 10)), pressAt(t, KB_CLICK), pressAt(t, GEN_CLICK), pressAt(t, ACTIVE_T), pressAt(t, SAVE_T),
    ...[1, 2, 3, 4].map(k => clamp(prog(t, DROP_T(k) - 0.55, DROP_T(k) - 0.5) * (1 - prog(t, DROP_T(k) - 0.02, DROP_T(k))))));
  const pa = prog(t, A(8, 2), A(8, 4)) * (1 - prog(t, TEST_T + 0.3, TEST_T + 0.6));
  if (pa > 0) { ctx.save(); ctx.globalAlpha = pa; cursor(ctx, px, py, 1.25 / Math.max(1, c.z * 0.8), press); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}

// ───────────────────────────── 4 · the mark pops out (bar 22), six cards (bars 23–28), CTA (bar 29), end card (30–31)
function popOut(ctx, t) {
  app(ctx, t, { out: EASE.expo(prog(t, A(22), A(22, 6))) });
  const d = t - A(22, 6), s = spring(d, 14, 8), cx = W / 2, cy = 470 - 80 * EASE.expo(prog(d, 0, 0.5));
  if (d > 0) { badge(ctx, cx, cy, 200, { spin: t * 0.08, scale: s }); shockRing(ctx, cx, cy, t, A(22, 6), { color: GREEN_D, life: 0.5, radius: 300, width: 12 }); }
  const q = E.inOutCubic(prog(t, A(22, 10), A(23)));
  if (q > 0) {
    const far = Math.hypot(W, H) + 10;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(mix(LIME, WHITE, 0.35))); g.addColorStop(1, rgba(mix(GREEN, WHITE, 0.35)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, lerp(100, far, q), 0, TAU); ctx.fill();
  }
}
function illustration(ctx, k, lt) {
  const lp = lt % 2;
  if (k === 0) {
    [[90, 200], [250, 200], [410, 200]].forEach(([x, y], i) => {
      ctx.fillStyle = rgba(WHITE); rrect(ctx, x, y, 110, 54, 10); ctx.fill(); ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 2; ctx.stroke();
      tile(ctx, x + 10, y + 11, 32, NODE_C[[7, 5, 2][i]], ['bolt', 'book', 'chat'][i]);
      ctx.fillStyle = rgba(INK, 0.5); rrect(ctx, x + 50, y + 18, 48, 7, 3); ctx.fill(); ctx.fillStyle = rgba(INK, 0.2); rrect(ctx, x + 50, y + 31, 36, 6, 3); ctx.fill();
      if (i < 2) { ctx.strokeStyle = 'rgb(176,178,188)'; ctx.beginPath(); ctx.moveTo(x + 110, y + 27); ctx.lineTo(x + 160, y + 27); ctx.stroke(); }
    });
    const u = (lt * 0.8) % 1;
    circle(ctx, lerp(200, 410, u > 0.5 ? (u - 0.5) * 2 : u * 2) + (u > 0.5 ? 0 : 0), 227, 7, GREEN_D);
  } else if (k === 1) {
    for (let i = 0; i < 3; i++) { ctx.fillStyle = rgba(WHITE); rrect(ctx, 130 + i * 16, 150 + i * 14, 170, 200 - i * 10, 10); ctx.fill(); ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 2; ctx.stroke(); }
    for (let j = 0; j < 6; j++) { const hl = Math.floor(lp * 3) === j % 3 && j > 1; ctx.fillStyle = rgba(hl ? LIME : [220, 222, 226]); rrect(ctx, 178, 200 + j * 22, j % 2 ? 90 : 110, 9, 4); ctx.fill(); }
    const mx = 380 + Math.sin(lt * 2) * 30, my = 230 + Math.cos(lt * 2) * 14;
    ctx.strokeStyle = rgba(NAVY); ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(mx, my, 42, 0, TAU); ctx.stroke(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx + 30, my + 30); ctx.lineTo(mx + 66, my + 66); ctx.stroke();
  } else if (k === 2) {
    ctx.strokeStyle = rgba(INK, 0.25); ctx.lineWidth = 4; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(80, 260); ctx.lineTo(500, 260); ctx.stroke(); ctx.setLineDash([]);
    const x = lerp(90, 420, E.inOutCubic(lp / 2));
    ctx.fillStyle = rgba(NODE_C[3]); rrect(ctx, x, 200, 70, 46, 6); ctx.fill(); rrect(ctx, x + 70, 214, 30, 32, 6); ctx.fill();
    circle(ctx, x + 18, 252, 10, NAVY); circle(ctx, x + 80, 252, 10, NAVY);
    ctx.fillStyle = rgba(GREEN_D); ctx.beginPath(); ctx.arc(510, 205, 20, Math.PI, TAU); ctx.lineTo(510, 245); ctx.closePath(); ctx.fill(); circle(ctx, 510, 205, 7, WHITE);
  } else if (k === 3) {
    const u = EASE.expo(clamp((lp - 0.3) / 0.8));
    circle(ctx, 450, 230, 50, mix(MINT, LIME, 0.4)); circle(ctx, 450, 214, 18, NAVY); ctx.fillStyle = rgba(NAVY); ctx.beginPath(); ctx.arc(450, 262, 30, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = rgba(WHITE); rrect(ctx, lerp(90, 270, u), 190, 130, 70, 16); ctx.fill(); ctx.strokeStyle = rgba(NAVY); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = rgba(INK, 0.35); rrect(ctx, lerp(90, 270, u) + 18, 212, 90, 8, 4); ctx.fill(); rrect(ctx, lerp(90, 270, u) + 18, 232, 60, 8, 4); ctx.fill();
  } else if (k === 4) {
    for (let i = 0; i < 6; i++) {
      const s = spring(lp - i * 0.08, 16, 8), x = 120 + (i % 3) * 125, y = 160 + Math.floor(i / 3) * 95;
      ctx.save(); ctx.translate(x + 50, y + 38); ctx.scale(s, s); ctx.fillStyle = rgba(WHITE); rrect(ctx, -50, -38, 100, 76, 10); ctx.fill(); ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 2; ctx.stroke();
      tile(ctx, -40, -28, 26, NODE_C[[0, 2, 3, 5, 6, 8][i]], ['msg', 'chat', 'truck', 'book', 'headset', 'route'][i]); ctx.fillStyle = rgba(INK, 0.25); rrect(ctx, -40, 10, 70, 7, 3); ctx.fill(); ctx.restore();
    }
  } else {
    ctx.strokeStyle = rgba(UI_LINE); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(90, 330); ctx.lineTo(510, 330); ctx.stroke();
    const pts = [[90, 300], [170, 280], [250, 290], [330, 230], [410, 210], [510, 170]], dr = EASE.expo(clamp(lp / 1.2)) * (pts.length - 1);
    ctx.strokeStyle = rgba(GREEN_D); ctx.lineWidth = 6; ctx.lineJoin = ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i <= Math.floor(dr); i++) i ? ctx.lineTo(...pts[i]) : ctx.moveTo(...pts[i]);
    const f = dr % 1, i0 = Math.floor(dr);
    if (i0 < pts.length - 1) ctx.lineTo(lerp(pts[i0][0], pts[i0 + 1][0], f), lerp(pts[i0][1], pts[i0 + 1][1], f));
    ctx.stroke();
    pts.forEach((p, i) => { if (i <= dr) circle(ctx, p[0], p[1], 8, LIME); });
  }
}
function features(ctx, t) {
  vgrad(ctx, mix(LIME, WHITE, 0.35), mix(GREEN, WHITE, 0.35));
  const k = Math.min(5, Math.floor((t - A(23)) / A(1))), lt = t - A(23 + k), left = k % 2 === 0;
  const inn = spring(lt, 12, 9), out = E.inBack(prog(lt, 1.74, 2.0), 2);
  const side = left ? -1 : 1, cx = (left ? 560 : 1360) + side * ((1 - inn) * 900 + out * 1300), cy = 500;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-side * 0.04 + side * (1 - clamp(inn)) * 0.3); ctx.transform(0.94, -side * 0.08, 0, 1, 0, 0); ctx.translate(-300, -220);
  ctx.fillStyle = 'rgba(20,60,10,0.16)'; rrect(ctx, 16, 22, 600, 440, 30); ctx.fill();
  ctx.fillStyle = rgba(WHITE); rrect(ctx, 0, 0, 600, 440, 30); ctx.fill(); ctx.strokeStyle = rgba(NAVY, 0.9); ctx.lineWidth = 4; ctx.stroke();
  badge(ctx, 62, 72, 30, { spin: lt * 0.1 });
  T(ctx, TX.cards[k], 90, 86, { w: 700, size: 38, fill: GREEN_D, ls: -0.6 });
  illustration(ctx, k, lt);
  ctx.restore();
  const [a, b] = TX.features[k], tx = left ? 1010 : 910, align = left ? 'left' : 'right';
  const s1 = fitFont(ctx, a, 820, 200, 800, SANS, -0.04), s2 = fitFont(ctx, b, 820, 170, 800, SANS, -0.04);
  const base1 = 460, base2 = base1 + s2 * 1.02;
  [[a, s1, base1, true, 0.06], [b, s2, base2, false, 0.14]].forEach(([str, size, base, outline, d]) => {
    const e = EASE.expo(prog(lt, d, d + 0.6)), o = E.inBack(prog(lt, 1.72 + d * 0.3, 2.0), 1.6);
    setFont(ctx, 800, size, SANS, -size * 0.04); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.save(); ctx.beginPath(); ctx.rect(-80, base - size * 0.95, W + 160, size * 1.25); ctx.clip();
    const y = base + (1 - e) * size * 1.05 - o * size * 1.05;
    if (outline) { ctx.lineWidth = 3.5; ctx.strokeStyle = rgba(NAVY); ctx.lineJoin = 'round'; ctx.strokeText(str, tx, y); }
    else { ctx.fillStyle = rgba(NAVY); ctx.fillText(str, tx, y); }
    ctx.restore();
  });
}
function cta(ctx, t) {
  vgrad(ctx, mix(LIME, WHITE, 0.35), mix(GREEN, WHITE, 0.35));
  const lt = t - A(29), [l1, l2] = TX.cta;
  T(ctx, l1, W / 2, 450, { w: 600, size: 60, fill: NAVY, a: 'center', alpha: EASE.expo(prog(lt, 0, 0.4)) });
  const font = `800 150px ${SANS}`, L = layout(ctx, l2, font, -6), x0 = W / 2 - L.total / 2, base = 610;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - 160, W, 200); ctx.clip(); ctx.font = font; ctx.letterSpacing = '-6px'; ctx.textAlign = 'left'; ctx.fillStyle = rgba(NAVY);
  for (let i = 0; i < l2.length; i++) ctx.fillText(l2[i], x0 + L.xs[i], base + (1 - EASE.expo(prog(lt, 0.1 + i * 0.03, 0.65 + i * 0.03))) * 170);
  ctx.restore();
  const click = A(29, 10), cin = EASE.expo(prog(t, A(29, 4), A(29, 9))), px = x0 + L.total + 40, py = base - 30;
  shockRing(ctx, px, py, t, click, { color: NAVY, life: 0.45, radius: 220, width: 12 });
  cursor(ctx, lerp(1760, px, cin), lerp(1140, py, cin), 1.6, pressAt(t, click));
  discCover(ctx, W, H, px, py, E.inOutCubic(prog(t, A(29, 12), A(30))), BG, 0);
}
function endCard(ctx, t) {
  vgrad(ctx, BG, SKY);
  const lt = t - A(30), g = lockupGeom(ctx, W / 2, 560, 160);
  const s = spring(lt, 13, 8);
  badge(ctx, g.bx, g.by, g.d, { spin: t * 0.06 - 0.4 * (1 - clamp(lt / 1.2)), sphere: clamp(s, 0, 1.2), rings: clamp(lt / 1.0), scale: clamp(spring(lt, 15, 9), 0, 1.2) });
  shockRing(ctx, g.bx, g.by, t, A(30), { color: GREEN_D, life: 0.6, radius: 360, width: 12 });
  nameLetters(ctx, g, lt - 0.35);
  const e1 = EASE.expo(prog(lt, 0.9, 1.5)), e2 = EASE.expo(prog(lt, 1.3, 1.9));
  T(ctx, TX.tagline, g.tx + 4, 640 + (1 - e1) * 20, { w: 700, size: 30, fill: GREEN_D, ls: 5, alpha: e1 });
  T(ctx, TX.url, W / 2, 790 + (1 - e2) * 24, { w: 700, size: 44, fill: NAVY, a: 'center', alpha: e2, ls: -1 });
}

const HITS = () => [[A(4) + 0.2, 6], [A(23), 8], [A(30), 5]];

export default {
  setup(api) {
    W = api.W; H = api.H; A = api.at; TX = COPY[api.lang] ?? COPY.en;
    CAPS = CAP_AT.map(([[b0, s0], [b1, s1]]) => [A(b0, s0), A(b1, s1)]);
  },
  draw(ctx, t, api) {
    FT = api.frameT ?? t;
    const [sx, sy] = shake(t, HITS());
    ctx.save(); ctx.translate(sx, sy);
    if (t < A(6, 8)) night(ctx, t);
    else if (t < A(8)) lockup(ctx, t);
    else if (t < A(22)) app(ctx, t);
    else if (t < A(23)) popOut(ctx, t);
    else if (t < A(29)) features(ctx, t);
    else if (t < A(30)) cta(ctx, t);
    else endCard(ctx, t);
    ctx.restore();
    caption(ctx, t);
  },
};
