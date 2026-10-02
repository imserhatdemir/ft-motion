"""Soundtrack for examples/dot-launch on the same 120 BPM grid as scene.js (bars are 2 s, m.at(bar, step) = 16 steps).
Run:  python examples/dot-launch/sound.py   → out/audio.wav

Voice-over slot: a recorded read of COPY.caps saved as `vo.wav` next to this file is mixed in at t = 0 and the music
ducks under it.
"""
import sys
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *  # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

seed(5)
m = Mix.from_project(__file__)
A = m.at

PROG = ['Fmaj7', 'G6', 'Em9', 'Am9']
ROOT = {'Fmaj7': 41, 'G6': 43, 'Em9': 40, 'Am9': 45}
for bar in range(33):
    m.pad(A(bar), chord(PROG[bar % 4], 3), dur=m.bar, gain=0.2 if bar < 9 else 0.14, att=0.3 if bar < 9 else 0.1, cutoff=1000 if bar < 9 else 1600)
m.pad(A(33), chord('Cmaj9', 3), dur=3 * m.bar, gain=0.22, att=0.05, cutoff=2400)

# ─────────────────────────────── drums
for bar in range(2, 5):
    m.drums(bar, kick=[4, 12], hats=range(0, 16, 4), hat_gain=0.06, root=ROOT[PROG[bar % 4]])
for bar in (7, 8, 9):
    m.drums(bar, kick=[0, 8], hats=range(0, 16, 2), hat_gain=0.07, root=ROOT[PROG[bar % 4]])
for bar in range(10, 24):
    m.drums(bar, kick=[0, 4, 8, 12], snare=[4, 12], hats=[2, 6, 10, 14], open_hats=[14] if bar % 2 else [], hat_gain=0.09, root=ROOT[PROG[bar % 4]])
for bar in range(25, 31):
    m.drums(bar, kick=[0, 4, 8, 10, 12], snare=[4, 12], hats=range(0, 16, 2), open_hats=[6, 14], hat_gain=0.1, root=ROOT[PROG[bar % 4]])
m.drums(31, kick=[0, 8], hats=range(0, 12, 2), hat_gain=0.08)

# ─────────────────────────────── bars 0–1: the sentence
m.typing(A(0, 4), A(0, 14), 15, gain=0.16)
m.typing(A(1, 8), A(1, 13), 10, gain=0.1)
m.add(A(1, 13), pop(500), 0.2, 0, 0.3)                                  # the caret becomes the dot

# ─────────────────────────────── bars 2–5: bounces, shapes, the drop
for k in range(6):
    t = A(2, 4) + k
    m.add(t, tom(110 + 15 * k, 0.1), 0.35, 0, 0.2)
    m.add(t + 0.02, pluck(midi([72, 76, 79, 83, 79, 76][k]), dec=0.35), 0.12, -0.4 + 0.16 * k, 0.5)
    m.add(t + 0.06, pop(600 + 60 * k), 0.12, 0, 0.3)
m.whoosh(A(5), 0.9, 300, 2000, 0.15)                                     # liquid rises
m.add(A(5, 9), filt(np.random.default_rng(3).standard_normal(int(0.8 * SR)), 'bandpass', [300, 2500]) * np.exp(-tarr(0.8) / 0.12), 0.35, 0, 0.6)
m.glide(A(5, 9), 0.4, 900, 220, 0.12, dec=0.2, wet=0.5)                  # splash
m.suck(A(5, 10), A(6), gain=0.2)
m.impact(A(6), 0.55, bright=False)

# ─────────────────────────────── bars 6–9: particles → name, white wave, button
m.whoosh(A(6), 2.0, 200, 1200, 0.1, wet=0.6)
m.riser(A(7), A(8), gain=0.18)
m.add(A(8), bell(midi(84), 1.4), 0.1, 0, 0.6)
m.whoosh(A(8, 6), 1.0, 200, 4500, 0.3, wet=0.4)                          # white wave
m.add(A(9), pop(560), 0.2)
m.whoosh(A(9, 3), 0.45, 1500, 5000, 0.05, pan=0.5)
m.add(A(9, 8), mouseclick(), 0.5, 0.2)
m.whoosh(A(9, 11), 0.6, 400, 5000, 0.18)

# ─────────────────────────────── bars 10–23: the window
for b in (12, 14, 16, 18, 20, 22):
    m.whoosh(A(b) - 0.1, 0.5, 900, 4000, 0.08)                           # camera move
m.typing(A(10) + 0.3, A(10) + 2.6, 80)
m.add(A(10) + 2.75, keyclick(), 0.4); m.add(A(10) + 2.75, tom(220, 0.05), 0.15)
for j in range(3):
    m.add(A(10) + 3.0 + j * 0.25, blip(midi(79 + j * 4)), 0.1, 0, 0.3)
for i in range(6):
    m.add(A(12) + 0.25 + i * 0.5, pop(600 + i * 60, 0.05), 0.14, 0.3, 0.2)
m.typing(A(14) + 0.25, A(14) + 2.85, 170, gain=0.12)
for i in range(16):
    m.add(A(16) + i * 0.035 + 0.05, pop(700 + 40 * (i % 4), 0.03), 0.06, -0.5 + i / 16, 0.2)
for i in (1, 2, 3):
    m.add(A(16) + 0.45 + i * 0.15, tick(2400 + i * 300), 0.12, 0.4)
for d in (0.0, 0.13):
    m.add(A(16) + 1.0 + d, blip(midi(52), 0.07), 0.25, 0, 0.2)
m.add(A(16) + 2.5, bell(midi(88), 0.8), 0.1, 0, 0.5)


def css_inverse(f):
    u = np.linspace(0, 1, 4001)
    bx = 3 * (1 - u) ** 2 * u * 0.25 + 3 * (1 - u) * u ** 2 * 0.25 + u ** 3
    by = 3 * (1 - u) ** 2 * u * 0.1 + 3 * (1 - u) * u ** 2 * 1.0 + u ** 3
    return float(np.interp(f, by, bx))


for k, bar in enumerate([0, 1, 2, 3, 4, 6, 7]):
    m.add(A(18) + 0.2 + 2.6 * css_inverse(bar / 8) + 0.03, pop(760 + 70 * k, 0.04), 0.13, -0.5 + k / 7, 0.2)
m.typing(A(20), A(20) + 0.35, 34, gain=0.1)
for k in range(26):
    m.add(A(20) + 0.4 + k * 0.1, tick(1800 + k * 50), 0.06, 0.2)
m.add(A(20) + 3.0, bell(midi(91), 0.6), 0.1, 0, 0.4)
m.add(A(22) + 0.5, mouseclick(), 0.3, 0.1)
m.add(A(22) + 0.6, glitch_burst(0.45), 0.12, 0, 0.15)

# ─────────────────────────────── bar 24: the dot pops out and floods the frame
m.whoosh(A(24), 0.7, 3000, 500, 0.12)
m.add(A(24, 6), pop(420, 0.08), 0.3, 0, 0.3)
m.riser(A(24, 4), A(25), gain=0.28)
m.roll(A(24, 8), A(25), n=12)
m.impact(A(25), 0.9)

# ─────────────────────────────── bars 25–30: six cards
for k in range(6):
    stamp(m, A(25 + k), 100 + 15 * k, 0.5)
    m.whoosh(A(25 + k), 0.45, 3500, 600, 0.14, pan=-0.6 if k % 2 == 0 else 0.6)
    m.whoosh(A(25 + k) + 1.74, 0.3, 700, 5000, 0.08)
    m.add(A(25 + k), bell(midi(79 + (0, 2, 4, 7, 9, 12)[k]), 0.7), 0.06, 0, 0.5)

# ─────────────────────────────── bars 31–35: GitHub, end card
for i in range(21):
    m.add(A(31) + i * 0.025 + 0.04, blip(midi(74 + (i * 2) % 12)), 0.035, -0.4 + i * 0.04, 0.3)
m.whoosh(A(31, 6), 0.5, 1500, 5000, 0.05, pan=0.5)
m.add(A(31, 12), mouseclick(), 0.5, 0.2)
m.suck(A(32, 6), A(33), gain=0.22)
for l, p in ((0.5, 120), (1.0, 150), (1.25, 180)):
    m.add(A(33) + l, tom(p, 0.1), 0.35, 0, 0.3)
for n_, g in zip(chord('Cmaj9', 5), (0.08, 0.07, 0.06, 0.05, 0.05)):
    m.add(A(33) + 1.25, bell(midi(n_), 2.2), g, 0, 0.6)
for i in range(9):
    m.add(A(33) + 1.3 + i * 0.035, blip(midi(79 + (i * 2) % 12)), 0.05, -0.3 + i * 0.07, 0.3)
m.add(A(33) + 1.8, pop(880, 0.05), 0.1)
m.add(A(33) + 2.2, pop(1040, 0.05), 0.1)

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

m.render(drive=2.0, peak=0.74)
