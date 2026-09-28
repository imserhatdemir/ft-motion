"""examples/edit-demo: the panel's own sounds (typing, tool-call ticks, diff swishes, a riser into the render).
The AFTER video keeps its own soundtrack; compose.mjs mixes it in from `videoStart`.
Run:  python examples/edit-demo/sound.py   →  examples/edit-demo/out/audio.wav

The timeline below mirrors timeline() in scene.js. Both read case/meta.json, so a new case retimes both."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *   # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

meta = json.loads((Path(__file__).resolve().parent / 'case' / 'meta.json').read_text(encoding='utf-8'))
m = Mix.from_project(__file__)

PROMPT0, PROMPT_DUR, STEPS0, STEP_GAP, HUNK = 0.5, 2.9, 3.8, 0.6, 0.95
n_steps, n_pick = len(meta['steps']), len(meta['pick'])
diff0 = STEPS0 + n_steps * STEP_GAP + 0.4
render0 = diff0 + n_pick * HUNK + 0.2
v0 = meta['videoStart']

# the request is typed, then sent
m.typing(PROMPT0, PROMPT0 + PROMPT_DUR, len(meta['prompt']), gain=0.12)
m.add(PROMPT0 + PROMPT_DUR + 0.15, pop(520, 0.08), 0.16, 0, 0.3)

# each tool call: a soft tick when it starts, a rising blip when it finishes
scale = [88, 90, 92, 93, 95]
for i in range(n_steps):
    ts = STEPS0 + i * STEP_GAP
    m.add(ts, pop(640 + 40 * i, 0.05), 0.12, -0.2, 0.2)
    m.add(ts + 0.5, blip(midi(scale[i % len(scale)])), 0.07, 0.2, 0.4)

# the diff appears: counters tick up, every hunk swishes in with a few key clicks
m.add(diff0 - 0.2, pop(480, 0.07), 0.12, 0, 0.3)
counter_ticks(m, diff0, 1.2, 12, gain=0.06)
for k in range(n_pick):
    t = diff0 + k * HUNK
    m.whoosh(t, 0.22, 2000, 6000, 0.05)
    m.typing(t + 0.1, t + 0.7, 18, gain=0.07)

# the render: progress ticks, and a riser that lands exactly when the videos start
counter_ticks(m, render0 + 0.1, v0 - render0 - 0.3, 24, gain=0.06)
m.riser(render0, v0, 250, 9000, gain=0.32, wet=0.3)

# the takeaway fades in
m.add(v0 + 0.7, pop(600, 0.08), 0.1, 0, 0.3)

m.render(peak=0.5)
