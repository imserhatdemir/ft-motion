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
- `api`: `W, H, fps, duration, lang, bpm, beat, bar, step, at(bar, step)`.
- Import helpers from `../../engine/core.js`. Don't copy them into scenes.
- Put all copy in a per-language dictionary at the top of `scene.js`, keyed by `api.lang`.
- Put time constants on the beat grid (`api.at(bar, step)` or multiples of `api.step`).

## Working agreement

- Before building a video from a brief, follow `prompts/VIDEO_BRIEF.md`: research → concepts → storyboard, then **wait for approval**.
- After every meaningful change, render a sheet or stills and **look at them** before moving on. Check text clipping (descenders and diacritics), overlaps, legibility at phone size and logo fidelity.
- Don't invent claims, metrics or testimonials. List every placeholder (names, prices) in your report.
- Sound: every visual event gets a sound on the same timeline; aim for about -14 LUFS and ≤ -1 dBFS.
- Never commit anything under `out/`, rendered media or `node_modules/`.

## Map

- `engine/core.js`: math, easing, springs, type layout, shapes, dot fields, 3D projection, morphing, particles, glass, chromatic split, the motion-blur runtime (`boot`).
- `engine/three.js`: three.js bridge (`createGL`, `toon`, `ink`, `Sweep`). 3D scenes build the world in `setup` and re-pose every object from `t` in `draw`; `three` and `three/addons/` resolve through the import map in `player.html`.
- `engine/player.html`: loads a project's fonts and scene; used by both preview and render.
- `ft.mjs`: CLI (static server, headless Chrome, ffmpeg).
- `audio/ftsynth.py`: synthesis, timeline mixer, reverb, sidechain, mastering.
- `examples/hello/`: reference scene using most techniques.
- `examples/cat-crossing/`: three.js cartoon short (cel shading, ink lines, character rig, traffic, shot list).
- `docs/TECHNIQUES.md`: recipes, with pointers into the example.
