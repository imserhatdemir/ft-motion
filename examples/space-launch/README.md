# space-launch: a narrated-style launch film for ft-motion

A 60-second, 16:9, 120 BPM story promo built in the shape of a classic SaaS launch film. It opens on a playful sci-fi hook, then demos the product inside a window, then runs feature cards and ends on a lockup. Everything is drawn in Canvas 2D, including the "product UI", which is ft-motion's own workflow.

| Bars | Time | Scene |
|---|---|---|
| 0–3 | 0–8 s | Stars and Earth. "2025" rolls to "2040" like a frame counter. The ft-motion dot swallows its letters and becomes a saucer. |
| 4–5 | 8–12 s | The saucer's trail draws an expo-out curve. It plants a flag on Saturn, then the camera dives into the planet. |
| 6–7 | 12–16 s | "ft HQ": a tower of film-frame slabs on a coral planet. Little film cards fly out. Amber and cream waves wash the frame. |
| 8–9 | 16–20 s | The mark, a "Write a brief" button and a click. The button grows into the demo window. |
| 10–21 | 20–44 s | Inside the window: the brief → storyboard on a beat grid → `scene.js` with a live preview → contact sheet QA (a clipped title is caught and fixed) → sound on the same grid (-14 LUFS) → render with motion blur → EN/TR switch. |
| 22 | 44–46 s | "Render". The saucer beams the button up, and its beam floods the frame coral. |
| 23–26 | 46–54 s | Four cards: Kinetic Type · Motion Blur · Synth Sound · 3D Scenes. |
| 27–29 | 54–60 s | "Now on GitHub", a click, then the saucer lands as the dot of the end card. |

```bash
node ft.mjs sheet examples/space-launch 24
python examples/space-launch/sound.py            # -14 LUFS, ≤ -1 dBTP
node ft.mjs render examples/space-launch --lang en
node ft.mjs render examples/space-launch --lang tr
```

**Copy.** All copy is in `COPY` (en / tr) at the top of `scene.js`. Caption timing is in `CAP_AT`, as one `[bar, step] → [bar, step]` window per caption. The captions double as a voice-over script.

**Voice-over.** The soundtrack is music, foley and captions only. To add a read of the captions, save it as `examples/space-launch/vo.wav`, starting at t = 0. `sound.py` mixes it in and turns the music down under it.

**Placeholders.** "Brew" (the coffee app the agent is briefed on), its storyboard rows, `brew.app`, "Morning rush", "ft HQ" and the Saturn studio are all invented for the story.
