# animation/

Hand-painted character animation kit, added to ft-motion from **ClaudeAnimationBase** by John Heibel (https://github.com/JohnHeibel/ClaudeAnimationBase, MIT, see `LICENSE`).
It is a second engine next to `engine/`: p5.js + p5.brush (watercolour fills, boiling ink lines) with Clawd, 31 acted emotions and a shot/transition timeline.
Canvas is fixed at 1920x1080, 24 fps, no sound of its own. The rules and the full API are in `ANIMATION_GUIDE.md`: read it before drawing anything.

```bash
node ft.mjs anim --sheet=0.5,2,4,6,8,10 --cols=3 --w=480 --out=out/check/sheet.jpg   # look at it
node ft.mjs anim --strip=2.0:2.5 --out=out/check/strip.jpg                             # every frame of a moment
node ft.mjs anim --clip --out=out/video.mp4 [--audio=out/audio.wav]                    # render (muxes audio if given)
```

Flags are `render.mjs` flags (see the header of that file); paths are relative to `animation/`. `studio.html` (open in Chrome) scrubs the video.
Put a video in `src/scenes/<name>.js` and swap it into the script list in `studio.html`; set length and tempo in `src/config.js`.
Sound: write it with `audio/ftsynth.py` on the same timeline, then pass `--audio`.
