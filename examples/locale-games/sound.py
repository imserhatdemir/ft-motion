"""examples/locale-games: score on the same grid as scene.js (120 BPM, bar = 2 s, 12 bars, A minor → C major lift).
Run:  python examples/locale-games/sound.py   →  examples/locale-games/out/audio.wav

Arrangement (bars): 0 hook: drone, eye power-on, PRESS START blips, click · 1–2 hero: impact on the cut, light groove ·
3–4 games: full groove, a coin per card · 5 design system: sparse, pops per swatch · 6–7 contact: clouds, typing, send,
roll into the drop · 8 LEVEL COMPLETE: the brightest chord, three star chimes · 9–11 credits: half-time, pad rings out."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *   # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

m = Mix.from_project(__file__)
at = m.at

# ── harmony: one chord per bar; bar 8 (LEVEL COMPLETE) gets the brightest voicing
CH = ['Am', 'F', 'C', 'G', 'Am', 'Fmaj7', 'C', 'G', 'Cmaj7', 'Fmaj7', 'Am7', 'Cmaj7']
ROOT = [33, 29, 36, 31, 33, 29, 36, 31, 36, 29, 33, 36]
PADG = [0.35, 0.6, 0.6, 0.7, 0.7, 0.55, 0.65, 0.75, 1.0, 0.8, 0.75, 0.9]
for bar in range(12):
    last = bar == 11
    m.pad(at(bar), chord(CH[bar], 3 if bar < 8 else 4), dur=(m.dur - at(bar)) if last else m.bar, att=0.25 if bar else 1.2,
          rel=1.5 if last else 0.4, gain=0.2 * PADG[bar], cutoff=1100 if bar < 8 else 1900, wet=0.4)

def coin(t, g=0.13, pan=0.0):
    m.add(t, blip(988, 0.05), g, pan, 0.2)
    m.add(t + 0.06, blip(1319, 0.12), g, pan, 0.3)

def chime(t, notes, g=0.1, gap=0.07):
    for i, n in enumerate(notes):
        m.add(t + i * gap, bell(midi(n), 0.9), g, -0.3 + 0.3 * i, 0.5)

# ── bar 0 · hook: drone, the eyes power on, PRESS START blinks, the click
m.glide(0, at(1), 55, 55, 0.14, dec=None)
m.glide(at(0, 2), 0.35, 180, 820, 0.18, dec=0.2, wet=0.4)              # eyes power on
m.add(at(0, 2), bell(midi(76), 1.4), 0.07, 0, 0.6)
m.add(at(0, 8), blip(1500, 0.03), 0.08, 0.2)                            # blink
for k in range(4, 13, 4):
    m.add(at(0, k), blip(2093, 0.03), 0.05, 0.3)                        # PRESS START blinking
m.whoosh(at(0, 8), 0.5, 600, 2500, 0.06, pan=0.4)                        # cursor glides in
m.add(at(0, 14), mouseclick(), 0.5, 0.2)
stamp(m, at(0, 14), 220, 0.45)
m.riser(at(0, 10), at(1), 300, 6000, gain=0.35)

# ── bars 1–2 · hero: the cut, the pull-back, the headline, the button
m.impact(at(1), 0.75)
m.whoosh(at(1), 1.2, 7000, 400, 0.12, wet=0.4)                          # camera pulls back
for i in range(4):
    m.add(at(1, 4 + i), tom(140 + 30 * i, 0.09), 0.22, -0.2 + 0.13 * i)  # headline lines land
m.add(at(1, 8), pop(900), 0.12, 0.3)                                    # nav
m.drums(1, kick=[8, 12], hats=[10, 14], hat_gain=0.1, root=ROOT[1])
m.drums(2, kick=[0, 4, 8, 12], hats=[2, 6, 10, 14], hat_gain=0.11, root=ROOT[2])
chime(at(2), [72, 76, 79], 0.07)                                        # HUD: level 01
m.add(at(2, 2), pop(620), 0.2, -0.1)                                    # button springs in
m.whoosh(at(2, 4), 0.6, 800, 2600, 0.05, pan=0.5)                       # cursor
m.add(at(2, 10), blip(1760, 0.06), 0.06, 0.1)                           # hover
m.add(at(2, 14), mouseclick(), 0.55, 0)

# ── bars 3–4 · games: scroll, level 02, a coin per card, hover
m.whoosh(at(3), 0.75, 300, 4200, 0.16, wet=0.3)
chime(at(3, 4), [74, 77, 81], 0.07)
m.add(at(3, 4), tom(150, 0.09), 0.2)
m.add(at(3, 5), tom(185, 0.09), 0.2)
for bar in (3, 4):
    m.drums(bar, kick=[0, 4, 8, 12], snare=[4, 12], hats=range(0, 16, 2), hat_gain=0.1, root=ROOT[bar])
for i in range(8):
    coin(at(3, 8 + 2 * i), 0.11 + 0.01 * i, -0.45 + 0.13 * i)
m.add(at(4, 12), blip(1568, 0.08), 0.07, 0.3)                           # hover on StackPop
TONES = {'C': [60, 64, 67, 72], 'G': [55, 59, 62, 67], 'Am': [57, 60, 64, 69], 'F': [53, 57, 60, 65],
         'Cmaj7': [60, 64, 67, 71], 'Fmaj7': [53, 57, 60, 64], 'Am7': [57, 60, 64, 67]}
PAT = [0, 2, 1, 3, 2, 1, 3, 2]
for bar, gain in [(2, 0.6), (3, 0.9), (4, 1.0), (6, 0.8), (7, 0.9), (8, 1.0)]:
    for s in range(8):
        n = TONES[CH[bar]][PAT[s]] + 12
        echo(m, at(bar, 2 * s), pluck(midi(n), dec=0.2), gain=0.07 * gain, pan=-0.35 if s % 2 else 0.35, taps=2 if s % 4 == 0 else 0)

# ── bar 5 · design system: the window steps back, the tokens pop in, the panel leaves
m.whoosh(at(5), 0.5, 5000, 600, 0.1)
m.drums(5, kick=[0, 8], hats=[4, 12], hat_gain=0.08, root=ROOT[5])
for i in range(5):
    m.add(at(5, 3) + i * at(0, 0.5), pop(700 + 120 * i), 0.13, -0.4 + 0.2 * i)
stamp(m, at(5, 6), 160, 0.3)
stamp(m, at(5, 7), 190, 0.3)
m.add(at(5, 8), pop(560), 0.15, 0.2)
m.add(at(5, 9), pop(640), 0.15, 0.3)
m.suck(at(5, 10), at(5, 14), 0.25)

# ── bars 6–7 · contact: through the clouds, level 03, typing, send, the build
m.whoosh(at(5, 13), 1.0, 300, 3000, 0.22, wet=0.6, bw=0.9)             # cloud pass (air)
chime(at(6, 4), [76, 79, 84], 0.07)
m.add(at(6, 4), tom(160, 0.09), 0.2)
m.add(at(6, 5), tom(200, 0.09), 0.2)
m.drums(6, kick=[0, 4, 8, 12], hats=range(2, 16, 4), hat_gain=0.09, root=ROOT[6])
m.add(at(6, 7), mouseclick(), 0.5, 0.2)
m.typing(at(6, 8), at(6, 8) + 11 / 24, 11, gain=0.1)
m.typing(at(6, 12), at(6, 12) + 21 / 50, 21, gain=0.1)
m.typing(at(6, 15.5), at(6, 15.5) + 33 / 50, 33, gain=0.1)
m.drums(7, kick=[0, 4, 8, 12], hats=range(0, 16, 2), hat_gain=0.09, root=ROOT[7])
m.add(at(7, 6), blip(1760, 0.06), 0.06, 0.2)                            # hover Send
m.add(at(7, 8), mouseclick(), 0.55, 0.2)
coin(at(7, 8), 0.14, 0.3)
m.glide(at(7, 8), 0.5, 500, 2400, 0.12, dec=0.25, wet=0.5)              # the speech bubble flies off
m.riser(at(7, 8), at(8), 250, 9000, gain=0.6)
m.roll(at(7, 9), at(8), n=12, gain=(0.06, 0.28))

# ── bar 8 · LEVEL COMPLETE: the drop, the pill, three stars
m.impact(at(8), 1.0)
m.drums(8, kick=[0, 4, 8, 12], snare=[4, 12], hats=range(16), hat_gain=0.08, root=ROOT[8])
m.add(at(8, 2), pop(520), 0.22)
for i, n in enumerate([84, 88, 91]):
    m.add(at(8, 4 + 2 * i), bell(midi(n), 1.3), 0.11, -0.4 + 0.4 * i, 0.5)
    m.add(at(8, 4 + 2 * i), blip(midi(n + 12), 0.05), 0.05, -0.4 + 0.4 * i)
m.suck(at(8, 11), at(8, 15), 0.2)

# ── bars 9–11 · credits: soft landing, a tick per line, then the pad rings out
m.impact(at(9), 0.45, bright=False)
m.drums(9, kick=[0, 8], hats=[4, 12], hat_gain=0.07, root=ROOT[9])
m.drums(10, kick=[0, 8], hats=[4, 12], hat_gain=0.06, root=ROOT[10])
for st, f in [(2, 1800), (4, 2000), (5, 2200), (8, 2400), (10, 2600), (12, 2800)]:
    m.add(at(9, st), tick(f), 0.12, 0.2)
for i, n in enumerate([72, 76, 79, 83, 84]):
    m.add(at(11) + i * 0.3, pluck(midi(n), dec=1.0), 0.06, -0.4 + 0.2 * i, 0.5)

m.render(peak=0.64, drive=2.6, fade_out=0.6)
