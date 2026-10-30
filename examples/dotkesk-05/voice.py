"""examples/dotkesk-05 "Added to cart… and left" — proactive engagement and one-time codes: narration. Run:  C:\vox\Scripts\python.exe examples/dotkesk-05/voice.py
Writes out/narration.wav, schedule.js and the duration in project.json (see examples/dotkesk/voice_lib.py).
`text` is what the captions show, `say` is what the model reads ("dot-kesk" so it says the name right)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'dotkesk'))
from voice_lib import build  # noqa: E402

LINES = [
    {'key': 'hook', 'text': 'They added it to the cart. Then they left.', 'min': 2.75, 'say': 'They added it to the cart. Then they left.'},
    {'key': 'turn', 'text': 'dotkesk notices the hesitation, and steps in at the right moment.', 'say': 'Dot-kesk notices the hesitation, and steps in at the right moment.', 'min': 3.75},
    {'key': 'proof', 'text': 'With a one-time discount code, built from the rules you set.', 'min': 4.5, 'say': 'With a one-time discount code, built from the rules you set.'},
    {'key': 'payoff', 'text': 'And the cart comes back to life.', 'min': 2.5, 'say': 'And the cart comes back to life.'},
    {'key': 'end', 'text': 'Follow @dotkesk, and book your free demo.', 'say': 'Follow at dot-kesk, and book your free demo.', 'min': 4.75},
]

build(__file__, LINES)
