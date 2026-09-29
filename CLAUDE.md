# ft-motion: notes for coding agents

Motion graphics videos written as code. A **project** is a folder with `project.json`, `scene.js` and optionally `sound.py`. The output goes to `<project>/out/` (git-ignored).

## Commands

```bash
node ft.mjs new <name>                     # scaffold examples/<name> from templates/blank
node ft.mjs preview examples/<name>        # live player (space, ←/→, shift, b = motion blur)
node ft.mjs sheet examples/<name> 16       # contact sheet → out/sheet.png   ← look at it
node ft.mjs stills examples/<name> 1.5s,4s # full-size stills → out/stills/
python examples/<name>/sound.py            # → out/audio.wav (prints LUFS / true peak)
node ft.mjs render examples/<name> [--lang en]   # → out/<name>[-en].mp4
```

Requirements: Node 18+, Python 3.10+ with numpy and scipy, ffmpeg on PATH, and Chrome, Chromium or Edge installed (or `CHROME_PATH`).

## Scene contract

- `export default { setup?(api), draw(ctx, t, api), post?(ctx, t, api) }`.
- `draw` paints the **entire** frame at scene time `t` and must be a pure function of `t`. No `Math.random`, `Date`, timers or accumulated state; use `hash()` and `noise1()`.
- `api`: `W, H, fps, duration, lang, bpm, beat, bar, step, at(bar, step), frameT`. `frameT` is the un-blurred time of the frame being rendered: use it (not `t`) for counters and anything that must stay sharp under motion blur; `post()` receives it as `t`.
- Import helpers from `../../engine/core.js`. Don't copy them into scenes.
- Put all copy in a per-language dictionary at the top of `scene.js`, keyed by `api.lang`.
- Put time constants on the beat grid (`api.at(bar, step)` or multiples of `api.step`).

## Working agreement

- Before building a video from a brief, follow `prompts/VIDEO_BRIEF.md`: research → concepts → storyboard, then **wait for approval**.
- After every meaningful change, render a sheet or stills and **look at them** before moving on. Check text clipping (descenders and diacritics), overlaps, legibility at phone size and logo fidelity.
- Don't invent claims, metrics or testimonials. List every placeholder (names, prices) in your report.
- Sound: every visual event gets a sound on the same timeline; aim for about -14 LUFS and ≤ -1 dBFS.
- When retiming or restyling an existing example, look for what the change does not reach on its own: absolute seconds in `sound.py`, numbers quoted in copy (frame counts, durations, BPM labels), helper defaults such as `accent`. Render a sheet and read the end card. `examples/edit-demo` shows one such round with its real diff.
- Never commit anything under `out/`, rendered media or `node_modules/`.

## Map

- `engine/core.js`: math, easing, springs, type layout, shapes, dot fields, 3D projection, morphing, particles, glass, chromatic split, the motion-blur runtime (`boot`).
- `engine/fx.js`: transitions (`transition`: skew / bars / disc wipes), `flash`, `shockRing`, `glitch`, `aberrate`, `bloom`, `hud`, `windowFrame`, `typeCode`, `fitFont`. Draw transitions after the scene; call `glitch` last in `draw`; call `hud`, `bloom` and `aberrate` from `post`.
- `engine/recipes.js`: `tunnel` + `surge`, `dotSphere`, `easingGraph`, `rippleDots`.
- `engine/three.js`: three.js bridge (`createGL`, `toon`, `ink`, `Sweep`). 3D scenes build the world in `setup` and re-pose every object from `t` in `draw`; `three` and `three/addons/` resolve through the import map in `player.html`.
- `engine/brand.js`: brand kit for brandable scenes (`brandApi`: palette from three colours with contrast-picked text, safe area per aspect ratio, `fit` / `fitLines`, logo or monogram, `samplePoints`, `drawAsset`).
- `engine/player.html`: loads a project's fonts and scene; used by both preview and render.
- `ft.mjs`: CLI (static server, headless Chrome, ffmpeg).
- `audio/ftsynth.py`: synthesis, timeline mixer, reverb, sidechain, mastering.
- `audio/ftextras.py`: `stamp`, `counter_ticks`, `echo`, `glitch_burst`, `tick`, `tom`.
- `examples/hello/`: reference scene using most techniques.
- `examples/reel/`: 15 s, 128 BPM showcase of `fx.js` and `recipes.js` (wipes, glitch, tunnel, dot sphere, easing graph, typed code with a preview inside a preview), `sound.py` with `ftextras`; TR / EN.
- `examples/edit-demo/`: 30 s, 4:5 side-by-side of an edit request, its real `git diff` (`case/change.patch`) and the BEFORE / AFTER renders of `examples/reel`. `scene.js` draws the panel from `case/`, `compose.mjs` overlays the two videos, `sound.py` scores the panel.
- `examples/cat-crossing/`: three.js cartoon short (cel shading, ink lines, character rig, traffic, shot list).
- `examples/chat-commerce/`, `examples/motion-principles/`: brandable 20 s promos (ported from ft-studio templates): copy in `COPY`, brand in `BRAND`, layout against `brandApi().fmt.safe`, 15 s choreography played at `speed` 0.75.
- `docs/TECHNIQUES.md`: recipes, with pointers into the example.
- `docs/sound-and-tempo.html`: standalone interactive explainer (EN default, TR toggle) of how `ftsynth` builds each sound and how scenes lock to the beat grid. Copy lives in the `I` dictionary; the DSP mirrors `audio/ftsynth.py`, so change both together.
