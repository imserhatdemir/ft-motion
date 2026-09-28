#!/usr/bin/env node
// Lay the BEFORE and AFTER renders over the two slots of the edit-demo panel and mix their sound.
//   node ft.mjs render examples/edit-demo            (panel: prompt, steps, diff, frames; needs out/audio.wav from sound.py)
//   node examples/edit-demo/compose.mjs --before before.mp4 --after after.mp4 [--out final.mp4]
// Both videos are scaled to the slot and held on their first / last frame, so they can have different lengths and tempos.
// The panel keeps its own UI sounds; the AFTER video's soundtrack is mixed in from `videoStart`.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const die = msg => { console.error('✖ ' + msg); process.exit(1); };

const meta = JSON.parse(fs.readFileSync(path.join(here, 'case', 'meta.json'), 'utf8'));
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'project.json'), 'utf8'));
const before = arg('before'), after = arg('after');
if (!before || !after) die('usage: node examples/edit-demo/compose.mjs --before before.mp4 --after after.mp4 [--panel out/edit-demo.mp4] [--out out/edit-demo-final.mp4]');
const panel = arg('panel', path.join(here, 'out', 'edit-demo.mp4')), out = arg('out', path.join(here, 'out', 'edit-demo-final.mp4'));
for (const f of [panel, before, after]) if (!fs.existsSync(f)) die(`not found: ${f}`);

const V0 = meta.videoStart, total = cfg.duration, SLOT = 510, Y = 800, X = [20, 550];
const hold = seconds => Math.max(0, total - V0 - seconds + 0.25).toFixed(3);       // freeze on the last frame until the panel ends
// the reel fades to its start colour in the last 0.2 s (for a seamless loop); trim that so the frozen frame is the end card
const slot = (i, seconds) => `[${i}:v]trim=end=${(seconds - 0.25).toFixed(3)},setpts=PTS-STARTPTS,scale=${SLOT}:${SLOT}:flags=lanczos,setsar=1,tpad=start_duration=${V0}:start_mode=clone:stop_duration=${hold(seconds)}:stop_mode=clone`;
const ms = Math.round(V0 * 1000);
const filter = [
  `${slot(1, meta.before.seconds)}[vb]`,
  `${slot(2, meta.after.seconds)}[va]`,
  `[0:v][vb]overlay=${X[0]}:${Y}[v1]`,
  `[v1][va]overlay=${X[1]}:${Y},format=yuv420p[v]`,
  `[2:a]adelay=${ms}|${ms}[aa]`,
  `[0:a][aa]amix=inputs=2:normalize=0:duration=first,volume=1.15,alimiter=limit=0.80:level=0[aout]`,
].join(';');

fs.mkdirSync(path.dirname(out), { recursive: true });
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', panel, '-i', before, '-i', after, '-filter_complex', filter,
  '-map', '[v]', '-map', '[aout]', '-t', String(total), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (r.status !== 0) die('ffmpeg failed (does the panel have an audio track? run examples/edit-demo/sound.py, then render the panel again)');
console.log(`  → ${path.relative(process.cwd(), out)}  (${total.toFixed(1)} s)`);
