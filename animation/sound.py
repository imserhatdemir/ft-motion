"""animation/sound.py: soundtrack for src/scenes/earthquake.js (30 s, 120 BPM, bar = 2 s, C major, playful then tense), on the same timeline.
Run:  python animation/sound.py   →  animation/out/earthquake_audio.wav     then:  node ft.mjs anim --clip --audio=out/earthquake_audio.wav --out=out/earthquake.mp4
Narration: ONE file, examples/earthquake/out/narration.wav (Ahenk, see examples/earthquake/voice.py); its schedule.js gives the shot times.
The music dips under every word. Every event in the picture has a sound: bounces, the dive, sparks, the bending stick, the snap, rings,
steps, the pen, twig / branch / log, the map, the sunrise, the iris."""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'audio'))
from ftsynth import *   # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

src = (HERE.parent / 'examples' / 'earthquake' / 'schedule.js').read_text(encoding='utf-8')
L = json.loads(src[src.index('['):src.rindex(']') + 1])
SC = [s['scene'] for s in L]
T_SNAP = round((L[2]['words'][-1][1] - 0.03) / 0.25) * 0.25          # same rule as the scene
W = {s['key']: s['words'] for s in L}

m = Mix(30.0, bpm=120, out=HERE / 'out' / 'earthquake_audio.wav')
B = m.beat
DUR = 30.0

# ── harmony: one chord per bar (2 s). Bright, then thin and tense around the snap, then warm again.
CH = ['Cmaj7', 'Am7', 'Fmaj7', 'Am7', 'Fmaj7', None, 'Dm9', 'Cmaj7', 'Am7', 'Fmaj7', 'Cmaj7', 'G6', 'Fmaj7', 'Am7', 'Cmaj7']
PG = [0.8, 0.9, 0.7, 0.55, 0.45, 0, 0.5, 0.8, 0.8, 0.85, 0.9, 0.8, 0.8, 0.9, 1.0]
for bar, name in enumerate(CH):
    if not name:
        continue
    last = bar == len(CH) - 1
    t0 = m.at(bar) if bar != 6 else T_SNAP + 1.2
    dur = (DUR - t0) if last else (m.bar if bar != 6 else m.at(7) - t0)
    m.pad(t0, chord(name, 3), dur=dur, att=1.2 if last else 0.5, rel=1.8 if last else 0.7, gain=0.15 * PG[bar] * (1.3 if last else 1),
          cutoff=900 if 2 <= bar <= 4 else 1500, wet=0.5)
m.glide(0, DUR, 55, 55, 0.06, dec=None)

# ── A · 0–4.75: Clawd bounces on the beat; the camera dives; the plates slide
BOUNCE = [48, 52, 55, 60]
for i in range(int(3.6 / B)):
    n = [72, 76, 79, 76][i % 4] + (0 if i < 4 else -2)
    m.add(i * B, pluck(midi(n), dec=0.22), 0.1, -0.3 if i % 2 else 0.3, 0.3)             # a little pizzicato on every bounce
    if i % 2 == 0:
        m.add(i * B, tom(150, 0.08), 0.12, 0, 0.1)                                         # the landing
m.whoosh(1.4, 1.4, 4000, 200, 0.14, wet=0.4)                                                # the dive through the grass line
m.add(2.8, tom(70, 0.2), 0.3, 0, 0.3)                                                       # the plates appear
for t in (2.8, 3.1):
    m.add(t, pop(620 + 120 * (t > 3), 0.1), 0.18, 0.3 * (1 if t > 3 else -1), 0.3)         # the two arrows pop
m.glide(2.9, 1.9, 82, 58, 0.12, dec=None, wet=0.2)                                           # the slow grind
m.add(3.9, pop(480, 0.14), 0.16, 0, 0.3)                                                    # the '?'
m.whoosh(SC[1] - 0.32, 0.5, 600, 5200, 0.1, wet=0.3)                                         # brush wipe out

# ── B · 4.75–9.75: the edges catch (sparks), the stick bends: a riser that lands on the snap, creaks, a breathless pulse
m.whoosh(SC[1], 0.5, 5200, 700, 0.07, wet=0.3)
for i in range(5):
    m.add(SC[1] + 0.1 + i * 0.3 + 0.2, tick(2800 - 150 * i), 0.13, 0.2 * (-1) ** i, 0.2)    # sparks where the plates catch
m.riser(SC[1] + 0.6, T_SNAP, 130, 2000, gain=0.32)
m.glide(SC[1] + 0.6, T_SNAP - SC[1] - 0.6, 52, 40, 0.12, dec=None)
c0, c1 = SC[1] + 1.0, T_SNAP - 0.15
for i, t in enumerate([c0 + (c1 - c0) * (k / 11) ** 1.6 for k in range(12)]):
    m.whoosh(t, 0.22 + 0.04 * (i % 3), 180 + 40 * i, 520 + 60 * i, 0.07 + 0.012 * i, bw=0.18, wet=0.15)     # the stick creaks, faster as it bends
for k, t in enumerate([T_SNAP - 1.5, T_SNAP - 1.0, T_SNAP - 0.6, T_SNAP - 0.3]):
    m.add(t, tick(900 + 200 * k), 0.13, 0.2)                                               # splinters

# ── C · the snap
m.add(T_SNAP - 0.03, glitch_burst(0.35), 0.4, 0, 0.2)
m.impact(T_SNAP, 1.15)
m.whoosh(T_SNAP - 0.01, 0.35, 9500, 2500, 0.3, wet=0.4)                                       # the crack of the stick
m.add(T_SNAP, np.sin(2 * np.pi * 36 * tarr(DUR - T_SNAP)) * np.exp(-tarr(DUR - T_SNAP) / 1.8) * 0.6)
for i in range(7):
    m.add(T_SNAP + 0.16 + i * 0.17, tom(70 + 6 * i, 0.2), 0.26 * (1 - i * 0.1), 0, 0.3)        # aftershocks
m.add(T_SNAP + 0.05, blip(900, 0.12), 0.2, 0.3, 0.2)                                          # the '!'
m.add(T_SNAP + 0.4, tom(110, 0.12), 0.35, -0.2, 0.2)                                           # Clawd lands on his back
for i, n in enumerate([88, 84, 81, 77]):
    m.add(T_SNAP + 0.9 + i * 0.13, bell(midi(n), 0.5), 0.07 * (1 - i * 0.12), -0.3 + 0.2 * i, 0.4)   # dizzy stars
stamp(m, T_SNAP + 0.02, 98, 0.6)

# ── D · rings through the rock: a bell for each ring, the tree rustles, Clawd gets surprised
for i in range(5):
    t = SC[3] + 0.35 + 0.6 * i
    m.add(t, bell(midi(79 - 2 * (i % 3)), 1.4), 0.09 * (1 - 0.1 * i), -0.3 if i % 2 else 0.3, 0.5)
    m.add(t, pluck(midi(67 - 3 * (i % 3)), dec=0.4), 0.07, 0.0, 0.3)
m.whoosh(T_SNAP + 1.2, 1.5, 2400, 500, 0.08, wet=0.5, bw=0.4)                                    # the tree
m.add(T_SNAP + 0.82, blip(780, 0.1), 0.18, -0.3, 0.2)                                              # Clawd feels the wave
m.whoosh(SC[4] - 0.32, 0.5, 600, 5200, 0.1, wet=0.3)

# ── E · the seismograph: steps, the pen, three arrivals
m.whoosh(SC[4], 0.5, 5200, 700, 0.07, wet=0.3)
for k in range(5):
    m.add(SC[4] + 0.15 + k * 0.17, tom(210 - 15 * (k % 2), 0.05), 0.1, -0.5 + k * 0.2, 0.1)
m.typing(SC[4] + 0.2, SC[4] + 3.0, 90, gain=0.05)
for dt, p, g in [(1.0, 880, 0.1), (1.45, 660, 0.14), (1.9, 440, 0.2)]:
    m.add(SC[4] + dt, blip(p, 0.09), g, 0.0, 0.2)
    m.add(SC[4] + dt, tom(125 - 25 * (p < 700), 0.14), g * 1.4, 0, 0.2)
m.glide(SC[4] + 1.0, 2.0, 62, 44, 0.14, dec=None)
m.add(SC[4] + 1.15, pop(700, 0.1), 0.2, 0.2, 0.3)                                                # Clawd's '!'

# ── F · twig, branch, log: each snap louder, each pen swing taller
for i, (dt, g, p) in enumerate([(0.7, 0.35, 160), (1.8, 0.65, 120), (2.85, 1.0, 80)]):
    t = SC[5] + dt
    m.whoosh(t - 0.01, 0.18 + 0.1 * i, 8000 - 1500 * i, 1500, 0.2 * g + 0.1, wet=0.3)               # the crack, lower each time
    m.add(t, tom(p, 0.1 + 0.08 * i), 0.3 * g + 0.1, 0, 0.2)
    m.add(t + 0.02, pop(900 - 200 * i, 0.1), 0.18, 0.2 * (i - 1), 0.2)                              # the pen jumps
    echo(m, t + 0.05, pluck(midi(72 - 5 * i), dec=0.5), gain=0.09 * (i + 1), pan=-0.3, taps=2)
    m.add(t - 0.35, pop(500 + 100 * i, 0.08), 0.1, 0.2, 0.2)                                         # the next prop arrives
m.impact(SC[5] + 2.85, 0.6, bright=False)
m.add(SC[5] + 3.25, tom(100, 0.14), 0.3, 0.2, 0.2)                                                # Clawd lands
m.whoosh(SC[6] - 0.32, 0.5, 600, 5200, 0.1, wet=0.3)

# ── G · the map rolls down (bounce), Türkiye, two faults painted in
m.whoosh(SC[6], 0.5, 5200, 700, 0.07, wet=0.3)
m.whoosh(SC[6] + 0.2, 0.8, 500, 3000, 0.12, wet=0.3)                                               # the roll unwinds
m.add(SC[6] + 0.85, tom(95, 0.14), 0.3, 0, 0.2)                                                   # it lands, bounces
m.add(SC[6] + 1.1, tom(120, 0.08), 0.15, 0, 0.2)
m.add(SC[6] + 1.1, bell(midi(76), 1.6), 0.07, 0.0, 0.5)
m.whoosh(SC[6] + 1.5, 1.1, 800, 2800, 0.09, wet=0.4)                                              # the first fault is painted in
m.whoosh(SC[6] + 2.1, 0.9, 800, 2800, 0.08, wet=0.4)                                              # the second
for dt in (1.6, 2.2, 2.8):
    m.add(SC[6] + dt, tick(2300), 0.11, 0.2)
m.whoosh(SC[7] - 0.32, 0.5, 600, 5200, 0.1, wet=0.3)

# ── H · dawn: a warm bell, sleepy snores of zz, the ground creeps, the iris closes
m.whoosh(SC[7], 0.5, 5200, 700, 0.07, wet=0.3)
for i, n in enumerate([72, 76, 79, 84]):
    m.add(SC[7] + 0.4 + i * 0.25, bell(midi(n), 2.2), 0.07 * (1 - i * 0.08), -0.4 + 0.27 * i, 0.55)   # sunrise
for dt in (1.4, 2.2):
    m.glide(SC[7] + dt, 0.9, 380, 300, 0.035, dec=None, wet=0.3)                                    # a sleepy 'zzz'
m.glide(SC[7] + 1.3, 1.6, 80, 62, 0.09, dec=None)                                                  # the ground, still creeping
m.suck(DUR - 1.0, DUR - 0.05, 0.2)                                                                 # the iris closes

# ── narration: ONE file, already on the 30 s timeline; the music dips under every word
narr = HERE.parent / 'examples' / 'earthquake' / 'out' / 'narration.wav'
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
