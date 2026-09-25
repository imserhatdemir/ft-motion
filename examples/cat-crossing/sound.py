"""examples/cat-crossing — cartoon score and foley on the same timeline as scene.js (120 BPM, bar = 2 s).
Run:  python examples/cat-crossing/sound.py   →  examples/cat-crossing/out/audio.wav"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import *  # noqa: E402,F403

m = Mix.from_project(__file__)
at = m.at

# the same beat-grid marks as timeline() in scene.js
T = dict(smell=at(0, 4), notice=at(1), closeup=at(1, 4), stand=at(2), step=at(2, 3), kerb=at(2, 8), lookL=at(2, 8), lookR=at(3), face=at(3, 4),
         whoosh=at(3, 8), back=at(3, 12), crouch=at(4), pounce=at(4, 4), land=at(4, 8), mid=at(4, 10), closeE=at(6), yellow=at(7), red=at(7, 4),
         cutG=at(7, 8), peek=at(7, 10), stopped=at(7, 12), strut=at(8), glance=at(8, 8), hop=at(9, 5), up=at(9, 8), fish=at(9, 14),
         bend=at(10), grab=at(10, 3), lift=at(10, 6), green=at(10, 8), turn=at(10, 10), go=at(10, 12), sit=at(10, 14), title=at(11), sub=at(11, 4))


# ─────────────────────────────── project-specific voices
def formant(x, contours, bw=0.45):
    """Shape a harmonic source with formant bands whose centres follow contours(tt) → list of Hz arrays."""
    f, tt, Z = signal.stft(x, fs=SR, nperseg=512)
    lf = np.log2(np.maximum(f[:, None], 20))
    mask = sum(g * np.exp(-((lf - np.log2(fc[None, :])) / bw) ** 2) for fc, g in contours(tt))
    _, y = signal.istft(Z * mask, fs=SR, nperseg=512)
    return y[: len(x)]


def meow(dur=0.6, f0=520, peak=800, end=420, open_=1.0, rough=0.0):
    """A cartoon meow: pitch rises then falls; the 'mouth' goes m → i/a → u."""
    t = tarr(dur)
    x = t / dur
    f = np.where(x < 0.35, f0 + (peak - f0) * np.sin(x / 0.35 * np.pi / 2), peak + (end - peak) * np.maximum(0, (x - 0.35) / 0.65) ** 1.3)
    f = f * (1 + 0.015 * np.sin(2 * np.pi * 6.5 * t)) * (1 + rough * 0.03 * rng.standard_normal(len(t)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = sum(np.sin(k * ph) / k ** 0.8 for k in range(1, 16))
    mouth = lambda tt: np.clip(np.sin(np.pi * np.clip(tt / dur, 0, 1) ** 0.7), 0, 1) * open_
    y = formant(src, lambda tt: [(500 + 550 * mouth(tt), 1.0), (1300 + 1100 * mouth(tt), 0.6), (3000 + 400 * mouth(tt), 0.25)])
    env = np.minimum(1, t / 0.04) * np.exp(-np.maximum(0, x - 0.7) / 0.12) * (0.4 + 0.6 * np.sin(np.pi * np.minimum(1, x * 1.6)) ** 0.5)
    return y / (np.max(np.abs(y)) + 1e-9) * env


def hiss(dur=0.5):
    t = tarr(dur)
    return filt(rng.standard_normal(len(t)), 'bandpass', [2500, 9000]) * np.minimum(1, t / 0.01) * np.exp(-t / (dur * 0.4))


def boing(f0=180, f1=560, dur=0.35):
    t = tarr(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.06))
    f = f * (1 + 0.08 * np.sin(2 * np.pi * 14 * t) * np.exp(-t / 0.15))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.45))


def thud():
    t = tarr(0.3)
    return np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t / 0.05) + 55) / SR) * np.exp(-t / 0.08)


def purr(dur=1.4):
    t = tarr(dur)
    n = filt(rng.standard_normal(len(t)), 'lowpass', 400)
    return n * (0.55 + 0.45 * np.sin(2 * np.pi * 24 * t)) * np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.3)


def car_pass(v, span=3.2, f_engine=70, tyre=0.5):
    """Stereo pass-by centred on its middle sample: distance swell, exaggerated Doppler, pan across."""
    d = 2.6
    t = tarr(d) - d / 2
    x = v * t
    amp = 1 / (1 + (x / span) ** 2)
    dop = 1 - 0.14 * np.tanh(x / span)
    eng = sum(np.sin(2 * np.pi * np.cumsum(f_engine * k * dop) / SR) / k for k in (1, 2, 3, 4))
    eng = filt(eng, 'lowpass', 900)
    road = filt(rng.standard_normal(len(t)), 'bandpass', [300, 2500]) * tyre
    s = (0.6 * eng + road) * amp
    pan = np.tanh(x / 5)
    return np.vstack([s * np.sqrt((1 - pan) / 2), s * np.sqrt((1 + pan) / 2)])


def brake(dur=0.8, f=2300):
    t = tarr(dur)
    s = np.sin(2 * np.pi * np.cumsum(f * (1 - 0.1 * t / dur) * (1 + 0.01 * np.sin(2 * np.pi * 17 * t))) / SR)
    return s * np.minimum(1, t / 0.05) * np.exp(-t / (dur * 0.5)) * (1 - t / dur)


# ─────────────────────────────── traffic (same list as traffic() in scene.js)
near = [(0.9, 12), (2.9, 13), (4.4, 12), (5.7, 14), (T['whoosh'], 26), (9.75, 14), (10.625, 15), (11.625, 13), (12.5, 15), (13.5, 14)]
far = [(0.3, 12), (1.9, 14), (3.6, 12), (5.1, 13), (6.3, 14), (8.3, 13), (9.375, 15), (10.125, 14), (11.0, 16), (12.0, 14), (13.0, 15)]
for i, (tp, v) in enumerate(near + far):
    lane = 1 if i < len(near) else -1
    sig = car_pass(v, f_engine=60 + 25 * ((i * 7) % 5) / 4)
    if lane < 0:
        sig = sig[::-1] * 0.8                                   # far lane: travels the other way, a touch quieter
    loud = 0.55 if 9 <= tp <= 14 else 0.32                      # louder while the cat is stranded in the middle
    m.add(tp - 1.3, sig, 0.8 if tp == T['whoosh'] else loud, 0, 0.12)
m.whoosh(T['whoosh'] - 0.12, 0.45, 300, 5000, 0.4, wet=0.2)

# stopping for the red light: brakes, idling, pulling away on green
for lane, (ts, delay) in enumerate([(T['stopped'], 0), (T['stopped'] + 0.4, 0.2)]):
    m.add(ts - 0.75, brake(0.8, 2200 + 250 * lane), 0.07, -0.5 + lane, 0.4)
m.add(T['stopped'], filt(rng.standard_normal(int(6 * SR)), 'lowpass', 180) * 0.6, 0.06, 0, 0)
m.whoosh(T['go'], 1.8, 120, 900, 0.16, wet=0.1)

# ─────────────────────────────── music: a light pizzicato cartoon score, one chord per bar
prog_ = [('C', 'maj7'), ('A', 'min7'), ('F', 'maj7'), ('G', '6'), ('A', 'min'), ('F', 'maj'), ('D', 'min7'), ('E', 'maj'),
         ('C', 'maj'), ('F', 'maj'), ('G', 'maj'), ('C', 'maj9')]
for b, (root, q) in enumerate(prog_):
    notes = chord(root + q, 3)
    if b in (7,):                                               # the red light: the music holds its breath
        m.pad(at(b), notes, dur=0.5, att=0.02, gain=0.12, cutoff=1200)
        continue
    tense = 4 <= b <= 6
    m.pad(at(b), notes, dur=m.bar, att=0.3 if b else 1.2, gain=0.1 if tense else 0.14, cutoff=900 if tense else 1300, wet=0.5)
    # pizzicato arpeggio on 8ths (sparser before the story starts moving)
    steps = range(0, 16, 4) if b < 2 else range(0, 16, 2)
    for k, st in enumerate(steps):
        if b == 3 and st >= 8:
            break                                               # the whoosh cuts the music off
        n = notes[k % len(notes)] + 12 + (12 if tense and k % 2 else 0)
        m.add(at(b, st), pluck(midi(n), dec=0.16 if tense else 0.25), 0.1 if tense else 0.12, -0.3 + 0.6 * (k % 2), 0.35)
    if 2 <= b <= 10 and b != 3:
        for st in (0, 8):
            m.bass(at(b, st), notes[0] - 12 if st == 0 else notes[2] - 24, gain=0.22)

# ─────────────────────────────── the story, beat by beat
# bar 0–1: the smell drifts over, the cat notices (harp-like gliss up, a curious chirp)
m.whoosh(T['smell'], 1.5, 400, 2500, 0.08, wet=0.6, bw=0.9)
for k in range(8):
    m.add(T['notice'] - 0.28 + k * 0.035, pluck(midi(72 + [0, 2, 4, 7, 9, 12, 14, 16][k]), dec=0.4), 0.09, -0.4 + k * 0.1, 0.6)
m.add(T['notice'] + 0.1, bell(midi(96), 0.8), 0.05, 0.2, 0.7)
m.add(T['notice'] + 0.15, meow(0.32, 600, 900, 820, 0.6), 0.22, 0, 0.3)          # "mrrp?"
m.add(T['closeup'] + 0.2, meow(0.5, 520, 760, 600, 0.9), 0.2, 0, 0.3)

# bar 2–3: steps to the kerb, looks left, looks right (tick, tock), the paw goes out…
for k in range(5):
    m.add(T['step'] + k * 0.125, pluck(midi(79 + (k % 2) * 3), dec=0.07), 0.07, 0.1, 0.2)
m.add(T['lookL'], blip(midi(84)), 0.1, -0.6, 0.3)
m.add(T['lookR'], blip(midi(79)), 0.1, 0.6, 0.3)
m.add(T['face'], pluck(midi(76), dec=0.3, bend=0.3), 0.1, 0, 0.3)
# …and a car blasts past: yowl, hiss, fur puff, bounce back
m.add(T['whoosh'] + 0.02, meow(0.55, 800, 1400, 700, 1.0, rough=1.0), 0.28, 0, 0.4)
m.add(T['whoosh'] + 0.05, hiss(0.45), 0.12, 0, 0.2)
m.add(T['whoosh'] + 0.03, boing(220, 700, 0.4), 0.14, 0, 0.3)
m.add(T['whoosh'] + 0.45, thud(), 0.3)

# bar 4: the butt wiggle, the pounce, the landing on the centre line
for k in range(4):
    m.add(T['crouch'] + 0.1 + k * 0.1, blip(midi(60 + (k % 2) * 2), 0.03), 0.09, -0.3 + 0.2 * k, 0.2)
m.riser(T['crouch'], T['pounce'], 300, 3000, 0.12, tone=False)
m.whoosh(T['pounce'], 0.5, 500, 4000, 0.22, wet=0.3)
m.add(T['pounce'], boing(160, 480, 0.4), 0.12)
m.add(T['land'], thud(), 0.4)
m.add(T['land'], filt(snare(), 'lowpass', 6000), 0.12, 0, 0.3)

# bars 4½–6: stranded between lanes: a nervous tremolo, a small scared meow
for k in range(40):
    tt = T['mid'] + 0.25 + k * 0.125
    if tt > T['yellow']:
        break
    m.add(tt, pluck(midi(57 + (k % 2)), dec=0.06), 0.05, 0, 0.1)
m.add(T['closeE'] + 0.55, meow(0.5, 700, 760, 520, 0.5), 0.2, 0.1, 0.3)

# bar 7: yellow, red, the cars brake — then a hopeful peek
m.add(T['yellow'], bell(midi(88), 0.6), 0.12, 0.3, 0.5)
m.add(T['red'], bell(midi(84), 0.9), 0.14, 0.3, 0.5)
m.add(T['peek'], pop(520, 0.08), 0.14, 0, 0.3)
m.add(T['peek'] + 0.25, pop(700, 0.07), 0.12, 0, 0.3)

# bars 8–9: the strut — a pizzicato step on every paw (8ths), a nod to the car, the kerb hop
for b, snares, hats in [(8, (4, 12), range(0, 16, 2)), (9, (4,), range(0, 12, 2))]:
    for st in (0, 8):
        m.kick(at(b, st), 0.5, dec=0.25, click=0.05)           # soft kick: no click transient under the plucks
    for st in snares:
        m.add(at(b, st), filt(snare(), 'lowpass', 6000), 0.18, 0.05, 0.3)
    for st in hats:
        m.add(at(b, st), hat(), 0.05, 0.25)
melody = [72, 76, 79, 76, 77, 81, 79, 77, 76, 79, 83, 79, 84]
for k, n in enumerate(melody):
    tt = T['strut'] + k * 0.25
    if tt >= T['hop']:
        break
    m.add(tt, pluck(midi(n), dec=0.14), 0.13, -0.2 + 0.4 * (k % 2), 0.3)
m.add(T['glance'] + 0.5, blip(midi(91)), 0.08, 0, 0.4)
m.add(T['hop'], boing(300, 700, 0.25), 0.1)
m.add(T['up'], thud(), 0.2)

# bar 10: the prize — chomp, a muffled happy mrrow, a purr; the light turns green and traffic resumes
m.add(T['grab'], pop(260, 0.05), 0.3, 0, 0.2)
m.add(T['grab'], keyclick(), 0.2)
m.add(T['lift'] + 0.1, meow(0.55, 420, 560, 380, 0.25), 0.2, 0, 0.3)
m.add(T['turn'], purr(2.4), 0.25, 0, 0.1)
m.add(T['green'], bell(midi(91), 0.8), 0.1, 0.4, 0.5)

# bar 11: the title — a pluck per letter, a bright chord, the subtitle pops
for i in range(13):
    m.add(T['title'] + i * 0.045, pluck(midi([72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98, 100][i]), dec=0.3), 0.07, -0.6 + 0.1 * i, 0.5)
m.pad(T['title'], chord('Cmaj9', 3) + [76, 79], dur=1.8, att=0.02, rel=1.2, gain=0.3, cutoff=3000, wet=0.6)
m.add(T['title'], bell(midi(84), 1.8), 0.12, 0, 0.6)
m.add(T['sub'], pop(760, 0.08), 0.14, 0, 0.3)

m.render(peak=0.82, drive=1.4)
