#!/usr/bin/env node
// ft-motion CLI
//   node ft.mjs new <name>                         scaffold examples/<name> from templates/blank
//   node ft.mjs preview <project>                  live player in your browser (space, ←/→, b)
//   node ft.mjs stills <project> <f,f,f|t1s,t2s>   PNG stills at frames (or seconds with an "s" suffix)
//   node ft.mjs sheet <project> [count]            evenly spaced stills tiled into out/sheet.png
//   node ft.mjs render <project>                   out/<name>.mp4 (muxes out/audio.wav if present)
// options: --lang xx  --sub N (motion-blur subframes)  --crf N  --out file.mp4
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

const [cmd, target, ...rest] = process.argv.slice(2);
const opt = (name, def) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : def; };
const die = msg => { console.error(`\n  ✖ ${msg}\n`); process.exit(1); };
if (!cmd || cmd === 'help' || cmd === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 9).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }

if (cmd === 'new') {
  if (!target) die('usage: node ft.mjs new <name>');
  const dst = path.join(ROOT, 'examples', target);
  if (fs.existsSync(dst)) die(`${path.relative(ROOT, dst)} already exists`);
  fs.cpSync(path.join(ROOT, 'templates', 'blank'), dst, { recursive: true });
  const pj = path.join(dst, 'project.json');
  fs.writeFileSync(pj, fs.readFileSync(pj, 'utf8').replace('"blank"', JSON.stringify(target)));
  console.log(`created examples/${target} — next: node ft.mjs preview examples/${target}`);
  process.exit(0);
}

if (!target) die(`usage: node ft.mjs ${cmd} <project-folder>`);
const PROJ = path.resolve(ROOT, target);
const rel = path.relative(ROOT, PROJ).split(path.sep).join('/');
if (rel.startsWith('..')) die('the project folder must live inside this repository');
if (!fs.existsSync(path.join(PROJ, 'project.json'))) die(`no project.json in ${rel}`);
const cfg = JSON.parse(fs.readFileSync(path.join(PROJ, 'project.json'), 'utf8'));
const FPS = cfg.fps ?? 60, FRAMES = Math.round(cfg.duration * FPS), lang = opt('lang', null);
const OUT = path.join(PROJ, 'out');
fs.mkdirSync(OUT, { recursive: true });

// ───────────── static server over the repo root
const server = http.createServer((req, res) => {
  const p = path.resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(cmd === 'preview' ? Number(opt('port', 5177)) : 0, '127.0.0.1', r));
const port = server.address().port;
const pageUrl = (extra = '') => `http://127.0.0.1:${port}/engine/player.html?project=${encodeURIComponent(rel)}${lang ? `&lang=${lang}` : ''}${extra}`;

if (cmd === 'preview') {
  console.log(`\n  ▶ ${pageUrl()}\n    space play/pause · ←/→ frame · shift+←/→ second · b motion blur · &t=3.5 to freeze\n    (edit scene.js and reload — Ctrl+C to stop)\n`);
  const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', pageUrl()]] : process.platform === 'darwin' ? ['open', [pageUrl()]] : ['xdg-open', [pageUrl()]];
  if (!process.env.FT_NO_OPEN) spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).on('error', () => {});
} else {
  await headless();
}

async function headless() {
  const chrome = findChrome();
  if (!chrome) die('Chrome/Chromium/Edge not found — set CHROME_PATH to its executable');
  let puppeteer;
  try { puppeteer = (await import('puppeteer-core')).default; } catch { die('run `npm install` first'); }
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--force-device-scale-factor=1', '--disable-gpu', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: cfg.width, height: cfg.height });
  page.on('pageerror', e => console.error('[scene error]', e.message));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.error(`[scene ${m.type()}]`, m.text()); });
  await page.goto(pageUrl('&render=1'));
  await page.waitForFunction('window.__ready || window.__error', { timeout: 60000 });
  const err = await page.evaluate(() => window.__error);
  if (err) { await browser.close(); server.close(); die(err); }
  const SUB = Number(opt('sub', cfg.subframes ?? 6));
  const grab = async f => Buffer.from(await page.evaluate((f, S) => { renderFrame(f, S); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, f, SUB), 'base64');

  if (cmd === 'stills' || cmd === 'sheet') {
    let frames;
    if (cmd === 'sheet') {
      const n = Number(rest.find(a => /^\d+$/.test(a)) ?? 12);
      frames = Array.from({ length: n }, (_, i) => Math.min(FRAMES - 1, Math.round(((i + 0.5) / n) * FRAMES)));
    } else {
      const list = rest.find(a => !a.startsWith('--') && a !== opt('lang') && a !== opt('sub'));
      if (!list) die('usage: node ft.mjs stills <project> 0,90,180  (or 1.5s,4s)');
      frames = list.split(',').map(s => (s.endsWith('s') ? Math.round(parseFloat(s) * FPS) : Number(s)));
    }
    const dir = path.join(OUT, 'stills');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const files = [];
    for (const f of frames) {
      const file = path.join(dir, `f${String(f).padStart(5, '0')}.png`);
      fs.writeFileSync(file, await grab(f));
      files.push(file);
      console.log(`  still ${f}  (${(f / FPS).toFixed(2)}s)`);
    }
    if (cmd === 'sheet' || rest.includes('--sheet')) {
      const cols = Math.min(files.length, cfg.width >= cfg.height ? 4 : 6), rows = Math.ceil(files.length / cols);
      const seq = fs.mkdtempSync(path.join(os.tmpdir(), 'ft-'));
      files.forEach((f, i) => fs.copyFileSync(f, path.join(seq, `${String(i).padStart(3, '0')}.png`)));
      const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(seq, '%03d.png'), '-vf', `scale=${Math.round(1600 / cols)}:-1,tile=${cols}x${rows}:padding=6:color=0x444444`, '-frames:v', '1', path.join(OUT, 'sheet.png')], { stdio: 'inherit' });
      fs.rmSync(seq, { recursive: true, force: true });
      if (r.status === 0) console.log(`  → ${path.relative(ROOT, path.join(OUT, 'sheet.png'))}`);
    }
  } else if (cmd === 'render') {
    const name = opt('out', `${cfg.name ?? path.basename(PROJ)}${lang ? `-${lang}` : ''}.mp4`);
    const outFile = path.isAbsolute(name) ? name : path.join(OUT, name);
    const wav = path.join(OUT, cfg.audio ?? 'audio.wav');
    const hasAudio = fs.existsSync(wav);
    if (!hasAudio) console.log(`  (no ${path.relative(ROOT, wav)} — rendering silent; run the project's sound.py first for audio)`);
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      ...(hasAudio ? ['-i', wav] : []),
      '-vf', 'format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(opt('crf', 16)), '-maxrate', '24M', '-bufsize', '48M', '-profile:v', 'high',
      '-g', String(FPS), '-r', String(FPS),
      ...(hasAudio ? ['-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest'] : ['-an']),
      '-movflags', '+faststart', outFile,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.on('error', () => die('ffmpeg not found on PATH'));
    const t0 = Date.now();
    for (let f = 0; f < FRAMES; f++) {
      const buf = await grab(f);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % FPS === 0) process.stdout.write(`\r  frame ${f}/${FRAMES}  ${((Date.now() - t0) / 1000).toFixed(0)}s   `);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log(`\n  → ${path.relative(ROOT, outFile)}  (${(fs.statSync(outFile).size / 1e6).toFixed(1)} MB)`);
  } else die(`unknown command: ${cmd}`);
  await browser.close();
  server.close();
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const c = {
    win32: [
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ],
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'],
  }[process.platform] ?? [];
  return c.find(p => p && fs.existsSync(p));
}
