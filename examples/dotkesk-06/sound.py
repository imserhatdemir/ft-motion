"""examples/dotkesk-06 "Refund requests": score, effects and narration on one timeline (120 BPM, D minor → F major).
Run after voice.py:  python examples/dotkesk-06/sound.py   →  out/audio.wav (prints LUFS, true peak and the high-band share)
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

# hook: the refund lands, then the day piles on
ui(m, 0.02, 'notif', 0.2)
for i in range(4):
    ui(m, wt('hook', 5) + i * 0.16, 'notif', 0.13)
# proof: the chat and the eligibility check, line by line
P0 = S['proof']['scene']
whoosh_soft(m, P0, 0.6, 3000, 600, 0.08)
ui(m, P0 + 0.25, 'in'); type_soft(m, P0 + 0.5, wt('proof', 1), 4); ui(m, wt('proof', 1), 'out'); ui(m, wt('proof', 4), 'in')
ui(m, wt('proof', 8) - 0.1, 'card')
for i in range(3):
    ui(m, wt('proof', 8) + i * 0.3, 'chip')
chime(m, wt('proof', 13), [76, 79, 84], gain=0.07, gap=0.05)
# handoff: the damaged item, the photo, the hand-over to a person
H0 = S['handoff']['scene']
ui(m, H0 + 0.05, 'in'); ui(m, H0 + 0.3, 'card', 0.15); type_soft(m, H0 + 0.6, wt('handoff', 2), 4); ui(m, wt('handoff', 2), 'out')
ui(m, wt('handoff', 5), 'card'); chime(m, wt('handoff', 5) + 0.05, [69, 74], gain=0.07, gap=0.06)

add_voice(m, HERE / 'out' / 'narration.wav', gain=2.2, duck=0.6)
finish(m, drive=1.2, peak=0.8)
