"""examples/chat-commerce — the soundtrack on the scene's 15 s clock (160 BPM). project.json's "speed"
stretches it with the picture (Mix.from_project reads it). Run: python examples/chat-commerce/sound.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'audio'))
from ftsynth import Mix, chord, midi, bell, pop, mouseclick, snare  # noqa: E402

PROG = [('Amaj9', 3), ('E6', 3), ('F#min9', 2), ('Dmaj9', 3)]        # bright, one chord per bar
BASS = [33, 40, 42, 38]
SCALE = [69, 71, 73, 76, 78, 81, 83, 85, 88, 90]                       # melodic cues
COPY = {'msg1': '1.500 TL altında siyah bir çanta arıyorum.', 'reply1': 'Bütçene uygun 3 siyah çanta buldum:',
        'msg2': 'İkincisinin taba rengi var mı?', 'reply2': 'Var, taba rengi stokta:',
        'steps': 6, 'channels': 6}                                    # keep in sync with COPY in scene.js


def bed(m, bars, start=0, groove='none', gain=1.0):
    for i in range(bars):
        b, (name, octave) = start + i, PROG[i % len(PROG)]
        m.pad(m.at(b), chord(name, octave), dur=m.bar, att=0.9 if b == 0 else 0.12, gain=0.22 * gain, cutoff=2400)
        root = BASS[i % len(BASS)]
        if groove == 'drive':
            m.drums(b, kick=[0, 4, 8, 12], snare=[4, 12], hats=range(0, 16, 2), hat_gain=0.07 * gain, root=root)
        elif groove == 'light':
            m.drums(b, kick=[0, 10], hats=range(0, 16, 2), hat_gain=0.05 * gain, root=root)
            m.add(m.at(b, 8), snare(), 0.12 * gain, 0.05, 0.35)


def chime(m, t, i, gain=0.07, pan=0.0):
    n = SCALE[i % len(SCALE)] + 12 * (i // len(SCALE))
    m.add(t, bell(midi(n), 1.1), gain, pan, 0.5)


def chat_schedule():
    ev, c = [], 0.36
    for kind, text in (('user', COPY['msg1']), ('agent', COPY['reply1']), ('products', None), ('user', COPY['msg2']), ('agent', COPY['reply2']), ('detail', None)):
        if kind == 'user':
            td = min(0.9, max(0.3, len(text) * 0.016))
            ev.append(dict(type='user', t0=c, t1=c + td, ta=c + td + 0.1, n=len(text))); c += td + 0.25
        elif kind == 'agent':
            ev.append(dict(type='agent', ta=c, text0=c + 0.3)); c += 0.55
        elif kind == 'products':
            ev.append(dict(type='products', ta=c)); c += 0.5
        else:
            ev.append(dict(type='detail', ta=c, press=c + 0.42)); c += 0.67
    k = 4.4 / c if c > 4.4 else 1.0
    return [{key: (v * k if key not in ('type', 'n') else v) for key, v in e.items()} for e in ev]


m = Mix.from_project(__file__)
at = m.at
bed(m, 1, 0, 'none', 0.8)
bed(m, 3, 1, 'light', 0.85)
bed(m, 4, 4, 'drive')
top = chord(*PROG[0])
m.pad(at(8), top + [n + 12 for n in top[1:3]], dur=3.2, att=0.03, rel=1.6, gain=0.3, cutoff=5000, wet=0.6)

# bar 0 · the old funnel
every = min(0.1875, 0.95 / COPY['steps'])
for i in range(COPY['steps']):
    m.add(0.12 + i * every, mouseclick(), 0.18, 0.15, 0.1)
m.suck(1.08, 1.5, 0.22)

# bars 1–3 · the conversation
c0 = at(1)
for e in chat_schedule():
    if e['type'] == 'user':
        m.typing(c0 + e['t0'], c0 + e['t1'], e['n'], 0.12)
        m.add(c0 + e['ta'], pop(880, 0.05), 0.14, 0.3, 0.3)
    elif e['type'] == 'agent':
        m.add(c0 + e['text0'], pop(620, 0.06), 0.12, -0.3, 0.3)
    elif e['type'] == 'products':
        for k in range(3):
            chime(m, c0 + e['ta'] + k * 0.09, 4 + k, 0.06 * (1 - 0.08 * k), -0.3 + 0.3 * k)
    else:
        m.add(c0 + e['ta'], pop(520, 0.08), 0.1, -0.2, 0.3)
        m.add(c0 + e['press'], mouseclick(), 0.2, 0.0, 0.1)
        chime(m, c0 + e['press'] + 0.04, 7, 0.07)
        chime(m, c0 + e['press'] + 0.12, 9, 0.05)

# bar 4 · manifesto
s0 = at(4)
for dt in (0.0, 0.375, 0.75):
    m.whoosh(s0 + dt, 0.35, 5000, 900, 0.1, 0.0, 0.3)
for dt in (0.2, 0.575):
    m.whoosh(s0 + dt, 0.16, 1200, 7000, 0.08, 0.3, 0.2)
m.suck(s0 + 1.08, s0 + 1.5, 0.16)

# bar 5 · channels, one inbox
ch0, n = at(5), COPY['channels']
for k in range(n):
    chime(m, ch0 + 0.1 + k * min(0.1875, 0.95 / n), 3 + k, 0.05, -0.5 + k / max(1, n - 1))
m.add(ch0 + 0.45, pop(500, 0.08), 0.1, 0.0, 0.3)

# bar 6 · the dots fly into the logo
l0 = at(6)
m.whoosh(l0, 0.9, 200, 1100, 0.12, 0.0, 0.4)
m.suck(l0 + 0.6, l0 + 1.05, 0.22)
m.kick(l0 + 1.05, 0.55)
chime(m, l0 + 1.05, 5, 0.07)

# bar 7 · formula, dive
f0 = at(7)
for i, dt in enumerate((0.02, 0.375, 0.75, 0.9375)):
    chime(m, f0 + dt, i * 2, 0.05)
m.riser(f0 + 0.55, f0 + 1.5, gain=0.22)
m.roll(f0 + 1.125, f0 + 1.5, n=8, gain=(0.06, 0.2))

# bars 8–9 · end card
e0 = at(8)
m.impact(e0, 0.55, bright=True)
m.add(e0 + 0.12, pop(640, 0.08), 0.1, 0.0, 0.4)
m.add(e0 + 1.0, pop(760, 0.07), 0.1, 0.0, 0.3)
m.add(e0 + 1.98, mouseclick(), 0.2, 0.25, 0.1)
chime(m, e0 + 2.0, 9, 0.06, 0.25)

m.render(peak=0.87, fade_out=0.35)
