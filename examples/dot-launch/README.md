# dot-launch: a 72 s launch film for ft-motion (English)

A 16:9, 120 BPM story promo with a pink / blue / black / white palette. One original character carries it: a single pink dot, which is also the dot of the ft-motion mark.

| Bars | Time | Scene |
|---|---|---|
| 0–1 | 0–4 s | Black. A caret types "make me a video", deletes it, and becomes a pink dot. |
| 2–4 | 4–10 s | The dot bounces once per beat. Each bounce grows a shape (circle → square → triangle → star …) while the camera follows. |
| 5 | 10–12 s | Blue liquid rises. The dot drops in and the surface ripples. |
| 6–8 | 12–18 s | Underwater, the splash swirls into particles that converge on the name. A white wave washes the frame. |
| 9 | 18–20 s | "Write a brief", a blue cursor clicks it, and the button grows into the product window. |
| 10–23 | 20–48 s | A white window with a pink/blue halo. The camera pushes in on each step: brief, storyboard on a beat grid, `scene.js` with a live preview, contact-sheet QA (a clipped title is caught and fixed), sound at -14 LUFS, a render with motion blur, EN → TR. |
| 24 | 48–50 s | The camera pulls back, the dot pops out of the window and floods the frame pink. |
| 25–30 | 50–62 s | Six cards: Kinetic Type · Motion Blur · Synth Sound · 3D Scenes · Brand Kit · Agent Ready. |
| 31–35 | 62–72 s | "Open source on GitHub", a click, and a disc wipe to black. The dot falls, bounces twice and settles as the dot of the end card. |

```bash
node ft.mjs sheet examples/dot-launch 24
python examples/dot-launch/sound.py      # ≈ -14 LUFS, ≤ -1 dBTP
node ft.mjs render examples/dot-launch
```

**Copy and VO.** Copy lives in `COPY.en` and caption timing in `CAP_AT`. The captions double as a voice-over script. To add a recorded read, save it as `vo.wav` (starting at t = 0); `sound.py` mixes it in and turns the music down under it.

**Placeholders.** "Brew" (the coffee app in the brief), its storyboard rows, `brew.app` and "Morning rush" are invented.
