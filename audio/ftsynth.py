"""ftsynth — a tiny procedural sound-design kit for ft-motion.

Everything is synthesized with numpy/scipy: drums, bass, pads, plucks, bells, UI pops,
noise whooshes and risers, a convolution reverb, kick sidechain and a soft-clip master.

Times you pass to Mix are *scene* seconds (the same t your scene.js sees). If the project
plays at speed < 1 (stretched), Mix converts every start time and every timed duration
(whoosh, riser, pad, glide) so sound stays locked to picture; percussive one-shots keep
their natural length.

    from ftsynth import *
    m = Mix.from_project(__file__)          # reads project.json (duration, bpm, speed)
    m.drums(bar=1, kick=[0, 6, 10], snare=[8], hats=range(0, 16, 2))
    m.pad(m.at(1), chord('Em9'), dur=m.bar)
    m.whoosh(2.0, 0.5, 700, 6000)
    m.riser(5.2, 6.0)                        # ends exactly on the 6.0 s hit
    m.impact(6.0)
    m.render()                               # → out/audio.wav, prints LUFS / true peak
"""
import json
import shutil
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


def seed(n):
    global rng
    rng = np.random.default_rng(n)


def tarr(d):
    return np.arange(max(1, int(d * SR))) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filt(x, kind, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, kind, fs=SR, output='sos'), x, axis=-1)


# ─────────────────────────────── envelopes
whoosh_env = lambda x: np.sin(np.pi * x) ** 2 * (1 - 0.3 * x)
suck_env = lambda x: x ** 3
swell_env = lambda x: x ** 2
decay_env = lambda k: (lambda x: np.exp(-x * k))

# ─────────────────────────────── one-shots (natural length, never stretched)
def kick(dec=0.34, f0=165, f1=45, click=0.5):
    t = tarr(dec * 4)
    f = f1 + (f0 - f1) * np.exp(-t / 0.032)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    c = filt(rng.standard_normal(len(t)), 'highpass', 1800) * np.exp(-t / 0.0025) * click
    return np.tanh((s + c) * 1.8)


def snare():
    t = tarr(0.4)
    body = filt(rng.standard_normal(len(t)), 'bandpass', [1100, 7500]) * np.exp(-t / 0.12)
    env = sum(np.exp(-np.maximum(t - d, 0) / 0.006) * (t >= d) for d in (0, 0.008, 0.017))
    clap = filt(rng.standard_normal(len(t)), 'bandpass', [900, 2600]) * env * 0.8
    return body + clap + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.045) * 0.7


def hat(dec=0.026):
    t = tarr(max(dec * 7, 0.03))
    return filt(rng.standard_normal(len(t)), 'highpass', 7500, 4) * np.exp(-t / dec)


def pluck(freq, dec=0.32, bend=0.0):
    t = tarr(dec * 5)
    f = freq * (1 + bend * np.exp(-t / 0.028))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.3 * np.sin(2 * ph) * np.exp(-t / 0.08) + 0.12 * np.sin(3 * ph) * np.exp(-t / 0.04)
    return s * np.exp(-t / dec) * (1 - np.exp(-t / 0.0015))


def blip(freq, dec=0.035):
    t = tarr(dec * 6)
    return np.sin(2 * np.pi * freq * t + 1.2 * np.sin(4 * np.pi * freq * t) * np.exp(-t / 0.01)) * np.exp(-t / dec)


def pop(freq=700, dec=0.06):
    """UI bubble / card appearing."""
    t = tarr(dec * 5)
    f = freq * (1 + 0.9 * np.exp(-t / 0.012))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec) * (1 - np.exp(-t / 0.001))


def keyclick():
    t = tarr(0.04)
    n = filt(rng.standard_normal(len(t)), 'bandpass', [1800, 6500]) * np.exp(-t / 0.0035)
    return n + np.sin(2 * np.pi * (300 + rng.random() * 90) * t) * np.exp(-t / 0.009) * 0.6


def mouseclick():
    t = tarr(0.05)
    n = filt(rng.standard_normal(len(t)), 'bandpass', [2500, 9000]) * np.exp(-t / 0.002)
    return n + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.012) * 0.7


def bell(freq, dec=1.6):
    t = tarr(dec * 4)
    idx = 2.2 * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * freq * t + idx * np.sin(2 * np.pi * freq * 3.5 * t)) * np.exp(-t / dec) * (1 - np.exp(-t / 0.002))


# ─────────────────────────────── timed generators (length in real seconds)
def saw(f, t):
    return 2 * ((f * t + rng.random()) % 1) - 1


def pad_sig(notes, dur, att=0.2, rel=0.9, cutoff=1500):
    t = tarr(dur + rel * 2.5)
    out = np.zeros((2, len(t)))
    for m in notes:
        for det, pan in ((-0.09, -0.7), (0.0, 0.0), (0.09, 0.7)):
            s = saw(midi(m) * 2 ** (det / 12), t)
            out[0] += s * (1 - pan) / 2
            out[1] += s * (1 + pan) / 2
    env = np.minimum(1, t / att) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel / 3)))
    return filt(filt(out, 'lowpass', cutoff), 'highpass', 95) * env / len(notes)


def sweep_sig(dur, f0, f1, shape, bw=0.55):
    """Stereo noise through a band gliding f0→f1 (log), shaped by shape(x∈[0,1])."""
    n = int(dur * SR)
    x = rng.standard_normal((2, n + 2048))
    f, tt, Z = signal.stft(x, fs=SR, nperseg=1024)
    fc = f0 * (f1 / f0) ** np.clip(tt / dur, 0, 1)
    mask = np.exp(-((np.log2(np.maximum(f[:, None], 20)) - np.log2(fc[None, :])) / bw) ** 2)
    _, y = signal.istft(Z * mask[None], fs=SR, nperseg=1024)
    y = y[:, :n]
    y /= np.max(np.abs(y)) + 1e-9
    return y * shape(np.linspace(0, 1, n))


def glide_sig(dur, f0, f1, dec=None):
    t = tarr(dur)
    s = np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (t / dur)) / SR)
    return s * (np.exp(-t / dec) if dec else 1)


CHORDS = {
    'maj7': [0, 4, 7, 11], 'min7': [0, 3, 7, 10], 'maj9': [0, 4, 7, 11, 14], 'min9': [0, 3, 7, 10, 14],
    'add9': [0, 4, 7, 14], '6': [0, 4, 7, 9], 'sus2': [0, 2, 7], 'maj': [0, 4, 7], 'min': [0, 3, 7],
}
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def chord(name, octave=3):
    """'Em9', 'Cmaj7', 'G6', 'Dadd9', 'F#min7' → midi notes rooted at `octave`."""
    root = name[:2] if len(name) > 1 and name[1] in '#b' else name[:1]
    q = name[len(root):] or 'maj'
    q = {'m': 'min', 'm7': 'min7', 'm9': 'min9'}.get(q, q)
    base = 12 * (octave + 1) + NOTE[root]
    return [base + i for i in CHORDS[q]]


# ─────────────────────────────── the mix
class Mix:
    def __init__(self, duration, bpm=120, speed=1.0, out='out/audio.wav'):
        self.K = 1 / speed                       # scene seconds → real seconds
        self.dur = float(duration)
        self.N = int(SR * self.dur)
        self.bpm = bpm
        self.beat, self.bar, self.step = 60 / bpm, 240 / bpm, 15 / bpm
        self.dry = np.zeros((2, self.N))
        self.duck = np.zeros((2, self.N))
        self.send = np.zeros((2, self.N))
        self.kicks = []
        self.out = Path(out)

    @classmethod
    def from_project(cls, sound_py):
        here = Path(sound_py).resolve().parent
        cfg = json.loads((here / 'project.json').read_text(encoding='utf-8'))
        return cls(cfg['duration'], cfg.get('bpm', 120), cfg.get('speed', 1.0), here / 'out' / cfg.get('audio', 'audio.wav'))

    def at(self, bar, step=0):
        return bar * self.bar + step * self.step

    def add(self, t, sig, gain=1.0, pan=0.0, wet=0.0, duck=False):
        """Place a signal at scene time t. pan ∈ [-1,1]; wet = reverb send; duck = sidechained to kicks."""
        sig = np.atleast_2d(sig)
        if sig.shape[0] == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig[0] * l, sig[0] * r]) * np.sqrt(2)
        i = int(round(t * self.K * SR))
        if i < 0:
            sig, i = sig[:, -i:], 0
        n = min(sig.shape[1], self.N - i)
        if n <= 0:
            return
        (self.duck if duck else self.dry)[:, i:i + n] += sig[:, :n] * gain
        if wet:
            self.send[:, i:i + n] += sig[:, :n] * gain * wet

    # timed helpers — durations in scene seconds, stretched with the picture
    def whoosh(self, t, dur, f0, f1, gain=0.2, pan=0.0, wet=0.3, shape=whoosh_env, bw=0.55):
        self.add(t, sweep_sig(dur * self.K, f0, f1, shape, bw), gain, pan, wet)

    def riser(self, t0, t1, f0=350, f1=9000, gain=0.3, wet=0.4, tone=True):
        """Builds from t0 and lands exactly on t1."""
        d = (t1 - t0) * self.K
        self.add(t0, sweep_sig(d, f0, f1, swell_env, 0.7), gain, 0, wet)
        if tone:
            rt = tarr(d)
            s = filt(np.sin(2 * np.pi * np.cumsum(110 * 4 ** (rt / rt[-1])) / SR), 'lowpass', 3000) * swell_env(rt / rt[-1])
            self.add(t0, s, gain * 0.3, 0, wet)

    def suck(self, t0, t1, gain=0.3, wet=0.3):
        """Reverse-cymbal style suction into t1."""
        self.add(t0, sweep_sig((t1 - t0) * self.K, 300, 5000, suck_env), gain, 0, wet)

    def pad(self, t, notes, dur, gain=0.32, att=0.15, rel=0.9, cutoff=1400, wet=0.4):
        self.add(t, pad_sig(notes, dur * self.K, att, rel, cutoff), gain, 0, wet, duck=True)

    def glide(self, t, dur, f0, f1, gain=0.3, dec=None, wet=0.0):
        self.add(t, glide_sig(dur * self.K, f0, f1, dec), gain, 0, wet)

    def kick(self, t, gain=0.8, **kw):
        self.add(t, kick(**kw), gain)
        self.kicks.append(t)

    def bass(self, t, note, gain=0.36, dec=0.2):
        bt = tarr(0.34)
        f = midi(note)
        s = np.tanh(1.6 * (np.sin(2 * np.pi * f * bt) + 0.25 * np.sin(4 * np.pi * f * bt)))
        self.add(t + 0.01, s * np.exp(-bt / dec) * np.minimum(1, bt / 0.006), gain, duck=True)

    def drums(self, bar, kick=(), snare=(), hats=(), hat_gain=0.12, open_hats=(), root=None):
        """One bar on a 16-step grid. root (midi) adds a bass note on every kick."""
        for st in kick:
            t = self.at(bar, st)
            self.kick(t, 0.9 if st == 0 else 0.75, dec=0.45 if st == 0 else 0.3)
            if root is not None:
                self.bass(t, root)
        for st in snare:
            self.add(self.at(bar, st), globals()['snare'](), 0.45, 0.05, 0.35)
        for st in hats:
            acc = 1.0 if st % 2 == 0 else 0.6
            self.add(self.at(bar, st) + (0.006 if st % 2 else 0), hat(), hat_gain * acc * (0.85 + 0.3 * rng.random()), 0.25)
        for st in open_hats:
            self.add(self.at(bar, st), hat(0.12), hat_gain * 0.8, -0.2, 0.3)

    def roll(self, t0, t1, n=12, gain=(0.1, 0.35)):
        """Accelerating snare roll ending at t1."""
        for k in range(n):
            x = k / n
            self.add(lerp_t(t0, t1, 1 - (1 - x) ** 1.6), snare(), gain[0] + (gain[1] - gain[0]) * x, 0.05, 0.3)

    def typing(self, t0, t1, chars, gain=0.14):
        for k in range(0, chars, 2):
            self.add(t0 + (t1 - t0) * k / chars + (rng.random() - 0.5) * 0.006, keyclick(), gain + 0.05 * rng.random(), -0.2 + 0.4 * rng.random())

    def impact(self, t, gain=1.0, bright=True):
        """The drop: sub kick, sub glide, noise burst, air."""
        self.kick(t, gain, dec=0.8, f0=210, f1=36, click=0.9)
        self.glide(t, 2.4, 72, 29, gain * 0.5, dec=1.0)
        self.add(t, filt(rng.standard_normal(int(1.6 * SR)), 'lowpass', 5000) * np.exp(-tarr(1.6) / 0.28), gain * 0.3, 0, 0.9)
        if bright:
            self.whoosh(t, 1.4, 9000, 1800, gain * 0.2, shape=decay_env(4), wet=0.6)

    def render(self, reverb=0.32, drive=1.3, peak=0.8, fade_out=0.25):
        t = np.arange(self.N) / SR
        sc = np.ones(self.N)
        for tk in self.kicks:
            tk *= self.K
            m = t >= tk
            sc[m] = np.minimum(sc[m], 1 - 0.55 * np.exp(-(t[m] - tk) / 0.11))
        mixbus = self.dry + self.duck * sc
        send = self.send + self.duck * sc * 0.25
        ir_t = tarr(2.6)
        ir = rng.standard_normal((2, len(ir_t))) * np.exp(-ir_t / 0.55)
        ir = filt(ir, 'lowpass', 5500)
        ir[:, : int(0.015 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
        wet = np.vstack([signal.fftconvolve(send[c], ir[c])[: self.N] for c in range(2)])
        out = filt(mixbus + reverb * filt(wet, 'highpass', 200), 'highpass', 28)
        out /= np.max(np.abs(out)) + 1e-9
        out = np.tanh(drive * out) / np.tanh(drive)
        fade = np.ones(self.N)
        fade[: int(0.004 * SR)] = np.linspace(0, 1, int(0.004 * SR))
        nf = int(fade_out * SR)
        if nf:
            fade[-nf:] = np.linspace(1, 0, nf) ** 2
        out = out * fade * peak
        self.out.parent.mkdir(parents=True, exist_ok=True)
        pcm = (np.clip(out.T, -1, 1) * 32767).astype('<i2')
        with wave.open(str(self.out), 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        print(f'wrote {self.out}')
        loudness(self.out)


def lerp_t(a, b, x):
    return a + (b - a) * x


def loudness(path):
    """Prints integrated LUFS and true peak (target ≈ -14 LUFS, ≤ -1 dBTP for social)."""
    if not shutil.which('ffmpeg'):
        return
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    lines = [l.strip() for l in r.stderr.splitlines()]
    i = next((l for l in reversed(lines) if l.startswith('I:')), None)
    p = next((l for l in reversed(lines) if l.startswith('Peak:')), None)
    if i and p:
        print(f'  loudness {i.split(":")[1].strip()} | true peak {p.split(":")[1].strip()}   (aim: -14 LUFS, <= -1 dBFS; tune Mix.render(peak=...))')
