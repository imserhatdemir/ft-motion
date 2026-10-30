"""examples/dotkesk-07 "Web chat": score, effects and narration on one timeline (120 BPM, D minor → F major).
Run after voice.py:  python examples/dotkesk-07/sound.py   →  out/audio.wav (prints LUFS, true peak and the high-band share)
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

# turn: the logo lands in the corner as the chat button
ui(m, wt('turn', 2) + 0.5, 'card', 0.2)
# proof: the chat opens and talks
ui(m, S['proof']['scene'] - 0.1, 'card')
ui(m, wt('proof', 1) - 0.05, 'out'); ui(m, wt('proof', 3) - 0.05, 'out'); ui(m, wt('proof', 6) - 0.1, 'in')
type_soft(m, wt('proof', 6) + 0.25, wt('proof', 8), 4); ui(m, wt('proof', 8), 'out'); ui(m, wt('proof', 11), 'card')

add_voice(m, HERE / 'out' / 'narration.wav', gain=2.2, duck=0.6)
finish(m, drive=1.2, peak=0.8)
