"""examples/dotkesk-01 "2 A.M.": score, effects and the narration on one timeline (120 BPM, D minor → F major).
Run after voice.py:  python examples/dotkesk-01/sound.py   →  out/audio.wav (prints LUFS, true peak and the high-band share)
Scene and word times come from schedule.js, the same file scene.js reads, so every visual event has its sound:
  night drone + clock ticks · a chime per DM · ticks racing to morning while the dots drift off · a rewind into the turn, a thump
  and a bright F chord on "dotkesk" · the groove starts · a pop per chat bubble, typing, size blips, the checkout tap ·
  a success chime on the order · the end card: dots whoosh into the logo, Follow tap, CTA."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'audio'))
sys.path.insert(0, str(HERE.parent / 'dotkesk'))
from ftsynth import Mix, chord, midi, filt, tarr  # noqa: E402
from sfx import soft_pop, soft_hat, soft_click, chime, type_soft, whoosh_soft, thump, add_voice, finish  # noqa: E402

src = (HERE / 'schedule.js').read_text(encoding='utf-8')
S = {s['key']: s for s in json.loads(src[src.index('['):src.rindex(']') + 1])}
wt = lambda k, i: S[k]['words'][min(i, len(S[k]['words']) - 1)][1]
m = Mix.from_project(__file__)
B = m.beat
NAME = wt('turn', 1)

# ── harmony: one chord per section (the proof cycles one per bar); the end card gets the brightest one
m.pad(0, chord('Dm', 3), S['lost']['scene'], gain=0.16, att=0.8, cutoff=800, wet=0.5)
m.pad(S['lost']['scene'], chord('Bbmaj7', 2), S['turn']['scene'] - S['lost']['scene'], gain=0.13, cutoff=650, wet=0.5)
m.pad(NAME, chord('Fadd9', 3), S['proof']['scene'] - NAME, gain=0.2, att=0.05, cutoff=1500, wet=0.45)
prog_ = ['F', 'C', 'Dm', 'Bb']
t, k = S['proof']['scene'], 0
while t < S['sale']['scene'] - 0.01:
    d = min(m.bar, S['sale']['scene'] - t)
    m.pad(t, chord(prog_[k % 4], 3), d, gain=0.15, cutoff=1300, wet=0.4)
    t += d; k += 1
m.pad(S['sale']['scene'], chord('Cadd9', 3), S['end']['scene'] - S['sale']['scene'], gain=0.17, cutoff=1500, wet=0.45)
m.pad(S['end']['scene'], chord('Fmaj9', 3), m.dur - S['end']['scene'], gain=0.2, att=0.4, rel=1.2, cutoff=1800, wet=0.5)

# ── hook / ask: a low night drone, a quiet clock tick on every beat, a soft chime per DM
m.glide(0, S['turn']['scene'], midi(38), midi(38), 0.09)
t = 0.0
while t < S['lost']['scene'] - 0.01:
    m.add(t, soft_click(), 0.08 if int(round(t / B)) % 2 else 0.11, 0.3)
    t += B
note_at = [wt('ask', 3) - 0.05, wt('ask', 6) - 0.05, wt('ask', 9) - 0.05]
for i, tt in enumerate(note_at):
    chime(m, tt, [76, 81] if i % 2 == 0 else [74, 79], gain=0.08, gap=0.07, pan=-0.2 + 0.2 * i)
    m.add(tt, soft_pop(540, 0.06), 0.18)

# ── lost: the clock races to morning (ticks speed up, then settle), the dots break off and drift away
L0, L1 = S['lost']['scene'], S['lost']['end']
n = 34
for j in range(n):
    x = j / n
    tt = L0 + 0.15 + (L1 - 0.3 - L0 - 0.15) * (3 * x * x - 2 * x ** 3)       # matches EASE.snap-ish run of the digits
    m.add(tt, soft_click(), 0.05 + 0.03 * (1 - abs(2 * x - 1)), 0.25)
whoosh_soft(m, L0 + 0.15, 1.6, 2400, 300, 0.12, wet=0.5)
m.glide(L0 + 0.1, 1.6, 300, 120, 0.05, dec=0.8, wet=0.4)

# ── turn: a rewind sweep up into the name, a thump and a bright chord on "dotkesk"
T0 = S['turn']['scene']
whoosh_soft(m, T0, NAME - T0 + 0.05, 350, 5000, 0.14, wet=0.3)
m.glide(T0, NAME - T0, 140, 420, 0.06, wet=0.3)
thump(m, NAME, 0.75)
chime(m, NAME + 0.02, [65, 69, 72, 77], gain=0.1, gap=0.045, dec=1.6, wet=0.55)

# ── groove from the name to the end card: soft kick on the beat, dark hats on the off-beat, bass on the eighths in the chat
start = round(NAME / B) * B + B * 2
t = start
while t < S['end']['scene'] - 0.01:
    if t < S['sale']['scene'] - 0.01 or t >= S['sale']['scene'] + m.bar * 0.5:
        m.kick(t, 0.5, dec=0.28)
    m.add(t + B / 2, soft_hat(), 0.05, 0.25)
    t += B
roots = {'F': 41, 'C': 36, 'Dm': 38, 'Bb': 34}
t, k = S['proof']['scene'], 0
while t < S['sale']['scene'] - 0.01:
    for st in (2, 6, 10, 14):
        if t + st * m.step < S['sale']['scene']:
            m.bass(t + st * m.step, roots[prog_[k % 4]] + 12, 0.16)
    t += m.bar; k += 1

# ── proof: the chat (same times as scene.js)
P0, P1 = S['proof']['scene'], S['proof']['end']
w = lambda i: wt('proof', i)
tap = P1 - 0.5
whoosh_soft(m, P0, 0.6, 3000, 600, 0.08)
m.add(P0 + 0.15, soft_pop(380, 0.1), 0.2)                                       # the card
m.add(P0 + 0.25, soft_pop(520), 0.2, -0.2)                                       # "Do you have this in pink?"
type_soft(m, P0 + 0.55, w(1), 6)
m.add(w(1), soft_pop(700), 0.2, 0.2)                                             # the answer
m.add(w(3) - 0.05, soft_pop(600, 0.09), 0.22, 0.2)                               # the product card
for i, f in enumerate((520, 620, 740)):
    m.add(w(6) - 0.05 + i * 0.08, soft_pop(f, 0.04), 0.12, -0.3 + 0.3 * i)      # S · M · L
m.add(w(6) + 0.15, soft_pop(520), 0.2, -0.2)                                     # "M please!"
type_soft(m, w(6) + 0.45, w(8), 5)
m.add(w(8), soft_pop(700), 0.2, 0.2)                                             # "Added to your cart…"
m.add(w(10) - 0.05, soft_pop(820, 0.06), 0.2, 0.25)                              # the checkout button
m.add(tap, soft_click(), 0.4, 0.2)

# ── sale: the order lands
S0 = S['sale']['scene']
thump(m, S0, 0.55)
chime(m, S0 + 0.05, [72, 76, 79, 84], gain=0.11, gap=0.07, dec=1.4, wet=0.5)
whoosh_soft(m, S0 + 0.1, 1.0, 1800, 500, 0.08, wet=0.4)

# ── end card: dots whoosh into the logo, the sphere, the wordmark, the Follow tap, the demo button
E0 = S['end']['scene']
whoosh_soft(m, E0 - 0.1, 1.1, 600, 4500, 0.13, wet=0.35)
m.add(E0 + 0.15, soft_pop(300, 0.14), 0.3)
m.add(E0 + 0.45, soft_pop(440, 0.08), 0.15)
m.add(E0 + 0.95, soft_pop(560, 0.07), 0.15)
m.add(E0 + 1.6, soft_pop(480, 0.09), 0.18)
m.add(E0 + 2.05, soft_click(), 0.45, 0.25)
chime(m, E0 + 2.07, [77, 81, 84], gain=0.1, gap=0.06, dec=1.2, pan=0.2)
chime(m, E0 + 3.0, [65, 72, 77], gain=0.07, gap=0.09, dec=2.2, wet=0.6)
m.glide(E0, m.dur - E0, midi(29), midi(29), 0.08)

add_voice(m, HERE / 'out' / 'narration.wav', gain=2.2, duck=0.6)
finish(m, drive=1.2, peak=0.8)
