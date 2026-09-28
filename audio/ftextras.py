"""ftextras: more sounds for ftsynth (kept separate so ftsynth.py stays small).

    from ftsynth import *
    from ftextras import *

    stamp(m, t, 110)                            # a text slam: pitched tom + short kick (ducks the pads)
    counter_ticks(m, t0, 0.85, 29)              # ticks that slow down like an expo-out counter
    echo(m, t, pluck(midi(76)), gain=0.14)      # ping-pong repeats through m.add()
    m.add(t, glitch_burst(0.4), 0.5, 0, 0.15)   # stuttering, bit-crushed noise for a digital tear
"""
import numpy as np

from ftsynth import SR, filt, kick, rng, tarr


def tom(freq=110, dec=0.13):
    """Pitched drum with a noise tick on top: the body of a stamp."""
    t = tarr(0.4)
    f = freq * (1 + 0.6 * np.exp(-t / 0.03))
    body = np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec))
    tick_ = filt(rng.standard_normal(len(t)), 'bandpass', [1800, 6000]) * np.exp(-t / 0.006) * 0.35
    return body + tick_


def tick(freq=2600):
    """A tiny UI tick: sine blip plus a breath of high noise."""
    t = tarr(0.05)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.008) * 0.6 + filt(rng.standard_normal(len(t)), 'highpass', 5000) * np.exp(-t / 0.003) * 0.3


def glitch_burst(dur=0.4, rate=34):
    """Square-wave stutters at random pitches, bit-crushed and gated at `rate` Hz, fading out."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    step = np.floor(t * rate).astype(int)
    freqs = rng.integers(300, 3000, size=step.max() + 2)
    y = np.sign(np.sin(2 * np.pi * freqs[step] * t)) * 0.4 + rng.standard_normal(n) * 0.25
    y = np.round(y * 5) / 5
    return y * (step % 2 == 0) * np.clip(1 - t / dur, 0, 1) ** 0.5


def stamp(m, t, pitch=110, gain=0.6):
    """Text slam on the beat: tom + a short kick. The kick is registered, so pads and bass duck under it."""
    m.add(t, tom(pitch, 0.12), gain * 0.9)
    m.kick(t, gain * 0.55, f0=90, f1=52, dec=0.11)


def counter_ticks(m, t0, dur, count, f0=1800, f1=3300, gain=0.15, pan=0.2):
    """`count` ticks whose spacing follows an expo-out counter (dense first, then slowing), pitch rising."""
    for k in range(1, count + 1):
        x = -np.log2(1 - k / (count + 0.5)) / 10          # inverse of 1 - 2^(-10x)
        m.add(t0 + dur * x, tick(f0 + (f1 - f0) * k / count), gain, pan)


def echo(m, t, sig, gain=0.15, pan=0.4, delay=None, feedback=0.4, taps=3, wet=0.3):
    """Ping-pong repeats: each tap is quieter and flips to the other side. delay defaults to a dotted eighth."""
    d = delay if delay is not None else 0.75 * m.beat
    m.add(t, sig, gain, pan, wet)
    for k in range(1, taps + 1):
        m.add(t + d * k, sig, gain * feedback ** k, -pan if k % 2 else pan, wet)
