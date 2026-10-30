// lemo/setup.mjs: install the lemo toolkit's dependencies on Windows, macOS or Linux (the upstream setup.sh assumes macOS/Linux paths).
//   node ft.mjs lemo setup [voice] [music]
// core:  npm packages (playwright-core, three) · a Python .venv with numpy, scipy, soundfile, soxr, pillow · a `.venv/bin/python` shim on Windows
// voice: also kokoro-onnx, edge-tts, faster-whisper and the Kokoro model (~0.55 GB). music: also numba.
// The renderer uses the Chrome you already have (PLAYWRIGHT_CHROME is set for you by `node ft.mjs lemo …`), so no browser is downloaded.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB = path.dirname(fileURLToPath(import.meta.url));
const tiers = process.argv.slice(2).filter(t => ['voice', 'music'].includes(t));
const win = process.platform === 'win32';
const run = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, { cwd: LIB, stdio: 'inherit', shell: win && /\.cmd$|^npm$/.test(cmd), ...opts }); if (r.status) { console.error(`\n  ✖ ${cmd} ${args.join(' ')} failed`); process.exit(1); } return r; };
const has = (cmd, args = ['--version']) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;

console.log('\n  lemo setup\n');
if (!has('ffmpeg', ['-version'])) console.log('  ! ffmpeg not found on PATH (needed to mux and master)');
if (Number(process.versions.node.split('.')[0]) < 20) console.log(`  ! Node 20+ is recommended (found ${process.version})`);

console.log('  → npm packages');
run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error']);

const py = ['python3.12', 'python3.13', 'python3.11', 'python', 'py'].find(c => has(c, ['-c', 'import sys; sys.exit(sys.version_info < (3, 11))']));
if (!py) { console.error('  ✖ Python 3.11+ is needed'); process.exit(1); }
const venvPy = path.join(LIB, '.venv', win ? 'Scripts/python.exe' : 'bin/python');
if (!fs.existsSync(venvPy)) { console.log('  → Python venv'); run(py, ['-m', 'venv', '.venv']); }
const reqs = ['requirements.txt', ...tiers.map(t => `requirements-${t}.txt`)];
for (const r of reqs) { console.log(`  → pip install -r ${r}`); run(venvPy, ['-m', 'pip', 'install', '--quiet', '--disable-pip-version-check', '-r', r]); }

if (win) {   // the guides say `.venv/bin/python`; under Git Bash / sh this shim forwards to the Windows venv
  const shim = path.join(LIB, '.venv', 'bin', 'python');
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  fs.writeFileSync(shim, '#!/bin/sh\nexec "$(dirname "$0")/../Scripts/python.exe" "$@"\n', { mode: 0o755 });
}
if (tiers.includes('voice') && !(fs.existsSync(path.join(LIB, 'core/tts/kokoro-v1.0.onnx')) && fs.existsSync(path.join(LIB, 'core/tts/voices-v1.0.bin')))) {
  console.log('  → Kokoro voice model (~350 MB)'); run('sh', ['tools/fetch.sh', 'voice']);
}
console.log('\n  ✓ done. Run tools with:  node ft.mjs lemo node core/render/still.mjs films/<name> 1.5 3\n');
