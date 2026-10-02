# ft-motion

**Motion graphics as a pure function of time.** You write scenes as `draw(ctx, t)` in plain Canvas 2D. They render in headless Chrome with real motion blur, get encoded with ffmpeg, and are scored with sound synthesized in Python on the same beat grid. There's no timeline editor, no keyframes and no plugins, which makes it a good fit for coding agents: describe the video, review the storyboard, get an mp4.

![Contact sheet of examples/hello](docs/preview.jpg)

*Frames from [`examples/hello`](examples/hello): kinetic type → dot field → 3D landscape → shape morph → spring UI → glass end card.*

[Türkçe README](README.tr.md)

## Why

- **Deterministic.** Every frame depends only on `t`, so any frame can be rendered, inspected and fixed in isolation.
- **Real motion blur.** Each output frame averages 6 subframes across a 180° shutter, and hard cuts stay hard.
- **Sound locked to picture.** `audio/ftsynth.py` builds drums, pads, UI foley, whooshes and risers from numpy on the same clock. Risers land exactly on the drop. Mastering targets -14 LUFS.
- **Built for agents.** [`prompts/VIDEO_BRIEF.md`](prompts/VIDEO_BRIEF.md) is a complete brief-to-delivery prompt (research → concepts → beat-grid storyboard → build → visual QA → sound → render). [`CLAUDE.md`](CLAUDE.md) gives the house rules.

## Requirements

- Node.js 18+
- Python 3.10+ with `numpy` and `scipy` (`pip install -r requirements.txt`)
- ffmpeg on your `PATH`
- Google Chrome, Chromium or Microsoft Edge (auto-detected, or set `CHROME_PATH`)

## Quick start

```bash
npm install
pip install -r requirements.txt

node ft.mjs preview examples/hello        # live preview in your browser
node ft.mjs sheet examples/hello 12       # contact sheet → examples/hello/out/sheet.png
python examples/hello/sound.py            # soundtrack → examples/hello/out/audio.wav
node ft.mjs render examples/hello         # → examples/hello/out/hello.mp4
```

Start your own:

```bash
node ft.mjs new launch-teaser             # copies templates/blank → examples/launch-teaser
node ft.mjs preview examples/launch-teaser
```

## Make a video with an agent

1. Open this repo in Claude Code (or another coding agent).
2. Paste [`prompts/VIDEO_BRIEF.md`](prompts/VIDEO_BRIEF.md) (Turkish: [`VIDEO_BRIEF.tr.md`](prompts/VIDEO_BRIEF.tr.md)), fill in the brief, and attach your logo, screenshots and website URL.
3. Pick a concept and approve the storyboard. The agent builds, checks its own frames, scores the sound and renders.

## A scene in 20 lines

```js
// examples/my-video/scene.js
import { prog, rgba, EASE, spring, setFont, TAU } from '../../engine/core.js';

export default {
  draw(ctx, t, api) {
    const { W, H } = api;
    ctx.fillStyle = '#0c0c0e'; ctx.fillRect(0, 0, W, H);

    const p = EASE.expo(prog(t, 0.1, 0.9));                 // 0→1 between 0.1 s and 0.9 s
    setFont(ctx, 700, 120, 'Inter', -4); ctx.textAlign = 'center';
    ctx.save(); ctx.beginPath(); ctx.rect(0, H / 2 - 130, W, 175); ctx.clip();
    ctx.fillStyle = '#f0f0ec'; ctx.fillText('Hello.', W / 2, H / 2 + 40 + (1 - p) * 150);
    ctx.restore();

    const s = spring(t - api.at(1), 16, 7);                 // springs in on bar 1
    ctx.fillStyle = '#ff6a3d'; ctx.beginPath(); ctx.arc(W / 2, H / 2 + 160, 18 * s, 0, TAU); ctx.fill();
  },
};
```

`project.json` sets the canvas, timing and fonts:

```json
{
  "name": "my-video", "width": 1080, "height": 1080, "fps": 60, "duration": 15,
  "bpm": 160, "speed": 1, "subframes": 6,
  "fonts": { "css": ["@fontsource/inter/700.css"], "preload": ["700 40px Inter"] }
}
```

- `bpm` defines the grid: `api.at(bar, step)` gives scene time, and at 160 BPM one bar is 1.5 s.
- `speed` stretches the whole choreography. `0.75` turns a 15 s cut into 20 s, and the sound follows.
- Fonts: any `@fontsource/*` package (`npm i @fontsource/<font>`), or CSS files inside the project folder.

## CLI

| Command | What it does |
|---|---|
| `node ft.mjs new <name>` | scaffold `examples/<name>` |
| `node ft.mjs preview <project>` | live player: space play/pause, ←/→ frame, shift+←/→ second, `b` motion blur, `&t=3.5` to freeze |
| `node ft.mjs stills <project> 0,90,2.5s` | full-size PNGs at frames or seconds |
| `node ft.mjs sheet <project> [n]` | `n` evenly spaced stills tiled into `out/sheet.png` |
| `node ft.mjs render <project>` | mp4 (H.264, yuv420p, faststart; muxes `out/audio.wav` if present) |

Options: `--lang xx` (passed to the scene as `api.lang`), `--sub N` (motion-blur subframes), `--crf N`, `--out name.mp4`.

## Layout

```
engine/core.js        helpers + motion-blur runtime
engine/fx.js          transitions, glitch, bloom, aberration, HUD, code window
engine/recipes.js     tunnel, dot sphere, easing graph, ripple dots
engine/three.js       three.js bridge: offscreen WebGL, cel shading, ink outlines, sweep tubes
engine/brand.js       brand kit: palette from 3 colours, safe areas, text fitting, logo / monogram
engine/player.html    loads a project's fonts + scene (preview and render)
ft.mjs                CLI: static server, headless Chrome, ffmpeg
audio/ftsynth.py      synthesis, timeline mixer, reverb, sidechain, mastering
audio/ftextras.py     stamp, counter ticks, echo, glitch burst
templates/blank/      starting point for `new`
examples/hello/       reference scene + soundtrack
examples/reel/        15 s showcase reel: wipes, glitch, tunnel, dot sphere, easing graph, typed code (TR / EN)
examples/edit-demo/   an edit request, its real git diff and the before / after renders side by side
examples/cat-crossing/ 3D cartoon short (three.js): a cat crossing a busy street
examples/chat-commerce/ conversational-commerce promo: chat demo, manifesto, inbox, dots → logo, glass end card
examples/motion-principles/ kinetic manifesto: code → dot landscape → timing, rhythm, contrast, squash, morph
examples/space-launch/ 60 s launch film for ft-motion: space story, saucer, product demo in a window, feature cards (EN / TR)
examples/dot-launch/  72 s launch film for ft-motion: a bouncing dot, liquid and particle transitions, white product window with camera push-ins, feature cards (EN)
examples/dotkesk-agents/ 64 s product film for dotkesk's AI agent builder: night-shift hook, rebuilt logo in orbit, real app UI redrawn from screenshots, flow editor demo (EN)
docs/TECHNIQUES.md    recipes: timing, type, dot fields, morphs, UI, glass, impacts, sound
docs/sound-and-tempo.html  interactive explainer: how the sound is synthesised, how motion locks to the beat (EN / TR)
prompts/              brief-to-video prompt templates (EN / TR)
```

## 3D scenes with three.js

A scene can build a three.js world in `setup()` and pose it from `t` in `draw()`; [`engine/three.js`](engine/three.js) renders it into an offscreen WebGL canvas and blits it onto the frame, so motion blur, `post()` and 2D overlays keep working. `import * as THREE from 'three'` and `three/addons/…` resolve from `node_modules` through the player's import map. Headless renders use SwiftShader (software WebGL), which is deterministic but slow (roughly 0.5–1 s per subframe at 1080p), so lower `subframes` for heavy 3D projects. See [`examples/cat-crossing`](examples/cat-crossing) and the three.js section in [`docs/TECHNIQUES.md`](docs/TECHNIQUES.md).

## Brandable examples

[`examples/chat-commerce`](examples/chat-commerce) and [`examples/motion-principles`](examples/motion-principles) are 20-second promos (also templates in ft-studio). Everything a brand changes sits at the top of `scene.js`: the `COPY` dictionary (TR / EN, pick with `--lang tr`) and `BRAND` (three colours, display font, optional logo file). [`engine/brand.js`](engine/brand.js) turns those into a palette with guaranteed contrast, a safe area for any aspect ratio (change `width` / `height` in `project.json` for 9:16, 4:5 or 16:9) and a logo, with a monogram when there is no file. Both are choreographed on a 15 s clock and play at `"speed": 0.75`; set `1` for the original 15 s tempo or `0.6` for 25 s, and the soundtrack follows.

```bash
node ft.mjs sheet examples/chat-commerce 12 --lang tr
python examples/chat-commerce/sound.py
node ft.mjs render examples/chat-commerce --lang tr
```

## Showcase reel

![Contact sheet of examples/reel](docs/reel-preview.jpg)

[`examples/reel`](examples/reel) is a 15 s, 128 BPM reel that puts [`engine/fx.js`](engine/fx.js) and [`engine/recipes.js`](engine/recipes.js) to work: nine scenes with skew / bars / disc wipes, a glitch tear, a tunnel that punches on the kick, a dot sphere, an easing-curve explainer, a rippling dot grid, kinetic type, and finally the reel's own source typing itself, rendering, and playing in a preview inside the preview. Copy is in `COPY` (`--lang tr` / `--lang en`), and the sound track ([`sound.py`](examples/reel/sound.py), using [`audio/ftextras.py`](audio/ftextras.py)) mirrors every camera hit.

**How the sound is made and how the picture locks to the tempo** is explained with live demos in [`docs/sound-and-tempo.html`](docs/sound-and-tempo.html) (English, with a Turkish toggle). Open it in a browser: a loop you can play and re-tempo, the kick, hat, pluck and riser formulas with sliders, the three mixer moves (sidechain, reverb, tanh drive), and the reel's real hit list scrubbed against three motion recipes. It is a single static file that needs no build step.

```bash
node ft.mjs sheet examples/reel 16 --lang en
python examples/reel/sound.py
node ft.mjs render examples/reel --lang en
```

## An edit request, the real diff, and the result

Because a scene is code, a revision is a diff you can read. [`examples/edit-demo`](examples/edit-demo) walks through one real round: the request *"Speed the reel up to 150 BPM and change the accent colour from coral to electric blue. Keep the sound in sync."*, the [draft PR](https://github.com/imserhatdemir/ft-motion/pull/5) that answered it (saved as [`case/change.patch`](examples/edit-demo/case/change.patch)), and the before and after renders side by side. One number in `project.json` retimed the picture and the sound. The rest of the diff is what that did not reach on its own: seven helpers that default to the old colour, a hard-coded `128 BPM` label, copy quoting `900 frames`, and one sound event at an absolute second.

![Frames from the reel before and after the edit](docs/edit-demo-compare.jpg)

The 30 s side-by-side video is itself an ft-motion project (the panel is drawn from `case/`, and `compose.mjs` overlays the two renders). See its [README](examples/edit-demo/README.md) to make one for your own edit.

## Tips

- Leave film grain out. It multiplies file size and every platform re-encodes it into blotches.
- Square (1080×1080) reads best in phone feeds. For Reels/Stories use 1080×1920 and keep about 250 px clear at the top and bottom.
- On Windows, keep the repo in a short path. Very long paths break some git and ffmpeg operations.

## License

MIT (see [LICENSE](LICENSE)). Fonts are distributed under their own licenses (Inter, JetBrains Mono and Barlow Condensed: SIL Open Font License).
