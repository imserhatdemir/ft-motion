# ft-promo

ft-motion's own promo for X: 1080×1080, 60 fps, 120 BPM, about 37.5 s, an English narrator and word-by-word captions. The video walks through what the engine does, and each scene uses the technique it names:

prompt → dots · `draw(ctx, t)` with a scrubbed `t` · kinetic type · dot field → 3D wave → dot sphere · morph + easing curve · three.js toon + ink · motion blur off / on · one `fx.js` effect per beat · the real stems · the captions themselves · the render command · the wordmark assembled from dots.

## Make it

```bash
C:\vox\Scripts\python.exe examples/ft-promo/voice.py   # narration → out/narration.wav, schedule.js, duration
python examples/ft-promo/sound.py                      # score → out/audio.wav, lanes.js
node ft.mjs sheet examples/ft-promo 28
node ft.mjs render examples/ft-promo                   # → out/ft-promo.mp4
```

- `voice.py`: VoxCPM2 (Apache-2.0, local GPU). The first run designs the narrator from a text description and saves `voice/ref.wav`. Every later run clones that file, so keep it. The chosen takes are cached in `out/takes/`, so changing the start times, `GAP` or `TEMPO` only lays them out again. `ONLY=glitch` re-synthesizes just that line with 6 takes; `FORCE=1` redoes every line.
- `schedule.js` (scene and word times) and `lanes.js` (loudness of the drums / music / fx / voice stems, 50 per second) are generated files. Don't edit them by hand.
- Scenes start on beats. A line that runs long pushes the following scenes back by whole beats, and the scene code reads every length from the schedule (the FX scene gets one effect per beat for as many beats as its line needs).

## Post on X

> This video was made from one sentence, in code.
> Every frame is a pure function of time: kinetic type, dot fields, 3D, motion blur, a synthesized score and captions that follow the voice. All of it is open source.
> github.com/imserhatdemir/ft-motion

- The voice is AI-generated (VoxCPM2). Turn on X's AI-content label.
- The first frame fades in from black, so pick a cover frame when uploading (e.g. the code scene or the end card).

## Check before posting

- `github.com/imserhatdemir/ft-motion` must be public; the end card and the narration both point there.
- The prompt typed in the hook (`make a promo video for ft-motion`) is an English summary of the original Turkish request.
- The "ft" in the three.js scene is blocky geometry drawn for this video. It is not a logo (ft-motion doesn't have one); the end card uses a Barlow Condensed wordmark.
