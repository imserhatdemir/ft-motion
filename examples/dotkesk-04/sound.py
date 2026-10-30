"""examples/dotkesk-04 "Before your coffee gets cold": score, effects and narration on one timeline (120 BPM, D minor → F major).
Run after voice.py:  python examples/dotkesk-04/sound.py   →  out/audio.wav (prints LUFS, true peak and the high-band share)
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

# train: a card per source, its lines pouring up into the logo
for i in (4, 6, 9):
    ui(m, wt('turn', i), 'card'); whoosh_soft(m, wt('turn', i) + 0.15, 0.9, 700, 3200, 0.05)
# test: the demo question, the answer, the one-click correction
ui(m, wt('test', 4) - 0.1, 'in'); type_soft(m, wt('test', 4) + 0.4, wt('test', 6), 5); ui(m, wt('test', 6), 'out')
ui(m, wt('test', 7), 'card', 0.15); ui(m, wt('test', 12), 'tap'); chime(m, wt('test', 12) + 0.03, [79, 84], gain=0.06, gap=0.05)
# live: the master switch, then one switch per channel
ui(m, S['live']['scene'] + 0.05, 'card')
for i in (3, 4, 5, 6, 7):
    ui(m, wt('live', i), 'tap', 0.14); ui(m, wt('live', i) + 0.03, 'chip', 0.2)

add_voice(m, HERE / 'out' / 'narration.wav', gain=2.2, duck=0.6)
finish(m, drive=1.2, peak=0.8)
