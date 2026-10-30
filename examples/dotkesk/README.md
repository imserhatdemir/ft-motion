# dotkesk daily series

Vertical (1080x1920) English shorts for Instagram Reels and YouTube Shorts, 15–25 s each, one per day. Every episode ends on the same end card: the orbit logo assembles, **Follow @dotkesk** gets tapped, and **Book a free demo → dotkesk.com**.

This folder is the shared kit. Episodes live next to it as `examples/dotkesk-NN/`.

| file | what it is |
|---|---|
| `kit.js` | light (default) and dark palettes from dotkesk.com (`setTheme`, `themeFrom`, project.json `"theme"`), the landing hero's fluted glass rebuilt from `HeroShader.tsx` (`heroGlass`; its green flow follows `focusAt(t)`), the orbit logo rebuilt from the site PNG (`drawLogo`, `logoDashes`), word-by-word captions, chat bubbles, CTA pill, `endCard`, `camera` (slow push-in so no frame stands still) |
| `voice_lib.py` | the narrator: VoxCPM2 cloning `voice/brand_voice_A.wav`, 3 takes per line, Whisper picks the clean one, writes `out/narration.wav` + `schedule.js` + the duration. Only one episode holds the GPU at a time (`out/gpu.lock`); an episode whose narration is newer than its `voice.py` is skipped (`FORCE=1` redoes it) |
| `sfx.py` | `series_score` (chords, the turn on "dotkesk", groove, payoff, end card) and `ui()` events for episodes 02+, soft UI sounds, de-esser, music ducking under the voice, high shelf + loudnorm (-14 LUFS, -1.5 dBTP), prints the 5–10 kHz / >10 kHz energy share |
| `voice/brand_voice_A.wav` | the series voice (voice A, "warm, confident"). Keep it: every episode clones it |
| `POSTS.md` | posting sheet: topic, placeholders and an Instagram caption per episode |
| `assets/dotkesk-orbit-logo.png` | the site logo, used only by `logo-check/` |
| `logo-check/` | the rebuilt logo next to the PNG and a difference overlay: `node ft.mjs stills examples/dotkesk/logo-check 0s` |

## Episodes

01 2 a.m. · 02 Where's my order? · 03 Connect everything (channels ↔ ikas / Shopify / WooCommerce) · 04 Before your coffee gets cold (Train → Test → Activate) · 05 Added to cart… and left · 06 Refund requests · 07 Web chat. Episodes 02+ are built on `stage()`, `chatCard()`, `turnLogo()`, `payoff()` from `kit.js`; 01 predates them.

## Make an episode

```bash
C:\vox\Scripts\python.exe examples/dotkesk-01/voice.py
python examples/dotkesk-01/sound.py
node ft.mjs sheet examples/dotkesk-01 16
node ft.mjs render examples/dotkesk-01
```

For a new episode, copy `examples/dotkesk-01/` to `examples/dotkesk-NN/`, then:

1. Rewrite `LINES` in `voice.py`. `text` is what the captions show. `say` is what the model reads: write the name as `dot-kesk` and the handle as `at dot-kesk`.
2. Run `voice.py`. It writes `schedule.js` and `project.json`'s duration.
3. Redraw the middle scenes in `scene.js`. Keep `captions(...)` and `endCard(...)`.
4. Add a sound for every visual event in `sound.py`.

The voice needs `torch` (CUDA), `voxcpm` and `transformers`, which `C:\vox` already has. Everything else runs on the normal Python.

## Rules for this series

- Only features that dotkesk.com shows: channels, store sync, product answers, order tracking, discount codes, refunds, human handoff, Train → Test → Activate, data protection. No invented statistics.
- Customer names, products and questions in the chats are placeholders. List them in the report for each episode.
- Third-party apps appear as neutral chips with a colour dot, never as their logos.
- The voice is AI-generated (VoxCPM2, Apache-2.0). Turn on the platform's AI label when posting.
- Keep the highs in check: `sound.py` prints the high-band share. Episode 01 reads 5–10 kHz -19 dB and >10 kHz -34 dB; stay near that.
