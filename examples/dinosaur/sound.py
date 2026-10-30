"""examples/dinosaur: soundtrack on the same grid as scene.js (160 BPM, D minor, bar = 1.5 s, 12 bars = 18 scene seconds, played at speed 0.6 = 30 s).
Run:  python examples/dinosaur/sound.py   →  examples/dinosaur/out/audio.wav
If examples/dinosaur/out/narration.wav exists (see voice.py) it is mixed in and the music ducks under it.

Arrangement (bars): 0–3 calm dusk, a riser builds · 3 impact · 3–5 rumble and fire · 5–8 dead air, sparse · 8 the %75 · 9–11 the bird, hope · 11 the end, ringing out."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *   # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

m = Mix.from_project(__file__)
b = lambda n: n * m.beat
BAR = m.bar
HERE = Path(__file__).resolve().parent

# ── harmony: Dm Bb Gm A | Dm Bb F A | Dm Gm Dm Dm9 (one chord per bar; the last one rings out)
CH = ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'F', 'A', 'Dm', 'Gm', 'Dm', 'Dm9']
GAIN = [0.7, 0.8, 0.9, 0.0, 0.5, 0.4, 0.3, 0.0, 0.0, 0.7, 0.9, 1.0]       # bar 3 and 7 are the holes: the impact and the silence
for bar in range(12):
    if GAIN[bar] <= 0 or CH[bar] not in ('Dm', 'Bb', 'Gm', 'A', 'F', 'Dm9'):
        continue
    last = bar == 11
    m.pad(m.at(bar), chord(CH[bar], 3), dur=(m.dur - m.at(bar)) if last else BAR, att=0.9 if last else 0.4, rel=1.6 if last else 0.6,
          gain=0.2 * GAIN[bar] * (1.3 if last else 1), cutoff=1100 if bar < 8 else 1700, wet=0.5)

# ── bars 0–2 · dusk: a low drone, a heartbeat that quickens, the light growing
m.glide(0, b(12), 49, 49, 0.14, dec=None)
for k in range(10):
    m.add(b(1.5 + k * 0.55 * (1 - k * 0.04)) + BAR, tom(70, 0.12), 0.1 + 0.025 * k, 0, 0.2)
m.add(BAR, bell(midi(86), 1.4), 0.07, 0.3, 0.6)                              # the first light (bar 1)
T = BAR * 3
m.riser(BAR * 2, T, 200, 6500, gain=0.55)                       # the rock falls
m.glide(BAR * 2, BAR, 180, 90, 0.12, dec=None)
m.typing(BAR * 2 + 0.05, BAR * 2 + 0.7, 7, gain=0.1)                         # "~10 KM"

# ── bar 3 · the impact: everything at once, then air
m.add(T - 0.02, glitch_burst(0.5), 0.5, 0, 0.2)
m.impact(T, 1.2)
m.add(T, np.sin(2 * np.pi * 38 * tarr(m.dur - T)) * np.exp(-tarr(m.dur - T) / 2.2) * 0.7)   # sub that decays over the whole shockwave
m.whoosh(T, 1.6, 4000, 120, 0.3, wet=0.5)
m.add(T + 0.02, kick(0.6, 120, 30), 0.9)
for i in range(7):
    m.add(T + 0.18 + i * 0.16, tom(60 + i * 8, 0.22), 0.26 * (1 - i * 0.1), 0, 0.3)       # debris

# ── bars 4–6 · ash: wind, then nothing
m.whoosh(BAR * 4, BAR * 2, 300, 900, 0.1, wet=0.6, bw=0.3)
m.suck(BAR * 5 + 0.1, BAR * 6, 0.22)                                            # the sun goes out
for n, p in [(5, 98), (6, 87)]:
    stamp(m, BAR * n + 0.05, p, 0.5)                                            # "GÜNEŞ KAYBOLDU" · "BİTKİLER ÖLDÜ"
m.suck(BAR * 6 + 0.1, BAR * 7, 0.18)

# ── bar 7 · the dots arrive: a dry tick per dot, then the hole before the number
counter_ticks(m, BAR * 7.3, 0.55, 40, 1500, 2600, gain=0.07, pan=0.0)

# ── bar 8 · %75: ticks as it counts, a slam, then 75 dots going dark
counter_ticks(m, BAR * 8, 0.9, 75, 1700, 3200, gain=0.11, pan=0.2)
stamp(m, BAR * 8, 110, 0.85)
m.impact(BAR * 8, 0.45, bright=False)
for i in range(25):
    m.add(BAR * 8 + 0.12 + i * 0.045, blip(300 - i * 6, 0.05), 0.05, -0.5 + (i % 5) * 0.25, 0.1)

# ── bar 9 · the bird: the colour of the world turns, a clear bell
m.add(BAR * 9 - 0.04, bell(midi(81), 2.0), 0.14, -0.2, 0.55)
m.add(BAR * 9 + 0.16, bell(midi(86), 2.0), 0.12, 0.2, 0.55)
stamp(m, BAR * 9, 147, 0.7)                                                 # "AMA HEPSİ GİTMEDİ"
for i, n in enumerate([74, 77, 81, 86, 89, 93]):                                # a small wing-beat arp while it lands
    m.add(BAR * 9 + 0.4 + i * 0.09, pluck(midi(n), dec=0.5), 0.08, -0.4 + i * 0.16, 0.4)

# ── bar 10 · take-off: wing flaps and an uplifting riser
for i in range(6):
    m.add(BAR * 10.2 + i * 0.13, hat(0.05), 0.07, 0.3, 0.3)
m.riser(BAR * 10, BAR * 11, 400, 8000, gain=0.35)
stamp(m, BAR * 10, 196, 0.8)                                                  # "KUŞLAR"
m.whoosh(BAR * 10.5, 0.9, 1500, 7000, 0.12, wet=0.4)

# ── bar 11 · the end: a big chord, sparkles, then ring out into the loop
m.impact(BAR * 11, 0.55)
for i, n in enumerate([98, 93, 89, 86, 93, 98]):
    m.add(BAR * 11 + 0.05 + i * 0.2, pluck(midi(n), dec=1.0), 0.09 * (1 - i * 0.08), -0.5 if i % 2 else 0.5, 0.5)
m.typing(BAR * 11 + 0.1, BAR * 11 + 0.9, 16, gain=0.1)

# ── voice-over (optional): out/narration.wav, ONE file with one voice, already placed on the 30 s timeline (see voice.py).
# The music dips under every word (smoothed envelope of the voice); the voice itself stays dry and in front.
narr = HERE / 'out' / 'narration.wav'
if narr.exists():
    import soundfile as sf
    from math import gcd
    from scipy.signal import resample_poly
    wav, sr = sf.read(narr)
    if wav.ndim > 1:
        wav = wav.mean(axis=1)
    if sr != SR:
        g = gcd(int(sr), SR); wav = resample_poly(wav, SR // g, int(sr) // g)
    wav = filt(wav, 'highpass', 70)[:m.N]
    vo = np.zeros((2, m.N)); vo[:, :len(wav)] = wav / (np.max(np.abs(wav)) + 1e-9)
    env = np.clip(filt(np.abs(vo[0]), 'lowpass', 6, order=1) * 4, 0, 1)
    for arr in (m.dry, m.duck, m.send):
        arr *= 1 - 0.62 * env
    m.dry += vo * 1.9
    print('voice: narration.wav')

m.render(drive=2.2, peak=0.68)
