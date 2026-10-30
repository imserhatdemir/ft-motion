"""examples/dotkesk-02 "Where's my order?" — order tracking: narration. Run:  C:\vox\Scripts\python.exe examples/dotkesk-02/voice.py
Writes out/narration.wav, schedule.js and the duration in project.json (see examples/dotkesk/voice_lib.py).
`text` is what the captions show, `say` is what the model reads ("dot-kesk" so it says the name right)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'dotkesk'))
from voice_lib import build  # noqa: E402

LINES = [
    {'key': 'hook', 'text': "Where's my order? You've heard it all day.", 'min': 2.5, 'say': "Where's my order? You've heard it all day."},
    {'key': 'pain', 'text': 'Each one means opening the panel, finding the order, and checking the courier.', 'min': 3.5, 'say': 'Each one means opening the panel, finding the order, and checking the courier.'},
    {'key': 'turn', 'text': 'Let dotkesk answer.', 'say': 'Let dot-kesk answer.', 'min': 2.0, 'extra': 0.25},
    {'key': 'proof', 'text': 'It finds the order, reads the live status, and sends the courier details.', 'min': 5.5, 'say': 'It finds the order, reads the live status, and sends the courier details.'},
    {'key': 'payoff', 'text': 'Answered, while your team gets on with their day.', 'min': 2.25, 'say': 'Answered, while your team gets on with their day.'},
    {'key': 'end', 'text': 'Follow @dotkesk, and book your free demo.', 'say': 'Follow at dot-kesk, and book your free demo.', 'min': 4.75},
]

build(__file__, LINES)
