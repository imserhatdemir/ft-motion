"""examples/ft-promo: the score, on the timeline voice.py wrote (schedule.js).  Run:  python examples/ft-promo/sound.py
120 BPM, A minor, one chord per bar, the brightest chord on the end card. Every visual event in scene.js has a sound at the same time.
The layers go in as groups (music, drums, fx, voice) and the loudness of each group is written to lanes.js, so the music scene
draws the real stems. Mastered with the dotkesk kit's finish(): de-essed voice, music ducked under it, high shelf, -14 LUFS."""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'audio'))
sys.path.insert(0, str(HERE.parent / 'dotkesk'))
from ftsynth import *   # noqa: E402,F403
from ftextras import *  # noqa: E402,F403
from sfx import add_voice, finish, load_schedule, soft_pop, soft_click, chime, whoosh_soft  # noqa: E402

m = Mix.from_project(__file__)
S = load_schedule(HERE)
B, BAR, END = m.beat, m.bar, m.dur
sc = lambda k: S[k]['scene']
en = lambda k: S[k]['end']
NB = int(np.clip(round((en('glitch') - sc('glitch')) / B), 1, 8))     # beats in the FX scene (same rule as scene.js)
beats = lambda t0, t1: [t0 + i * B for i in range(int(round((t1 - t0) / B)))]


def stem():
    return (m.dry + m.duck).copy()


# ───────────── music: drone, one chord per bar, arps
before = stem()
PROG = ['Am', 'Fmaj7', 'C', 'G']
ROOTS = {'Am': 33, 'Fmaj7': 29, 'C': 36, 'G': 31, 'Cadd9': 36}
m.glide(0, sc('code'), 55, 55, 0.12, dec=None)                                     # the hook sits on a low A
bar = 2
while bar * BAR < sc('end'):
    t = bar * BAR
    quiet = sc('subs') <= t < sc('render')
    m.pad(t, chord(PROG[bar % 4], 3), BAR, gain=0.16 if quiet else 0.2, att=0.25, rel=0.5, cutoff=1500, wet=0.35)
    bar += 1
m.pad(sc('end'), chord('Cadd9', 3), END - sc('end'), gain=0.26, att=0.6, rel=1.2, cutoff=2200, wet=0.5)   # the brightest chord
TONES = {'Am': [57, 60, 64, 69], 'Fmaj7': [53, 57, 60, 64], 'C': [60, 64, 67, 72], 'G': [55, 59, 62, 67]}
PAT = [0, 2, 1, 3, 2, 1, 3, 2]


def arp(t0, t1, step, gain):
    n = 0
    t = t0
    while t < t1 - 1e-6:
        ch = PROG[int(t // BAR) % 4]
        echo(m, t, pluck(midi(TONES[ch][PAT[n % 8]] + (12 if n % 8 == 3 else 0)), dec=0.2), gain=gain * (1 if n % 4 == 0 else 0.7),
             pan=-0.35 if n % 2 else 0.35, taps=2 if n % 4 == 0 else 0)
        t += step
        n += 1


arp(sc('dots') + 0.5, en('morph'), m.step, 0.13)
arp(sc('blur'), en('music'), m.step * 2, 0.12)
m.lanes_music = stem() - before

# ───────────── drums: a groove that grows (code → three → blur), breathes in subs, stops for the render
before = stem()


def groove(t0, t1, snare=False, hats=True, hat16=False, bass=False, kick_gain=0.7, hat_gain=0.1):
    for t in beats(t0, t1):
        bi = int(round(t / B))
        root = ROOTS[PROG[int(t // BAR) % 4]]
        m.kick(t, kick_gain, dec=0.32)
        if bass:
            m.bass(t, root, 0.3)
            m.bass(t + B / 2, root + 12, 0.18)
        if snare and bi % 2 == 1:
            m.add(t, globals()['snare'](), 0.38, 0.05, 0.3)
        if hats:
            for k in ((1, 2, 3) if hat16 else (2,)):
                m.add(t + k * B / 4, filt(hat(), 'lowpass', 7000), hat_gain * (1 if k == 2 else 0.6), 0.25)


groove(sc('code'), sc('type'), kick_gain=0.5, hat_gain=0.07)
groove(sc('type'), sc('three'), kick_gain=0.65)
groove(sc('three'), sc('blur'), snare=True, kick_gain=0.7)
groove(sc('blur'), sc('subs'), snare=True, hat16=True, bass=True, kick_gain=0.85, hat_gain=0.09)
for t in beats(sc('subs'), sc('render')):                                         # subs: the room gets quiet so the words lead
    m.add(t + B / 2, hat(), 0.06, 0.2)
    if int(round(t / B)) % 4 == 0:
        m.kick(t, 0.45, dec=0.3)
m.roll(en('dots') - 1.0, en('dots'), n=10, gain=(0.04, 0.16))
m.roll(sc('blur') - 1.0, sc('blur'), n=14, gain=(0.06, 0.3))
m.lanes_drums = stem() - before

# ───────────── fx + foley: one sound per visual event
before = stem()
WIPES = [(sc('code'), 0.3, 0.4), (sc('type'), 0.3, 0), (sc('dots'), 0.35, 0), (sc('three'), 0.3, 0.4), (sc('music'), 0.3, 0.4),
         (sc('subs'), 0.3, 0.4), (sc('render'), 0.35, 0.45)] + [(sc('glitch') + k * B, 0.2, 0) for k in (1, 2, 3) if k < NB]
for mid, cov, rev in WIPES:
    m.whoosh(mid - cov, cov, 500, 4200, 0.09, wet=0.25)
    if rev:
        m.whoosh(mid, rev, 4200, 700, 0.05, wet=0.25)

# hook: typing, Enter, letters → dots, three ripples
H0 = sc('hook')
m.typing(H0 + 0.3, H0 + 0.3 + 33 / 22, 33, gain=0.1)
m.add(H0 + 2.0, soft_click(), 0.6, 0.1)
m.add(H0 + 2.0, tom(75, 0.2), 0.5)
whoosh_soft(m, H0 + 2.0, 0.8, 900, 3800, 0.1)
for k, n in enumerate((69, 72, 76)):
    echo(m, H0 + 2.5 + k * B, pluck(midi(n), dec=0.35), gain=0.16, pan=(-0.3, 0, 0.3)[k], taps=3)
m.riser(H0 + 2.6, sc('code') - 0.05, 300, 5000, gain=0.25)

# code: typing, preview pop, readout, pointer press, the scrub zips with t
C0 = sc('code')
m.typing(C0 + 0.25, C0 + 0.25 + 130 / 75, 130, gain=0.09)
m.add(C0 + 1.0, soft_pop(620, 0.08), 0.35, -0.3)
m.add(C0 + 1.25, blip(1320), 0.12, 0.3)
m.add(C0 + 2.0, mouseclick(), 0.35, 0.3)
scrub = lambda u: 1.8 + 1.15 * np.sin((min(u, 3.8) - 2) * 3.4)
for k in range(18):
    u0, u1 = 2.0 + k * 0.1, 2.1 + k * 0.1
    m.glide(C0 + u0, 0.11, 300 + 260 * scrub(u0), 300 + 260 * scrub(u1), 0.035, dec=0.08)
m.add(C0 + 3.8, mouseclick(), 0.25, 0.3)

# type: a tick per letter, pops when MOVES hops
T0, TL = sc('type'), en('type') - sc('type')
for li, word in enumerate(['TYPE', 'THAT', 'MOVES']):
    for i in range(len(word)):
        m.add(T0 + li * 0.25 + i * 0.04, tick(2200 + 140 * li), 0.06, -0.3 + 0.15 * i)
    stamp(m, T0 + li * 0.25, (110, 131, 165)[li], 0.45)
for hb in (1.0, 1.5):
    for i, n in enumerate((72, 74, 76, 79, 81)):
        m.add(T0 + hb + i * 0.045, soft_pop(midi(n) / 2, 0.05), 0.13, -0.4 + 0.2 * i)
m.suck(T0 + TL - 0.4, T0 + TL, 0.15)

# dots: spring-in, ripples, tilt, swirl into a point, sphere born, beat pulses, collapse
D0, DL = sc('dots'), en('dots') - sc('dots')
whoosh_soft(m, D0 + 0.05, 0.6, 400, 2500, 0.08)
for k, n in enumerate((81, 84, 88)):
    m.add(D0 + 0.5 + k * B, bell(midi(n), 0.9), 0.07, (-0.3, 0.3, 0)[k], 0.4)
m.whoosh(D0 + 1.0, 1.0, 300, 3000, 0.07, wet=0.4)
m.suck(D0 + 2.0, D0 + 2.5, 0.2)
m.add(D0 + 2.47, tom(120, 0.16), 0.4)
m.add(D0 + 2.47, soft_pop(300, 0.12), 0.3)
m.suck(D0 + DL - 0.45, D0 + DL, 0.22)
m.add(D0 + DL - 0.02, blip(880), 0.12)

# morph: a swoosh + pluck per morph, the ball rides the curve, pop at the end, disc cover
M0 = sc('morph')
for k, n in enumerate((64, 67, 71)):
    m.whoosh(M0 + 0.5 + k * B - 0.05, 0.3, 700, 3000, 0.06)
    m.add(M0 + 0.5 + k * B, pluck(midi(n), dec=0.3), 0.18, (-0.3, 0, 0.3)[k], 0.3)
m.glide(M0 + 0.9, 0.9, 260, 780, 0.05, dec=0.6)
m.add(M0 + 1.8, soft_pop(780, 0.07), 0.25)

# three: the drop into 3D, hops and landings, riser into the big drop
R0 = sc('three')
m.impact(R0, 0.6)
for hb, f in ((0.5, 150), (1.0, 190), (1.5, 150)):
    m.add(R0 + hb, tom(f, 0.12), 0.32, -0.2 if f == 150 else 0.2)
    m.add(R0 + hb + 0.4, tom(f * 0.6, 0.16), 0.4, -0.2 if f == 150 else 0.2)
m.riser(R0 + 0.5, sc("blur"), 200, 6000, gain=0.5)

# blur: THE drop, panels slide in
L0 = sc('blur')
m.impact(L0, 1.0)
whoosh_soft(m, L0 + 0.25, 0.5, 400, 3000, 0.1, pan=-0.3)
whoosh_soft(m, L0 + 0.37, 0.5, 400, 3000, 0.1, pan=0.3)

# glitch: one technique per beat
G0 = sc('glitch')
m.add(G0 - 0.08, glitch_burst(0.42), 0.4, 0, 0.15)
for k in range(NB):
    t = G0 + k * B
    stamp(m, t, (110, 123, 131, 147, 165, 175, 196, 220)[k], 0.5)
    if k == 4:
        m.add(t, filt(rng.standard_normal(int(0.4 * SR)), 'bandpass', (800, 5000)) * np.exp(-tarr(0.4) / 0.06), 0.25, 0, 0.4)
    if k == 5:
        m.whoosh(t, 0.45, 3000, 300, 0.12, wet=0.4)
    if k == 6:
        m.add(t - 0.02, glitch_burst(0.2), 0.3, 0.2, 0.1)
    if k == 7:
        chime(m, t, [76, 79, 84], gain=0.08, gap=0.04, dec=1.0)

# music: the lanes slide in
for k in range(4):
    m.add(sc('music') + k * 0.08, soft_pop(440 + 60 * k, 0.05), 0.1, -0.3 + 0.2 * k)

# subs: a soft tick on every word
for w, w0, _ in S['subs']['words']:
    m.add(w0, tick(3000), 0.035, 0.2)

# render: typing, lines, the frame counter, the mp4, the window collapses
N0, NL = sc('render'), en('render') - sc('render')
m.typing(N0 + 0.1, N0 + 0.1 + 38 / 80, 38, gain=0.1)
m.add(N0 + 0.6, soft_pop(520, 0.05), 0.15)
counter_ticks(m, N0 + 0.75, 1.1, 22, gain=0.09)
m.add(N0 + 1.9, soft_pop(560, 0.05), 0.15)
chime(m, N0 + 2.0, [72, 76, 79], gain=0.09, gap=0.05)
m.suck(N0 + NL - 0.4, N0 + NL, 0.18)

# end card: dots burst into the wordmark, line, URL, licence
E0 = sc('end')
m.impact(E0, 0.45)
whoosh_soft(m, E0, 1.0, 600, 4500, 0.13, wet=0.35)
m.add(E0 + 0.9, soft_pop(300, 0.14), 0.3)
m.add(E0 + 1.05, soft_pop(440, 0.08), 0.15)
m.add(E0 + 1.5, soft_click(), 0.45, 0.2)
chime(m, E0 + 1.52, [76, 79, 84], gain=0.1, gap=0.06, dec=1.4, pan=0.2)
m.add(E0 + 1.9, soft_pop(560, 0.06), 0.12)
chime(m, E0 + 2.6, [64, 72, 76], gain=0.06, gap=0.09, dec=2.2, wet=0.6)
m.lanes_fx = stem() - before

# ───────────── voice, lanes, master
for name in ('dry', 'duck', 'send'):                 # nothing of ours above ~9 kHz: phone speakers make it hiss
    setattr(m, name, filt(getattr(m, name), 'lowpass', 9000, 4))
voice = add_voice(m, HERE / 'out' / 'narration.wav', gain=1.9, duck=0.55)


def env(x, sr):
    mono = np.abs(np.atleast_2d(x)).sum(axis=0)
    hop = sr // 50
    n = len(mono) // hop
    e = mono[:n * hop].reshape(n, hop).mean(axis=1)
    e = np.sqrt(np.clip(e / (np.percentile(e[e > 0], 99) + 1e-9 if (e > 0).any() else 1), 0, 1))
    return [round(float(v), 3) for v in e]


lanes = {'rate': 50, 'kick': env(m.lanes_drums, SR), 'music': env(m.lanes_music, SR), 'fx': env(m.lanes_fx, SR),
         'voice': env(voice if voice is not None else np.zeros(m.N), SR)}
(HERE / 'lanes.js').write_text('// written by sound.py: loudness envelopes of the stems (50 per second) for the music scene\n'
                               'export const LANES = ' + json.dumps(lanes, separators=(',', ':')) + ';\n', encoding='utf-8')
finish(m, shelf_db=-6, shelf_hz=6000, lufs=-14.0, tp=-1.5)
