"""examples/dotkesk: the series' sound kit, on top of audio/ftsynth.py. Every episode's sound.py uses it.
The brief for this series is "watch the highs": phone speakers and earbuds make anything above ~5 kHz sound harsh, and a voice
already has its own sibilance there. So:
  · UI sounds are sine-based and low-passed (nothing of ours above ~4-6 kHz), hats are band-passed and quiet,
  · the voice is de-essed (5-10 kHz is pressed down only while an "s" is loud) and the music dips under every word,
  · the master gets a gentle high shelf, then loudnorm to -14 LUFS / -1.5 dBTP,
  · finish() prints how much energy sits in 5-10 kHz and above 10 kHz, so harshness is measured, not guessed."""
import subprocess
import sys
from math import gcd
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, welch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import SR, filt, midi, rng, tarr, pop, bell, sweep_sig, decay_env  # noqa: E402


# ───────────── soft one-shots
def soft_pop(freq=620, dec=0.07, lp=3500):
    """a chat bubble / card landing: a pitched sine drop, no click"""
    return filt(pop(freq, dec), 'lowpass', lp)


def soft_hat(dec=0.022):
    t = tarr(dec * 7)
    return filt(rng.standard_normal(len(t)), 'bandpass', [4500, 8000], 2) * np.exp(-t / dec)


def soft_click(gain=1.0):
    """a finger tap on glass: a low thump and a short, dark tick"""
    t = tarr(0.06)
    n = filt(rng.standard_normal(len(t)), 'bandpass', [900, 3200]) * np.exp(-t / 0.004)
    return (n * 0.6 + np.sin(2 * np.pi * 210 * t) * np.exp(-t / 0.014)) * gain


def chime(m, t, notes, gain=0.1, gap=0.06, dec=1.1, pan=0.0, wet=0.45):
    """a notification / success chime: soft bells, kept under ~1.6 kHz and low-passed"""
    for i, n in enumerate(notes):
        m.add(t + i * gap, filt(bell(midi(n), dec), 'lowpass', 4200), gain * (1 - 0.12 * i), pan, wet)


def type_soft(m, t0, t1, n, gain=0.06):
    """typing dots / keystrokes: dark, quiet ticks"""
    for k in range(n):
        tt = t0 + (t1 - t0) * k / max(1, n)
        x = tarr(0.03)
        s = filt(rng.standard_normal(len(x)), 'bandpass', [1200, 3800]) * np.exp(-x / 0.004)
        m.add(tt, s, gain * (0.8 + 0.4 * rng.random()), -0.2 + 0.4 * rng.random())


def whoosh_soft(m, t, dur, f0, f1, gain=0.12, pan=0.0, wet=0.3):
    """a noise sweep with its top cut at 6 kHz"""
    m.add(t, filt(sweep_sig(dur * m.K, f0, min(f1, 6000), lambda x: np.sin(np.pi * x) ** 2), 'lowpass', 6500), gain, pan, wet)


def thump(m, t, gain=0.8):
    """a soft impact: sub kick, sub glide and a dark noise bloom (ftsynth.impact without the bright air)"""
    m.kick(t, gain, dec=0.7, f0=180, f1=38, click=0.2)
    m.glide(t, 1.8, 70, 32, gain * 0.45, dec=0.8)
    m.add(t, filt(rng.standard_normal(int(1.2 * SR)), 'lowpass', 2200) * np.exp(-tarr(1.2) / 0.22), gain * 0.25, 0, 0.8)


# ───────────── voice
def deess(x, lo=5000, hi=10000, thresh=0.4, ratio=4.0):
    """press the 5-10 kHz band down while it is loud (the s / sh / t), leave it alone the rest of the time"""
    band = filt(x, 'bandpass', [lo, hi], 4)
    env = filt(np.abs(band), 'lowpass', 120, 1)
    ref = np.percentile(env, 99) * thresh + 1e-9
    over = np.maximum(env / ref, 1.0)
    g = over ** (1 / ratio - 1)
    return x - band + band * g


def add_voice(m, path, gain=1.9, duck=0.6):
    """the narration (already placed on the timeline by voice.py): high-passed, de-essed, and the music dips under every word"""
    if not Path(path).exists():
        print('no narration.wav yet: run voice.py first'); return None
    wav, sr = sf.read(path)
    if wav.ndim > 1:
        wav = wav.mean(axis=1)
    if sr != SR:
        g = gcd(int(sr), SR)
        wav = resample_poly(wav, SR // g, int(sr) // g)
    wav = deess(filt(wav, 'highpass', 80))[:m.N]
    vo = np.zeros((2, m.N))
    vo[:, :len(wav)] = wav / (np.max(np.abs(wav)) + 1e-9)
    env = np.clip(filt(np.abs(vo[0]), 'lowpass', 6, order=1) * 4, 0, 1)
    for arr in (m.dry, m.duck, m.send):
        arr *= 1 - duck * env
    m.dry += vo * gain
    return wav


# ───────────── master
def bands(x, sr):
    f, p = welch(x if x.ndim == 1 else x.mean(axis=0 if x.shape[0] == 2 else 1), sr, nperseg=4096)
    tot = p[f > 60].sum() + 1e-20
    db = lambda a, b: 10 * np.log10(p[(f >= a) & (f < b)].sum() / tot + 1e-12)
    return db(5000, 10000), db(10000, 24000)


def finish(m, shelf_db=-2.5, shelf_hz=7000, lufs=-14.0, tp=-1.5, **render_kw):
    """render, tame the top end with a high shelf, loudnorm (two-pass, linear) and report loudness and the high bands"""
    m.render(**render_kw)
    x, sr = sf.read(m.out)
    hp = filt(x.T, 'highpass', shelf_hz, 2)
    y = (x.T + (10 ** (shelf_db / 20) - 1) * hp).T
    tmp = m.out.with_name('_pre.wav')
    sf.write(tmp, y, sr, subtype='FLOAT')
    an = f'loudnorm=I={lufs}:TP={tp}:LRA=11'
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(tmp), '-af', an + ':print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1]
    import json
    v = json.loads(js)
    second = (f"{an}:measured_I={v['input_i']}:measured_TP={v['input_tp']}:measured_LRA={v['input_lra']}:measured_thresh={v['input_thresh']}"
              f":offset={v['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(tmp), '-af', second, '-ar', str(sr), '-c:a', 'pcm_s16le', str(m.out)], check=True)
    tmp.unlink()
    z, _ = sf.read(m.out)
    b510, b10 = bands(z.T, sr)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(m.out), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    lines = [ln.strip() for ln in r.stderr.splitlines()]
    i = next((ln for ln in reversed(lines) if ln.startswith('I:')), 'I: ?')
    p = next((ln for ln in reversed(lines) if ln.startswith('Peak:')), 'Peak: ?')
    print(f'final  {i.split(":")[1].strip()} | true peak {p.split(":")[1].strip()} | 5-10 kHz {b510:.1f} dB | >10 kHz {b10:.1f} dB (share of total energy)')


# ───────────── the series score (episodes 02+): what every episode shares, on its own schedule
def load_schedule(here):
    """the scene / word times voice.py wrote into schedule.js, keyed by line"""
    import json
    src = (Path(here) / 'schedule.js').read_text(encoding='utf-8')
    return {s['key']: s for s in json.loads(src[src.index('['):src.rindex(']') + 1])}


def name_time(S):
    return next((w[1] for w in S['turn']['words'] if 'dotkesk' in w[0].lower()), S['turn']['voice'])


def series_score(m, S):
    """D minor while the problem plays, a rewind sweep + thump + bright F chord on "dotkesk", a soft groove (kick, dark hats,
    bass) until the end card, a success chime on the payoff, and the end card's sounds. Returns the name time."""
    from ftsynth import chord
    name, T0, E0 = name_time(S), S['turn']['scene'], S['end']['scene']
    P0 = S['payoff']['scene'] if 'payoff' in S else E0
    m.pad(0, chord('Dm', 3), name, gain=0.15, att=0.8, cutoff=800, wet=0.5)
    m.glide(0, name, midi(38), midi(38), 0.08)
    m.pad(name, chord('Fadd9', 3), S['turn']['end'] - name, gain=0.19, att=0.05, cutoff=1500, wet=0.45)
    prog_, roots = ['F', 'C', 'Dm', 'Bb'], {'F': 41, 'C': 36, 'Dm': 38, 'Bb': 34}
    t, k = S['turn']['end'], 0
    while t < P0 - 0.01:
        d = min(m.bar, P0 - t)
        m.pad(t, chord(prog_[k % 4], 3), d, gain=0.14, cutoff=1300, wet=0.4)
        for st in (2, 6, 10, 14):
            if t + st * m.step < P0:
                m.bass(t + st * m.step, roots[prog_[k % 4]] + 12, 0.15)
        t += d; k += 1
    if P0 < E0:
        m.pad(P0, chord('Cadd9', 3), E0 - P0, gain=0.16, cutoff=1500, wet=0.45)
    m.pad(E0, chord('Fmaj9', 3), m.dur - E0, gain=0.2, att=0.4, rel=1.2, cutoff=1800, wet=0.5)
    # the turn
    whoosh_soft(m, T0, max(0.3, name - T0 + 0.05), 350, 5000, 0.13, wet=0.3)
    thump(m, name, 0.75)
    chime(m, name + 0.02, [65, 69, 72, 77], gain=0.1, gap=0.045, dec=1.6, wet=0.55)
    # groove from two beats after the name to the end card
    t = round(name / m.beat) * m.beat + 2 * m.beat
    while t < E0 - 0.01:
        if not (P0 <= t < P0 + m.bar * 0.5):
            m.kick(t, 0.5, dec=0.28)
        m.add(t + m.beat / 2, soft_hat(), 0.05, 0.25)
        t += m.beat
    # payoff
    if P0 < E0:
        thump(m, P0, 0.55)
        chime(m, P0 + 0.05, [72, 76, 79, 84], gain=0.11, gap=0.07, dec=1.4, wet=0.5)
        whoosh_soft(m, P0 + 0.1, 1.0, 1800, 500, 0.08, wet=0.4)
    end_card(m, E0)
    return name


def end_card(m, E0):
    """dots whoosh into the logo, the sphere, the wordmark, the Follow tap, the demo button (same times as kit.js endCard)"""
    whoosh_soft(m, E0 - 0.1, 1.1, 600, 4500, 0.13, wet=0.35)
    m.add(E0 + 0.15, soft_pop(300, 0.14), 0.3)
    m.add(E0 + 0.45, soft_pop(440, 0.08), 0.15)
    m.add(E0 + 0.95, soft_pop(560, 0.07), 0.15)
    m.add(E0 + 1.6, soft_pop(480, 0.09), 0.18)
    m.add(E0 + 2.05, soft_click(), 0.45, 0.25)
    chime(m, E0 + 2.07, [77, 81, 84], gain=0.1, gap=0.06, dec=1.2, pan=0.2)
    chime(m, E0 + 3.0, [65, 72, 77], gain=0.07, gap=0.09, dec=2.2, wet=0.6)
    m.glide(E0, m.dur - E0, midi(29), midi(29), 0.08)


def ui(m, t, kind='in', gain=0.2):
    """one UI event: 'in' (customer bubble), 'out' (agent bubble), 'card', 'chip', 'tap', 'notif'"""
    if kind == 'in':
        m.add(t, soft_pop(520), gain, -0.2)
    elif kind == 'out':
        m.add(t, soft_pop(700), gain, 0.2)
    elif kind == 'card':
        m.add(t, soft_pop(600, 0.09), gain * 1.1, 0.1)
    elif kind == 'chip':
        m.add(t, soft_pop(640, 0.04), gain * 0.6, 0.0)
    elif kind == 'tap':
        m.add(t, soft_click(), gain * 2, 0.2)
    elif kind == 'notif':
        chime(m, t, [76, 81], gain=gain * 0.4, gap=0.07)
        m.add(t, soft_pop(540, 0.06), gain * 0.9)
