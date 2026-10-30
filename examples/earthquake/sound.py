"""examples/earthquake: soundtrack on the same timeline as scene.js (30 s, 120 BPM, bar = 2 s, C major; bright and calm, then tense).
Run:  python examples/earthquake/sound.py   →  examples/earthquake/out/audio.wav
Scene and word times come from schedule.js (written by voice.py); if out/narration.wav exists the single narration track is mixed in
and the music dips under every word.

Arrangement: 0–4.75 calm, a drone and a slow slide · 4.75–10 a riser, creaks, the pad thins out · 10.0 the snap · 10–15 crests ping outwards
· 15–18 pen on paper, three arrivals · 18–22 three stamps (M5, M6, M7) · 22–26 fault lines draw · 26–30 resolve."""
import json
import re
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *   # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

HERE = Path(__file__).resolve().parent
src = (HERE / 'schedule.js').read_text(encoding='utf-8')
S = {s['key']: s for s in json.loads(src[src.index('['):src.rindex(']') + 1])}

m = Mix.from_project(__file__)
BAR = m.bar
T_R = round((S['rupture']['words'][-1][1] - 0.03) / 0.25) * 0.25      # same rule as scene.js

# ── harmony: one chord per bar
CH = ['Cmaj7', 'Am7', 'Fmaj7', 'Am7', 'Fmaj7', None, 'Dm9', 'Cmaj7', 'Am7', 'Fmaj7', 'Cmaj7', 'G6', 'Fmaj7', 'Am7', 'Cmaj7']
PG = [0.8, 0.9, 0.7, 0.55, 0.45, 0, 0.5, 0.8, 0.8, 0.85, 0.9, 0.8, 0.8, 0.9, 1.0]
for bar, name in enumerate(CH):
    if not name:
        continue
    last = bar == len(CH) - 1
    t0 = m.at(bar) if bar != 6 else T_R + 1.2           # the pad returns a beat after the aftershock
    dur = (m.dur - t0) if last else (BAR if bar != 6 else m.at(7) - t0)
    m.pad(t0, chord(name, 3), dur=dur, att=1.2 if last else 0.5, rel=1.8 if last else 0.7, gain=0.17 * PG[bar] * (1.3 if last else 1),
          cutoff=900 if 2 <= bar <= 4 else 1500, wet=0.5)

# ── 0–4.75 · calm: a low drone and the plates sliding
m.glide(0, m.dur, 55, 55, 0.07, dec=None)
m.glide(S['hook']['voice'] + 1.4, 3.3, 90, 60, 0.1, dec=None, wet=0.2)
for t, n in [(0.2, 84), (1.0, 88), (1.8, 91)]:
    m.add(t, bell(midi(n), 1.8), 0.05, 0.3 if n % 2 else -0.3, 0.5)

# ── 4.75–10 · the edges lock: a riser that lands on the snap, creaks and groans, a gauge that fills
m.riser(S['strain']['scene'], T_R, 120, 1800, gain=0.34)
m.glide(S['strain']['scene'], T_R - S['strain']['scene'], 48, 41, 0.13, dec=None)
c0, c1 = S['strain']['scene'] + 0.7, T_R - 0.15
for i, t in enumerate([c0 + (c1 - c0) * (k / 10) ** 1.6 for k in range(11)]):
    m.whoosh(t, 0.22 + 0.04 * (i % 3), 180 + 40 * i, 520 + 60 * i, 0.07 + 0.012 * i, bw=0.18, wet=0.15)      # rock creaking, faster as it nears the limit
for k, t in enumerate([T_R - 1.5, T_R - 1.0, T_R - 0.6]):
    m.add(t, tick(900 + 200 * k), 0.12, 0.2)

# ── 10.0 · the snap
m.add(T_R - 0.03, glitch_burst(0.35), 0.45, 0, 0.2)
m.impact(T_R, 1.15)
m.whoosh(T_R - 0.01, 0.35, 9500, 2500, 0.28, wet=0.4)
m.add(T_R, np.sin(2 * np.pi * 36 * tarr(m.dur - T_R)) * np.exp(-tarr(m.dur - T_R) / 1.8) * 0.6)
for i in range(7):
    m.add(T_R + 0.16 + i * 0.17, tom(70 + 6 * i, 0.2), 0.26 * (1 - i * 0.1), 0, 0.3)             # aftershocks
m.add(T_R + 0.05, pop(520, 0.12), 0.25, -0.1, 0.3)                                              # "ODAK"
m.add(T_R + 0.25, pop(780, 0.1), 0.2, 0.1, 0.3)                                                 # "MERKEZ ÜSSÜ"
stamp(m, T_R + 0.02, 98, 0.7)                                                                    # "KIRILMA"

# ── 10–15 · crests travelling out: P pings bright, S pings lower
for k in range(4):
    echo(m, T_R + 0.6 * k, pluck(midi(84 - 2 * k), dec=0.5), gain=0.09 * (1 - 0.2 * k), pan=-0.3, taps=2)
for k in range(3):
    m.add(T_R + 0.9 * k + 0.1, bell(midi(67 - 2 * k), 1.4), 0.07 * (1 - 0.2 * k), 0.3, 0.5)
m.whoosh(T_R + 0.1, 3.2, 3000, 300, 0.1, wet=0.6, bw=0.35)

# ── 15–18 · the seismograph: pen on paper, then the three arrivals
t0 = S['seismo']['scene']
m.typing(t0 + 0.1, t0 + 2.6, 85, gain=0.055)
m.glide(t0 + 0.65, 2.2, 62, 44, 0.16, dec=None)
for dt, p, g in [(0.65, 880, 0.1), (1.05, 660, 0.14), (1.5, 440, 0.2)]:
    m.add(t0 + 0.1 + dt, blip(p, 0.09), g, 0.0, 0.2)
    m.add(t0 + 0.1 + dt, tom(120 - 25 * (p < 700), 0.14), g * 1.4, 0, 0.2)
m.add(t0 - 0.02, glitch_burst(0.3), 0.15, 0, 0.1)

# ── 18–22 · each step is 32 times more: three stamps, rising
tm = S['mag']
stamps = [tm['scene'] + 0.35, tm['words'][2][1] - 0.1, tm['words'][4][1] - 0.15]
for i, (tt, p) in enumerate(zip(stamps, [110, 147, 196])):
    stamp(m, tt, p, 0.55 + 0.2 * i)
    m.add(tt, tom(p, 0.1), 0.2 + 0.1 * i)
    if i:
        m.add(tt + 0.15, bell(midi(72 + 5 * i), 1.0), 0.08, 0.2, 0.4)
m.riser(stamps[1] + 0.2, stamps[2], 200, 6500, gain=0.4)
m.impact(stamps[2], 0.5, bright=False)

# ── 22–26 · Turkey: two faults draw themselves
tt = S['turkey']['scene']
m.whoosh(tt + 0.6, 1.0, 400, 2800, 0.12, wet=0.4)
m.whoosh(tt + 1.0, 0.8, 400, 2800, 0.1, wet=0.4)
for dt in (0.6, 1.0, 1.7, 2.1):
    m.add(tt + dt, tick(2400 - 200 * (dt > 1.5)), 0.12, 0.2)
m.add(tt + 0.4, bell(midi(79), 1.6), 0.08, 0.0, 0.5)

# ── 26–30 · resolve: a soft stamp on "SESSİZ", a bell on "DURMAZ", the pad rings out
te = S['end']['scene']
stamp(m, te + 0.1, 98, 0.45)
for i, n in enumerate([84, 88, 91, 96]):
    m.add(te + 0.65 + i * 0.18, bell(midi(n), 2.2), 0.07 * (1 - i * 0.1), -0.4 + 0.27 * i, 0.55)

# ── voice-over (optional): ONE file, already placed on the timeline by voice.py; the music dips under every word
narr = HERE / 'out' / 'narration.wav'
if narr.exists():
    import soundfile as sf
    from math import gcd
    from scipy.signal import resample_poly
    wav, sr = sf.read(narr)
    if wav.ndim > 1:
        wav = wav.mean(axis=1)
    if sr != SR:
        g = gcd(int(sr), SR)
        wav = resample_poly(wav, SR // g, int(sr) // g)
    wav = filt(wav, 'highpass', 70)[:m.N]
    vo = np.zeros((2, m.N))
    vo[:, :len(wav)] = wav / (np.max(np.abs(wav)) + 1e-9)
    env = np.clip(filt(np.abs(vo[0]), 'lowpass', 6, order=1) * 4, 0, 1)
    for arr in (m.dry, m.duck, m.send):
        arr *= 1 - 0.55 * env
    m.dry += vo * 1.9
    print('voice: narration.wav')

m.render(drive=2.0, peak=0.7)
