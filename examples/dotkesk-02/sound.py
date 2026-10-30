"""examples/dotkesk-02 "Where's my order?": score, effects and narration on one timeline (120 BPM, D minor → F major).
Run after voice.py:  python examples/dotkesk-02/sound.py   →  out/audio.wav (prints LUFS, true peak and the high-band share)
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

# hook: five DMs, one chime each
for i in range(5):
    ui(m, max(0.02, -0.4 + i * 0.42), 'notif', 0.17 - 0.015 * i)
# pain: the panel opens, the order number is typed, the courier window keeps loading
ui(m, wt('pain', 3), 'tap'); ui(m, wt('pain', 3) + 0.05, 'card')
type_soft(m, wt('pain', 6), wt('pain', 6) + 0.45, 6)
ui(m, wt('pain', 6) + 0.6, 'tap'); ui(m, wt('pain', 10), 'tap'); ui(m, wt('pain', 10) + 0.05, 'card', 0.15)
# proof: the chat
P0 = S['proof']['scene']
whoosh_soft(m, P0, 0.6, 3000, 600, 0.08)
ui(m, P0 + 0.25, 'in'); type_soft(m, P0 + 0.55, wt('proof', 1), 5); ui(m, wt('proof', 1), 'out')
ui(m, wt('proof', 5) - 0.1, 'card')
for i in range(4):
    ui(m, wt('proof', 5) + i * 0.18, 'chip')
ui(m, wt('proof', 9) - 0.1, 'card')

add_voice(m, HERE / 'out' / 'narration.wav', gain=2.2, duck=0.6)
finish(m, drive=1.2, peak=0.8)
