# lemo/

The **Lemo-Opuscar** film-style library, vendored into ft-motion: 51 film styles (each a `styles/<slug>/STYLE.md` with its look, colour, type, motion, camera grammar, sound palette and pitfalls), a director's guide, a build guide and a shared set of production tools (headless-Chrome renderer, Kokoro / edge-tts voice, speech check, procedural sound and a sampler, subtitles, contact sheets, loudness mux).

Upstream: https://github.com/lemomo-ai/lemo-opuscar by LemoLab (MIT, see `LICENSE`). Vendored from commit `b5e8ef9` (2026-10-19).
Not copied: the demo films, posters and subtitles (CC BY 4.0, ~80 MB), the gallery, the plugin marketplace file and the maintainer-only scripts (`publish.sh`, `release.py`, `web_cuts.sh`, `directory.py`). `README.upstream.md` is the upstream README. Third-party assets inside `core/` keep their licences (`core/fonts/OFL.md`, `core/assets/polyhaven/SOURCES.md`).
To read a style's demo source: `git clone https://github.com/lemomo-ai/lemo-opuscar` (the demo code is in `styles/<slug>/demo/`).

## How it fits ft-motion

ft-motion now has three ways to make a video; pick by what the request needs.

| | engine | look | use when |
|---|---|---|---|
| `engine/` + `examples/` | Canvas 2D, pure `draw(t)`, motion blur, 60 fps | motion graphics | brand and product videos, kinetic type, Reels at 1080x1920 |
| `animation/` | p5 + p5.brush | hand-painted character cartoons (Clawd, the tabby) | a character acts out a story |
| `lemo/` | a web page with `window.render(t)`, any stack (canvas, WebGL, three.js) | one of 51 named styles | the user names a style ("watercolour", "ukiyo-e", "80s cel anime", "satellite briefing") or wants help choosing one |

How to work with it: start from `AGENTS.md` (upstream's instructions), then `DIRECTOR.md` (story, sound, rhythm, delivery) and `TECHNIQUE.md` (the pipeline). Every tool and flag is in `core/README.md`; the style list is in `styles/README.md`. Make a film in `lemo/films/<name>/` (git-ignored) and never edit `core/` or `styles/` for a film.

**Where ft-motion's rules win over `AGENTS.md`:** follow `prompts/VIDEO_BRIEF.md` first: research, concepts and a storyboard, then **wait for approval** (upstream defaults to no storyboard and no stop). Everything else in CLAUDE.md (look at what you render, no invented claims, list placeholders, sound on the same timeline, -14 LUFS) applies to lemo films too.

## Running it (set up for Windows, macOS and Linux)

```bash
node ft.mjs lemo setup               # npm packages + a Python .venv (core tier). Add `voice` and/or `music` for the extra tiers.
node ft.mjs lemo node core/render/still.mjs films/<name> 1.5 3          # review stills
node ft.mjs lemo node core/render/video.mjs films/<name> --out films/<name>/out/video.mp4
node ft.mjs lemo sh -c ".venv/bin/python core/render/sheet.py out.jpg a.jpg b.jpg --cols 4"
node ft.mjs lemo sh core/render/mux.sh video.mp4 mix.wav final.mp4      # two-pass loudnorm to -14 LUFS
```

`node ft.mjs lemo <command>` runs the command inside `lemo/` with the Chrome you already have (`PLAYWRIGHT_CHROME`; no browser download) and the venv on `PATH`. Upstream guides say `sh plugin/skills/lemo-opuscar/scripts/setup.sh`; use `node ft.mjs lemo setup` instead (that script assumes macOS/Linux paths and would clone the library again). The `.venv/bin/python` shim that setup creates on Windows needs `sh` (Git Bash). Checked on this machine: still, video, sheet and mux all work.

Voices: Kokoro (English, offline) and edge-tts (Chinese, online) come with it; neither speaks Turkish. For Turkish narration use the Ahenk route (`examples/earthquake/voice.py`). Large asset packs (voice model, sample libraries, HDRIs) download only on request with `sh tools/fetch.sh …`.
