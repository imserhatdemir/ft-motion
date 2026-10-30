"""examples/dotkesk: the series voice. Every episode's voice.py calls build(LINES, ...).
Run an episode with a Python that has torch (CUDA), voxcpm and transformers:   C:\\vox\\Scripts\\python.exe examples/dotkesk-01/voice.py

The voice is VoxCPM2 (openbmb/VoxCPM2, Apache-2.0, free, runs locally). It clones ONE reference clip, voice/brand_voice_A.wav
(designed once as "a young American woman, warm, confident and friendly"), so every episode is the same woman.
  1. every line gets TAKES takes (cloned from the reference, continuing its delivery),
  2. Whisper (openai/whisper-large-v3) transcribes every take; the take with the right words and a natural pace wins,
  3. the lines go on the timeline one after another, each scene snapped to an eighth note (0.25 s at 120 BPM),
  4. writes out/narration.wav, schedule.js (scene + word times for scene.js and sound.py) and the duration into project.json.
The audio is AI-generated: switch on the platform's AI label when you post."""
import gc
import json
import os
import re
import subprocess
import time
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

KIT = Path(__file__).resolve().parent
REF = KIT / 'voice' / 'brand_voice_A.wav'
REF_TEXT = "It's 2 a.m. Your store is closed. But a customer just asked about the pink shirt. Who's answering? With dotkesk, your AI agent is."
BEAT = 0.25                      # eighth note at 120 BPM: every cut lands on one
TAKES = 3
GAP = 0.3                        # air after each line before the next scene


def _norm(s):
    s = s.lower().replace('@', ' at ').replace('sail', 'sale')
    s = re.sub(r'\b(ee-?kas|e-?kas|ikas|ekas|icas|ecas)\b', 'ikas', s)          # the store platform, read "ee-kas"
    s = re.sub(r'\bf\W{0,2}a\W{0,2}q\b', 'faq', s)                     # F.A.Q. / FAQ
    # Whisper doesn't know the name and writes what an American "dot-kesk" sounds like to it: DotCast, DotCask, Doc Kesk, .kesk
    s = re.sub(r'(\bdo[tc]?\s*[-.]?\s*|(?<![a-z])\.)(c|k|h)?[aeo]?[ae]s[kt]\b', 'dotkesk', s)
    return re.sub(r'[^a-z0-9 ]', ' ', s).split()


def _tempo(wav, sr, rate):
    """ffmpeg atempo: slower or faster without changing the pitch"""
    if abs(rate - 1) < 1e-3:
        return wav
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-', '-af', f'atempo={rate}', '-f', 'f32le', '-'],
                       input=wav.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def _trim(wav, sr):
    """cut leading/trailing silence, keep 50 ms in front and 100 ms behind"""
    env = np.convolve(np.abs(wav), np.ones(int(0.01 * sr)) / int(0.01 * sr), mode='same')
    idx = np.where(env > 0.03 * env.max())[0]
    return wav[max(0, idx[0] - int(0.05 * sr)):min(len(wav), idx[-1] + int(0.1 * sr))]


def _synth(lines):
    from voxcpm import VoxCPM
    tts = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False)
    sr = tts.tts_model.sample_rate
    takes = []
    for ln in lines:
        row = []
        for _ in range(TAKES):
            wav = tts.generate(text=ln['say'], prompt_wav_path=str(REF), prompt_text=REF_TEXT, reference_wav_path=str(REF),
                               cfg_value=2.0, inference_timesteps=16, normalize=False)
            row.append(_tempo(_trim(np.asarray(wav, dtype=np.float32), sr), sr, ln.get('tempo', 1.0)))
        takes.append(row)
        print(f"  synth {ln['key']:6s} " + ' '.join(f'{len(w) / sr:.2f}s' for w in row), flush=True)
    del tts
    gc.collect(); torch.cuda.empty_cache()
    return takes, sr


def _asr():
    from transformers import pipeline
    return pipeline('automatic-speech-recognition', model='openai/whisper-large-v3', torch_dtype=torch.float16, device=0)


def _hear(asr, wav, sr):
    r = asr({'raw': wav, 'sampling_rate': sr}, generate_kwargs={'language': 'en'}, return_timestamps='word')
    return r['text'].strip(), [(c['text'].strip(), c['timestamp'][0], c['timestamp'][1] or c['timestamp'][0] + 0.2) for c in r['chunks']]


def _word_times(display, heard, dur):
    """Start/end of every display word. The letters of what Whisper heard form a timeline; each display word takes the
    span of its own letters on it, so 'dotkesk' / 'Dot Kesk' / '@dotkesk' map cleanly."""
    lt = []
    for w, a, b in heard:
        ch = re.sub(r'[^a-z0-9]', '', w.lower())
        lt += [(a + (b - a) * i / len(ch), a + (b - a) * (i + 1) / len(ch)) for i in range(len(ch))] if ch else []
    if not lt:
        lt = [(0.0, dur)]
    ws = display.split()
    n = [max(1, len(re.sub(r'[^a-z0-9]', '', w.lower().replace('@', 'at')))) for w in ws]
    cum = np.concatenate([[0], np.cumsum(n)]) / sum(n) * len(lt)
    out = []
    for i, w in enumerate(ws):
        i0, i1 = int(cum[i]), max(int(cum[i]), int(np.ceil(cum[i + 1])) - 1)
        out.append([w, lt[min(i0, len(lt) - 1)][0], lt[min(i1, len(lt) - 1)][1]])
    return out


LOCK = KIT / 'out' / 'gpu.lock'


def _done(here):
    """this episode already has narration newer than its voice.py (set FORCE=1 to redo it)"""
    n, s = here / 'out' / 'narration.wav', here / 'schedule.js'
    return (not os.environ.get('FORCE') and n.exists() and s.exists() and n.stat().st_mtime > (here / 'voice.py').stat().st_mtime
            and 'ESTIMATE' not in s.read_text(encoding='utf-8')[:200])


def build(here, lines, total_max=30.0):
    """lines: [{key, text (on screen), say (what the model reads), min (shortest scene, s), extra (air after the line, s),
    tempo (atempo on the take, e.g. 0.92 to slow a rushed line)}]
    One episode at a time holds the GPU (two models at once overflow an 8 GB card and crawl); a finished episode is skipped."""
    here = Path(here).resolve().parent
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    while True:
        if _done(here):
            print(f'{here.name}: narration already done, skipping (FORCE=1 to redo)'); return
        try:
            os.close(os.open(LOCK, os.O_CREAT | os.O_EXCL)); break
        except FileExistsError:
            if time.time() - LOCK.stat().st_mtime > 2400:      # a lock older than 40 min is left over from a crash
                LOCK.unlink(missing_ok=True)
            time.sleep(10)
    try:
        if _done(here):
            print(f'{here.name}: narration already done, skipping (FORCE=1 to redo)'); return
        _build(here, lines, total_max)
    finally:
        LOCK.unlink(missing_ok=True)


def _build(here, lines, total_max):
    out = here / 'out'
    out.mkdir(parents=True, exist_ok=True)
    takes, sr = _synth(lines)
    asr = _asr()
    picked = []
    for ln, row in zip(lines, takes):
        want = _norm(ln['say'])
        best = None
        for k, wav in enumerate(row):
            text, words = _hear(asr, wav, sr)
            acc = SequenceMatcher(None, want, _norm(text)).ratio()
            pace = len(wav) / sr / len(ln['text'].split())
            score = acc * 3 - abs(pace - 0.4)                     # right words first, then a natural pace (~0.4 s / word)
            print(f"  hear  {ln['key']:6s} take {k + 1}  acc {acc:.2f}  pace {pace:.2f}s/w  \"{text}\"", flush=True)
            if best is None or score > best[0]:
                best = (score, wav, text, words, acc)
        if best[4] < 0.85:
            print(f"  !! {ln['key']}: no clean take (best \"{best[2]}\"); run again or reword the line")
        picked.append(best)

    lens = []
    for ln, (_, wav, *_r) in zip(lines, picked):
        d = max(len(wav) / sr + GAP + ln.get('extra', 0), ln.get('min', 0))
        lens.append(np.ceil(d / BEAT) * BEAT)
    total = float(sum(lens))
    if total > total_max:
        raise SystemExit(f'narration needs {total:.2f}s, more than {total_max}s: shorten a line')

    track = np.zeros(int(total * sr) + sr, dtype=np.float32)
    sched, t0 = [], 0.0
    for ln, (_, wav, text, heard, acc), d in zip(lines, picked, lens):
        s = t0 + 0.1                                          # the voice starts a hair after the cut
        track[int(s * sr):int(s * sr) + len(wav)] += wav
        words = [[w, round(s + a, 3), round(s + b, 3)] for w, a, b in _word_times(ln['text'], heard, len(wav) / sr)]
        sched.append({'key': ln['key'], 'text': ln['text'], 'scene': round(t0, 3), 'end': round(t0 + d, 3), 'voice': round(s, 3),
                      'dur': round(len(wav) / sr, 3), 'heard': text, 'words': words})
        t0 += d
    track = track[:int(total * sr)]
    sf.write(out / 'narration.wav', track / (np.abs(track).max() + 1e-9) * 0.95, sr)
    (here / 'schedule.js').write_text('// written by voice.py: scene and word times (real seconds) of the narration in out/narration.wav\n'
                                      'export const SCHEDULE = ' + json.dumps(sched, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    pj = here / 'project.json'
    cfg = json.loads(pj.read_text(encoding='utf-8'))
    cfg['duration'] = total
    pj.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for s in sched:
        print(f"{s['key']:6s} scene {s['scene']:5.2f}-{s['end']:5.2f}  voice {s['voice']:5.2f}-{s['voice'] + s['dur']:5.2f}  {s['text']}")
    print(f'total {total:.2f}s -> project.json duration; wrote {out / "narration.wav"}')
