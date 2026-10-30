"""examples/dotkesk-01 "2 A.M.": narration. Run:  C:\\vox\\Scripts\\python.exe examples/dotkesk-01/voice.py
Writes out/narration.wav, schedule.js and the duration in project.json (see examples/dotkesk/voice_lib.py).
`text` is what the captions show, `say` is what the model reads ("dot-kesk" so it says the name right)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'dotkesk'))
from voice_lib import build  # noqa: E402

LINES = [
    {'key': 'hook', 'text': "It's 2 a.m. Your store is closed.", 'say': "It's 2 a.m. Your store is closed.", 'min': 2.25},
    {'key': 'ask', 'text': 'But someone just asked: do you have this in pink?', 'say': 'But someone just asked: do you have this in pink?', 'tempo': 0.92},
    {'key': 'lost', 'text': "By morning, they've moved on.", 'say': "By morning, they've moved on.", 'min': 2.25, 'extra': 0.25},
    {'key': 'turn', 'text': 'Unless dotkesk answers.', 'say': 'Unless dot-kesk answers.', 'min': 2.0, 'extra': 0.25},
    {'key': 'proof', 'text': 'It checks your stock, sends the sizes, and drops a checkout link.',
     'say': 'It checks your stock, sends the sizes, and drops a checkout link.', 'min': 5.5},
    {'key': 'sale', 'text': 'Sale made. While you sleep.', 'say': 'Sale made. While you sleep.', 'min': 2.25},
    {'key': 'end', 'text': 'Follow @dotkesk, and book your free demo.', 'say': 'Follow at dot-kesk, and book your free demo.', 'min': 4.75},
]

build(__file__, LINES)
