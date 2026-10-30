"""examples/ft-promo: English narration. Run:  C:\\vox\\Scripts\\python.exe examples/ft-promo/voice.py
VoxCPM2 (openbmb/VoxCPM2, Apache-2.0, runs locally). Not the dotkesk voice: this video gets its own narrator.
  1. voice design: the first run writes voice/ref.wav from a text description (3 tries, Whisper keeps the clean one).
     Keep that file: every later run clones it, so the narrator stays the same person.
  2. every line gets TAKES takes cloned from voice/ref.wav; Whisper picks the take with the right words and a natural pace,
  3. each line starts on its planned beat (START, seconds on the 120 BPM grid); a long line pushes the rest back by whole beats,
  4. writes out/narration.wav, schedule.js (scene + word times for scene.js and sound.py) and the duration into project.json.
The picked takes are cached in out/takes/ (with Whisper's word times), so changing START, GAP or TEMPO only re-lays them out;
FORCE=1 synthesizes again; ONLY=glitch,end redoes just those lines (with more takes).
The audio is AI-generated: switch on X's AI label when you post."""
import gc
import json
import os
import sys
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[0] / 'dotkesk'))
from voice_lib import _asr, _hear, _norm, _tempo, _trim, _word_times  # noqa: E402  (shared helpers: ASR, word timing)

OUT = HERE / 'out'
REF = HERE / 'voice' / 'ref.wav'
CONTROL = ('A calm, clear and confident male narrator in his thirties, American English, warm mid-low voice, '
           'measured pace, quietly excited, like a developer showing something he built')
REF_TEXT = ('Every frame of this video is a function of time. You write the scene in code, '
            'and the computer draws it, frame by frame, on the beat.')
STEP = 0.5        # one beat at 120 BPM: every scene starts on one
GAP = 0.25        # air after a line before the next scene may start
TAKES = 3
TEMPO = 1.1      # the designed narrator reads a little slowly: every take is sped up (pitch kept)

# key, on-screen text, what the model reads, planned start (s), shortest scene (s)
LINES = [
    ('hook', 'This video started as one sentence.', 'This video started as one sentence.', 0.0, 4.0),
    ('code', 'Every frame is code: a pure function of time.', 'Every frame is code. A pure function of time.', 4.0, 4.0),
    ('type', 'Type that moves,', 'Type that moves,', 8.0, 2.0),
    ('dots', 'dots that ripple and fold into 3D,', 'dots that ripple, and fold into three D,', 10.0, 4.0),
    ('morph', 'shapes that morph,', 'shapes that morph,', 14.0, 2.0),
    ('three', 'even real 3D.', 'even real three D.', 16.0, 2.0),
    ('blur', 'Real motion blur,', 'Real motion blur,', 18.0, 2.0),
    ('glitch', 'glitches and wipes, all on the beat.', 'glitches and wipes, all on the beat.', 20.0, 2.0),
    ('music', 'The music is synthesized in Python,', 'The music is synthesized in Python,', 22.0, 2.0),
    ('subs', 'and these subtitles follow my voice, word by word.', 'and these subtitles follow my voice, word by word.', 24.0, 3.0),
    ('render', 'One command renders it all.', 'One command renders it all.', 27.0, 2.5),
    ('end', 'ft-motion. Open source, on GitHub.', 'F T motion. Open source, on GitHub.', 29.5, 4.5),
]
VOICE_AT = {'hook': 0.35}   # the first line starts under the typing, the rest a hair after their cut


def load_tts():
    from voxcpm import VoxCPM
    return VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False)


def design():
    """write voice/ref.wav once: three designed reads of REF_TEXT, Whisper keeps the most accurate"""
    tts = load_tts(); sr = tts.tts_model.sample_rate
    cands = [_trim(np.asarray(tts.generate(text=f'({CONTROL}){REF_TEXT}', cfg_value=2.0, inference_timesteps=16), dtype=np.float32), sr)
             for _ in range(3)]
    del tts; gc.collect(); torch.cuda.empty_cache()
    asr = _asr()
    want = _norm(REF_TEXT)
    scored = []
    for k, w in enumerate(cands):
        text, _ = _hear(asr, w, sr)
        acc = SequenceMatcher(None, want, _norm(text)).ratio()
        pace = len(w) / sr / len(REF_TEXT.split())
        print(f'  ref take {k + 1}: acc {acc:.2f} pace {pace:.2f}s/w "{text}"', flush=True)
        scored.append((acc * 3 - abs(pace - 0.38), w))
    del asr; gc.collect(); torch.cuda.empty_cache()
    REF.parent.mkdir(parents=True, exist_ok=True)
    best = max(scored, key=lambda s: s[0])[1]
    sf.write(REF, best / (np.abs(best).max() + 1e-9) * 0.9, sr)
    print(f'wrote {REF}')


def synth(lines, n=TAKES):
    tts = load_tts(); sr = tts.tts_model.sample_rate
    takes = []
    for key, _, say, *_ in lines:
        row = [_trim(np.asarray(tts.generate(text=say, prompt_wav_path=str(REF), prompt_text=REF_TEXT, reference_wav_path=str(REF),
                                              cfg_value=2.0, inference_timesteps=16), dtype=np.float32), sr) for _ in range(n)]
        takes.append(row)
        print(f'  synth {key:6s} ' + ' '.join(f'{len(w) / sr:.2f}s' for w in row), flush=True)
    del tts; gc.collect(); torch.cuda.empty_cache()
    return takes, sr


def pick(only=None):
    """synthesize, let Whisper choose a take per line, cache the winners in out/takes/"""
    lines = [ln for ln in LINES if not only or ln[0] in only]
    takes, sr = synth(lines, 6 if only else TAKES)
    asr = _asr()
    cache = OUT / 'takes'
    cache.mkdir(parents=True, exist_ok=True)
    mf = cache / 'meta.json'
    meta = json.loads(mf.read_text(encoding='utf-8')) if only and mf.exists() else {}
    for (key, text, say, *_), row in zip(lines, takes):
        want = _norm(say)
        best = None
        for k, wav in enumerate(row):
            heard, words = _hear(asr, wav, sr)
            acc = SequenceMatcher(None, want, _norm(heard)).ratio()
            pace = len(wav) / sr / len(text.split())
            score = acc * 3 - abs(pace - 0.42)
            print(f'  hear  {key:6s} take {k + 1}  acc {acc:.2f}  pace {pace:.2f}s/w  "{heard}"', flush=True)
            if best is None or score > best[0]:
                best = (score, wav, heard, words, acc)
        if best[4] < 0.85:
            print(f'  ?? {key}: best "{best[2]}" (acc {best[4]:.2f}); "3D" / "ft-motion" read as "three D" / "F T motion" score low here')
        sf.write(cache / f'{key}.wav', best[1], sr)
        meta[key] = {'heard': best[2], 'words': best[3]}
    (cache / 'meta.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    del asr; gc.collect(); torch.cuda.empty_cache()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if not REF.exists():
        design()
    cache = OUT / 'takes'
    if os.environ.get('FORCE') or not (cache / 'meta.json').exists():
        pick()
    elif os.environ.get('ONLY'):
        pick(set(os.environ['ONLY'].split(',')))
    meta = json.loads((cache / 'meta.json').read_text(encoding='utf-8'))
    picked = []
    for key, *_ in LINES:
        wav, sr = sf.read(cache / f'{key}.wav', dtype='float32')
        m = meta[key]
        words = [(w, a / TEMPO, b / TEMPO) for w, a, b in m['words']]
        picked.append((0, _tempo(wav, sr, TEMPO), m['heard'], words, 1))

    # lay out: planned start, or later if the previous line is still talking (pushed by whole beats)
    sched, t = [], 0.0
    for (key, text, _, start, mn), (_, wav, heard, words, _) in zip(LINES, picked):
        s0 = max(start, np.ceil(t / STEP - 1e-6) * STEP)
        v = s0 + VOICE_AT.get(key, 0.1)
        dur = len(wav) / sr
        sched.append({'key': key, 'text': text, 'scene': float(s0), 'voice': round(v, 3), 'dur': round(dur, 3), 'heard': heard,
                      'words': [[w, round(v + a, 3), round(v + b, 3)] for w, a, b in _word_times(text, words, dur)], 'min': mn})
        t = v + dur + GAP
    for i, s in enumerate(sched):
        nxt = sched[i + 1]['scene'] if i + 1 < len(sched) else None
        s['end'] = float(nxt if nxt is not None else max(s['scene'] + s['min'], np.ceil((s['voice'] + s['dur'] + 1.5) / STEP) * STEP))
        del s['min']
    total = sched[-1]['end']
    track = np.zeros(int(total * sr) + sr, dtype=np.float32)
    for s, (_, wav, *_r) in zip(sched, picked):
        a = int(s['voice'] * sr); track[a:a + len(wav)] += wav
    track = track[:int(total * sr)]
    sf.write(OUT / 'narration.wav', track / (np.abs(track).max() + 1e-9) * 0.95, sr)
    (HERE / 'schedule.js').write_text('// written by voice.py: scene and word times (seconds) of the narration in out/narration.wav\n'
                                      'export const SCHEDULE = ' + json.dumps(sched, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    pj = HERE / 'project.json'
    cfg = json.loads(pj.read_text(encoding='utf-8'))
    cfg['duration'] = total
    pj.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for s in sched:
        print(f"{s['key']:6s} scene {s['scene']:5.2f}-{s['end']:5.2f}  voice {s['voice']:5.2f}-{s['voice'] + s['dur']:5.2f}  {s['text']}")
    print(f'total {total:.2f}s -> project.json duration; wrote {OUT / "narration.wav"}')


if __name__ == '__main__':
    main()
