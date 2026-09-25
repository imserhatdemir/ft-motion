"""examples/hello — soundtrack on the same timeline as scene.js (120 BPM, bar = 2 s).
Run:  python examples/hello/sound.py   →  examples/hello/out/audio.wav"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *  # noqa: E402,F403

m = Mix.from_project(__file__)
BAR = m.bar

# harmony: one chord per bar, a bright one for the end card
for b, (name, octave) in enumerate([('Em9', 3), ('Cmaj7', 3), ('G6', 3), ('Dadd9', 3)]):
    m.pad(m.at(b), chord(name, octave), dur=BAR, att=1.0 if b == 0 else 0.1, gain=0.22 if b == 0 else 0.3, cutoff=800 if b == 0 else 1400)
m.pad(8.0, chord('Gmaj9', 3) + [74, 78], dur=1.8, att=0.02, rel=1.2, gain=0.4, cutoff=3000, wet=0.6)

# bar 0 · type — a soft tick per letter, a swell into the dot
for i, n in enumerate([64, 66, 67, 69, 71, 74]):
    m.add(0.05 + i * 0.04 + 0.12, blip(midi(n + 12)), 0.06, -0.4 + 0.16 * i, 0.4)
m.whoosh(0.45, 0.4, 900, 4000, 0.1)
m.whoosh(0.7, 0.4, 900, 4000, 0.1, pan=0.3)
m.suck(1.55, 2.0, 0.26)

# bar 1 · field — the pop, three coloured ripples, the landscape, the collapse
m.drums(1, kick=[0, 10], snare=[8], hats=range(0, 16, 2), root=40)
m.add(2.0, pluck(midi(76), dec=0.5), 0.22, 0, 0.5)
for t, n, pan in [(2.5, 79, 0), (2.75, 83, -0.5), (3.0, 86, 0.5)]:
    m.add(t, pluck(midi(n), dec=0.25, bend=0.4), 0.16, pan, 0.5)
m.whoosh(3.0, 0.8, 180, 900, 0.14, bw=0.8)
m.suck(3.6, 4.0, 0.3)

# bar 2 · morph — a pitched swish per shape change
m.drums(2, kick=[0, 6, 10], snare=[8], hats=range(16), root=36)
m.add(4.0, pop(520, 0.08), 0.18, 0, 0.4)
for i, t in enumerate([4.5, 5.0, 5.5]):
    m.glide(t, 0.2, 300 * 1.5 ** i, 1300 * 1.5 ** i, 0.06, dec=0.08, wet=0.5)
    m.whoosh(t, 0.28, 1200, 6000, 0.14, pan=(-0.4, 0.4, 0)[i])

# bar 3 · UI — cards pop, the click, a riser into the drop
m.drums(3, kick=[0, 6], snare=[4, 12], hats=range(0, 8), root=43)
for i in range(3):
    m.add(6.0 + i * 0.12, pop(700 + 120 * i), 0.16, -0.2 + 0.2 * i, 0.3)
m.add(7.05, mouseclick(), 0.25, 0.3)
m.add(7.1, bell(midi(88), 0.8), 0.07, 0.3, 0.6)
m.riser(7.1, 8.0, gain=0.28)
m.roll(7.5, 8.0, n=10)

# bar 4 · end card — the drop, the CTA click
m.impact(8.0, 0.9)
m.add(8.45, pop(640, 0.08), 0.12, 0, 0.4)
m.add(8.8, pop(760, 0.07), 0.14, 0, 0.3)
m.add(9.45, mouseclick(), 0.25, 0.25)
m.add(9.5, bell(midi(90), 0.9), 0.07, 0.25, 0.6)

m.render()
