"""examples/dotkesk-04 "Before your coffee gets cold" — train, test, activate: narration. Run:  C:\vox\Scripts\python.exe examples/dotkesk-04/voice.py
Writes out/narration.wav, schedule.js and the duration in project.json (see examples/dotkesk/voice_lib.py).
`text` is what the captions show, `say` is what the model reads ("dot-kesk" so it says the name right)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'dotkesk'))
from voice_lib import build  # noqa: E402

LINES = [
    {'key': 'hook', 'text': 'Your AI agent, live before your coffee gets cold.', 'min': 2.75, 'say': 'Your AI agent, live before your coffee gets cold.'},
    {'key': 'turn', 'text': 'First, dotkesk reads your catalog, your policies and your FAQ.', 'say': 'First, dot-kesk reads your catalog, your policies, and your F.A.Q.', 'min': 3.75},
    {'key': 'test', 'text': 'Then you test it. Ask anything, and fix an answer in one click.', 'min': 4.0, 'say': 'Then you test it. Ask anything, and fix an answer in one click.'},
    {'key': 'live', 'text': 'Then switch it on: WhatsApp, Instagram, Telegram, web chat.', 'min': 3.75, 'say': 'Then switch it on: WhatsApp, Instagram, Telegram, web chat.'},
    {'key': 'payoff', 'text': 'From setup to sales, in minutes.', 'min': 2.25, 'say': 'From setup to sales, in minutes.'},
    {'key': 'end', 'text': 'Follow @dotkesk, and book your free demo.', 'say': 'Follow at dot-kesk, and book your free demo.', 'min': 4.75},
]

build(__file__, LINES)
