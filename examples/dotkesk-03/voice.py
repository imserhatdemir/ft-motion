"""examples/dotkesk-03 "Connect everything" — chat channels linked to the store: narration. Run:  C:\vox\Scripts\python.exe examples/dotkesk-03/voice.py
Writes out/narration.wav, schedule.js and the duration in project.json (see examples/dotkesk/voice_lib.py).
`text` is what the captions show, `say` is what the model reads ("dot-kesk" so it says the name right)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'dotkesk'))
from voice_lib import build  # noqa: E402

LINES = [
    {'key': 'hook', 'text': 'Your chats are in one place. Your stock is in another.', 'min': 3.0, 'say': 'Your chats are in one place. Your stock is in another.'},
    {'key': 'pain', 'text': 'So every answer starts with switching tabs.', 'min': 2.5, 'say': 'So every answer starts with switching tabs.'},
    {'key': 'turn', 'text': 'dotkesk connects them.', 'say': 'Dot-kesk connects them.', 'min': 2.0, 'extra': 0.25},
    {'key': 'proof', 'text': 'WhatsApp, Instagram, Telegram, email and web chat, linked to your ikas, Shopify or WooCommerce store.', 'say': 'WhatsApp, Instagram, Telegram, email and web chat, linked to your ee-kas, Shopify, or WooCommerce store.', 'min': 6.0},
    {'key': 'payoff', 'text': 'Catalog, stock and orders, live in every conversation.', 'min': 3.25, 'say': 'Catalog, stock and orders, live in every conversation.'},
    {'key': 'end', 'text': 'Follow @dotkesk, and book your free demo.', 'say': 'Follow at dot-kesk, and book your free demo.', 'min': 4.75},
]

build(__file__, LINES)
