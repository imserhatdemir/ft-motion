"""examples/reel: soundtrack on the same grid as scene.js (128 BPM, A minor, bar = 1.875 s).
Run:  python examples/reel/sound.py   →  examples/reel/out/audio.wav

Arrangement (beats):  0–4 hook: only text slams · 4–12 groove builds · 12–20 the drop · 20–28 code (filtered, sparse) · 28–32 resolve.
Every camera hit in scene.js HITS has a sound here; the drop-outs at beats 11 and 27 make the next hit land harder."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *   # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

m = Mix.from_project(__file__)
b = lambda n: n * m.beat
BAR = m.bar

# ── harmony: Am F C Am | F C G Am9 (one chord per bar; the last one rings out to the end)
CH = ['Am', 'F', 'C', 'Am', 'F', 'C', 'G', 'Am9']
ROOT = [33, 29, 36, 33, 29, 36, 31, 33]
PADG = [0.0, 0.5, 0.55, 0.7, 0.7, 0.6, 0.6, 1.0]
ARPG = [0, 0.26, 0.32, 0.55, 0.6, 0.34, 0.2, 0]
for bar in range(1, 8):
    last = bar == 7
    m.pad(m.at(bar), chord(CH[bar], 3), dur=(m.dur - m.at(bar)) if last else BAR, att=0.9 if last else 0.3, rel=1.4 if last else 0.4,
          gain=0.22 * PADG[bar] * (1.3 if last else 1), cutoff=1400, wet=0.35)

# ── bar 0 · hook: a drone and four slams (NE · KADAR · İYİ · ?)
m.glide(0, b(4), 55, 55, 0.16, dec=None)
for n, p in [(0, 110), (1, 131), (2, 165)]:
    stamp(m, b(n), p, 0.75)
stamp(m, b(2.5), 220, 0.8)
m.glide(b(2.5), 0.2, 300, 1900, 0.28, dec=0.09, wet=0.3)               # the "?" chirps up
for k in (1, 2, 3):
    m.add(b(k) + m.beat / 2, hat(), 0.05 * k, 0.25)
m.riser(1.15, b(4), 300, 7000, gain=0.5)

# ── beats 4–12 · groove: kick every beat, offbeat hats, wipes between the mini scenes
m.impact(b(4), 0.6, bright=False)
m.drums(1, kick=[0, 4, 8, 12], hats=[2, 6, 10, 14], hat_gain=0.14)
m.drums(2, kick=[0, 4, 8], hats=[2, 6, 10, 14], hat_gain=0.14, root=ROOT[2])       # beat 11 drops out
for mid in (b(6), b(8), b(10)):
    m.whoosh(mid - 0.32, 0.32, 500, 6500, 0.11)                                     # cover
    m.whoosh(mid, 0.4, 6000, 600, 0.06)                                             # reveal
    m.add(mid, tom(90, 0.1), 0.3)
m.whoosh(b(4), 0.46, 6000, 500, 0.06)
m.riser(b(10) + 0.42, b(12), 200, 9000, gain=0.6)                                   # into the drop

# ── beats 12–20 · the drop: full kit, 8th-note bass, 16th arp with echoes
m.impact(b(12), 0.9)
counter_ticks(m, b(12), 0.85, 29)                                                   # "900" counting up
for bar in (3, 4):
    m.drums(bar, kick=[0, 4, 8, 12], snare=[4, 12], hats=range(16), hat_gain=0.09, root=ROOT[bar])
    for st in (2, 6, 10, 14):
        m.bass(m.at(bar, st), ROOT[bar] + (12 if st in (6, 14) else 0), 0.22)
for n, p in [(14, 147), (15, 175)]:
    stamp(m, b(n), p, 0.8)                                                          # "60 FPS" · "ZERO MOUSE"
m.riser(b(14) + 0.1, b(16), 200, 8500, gain=0.45)
m.impact(b(16), 0.8)                                                                # sphere lands
m.suck(b(18) + 0.05, b(20), 0.4)

# arp: chord tones, two octaves up, alternate sides
TONES = {'Am': [57, 60, 64, 69], 'F': [53, 57, 60, 65], 'C': [60, 64, 67, 72], 'G': [55, 59, 62, 67], 'Am9': [57, 60, 64, 69]}
PAT = [0, 2, 1, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2]
ACC = [1, .5, .7, .5, .9, .5, .7, .5, 1, .5, .7, .5, .9, .5, .8, .6]
for bar in range(1, 7):
    for s in range(16):
        n = TONES[CH[bar]][PAT[s]] + (12 if (s % 8) in (3, 7) and bar in (3, 4) else 0)
        echo(m, m.at(bar, s), pluck(midi(n), dec=0.22), gain=0.11 * ARPG[bar] * ACC[s] * 2, pan=-0.4 if s % 2 else 0.4, taps=2 if s % 4 == 0 else 0)

# ── beats 20–28 · code: the groove stays, quieter; typing, a glitch tear, then three slams
m.add(b(20) - 0.02, glitch_burst(0.42), 0.5, 0, 0.15)
m.impact(b(20), 0.35, bright=False)
m.drums(5, kick=[0, 4, 8, 12], hats=[2, 6, 10, 14], hat_gain=0.09, root=ROOT[5])
m.drums(6, kick=[0, 4, 8], hats=[2, 6, 10, 14], hat_gain=0.09, root=ROOT[6])        # beat 27 drops out
m.typing(b(20) + 0.12, b(20) + 1.5, 100)
m.add(b(22), tom(180, 0.08), 0.25, 0.3)                                            # the preview window pops
for n, p in [(24, 110), (25, 131), (26, 165)]:
    stamp(m, b(n), p, 0.75)                                                         # "BU VİDEO · KODLA · YAZILDI."
m.riser(b(26), b(28), 250, 10000, gain=0.85)
m.roll(b(26), b(28), n=14, gain=(0.08, 0.32))

# ── beats 28–32 · resolve: the big hit, a sub, sparkles, the question, and quiet
m.impact(b(28), 1.0)
m.add(b(28), np.sin(2 * np.pi * 55 * tarr(m.dur - b(28))) * np.exp(-tarr(m.dur - b(28)) / 1.2) * 0.5)
stamp(m, b(29), 196, 0.85)                                                          # "MI?" lands
for i, n in enumerate([93, 88, 84, 91, 88, 81]):
    m.add(b(28) + 0.22 + i * 0.235, pluck(midi(n), dec=0.9), 0.1 * (1 - i * 0.1), -0.5 if i % 2 else 0.5, 0.45)
m.typing(b(30), b(30) + 0.6, 28, gain=0.1)
m.add(14.4, bell(midi(96), 1.0), 0.06, 0.2, 0.5)                                    # tinkle on the "?" wiggle

m.render(peak=0.74)
