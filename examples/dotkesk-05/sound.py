"""examples/dotkesk-05 "Added to cart… and left": score, effects and narration on one timeline (120 BPM, D minor → F major).
Run after voice.py:  python examples/dotkesk-05/sound.py   →  out/audio.wav (prints LUFS, true peak and the high-band share)
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

# hook: add to cart, the badge, then the pointer leaves and the idle timer ticks
ui(m, wt('hook', 1), 'tap'); ui(m, wt('hook', 1) + 0.1, 'chip', 0.25)
whoosh_soft(m, wt('hook', 7) - 0.2, 0.7, 2400, 500, 0.06)
t = wt('hook', 7) + 0.3
while t < wt('turn', 5):
    m.add(t, soft_click(), 0.05, 0.3); t += m.beat
# the agent steps in from the chat button
ui(m, wt('turn', 5), 'card', 0.18); ui(m, wt('turn', 5) + 0.2, 'out')
# proof: the coupon, the rules
ui(m, wt('proof', 3) - 0.1, 'card'); chime(m, wt('proof', 3), [76, 79], gain=0.06, gap=0.05)
ui(m, wt('proof', 8) - 0.15, 'card', 0.15)
for i in range(3):
    ui(m, wt('proof', 8) + i * 0.12, 'tap', 0.1)
# the cart wakes up
ui(m, S['payoff']['scene'] + 0.05, 'chip', 0.3)

add_voice(m, HERE / 'out' / 'narration.wav', gain=2.2, duck=0.6)
finish(m, drive=1.2, peak=0.8)
