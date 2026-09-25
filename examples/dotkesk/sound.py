"""examples/dotkesk — score and UI foley on the same timeline as scene.js (128 BPM, bar = 1.875 s).
Run:  python examples/dotkesk/sound.py   →  examples/dotkesk/out/audio.wav"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *  # noqa: E402,F403

m = Mix.from_project(__file__)
at = m.at

# the same marks as setup() in scene.js
T = dict(chips=[at(0, 2 * i) for i in range(6)], strike=at(0, 12), suck=at(0, 14),
         dot=at(1), input=at(1, 2), type0=at(1, 3), type1=at(1, 10), send=at(1, 11), chat=at(1, 12), typing=at(1, 13),
         stream=at(2), cards=at(2, 2), ask=at(2, 8), reply=at(2, 11), swatch=at(2, 12), cart=at(3), badge=at(3, 1),
         omni=at(3, 4), inbox=at(3, 6), grid=at(4, 8), tiles=[at(4, 8 + 2 * i) for i in range(4)],
         eq=at(5, 8), terms=[at(5, 8 + 4 * i) for i in range(4)], swirl=at(6, 8), sphere=at(6, 12), lock=at(7), tag=at(7, 1))

# ─────────────────────────────── harmony: one chord per bar, the brightest on the lockup
bars = [('Am9', 0.10, 700), ('Fmaj9', 0.2, 1100), ('Cmaj9', 0.24, 1400), ('G6', 0.24, 1400),
        ('Am9', 0.22, 1300), ('Fmaj7', 0.22, 1400), ('Dmin9', 0.24, 1800)]
for b, (name, g, cut) in enumerate(bars):
    m.pad(at(b), chord(name, 3), dur=m.bar, att=0.6 if b == 0 else 0.05, gain=g, cutoff=cut)
m.pad(T['lock'], chord('Cmaj9', 3) + [76, 79, 84], dur=1.7, att=0.01, rel=1.2, gain=0.36, cutoff=3200, wet=0.6)
roots = [33, 29, 36, 31, 33, 29, 26]

# ─────────────────────────────── drums: the hook is clicks only, the groove arrives with the conversation
m.drums(1, kick=[0], hats=range(8, 16, 2), hat_gain=0.07, root=roots[1])
for b in (2, 3, 4, 5):
    m.drums(b, kick=[0, 6, 10], snare=[4, 12], hats=range(16), hat_gain=0.08, root=roots[b])
m.drums(6, kick=[0, 4, 8], hats=range(0, 12, 2), hat_gain=0.08, root=roots[6])
m.roll(at(6, 8), T['lock'], n=14, gain=(0.06, 0.3))
m.riser(T['swirl'], T['lock'], 300, 8000, 0.26)

# ─────────────────────────────── bar 0 · six clicks down the old path, crossed out, sucked into one dot
for i, t0 in enumerate(T['chips']):
    m.add(t0 + 0.1, mouseclick(), 0.26, -0.5 + 0.2 * i)
    m.add(t0, pluck(midi([57, 60, 64, 67, 69, 72][i]), dec=0.18), 0.14, -0.5 + 0.2 * i, 0.3)
m.whoosh(T['strike'], 0.35, 1200, 5000, 0.14, pan=0.1)
m.suck(T['suck'] - 0.2, T['dot'], 0.26)

# bar 1 · the dot, the message box, typing, send
m.add(T['dot'], pop(620, 0.09), 0.3, 0, 0.4)
m.whoosh(T['input'], 0.45, 500, 3000, 0.12)
m.typing(T['type0'], T['type1'], 42, gain=0.12)
m.add(T['send'], mouseclick(), 0.28, 0.4)
m.add(T['send'] + 0.02, blip(midi(88)), 0.08, 0.3, 0.4)
m.whoosh(T['chat'], 0.4, 900, 4500, 0.14, pan=0.2)
m.add(T['chat'] + 0.05, pop(780, 0.07), 0.16, 0.3, 0.3)

# bars 2–3 · the agent answers with products, the variant, add to cart
for k in range(3):
    m.add(T['typing'] + k * 0.1, blip(midi(79 + k * 2), 0.02), 0.04, -0.2, 0.2)
for k in range(7):
    m.add(T['stream'] + k * 0.045, blip(midi(84 + (k % 3) * 2), 0.015), 0.035, -0.3, 0.2)
for i in range(3):
    m.add(T['cards'] + i * 0.09, pop(560 + 110 * i, 0.08), 0.18, -0.35 + 0.35 * i, 0.3)
m.add(T['ask'], pop(760, 0.07), 0.16, 0.3, 0.3)
m.add(T['reply'], pop(640, 0.07), 0.14, -0.3, 0.3)
m.add(T['swatch'], pluck(midi(76), dec=0.2, bend=0.3), 0.12, 0, 0.4)
m.add(T['cart'], mouseclick(), 0.3, 0.1)
m.add(T['cart'] + 0.08, bell(midi(91), 0.7), 0.08, 0.1, 0.5)
m.add(T['badge'], pop(900, 0.06), 0.2, 0.5, 0.3)

# bar 3½–4½ · the inbox: channels pop onto the orbit, messages land on every beat
m.whoosh(T['omni'], 0.7, 2500, 300, 0.2, wet=0.4)
for i in range(6):
    m.add(T['omni'] + 0.12 + i * 0.06, pop(500 + 90 * i, 0.06), 0.1, -0.6 + 0.24 * i, 0.3)
for i in range(6):
    for k in range(4):
        m.add(T['omni'] + 0.35 + i * 0.07 + k * 0.47 + 0.42, blip(midi(91 + (i % 3) * 3), 0.02), 0.03, -0.6 + 0.24 * i, 0.4)
m.whoosh(T['inbox'], 0.5, 700, 3500, 0.1)

# bar 4½–5½ · four capabilities, one per eighth
m.suck(T['grid'] - 0.3, T['grid'], 0.2)
for i, t0 in enumerate(T['tiles']):
    m.add(t0, pop(420 + 120 * i, 0.08), 0.2, -0.4 + 0.27 * i, 0.3)
m.add(T['tiles'][0] + 0.6, bell(midi(88), 0.5), 0.07, -0.3, 0.5)            # the cart comes back
m.whoosh(T['tiles'][1] + 0.15, 0.6, 400, 2000, 0.07, pan=0.3)                 # segments sort themselves
for k in range(3):
    m.add(T['tiles'][2] + 0.15 + k * 0.4, blip(midi(81 + 3 * k)), 0.06, -0.2, 0.3)   # the flow lights up
m.whoosh(T['tiles'][3] + 0.2, 0.7, 3000, 6000, 0.05, pan=0.3)                 # the scan line

# bar 5½–6½ · the formula, one term per beat
for i, t0 in enumerate(T['terms']):
    m.add(t0, pluck(midi([69, 72, 76, 79][i]), dec=0.4), 0.18, 0, 0.4)
    m.whoosh(t0, 0.3, 800, 4000, 0.1)
    if i:
        m.add(t0, pop(880, 0.05), 0.14, -0.3, 0.3)

# bars 6½–8 · the formula dissolves into dots, the mark assembles, the drop
m.whoosh(T['swirl'], 0.8, 300, 3000, 0.2, wet=0.5, bw=0.8)
m.add(T['sphere'], pop(300, 0.14), 0.3, 0, 0.4)
m.glide(T['sphere'], 0.5, 90, 45, 0.25, dec=0.3)
m.impact(T['lock'], 0.6)
m.add(T['lock'], bell(midi(84), 2.0), 0.1, 0, 0.6)
for k, n in enumerate([72, 76, 79, 83, 84, 88, 91]):
    m.add(T['lock'] + 0.03 * k, pluck(midi(n), dec=0.5), 0.05, -0.6 + 0.2 * k, 0.6)
m.add(T['tag'], pop(700, 0.08), 0.12, 0, 0.4)

m.render(peak=0.68, drive=1.3)
