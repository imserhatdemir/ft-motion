"""Soundtrack on the same clock as scene.js.  Run:  python examples/<name>/sound.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *  # noqa: E402,F403

m = Mix.from_project(__file__)

m.pad(0.0, chord('Em9'), dur=m.bar, att=1.0, gain=0.22, cutoff=800)
m.whoosh(0.1, 0.6, 700, 5000, 0.14)          # the headline reveal
m.drums(1, kick=[0, 10], snare=[8], hats=range(0, 16, 2), root=40)
m.add(m.at(1), pop(640), 0.18, 0, 0.4)        # the dot

m.render()
