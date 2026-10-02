"""Soundtrack for examples/dotkesk-agents on the same 120 BPM grid as scene.js (bars are 2 s, m.at(bar, step) = 16 steps).
Run:  python examples/dotkesk-agents/sound.py   → out/audio.wav

Voice-over slot: a recorded read of COPY.caps saved as `vo.wav` next to this file is mixed in at t = 0 and the music
ducks under it.
"""
import sys
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *  # noqa: E402,F403
from ftextras import *  # noqa: E402,F403

seed(21)
m = Mix.from_project(__file__)
A = m.at

# timeline mirrors scene.js
MSG_T = lambda k: A(2) + k * 0.25
ANS_T = lambda k: A(4, 4) + k * 0.14
DROP_T = lambda k: A(9, 4) + k * 1.0
KB_CLICK, KB_FIELD = A(13, 2), [A(14), A(14, 8), A(15)]
KB_VALUES = ['5', '0.18', '1800']
GEN_CLICK, ACTIVE_T, SAVE_T = A(16, 2), A(17, 4), A(17, 10)
ASK_T, PULSE_T, HELLO_T, ANSWER_T = A(18, 4), A(18, 10), A(19, 4), A(20, 6)

PROG = ['Cmaj7', 'Am9', 'Fmaj7', 'G6']
ROOT = {'Cmaj7': 48, 'Am9': 45, 'Fmaj7': 41, 'G6': 43}
for bar in range(30):
    quiet = bar < 4
    m.pad(A(bar), chord(PROG[bar % 4], 3), dur=m.bar, gain=0.2 if quiet else 0.14, att=0.4 if quiet else 0.1, cutoff=900 if quiet else 1600)
m.pad(A(30), chord('Cmaj9', 3), dur=2 * m.bar, gain=0.22, att=0.05, cutoff=2400)

# ─────────────────────────────── drums
for bar in (2, 3):
    m.drums(bar, kick=[0, 8], hats=range(0, 16, 4), hat_gain=0.05, root=ROOT[PROG[bar % 4]])
for bar in (4, 5):
    m.drums(bar, kick=[0, 6, 8], snare=[12], hats=range(0, 16, 2), hat_gain=0.07, root=ROOT[PROG[bar % 4]])
m.drums(7, kick=[0, 8], hats=range(0, 16, 2), hat_gain=0.06, root=ROOT[PROG[7 % 4]])
for bar in range(8, 22):
    m.drums(bar, kick=[0, 4, 8, 12], snare=[4, 12], hats=[2, 6, 10, 14], open_hats=[14] if bar % 2 else [], hat_gain=0.08, root=ROOT[PROG[bar % 4]])
for bar in range(23, 29):
    m.drums(bar, kick=[0, 4, 8, 10, 12], snare=[4, 12], hats=range(0, 16, 2), open_hats=[6, 14], hat_gain=0.1, root=ROOT[PROG[bar % 4]])
m.drums(29, kick=[0, 8], hats=range(0, 10, 2), hat_gain=0.08)

# ─────────────────────────────── bars 0–3: 3:12 a.m., messages rain in
for b in range(4):
    m.add(A(0) + b * m.beat, tick(2200), 0.08, 0.3)                    # the clock
m.add(A(1), tom(130, 0.12), 0.35)                                       # 03:11 → 03:12 flip
m.add(A(1) + 0.02, tick(3000), 0.12)
m.add(0.3, pop(420, 0.08), 0.16)                                         # the store
for k in range(12):
    t = MSG_T(k)
    m.whoosh(t - 0.05, 0.35, 1800, 5000, 0.04, pan=-0.6 if k % 2 == 0 else 0.6)
    m.add(t + 0.32, blip(midi(84 + (k % 3) * 3)), 0.07, -0.6 if k % 2 == 0 else 0.6, 0.3)   # notification
    m.add(t + 0.38, blip(midi(91 + (k % 3) * 3)), 0.05, -0.6 if k % 2 == 0 else 0.6, 0.3)

# ─────────────────────────────── bars 4–5: the mark takes orbit and answers
m.whoosh(A(4) - 0.6, 0.8, 4000, 600, 0.2, pan=0.5)
m.impact(A(4) + 0.2, 0.45, bright=False)
m.add(A(4) + 0.2, bell(midi(79), 1.4), 0.1, 0, 0.6)
arp = [72, 76, 79, 84, 79, 76, 81, 84, 88, 84, 81, 91]
for k in range(12):
    m.add(ANS_T(k), pluck(midi(arp[k]), dec=0.3), 0.1, -0.5 + k / 11, 0.4)
    m.add(ANS_T(k) + 0.33, tick(2600 + 80 * k), 0.06, -0.5 + k / 11)
m.add(ANS_T(11) + 0.25, bell(midi(88), 1.0), 0.08, 0, 0.5)              # all answered

# ─────────────────────────────── bars 6–7: dive, wave, lockup
m.suck(A(6), A(6, 8), gain=0.24)
m.whoosh(A(6, 8), 1.0, 200, 4500, 0.28, wet=0.4)
m.add(A(7), pop(560), 0.2)
for n_, g in zip(chord('Cmaj9', 5), (0.07, 0.06, 0.05, 0.05, 0.04)):
    m.add(A(7), bell(midi(n_), 1.6), g, 0, 0.6)
for i in range(7):
    m.add(A(7) + 0.25 + i * 0.04, blip(midi(76 + (i * 2) % 12)), 0.045, -0.3 + i * 0.1, 0.3)

# ─────────────────────────────── bars 8–21: the app
m.whoosh(A(8), 0.6, 300, 3000, 0.16)                                    # window rises
m.add(A(8, 10), mouseclick(), 0.5, 0.2)                                  # New Agent
m.whoosh(A(9) - 0.2, 0.5, 800, 4000, 0.1)                                # editor opens
m.add(DROP_T(0), pop(500, 0.06), 0.18)                                   # trigger node
for k in range(1, 5):
    m.add(DROP_T(k) - 0.55, mouseclick(), 0.3, -0.3)                     # pick up
    m.whoosh(DROP_T(k) - 0.45, 0.45, 1200, 3500, 0.05, pan=0.2)
    m.add(DROP_T(k), tom(160 + 20 * k, 0.07), 0.25, 0.1)                 # drop
    m.add(DROP_T(k) + 0.05, blip(midi(79 + k * 2)), 0.06, 0.2, 0.3)      # edge connects
m.add(KB_CLICK, mouseclick(), 0.45, 0.3)
m.whoosh(A(13, 4), 0.5, 900, 4000, 0.08, pan=0.5)                        # panel slides in
for t0, v in zip(KB_FIELD, KB_VALUES):
    m.add(t0, mouseclick(), 0.25, 0.4)
    for c in range(len(v)):
        m.add(t0 + 0.15 + c * 0.09, keyclick(), 0.16, 0.3)
m.add(GEN_CLICK, mouseclick(), 0.45, 0.3)
for i, n in enumerate((21, 3)):
    t0 = GEN_CLICK + 0.5 + i * 0.6
    m.typing(t0, t0 + 0.4, n * 2, gain=0.12)
m.add(ACTIVE_T, mouseclick(), 0.45, 0.4)
m.glide(ACTIVE_T + 0.02, 0.18, 600, 1200, 0.08, dec=0.12)                # switch on
m.add(SAVE_T, mouseclick(), 0.5, 0.45)
m.add(SAVE_T + 0.12, bell(midi(91), 0.8), 0.09, 0.3, 0.4)                # saved
m.add(ASK_T, pop(900, 0.04), 0.14, 0.4)                                  # message sent
for k in range(5):
    m.add(PULSE_T + k * 0.42, tick(1800 + 300 * k), 0.1, -0.4 + 0.2 * k)
m.add(HELLO_T, pop(700, 0.05), 0.16, 0.4)
m.add(ANSWER_T, pop(760, 0.05), 0.16, 0.4)
m.add(ANSWER_T + 0.05, bell(midi(88), 0.9), 0.07, 0.4, 0.4)

# ─────────────────────────────── bar 22: the mark pops out, floods the frame
m.whoosh(A(22), 0.7, 3000, 500, 0.12)
m.add(A(22, 6), pop(420, 0.08), 0.3, 0, 0.3)
m.riser(A(22, 4), A(23), gain=0.28)
m.roll(A(22, 8), A(23), n=12)
m.impact(A(23), 0.85)

# ─────────────────────────────── bars 23–28: six cards
for k in range(6):
    stamp(m, A(23 + k), 100 + 15 * k, 0.5)
    m.whoosh(A(23 + k), 0.45, 3500, 600, 0.14, pan=-0.6 if k % 2 == 0 else 0.6)
    m.whoosh(A(23 + k) + 1.74, 0.3, 700, 5000, 0.08)
    m.add(A(23 + k), bell(midi(79 + (0, 2, 4, 7, 9, 12)[k]), 0.7), 0.06, 0, 0.5)

# ─────────────────────────────── bar 29: CTA, bars 30–31: end card
for i in range(11):
    m.add(A(29) + 0.1 + i * 0.03, blip(midi(74 + (i * 2) % 12)), 0.04, -0.4 + i * 0.08, 0.3)
m.whoosh(A(29, 4), 0.5, 1500, 5000, 0.05, pan=0.5)
m.add(A(29, 10), mouseclick(), 0.5, 0.2)
m.suck(A(29, 12), A(30), gain=0.22)
m.impact(A(30), 0.6, bright=False)
for n_, g in zip(chord('Cmaj9', 5), (0.08, 0.07, 0.06, 0.05, 0.05)):
    m.add(A(30), bell(midi(n_), 2.2), g, 0, 0.6)
for i in range(7):
    m.add(A(30) + 0.4 + i * 0.04, blip(midi(79 + (i * 2) % 12)), 0.05, -0.3 + i * 0.1, 0.3)
m.add(A(30) + 0.9, pop(880, 0.05), 0.1)
m.add(A(30) + 1.3, pop(1040, 0.05), 0.1)

# ─────────────────────────────── optional voice-over
vo_path = Path(__file__).resolve().parent / 'vo.wav'
if vo_path.exists():
    from scipy.signal import resample_poly
    with wave.open(str(vo_path)) as w:
        sr, ch, raw = w.getframerate(), w.getnchannels(), w.readframes(w.getnframes())
    vo = np.frombuffer(raw, '<i2').astype(float).reshape(-1, ch).T / 32768
    if sr != SR:
        vo = resample_poly(vo, SR, sr, axis=1)
    m.dry *= 0.6
    m.duck *= 0.6
    m.add(0, vo if ch == 2 else vo[0], 1.0)
    print(f'mixed {vo_path.name}')

m.render(drive=2.1, peak=0.72)
