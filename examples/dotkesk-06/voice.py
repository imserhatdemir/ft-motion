"""examples/dotkesk-06 "Refund requests" — refunds and human handoff: narration. Run:  C:\vox\Scripts\python.exe examples/dotkesk-06/voice.py
Writes out/narration.wav, schedule.js and the duration in project.json (see examples/dotkesk/voice_lib.py).
`text` is what the captions show, `say` is what the model reads ("dot-kesk" so it says the name right)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'dotkesk'))
from voice_lib import build  # noqa: E402

LINES = [
    {'key': 'hook', 'text': 'A refund request. At the worst possible moment.', 'min': 2.75, 'say': 'A refund request. At the worst possible moment.'},
    {'key': 'turn', 'text': 'dotkesk takes it from here.', 'say': 'Dot-kesk takes it from here.', 'min': 2.25},
    {'key': 'proof', 'text': 'It guides the customer step by step, and checks if the order is eligible.', 'min': 5.0, 'say': 'It guides the customer step by step, and checks if the order is eligible.'},
    {'key': 'handoff', 'text': 'Anything unusual goes straight to your team.', 'min': 3.0, 'say': 'Anything unusual goes straight to your team.'},
    {'key': 'payoff', 'text': 'Calm customers. Calm you.', 'min': 2.25, 'say': 'Calm customers. Calm you.'},
    {'key': 'end', 'text': 'Follow @dotkesk, and book your free demo.', 'say': 'Follow at dot-kesk, and book your free demo.', 'min': 4.75},
]

build(__file__, LINES)
