"""Soundtrack for examples/space-launch, on the same 120 BPM grid as scene.js (bars are 2 s, m.at(bar, step) = 16 steps).
Run:  python examples/space-launch/sound.py   → out/audio.wav

Voice-over slot: drop a recorded read of COPY.caps as `vo.wav` next to this file and it is mixed in at t = 0
(the music ducks under it). Without it the film plays as music, foley and captions.
"""
import sys
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *  # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

seed(11)
m = Mix.from_project(__file__)
A = m.at

# ─────────────────────────────── harmony: one chord per bar; the end card gets the brightest one
PROG = ['Am9', 'Fmaj7', 'Cmaj7', 'G6']
for bar in range(28):
    space = bar < 6
    m.pad(A(bar), chord(PROG[bar % 4], 3), dur=m.bar, gain=0.2 if space else 0.15, att=0.4 if space else 0.12, cutoff=900 if space else 1500)
m.pad(A(28), chord('Cmaj9', 3), dur=2 * m.bar, gain=0.22, att=0.05, cutoff=2200)
ROOT = {'Am9': 45, 'Fmaj7': 41, 'Cmaj7': 48, 'G6': 43}

# space arpeggio (bars 0–5): soft plucks on the chord tones
for bar in range(6):
    notes = chord(PROG[bar % 4], 5)
    for st in range(0, 16, 2):
        m.add(A(bar, st), pluck(midi(notes[(st // 2) % len(notes)]), dec=0.25), 0.05, 0.4 if st % 4 else -0.4, 0.5)

# ─────────────────────────────── drums
for bar in (6, 7):
    m.drums(bar, kick=[0, 8], hats=range(0, 16, 2), hat_gain=0.07, root=ROOT[PROG[bar % 4]])
m.drums(9, kick=[0, 8], hats=range(0, 16, 2), hat_gain=0.08, root=ROOT[PROG[9 % 4]])
for bar in range(10, 22):
    m.drums(bar, kick=[0, 4, 8, 12], snare=[4, 12], hats=[2, 6, 10, 14], open_hats=[14] if bar % 2 else [], hat_gain=0.09, root=ROOT[PROG[bar % 4]])
m.drums(22, kick=[0, 4, 8], hats=range(0, 12, 2), hat_gain=0.08, root=ROOT[PROG[22 % 4]])
for bar in range(23, 27):
    m.drums(bar, kick=[0, 4, 8, 10, 12], snare=[4, 12], hats=range(0, 16, 2), open_hats=[6, 14], hat_gain=0.1, root=ROOT[PROG[bar % 4]])
m.drums(27, kick=[0, 8], hats=range(0, 8, 2), hat_gain=0.08)

# ─────────────────────────────── bar 0–3: the year, the mark, the saucer
counter_ticks(m, A(0, 3), A(1) - A(0, 3), 15, gain=0.12)
stamp(m, A(1), 120, 0.55)
m.add(A(2), pop(560), 0.2, 0, 0.3)                                     # the dot
for i in range(9):
    m.add(A(2) + 0.05 + i * 0.035, blip(midi(72 + (i * 2) % 12)), 0.06, -0.3 + i * 0.07, 0.3)
m.suck(A(2, 8), A(2, 13), gain=0.22)                                   # letters into the dot
m.glide(A(2, 12), 0.5, 260, 880, 0.12, dec=0.4, wet=0.4)               # dot becomes the saucer
m.whoosh(A(3), 1.4, 180, 900, 0.14, wet=0.5)                           # beam on
m.glide(A(3), 1.4, 110, 104, 0.08, wet=0.3)
m.whoosh(A(3, 12), 0.55, 500, 7000, 0.22, pan=0.5)                     # zip

# ─────────────────────────────── bar 4–5: flight, flag, dive
m.whoosh(A(4), 1.7, 300, 3200, 0.2, pan=-0.3)
m.whoosh(A(5, 1), 0.7, 200, 1200, 0.1)                                 # beam
m.add(A(5, 4), tom(150, 0.14), 0.4, 0.2, 0.3)                           # flag
m.whoosh(A(5, 7), 0.4, 800, 6000, 0.14, pan=0.4)                        # leave
m.riser(A(5, 6), A(6), gain=0.24)
m.impact(A(6), 0.6)

# ─────────────────────────────── bar 6–7: HQ
for i in range(9):
    m.add(A(6) + 0.15 + i * 0.085 + 0.06, pop(380 + i * 55, 0.05), 0.16, -0.2 + i * 0.05, 0.2)
m.add(A(6) + 0.97, pop(900), 0.14, 0, 0.3)                              # cap
m.add(A(6) + 1.0, tom(90, 0.1), 0.25)                                   # door
stamp(m, A(6) + 1.15, 140, 0.4)                                         # sign
for k in range(18):
    m.add(A(6) + 1.2 + k * 0.16 + 0.04, pop(1100 + 80 * (k % 5), 0.03), 0.05, (-1) ** k * 0.6, 0.4)
m.whoosh(A(7, 9), 1.0, 200, 4500, 0.3, wet=0.4)                         # the wave

# ─────────────────────────────── bar 8–9: mark, button, window
m.add(A(8, 2), pop(620), 0.22, 0, 0.3)
m.add(A(8, 2), bell(midi(84), 1.2), 0.08, 0, 0.6)
for i in range(9):
    m.add(A(8, 2) + 0.05 + i * 0.035, blip(midi(76 + (i * 3) % 12)), 0.05, -0.3 + i * 0.07, 0.3)
m.whoosh(A(8, 12), 0.4, 700, 3000, 0.08)
m.add(A(9), pop(520), 0.22, 0, 0.2)                                      # button
m.whoosh(A(9, 3), 0.45, 1500, 5000, 0.05, pan=0.5)                       # cursor
m.add(A(9, 8), mouseclick(), 0.5, 0.2)
m.whoosh(A(9, 11), 0.6, 400, 5000, 0.18)                                 # button → window

# ─────────────────────────────── bars 10–21: the demo
for b in (12, 14, 16, 18, 20, 21):
    m.whoosh(A(b) - 0.1, 0.4, 900, 4000, 0.07)                           # section slide
m.typing(A(10) + 0.3, A(10) + 2.6, 80)
m.add(A(10) + 2.75, keyclick(), 0.4); m.add(A(10) + 2.75, tom(220, 0.05), 0.15)   # enter
for j in range(3):
    m.add(A(10) + 3.0 + j * 0.25, blip(midi(79 + j * 4)), 0.1, 0, 0.3)
for i in range(6):
    m.add(A(12) + 0.25 + i * 0.5, pop(600 + i * 60, 0.05), 0.14, 0.3, 0.2)
m.typing(A(14) + 0.25, A(14) + 2.85, 180, gain=0.12)
for i in range(16):
    m.add(A(16) + i * 0.035 + 0.05, pop(700 + 40 * (i % 4), 0.03), 0.06, -0.5 + i / 16, 0.2)
for i in (1, 2, 3):
    m.add(A(16) + 0.45 + i * 0.15, tick(2400 + i * 300), 0.12, 0.4)
for d in (0.0, 0.13):
    m.add(A(16) + 1.0 + d, blip(midi(52), 0.07), 0.25, 0, 0.2)          # error
m.whoosh(A(16) + 0.95, 0.5, 600, 2400, 0.06)                             # zoom in
m.add(A(16) + 2.5, bell(midi(88), 0.8), 0.1, 0, 0.5)                     # fixed
m.add(A(16) + 2.5, blip(midi(84)), 0.12)


def css_inverse(f):
    """Time fraction where CSS `ease` (cubic-bezier .25,.1,.25,1) reaches f — used to sync the sound chips."""
    u = np.linspace(0, 1, 4001)
    bx = 3 * (1 - u) ** 2 * u * 0.25 + 3 * (1 - u) * u ** 2 * 0.25 + u ** 3
    by = 3 * (1 - u) ** 2 * u * 0.1 + 3 * (1 - u) * u ** 2 * 1.0 + u ** 3
    return float(np.interp(f, by, bx))


for k, bar in enumerate([0, 1, 2, 3, 4, 6, 7]):
    m.add(A(18) + 0.2 + 2.6 * css_inverse(bar / 8) + 0.03, pop(760 + 70 * k, 0.04), 0.13, -0.5 + k / 7, 0.2)
m.typing(A(20), A(20) + 0.35, 34, gain=0.1)
for k in range(13):
    m.add(A(20) + 0.4 + k * 0.1, tick(1800 + k * 90), 0.07, 0.2)
m.add(A(20) + 1.72, bell(midi(91), 0.6), 0.1, 0, 0.4)
m.add(A(21) + 0.5, mouseclick(), 0.3, 0.1)                              # language toggle
m.add(A(21) + 0.6, glitch_burst(0.45), 0.12, 0, 0.15)

# ─────────────────────────────── bar 22: "Render", the saucer beams it up
m.add(A(22), pop(480), 0.22)
m.add(A(22, 4), mouseclick(), 0.5, 0.15)
m.whoosh(A(22, 5), 0.45, 4000, 500, 0.22)                               # saucer drops in
m.whoosh(A(22, 8), 1.0, 160, 900, 0.14, wet=0.5)                        # beam
m.suck(A(22, 9), A(22, 13), gain=0.2)
m.riser(A(22, 6), A(23), gain=0.3)
m.roll(A(22, 8), A(23), n=14)
m.impact(A(23), 0.9)

# ─────────────────────────────── bars 23–26: feature cards
for k in range(4):
    stamp(m, A(23 + k), 100 + 20 * k, 0.5)
    m.whoosh(A(23 + k), 0.45, 3500, 600, 0.14, pan=-0.6 if k % 2 == 0 else 0.6)
    m.whoosh(A(23 + k) + 1.74, 0.3, 700, 5000, 0.08)
    m.add(A(23 + k), bell(midi(81 + (0, 2, 4, 7)[k]), 0.7), 0.06, 0, 0.5)

# ─────────────────────────────── bar 27: GitHub, bars 28–29: end card
for i in range(13):
    m.add(A(27) + i * 0.03 + 0.04, blip(midi(74 + (i * 2) % 12)), 0.04, -0.4 + i * 0.06, 0.3)
m.whoosh(A(27, 3), 0.5, 1500, 5000, 0.05, pan=0.5)
m.add(A(27, 8), mouseclick(), 0.5, 0.2)
m.suck(A(27, 10), A(28), gain=0.25)
m.impact(A(28), 0.75)
m.whoosh(A(28), 0.6, 600, 2500, 0.15, pan=-0.6)                         # saucer flies in
m.add(A(28, 7), pop(700), 0.2)                                           # …and is the dot again
for n_, g in zip(chord('Cmaj9', 5), (0.08, 0.07, 0.06, 0.05, 0.05)):
    m.add(A(28, 7), bell(midi(n_), 2.0), g, 0, 0.6)
for i in range(9):
    m.add(A(28) + 0.85 + i * 0.035, blip(midi(79 + (i * 2) % 12)), 0.05, -0.3 + i * 0.07, 0.3)
m.add(A(28) + 1.35, pop(880, 0.05), 0.1)
m.add(A(28) + 1.75, pop(1040, 0.05), 0.1)

# ─────────────────────────────── optional voice-over
vo_path = Path(__file__).resolve().parent / 'vo.wav'
if vo_path.exists():
    from scipy.signal import resample_poly
    with wave.open(str(vo_path)) as w:
        sr, ch, raw = w.getframerate(), w.getnchannels(), w.readframes(w.getnframes())
    vo = np.frombuffer(raw, '<i2').astype(float).reshape(-1, ch).T / 32768
    if sr != SR:
        vo = resample_poly(vo, SR, sr, axis=1)
    m.dry *= 0.6
    m.duck *= 0.6
    m.add(0, vo if ch == 2 else vo[0], 1.0)
    print(f'mixed {vo_path.name}')

m.render(drive=1.9, peak=0.78)
