"""examples/dotkesk-07 "Web chat" — the AI agent on your own site: narration. Run:  C:\vox\Scripts\python.exe examples/dotkesk-07/voice.py
Writes out/narration.wav, schedule.js and the duration in project.json (see examples/dotkesk/voice_lib.py).
`text` is what the captions show, `say` is what the model reads ("dot-kesk" so it says the name right)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'dotkesk'))
from voice_lib import build  # noqa: E402

LINES = [
    {'key': 'hook', 'text': 'A visitor is on your site. Nobody says hello.', 'min': 2.75, 'say': 'A visitor is on your site. Nobody says hello.'},
    {'key': 'turn', 'text': "dotkesk's web chat does.", 'say': "Dot-kesk's web chat does.", 'min': 2.0, 'extra': 0.25},
    {'key': 'proof', 'text': 'It greets them, asks what they need, and recommends the right product from your catalog.', 'min': 6.0, 'say': 'It greets them, asks what they need, and recommends the right product from your catalog.'},
    {'key': 'payoff', 'text': 'Questions answered. Products found. Right on your site.', 'min': 3.0, 'say': 'Questions answered. Products found. Right on your site.'},
    {'key': 'end', 'text': 'Follow @dotkesk, and book your free demo.', 'say': 'Follow at dot-kesk, and book your free demo.', 'min': 4.75},
]

build(__file__, LINES)
