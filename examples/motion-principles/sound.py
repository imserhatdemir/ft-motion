"""examples/motion-principles — the soundtrack on the scene's 15 s clock (160 BPM). project.json's "speed"
stretches it with the picture. The drum pattern is part of the film: the RHYTHM bar shows it on a step
sequencer. Run: python examples/motion-principles/sound.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import Mix, chord, midi, bell, blip, pluck, keyclick  # noqa: E402

PROG = [('Dmin9', 2), ('Bbmaj7', 2), ('Gmin9', 2), ('Asus2', 2)]       # cinematic, one chord per bar
SCALE = [62, 64, 65, 69, 72, 74, 76, 77, 81, 84]
COPY = {'code': 'hareket = f(t)', 'w1': 'ZAMANLAMA', 'w4': 'ESNEME'}     # keep in sync with COPY in scene.js
PATTERNS = {                                                           # bar: kick, snare, hats, hat gain
    1: ([0], [8], range(8, 16, 2), 0.08),
    2: ([0, 6, 10], [8], range(16), 0.10),
    3: ([0, 6, 10], [8], range(16), 0.11),
    4: ([0, 6, 10], [4, 12], range(0, 16, 2), 0.12),                   # = the step sequencer on screen
    5: ([0, 8, 10], [12], range(8, 16), 0.10),
    6: ([0, 8], [12], range(0, 16, 2), 0.09),
    7: ([0], [], range(0, 8, 2), 0.09),
}


def note(i):
    return SCALE[i % len(SCALE)] + 12 * (i // len(SCALE))


m = Mix.from_project(__file__)
at = m.at
for b in range(8):
    name, octave = PROG[b % len(PROG)]
    m.pad(at(b), chord(name, octave), dur=m.bar, att=0.9 if b == 0 else 0.12, gain=0.27, cutoff=900)
top = chord(*PROG[0])
m.pad(at(8), top + [n + 12 for n in top[1:3]], dur=3.2, att=0.03, rel=1.6, gain=0.32, cutoff=2000, wet=0.6)
for b, (k, s, h, g) in PATTERNS.items():
    m.drums(b, kick=k, snare=s, hats=h, hat_gain=g)

# bar 0 · code types itself, collapses into a dot
code = COPY['code']
per = min(0.05, 0.7 / max(1, len(code)))
for i, ch in enumerate(code):
    if ch != ' ':
        m.add(0.3 + i * per, keyclick(), 0.15, -0.3 + 0.6 * i / max(1, len(code) - 1), 0.15)
m.suck(1.06, 1.5, 0.24)

# bars 1–2 · pop, ripples, landscape, vortex
m.add(at(1), pluck(midi(note(0)), 0.6), 0.2, 0.0, 0.5)
m.glide(at(1), 0.5, 90, 42, 0.3, dec=0.25)
m.add(at(1) + 1.125, bell(midi(note(4)), 1.1), 0.06, -0.45, 0.5)
m.add(at(1) + 1.3125, bell(midi(note(6)), 1.1), 0.05, 0.45, 0.5)
m.whoosh(at(2), 0.9, 180, 900, 0.12, 0.0, 0.4)
m.suck(at(2) + 0.7, at(3), 0.28)

# bar 3 · TIMING: a quiet tick per keyframe
w1 = COPY['w1']
st = 0.045 * min(1.0, 0.36 / max(0.36, (len(w1) - 1) * 0.045))
for i in range(len(w1)):
    m.add(at(3) + 0.04 + i * st + 0.22, blip(midi(note(5 + i))), 0.05, -0.5 + i / max(1, len(w1) - 1), 0.4)
m.whoosh(at(3) + 1.0, 0.5, 700, 6000, 0.14, 0.0, 0.3)

# bar 5 · CONTRAST
c0 = at(5)
m.whoosh(c0, 1.0, 9000, 2500, 0.18, 0.0, 0.5)
m.whoosh(c0 + 0.7, 0.35, 7000, 1500, 0.14, 0.6, 0.2)
m.whoosh(c0 + 1.1, 0.45, 3000, 400, 0.14, -0.3, 0.2)

# bar 6 · SQUASH: every bounce is a note
hits = min(6, len(COPY['w4']))
for i in range(hits):
    m.add(at(6) + 0.1875 * (i + 1) * (6 / max(1, hits)), pluck(midi(note(i * 2)), 0.22, 0.9), 0.16, -0.5 + i / max(1, hits - 1), 0.45)
m.glide(at(6) + 1.3, 0.2, 320, 70, 0.14, dec=0.08)

# bar 7 · MORPH
for i, dt in enumerate((0.28, 0.56, 0.84)):
    m.glide(at(7) + dt, 0.2, 300 * 1.5 ** i, 1300 * 1.5 ** i, 0.06, dec=0.08, wet=0.5)
    m.whoosh(at(7) + dt, 0.28, 1200, 6000, 0.1, (-0.4, 0.4, 0.0)[i], 0.2)
m.suck(at(7) + 1.08, at(8), 0.3)

# bars 8–9 · the drop, counters, signature, fold back into the cursor
e0 = at(8)
m.impact(e0, 0.8, bright=True)
for i in range(3):
    m.add(e0 + 0.42 + i * 0.1 + 0.38, blip(midi(note(7 + 2 * i)), 0.05), 0.07, -0.4 + 0.4 * i, 0.5)
m.add(e0 + 1.15, bell(midi(note(7)), 1.1), 0.07, 0.0, 0.5)
m.suck(e0 + 2.33, e0 + 2.72, 0.14)
m.add(e0 + 2.72, keyclick(), 0.18, 0.0, 0.2)

m.render(peak=0.68, fade_out=0.35)
