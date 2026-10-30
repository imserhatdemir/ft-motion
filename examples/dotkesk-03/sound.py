"""examples/dotkesk-03 "Connect everything": score, effects and narration on one timeline (120 BPM, D minor → F major).
Run after voice.py:  python examples/dotkesk-03/sound.py   →  out/audio.wav (prints LUFS, true peak and the high-band share)
The shared part (chords, the turn on "dotkesk", groove, payoff, end card) is sfx.series_score; below are this episode's own
events, at the same times scene.js uses."""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'audio'))
sys.path.insert(0, str(HERE.parent / 'dotkesk'))
from ftsynth import Mix  # noqa: E402
from sfx import series_score, load_schedule, ui, type_soft, whoosh_soft, soft_click, chime, add_voice, finish  # noqa: E402

S = load_schedule(HERE)
wt = lambda k, i: S[k]['words'][min(i, len(S[k]['words']) - 1)][1]
m = Mix.from_project(__file__)
series_score(m, S)

# hook: the inbox, then the store window; pain: a tab click on every beat
ui(m, 0.02, 'card'); ui(m, 0.6, 'card')
t = S['pain']['voice']
while t < S['turn']['scene'] - 0.1:
    ui(m, t + 0.02, 'tap', 0.12); t += m.beat
# proof: a pop per chip as it is named, and the wire
for i in (0, 1, 2, 3, 5, 10, 11, 13):
    ui(m, wt('proof', i), 'chip', 0.24); whoosh_soft(m, wt('proof', i), 0.4, 900, 2600, 0.03)
chime(m, wt('proof', 7), [72, 76], gain=0.06, gap=0.05)
# payoff: the chat and its tags
P = S['payoff']['scene']
ui(m, P + 0.15, 'in'); type_soft(m, P + 0.35, wt('payoff', 1) - 0.05, 4); ui(m, wt('payoff', 1) - 0.05, 'out')
for i in (0, 1, 3):
    ui(m, wt('payoff', i), 'chip', 0.22)
ui(m, wt('payoff', 3), 'card')

add_voice(m, HERE / 'out' / 'narration.wav', gain=2.2, duck=0.6)
finish(m, drive=1.2, peak=0.8)
