"""examples/earthquake: Turkish voice-over with Ahenk (https://github.com/ozguradmin/ahenk-turkish-tts), a LoRA on openbmb/VoxCPM2.
Run with a Python that has torch (CUDA), voxcpm and trnorm:   C:\vox\Scripts\python.exe examples/earthquake/voice.py
One built-in voice (f022), so every line is the same person. The script does three things:
  1. generates every line (with an emotion instruction) and keeps the first take that is clean and not too long,
  2. lays the lines on the 30 s timeline, one after the other with a beat-aligned gap, and writes out/narration.wav (one file),
  3. writes schedule.js (when each line / scene starts, and a start time for every word) that scene.js and sound.py import.
Credit (CC BY 4.0, required): "Ahenk (https://github.com/ozguradmin/ahenk-turkish-tts), CC BY 4.0". The audio is AI-generated; say so when you post it."""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from huggingface_hub import snapshot_download
from trnorm import normalize
from voxcpm import VoxCPM
from voxcpm.model.voxcpm import LoRAConfig

HERE = Path(__file__).resolve().parent
OUT = HERE / 'out'
OUT.mkdir(parents=True, exist_ok=True)
TOTAL, BEAT = 30.0, 0.25

# (key, text, instruction). The key names the scene the line belongs to. The sentences are whole, natural Turkish (subject first, verb last)
# and each carries its own acting instruction, so the delivery changes with the story: curious, uneasy, sudden, excited, serious, soft.
LINES = [
    ('hook', 'Yer sağlam görünür, ama altında dev levhalar kayar.', 'Mysterious and intriguing, like telling a story, soft and low.'),
    ('strain', 'Levhalar sürtünür, gerilim yıllarca birikir.', 'Tense and uneasy, with slowly building worry.'),
    ('rupture', 'Bir gün kaya dayanamaz ve kırılır.', 'Sudden and dramatic, strong emphasis, voice rising on the last word.'),
    ('waves', 'Enerji dalgalar hâlinde her yöne yayılır.', 'Excited and flowing, full of energy.'),
    ('seismo', 'Sismograf bu titreşimi kaydeder.', 'Curious and focused, calm and clear.'),
    ('mag', 'Büyüklük bir artınca, enerji otuz iki kat büyür.', 'Impressed and emphatic, stressing the numbers.'),
    ('turkey', 'Türkiye de, aktif fay hatlarının üzerinde.', 'Serious and sincere, steady and warm.'),
    ('end', 'Yer sessiz görünür, ama hiç durmaz.', 'Soft and thoughtful, voice fading gently at the end.'),
]

repo = snapshot_download('ozgurguler/ahenk-tts-tr', allow_patterns=['lora_*', '*.py', 'instructions_tr.json'])
sys.path.insert(0, repo)
from instruction_pick import compose, pick   # noqa: E402  (reviewed: pure text helpers)
from pause_clean import clean                # noqa: E402

cfg = json.loads(Path(repo, 'lora_config.json').read_text(encoding='utf-8'))['lora_config']
tts = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, lora_config=LoRAConfig(**cfg), lora_weights_path=repo)
SR = tts.tts_model.sample_rate


def trim(wav):
    """cut leading/trailing silence, keep 60 ms of air"""
    env = np.abs(wav)
    k = int(0.01 * SR)
    env = np.convolve(env, np.ones(k) / k, mode='same')
    idx = np.where(env > 0.02 * env.max())[0]
    a, b = max(0, idx[0] - int(0.06 * SR)), min(len(wav), idx[-1] + int(0.1 * SR))
    return wav[a:b]


def say(text, emotion):
    instruction, model_text, _ = pick(emotion, normalize(text), 'auto')
    wav = tts.generate(text=compose(instruction, model_text), cfg_value=2.0, inference_timesteps=16, normalize=False)
    return trim(np.asarray(clean(wav, SR)[0], dtype=np.float32))


clips = []
for key, text, emo in LINES:
    words = len(text.split())
    wav = say(text, emo)
    for _ in range(2):   # a clip that is slow or rushed for its word count gets one more try
        pace = len(wav) / SR / words
        if 0.38 <= pace <= 0.62:
            break
        wav = min((wav, say(text, emo)), key=lambda w: abs(len(w) / SR / words - 0.5))
    clips.append(wav)
    print(f'{key:8s} {len(wav) / SR:.2f}s  {words} words  "{text}"', flush=True)

# scene lengths: clip + 0.3 s of air, snapped up to an eighth note (0.25 s); the last scene takes whatever is left (min 2 s)
GAP = 0.3
lens = [np.ceil((len(c) / SR + GAP) / BEAT) * BEAT for c in clips]
over = sum(lens) - TOTAL
print(f'sum of scenes {sum(lens):.1f}s (limit {TOTAL}s)')
if over > 0:  # (extras are added after this check)
    raise SystemExit(f'narration is {over:.1f}s too long: shorten a line or two, then run again')
EXTRA = {'hook': 0.5, 'strain': 1.0, 'rupture': 0.75, 'waves': 0.5, 'seismo': 0.5, 'turkey': 0.5}   # air after the line, where the picture needs room
slack = TOTAL - sum(lens)
k = min(1.0, max(0.0, slack - 0.25) / sum(EXTRA.values()))                       # shrink the extras if the takes came out long
lens = [ln + EXTRA.get(key, 0) * k for (key, _, _), ln in zip(LINES, lens)]
lens = [np.round(ln / BEAT) * BEAT for ln in lens]                                # keep every cut on an eighth note
lens[-1] += TOTAL - sum(lens)

track = np.zeros(int(TOTAL * SR), dtype=np.float32)
sched, t0 = [], 0.0
for (key, text, emo), clip, ln in zip(LINES, clips, lens):
    s = t0 + 0.12                                    # the voice starts a hair after the scene does
    track[int(s * SR):int(s * SR) + len(clip)] += clip
    # word starts: proportional to letters, which is close enough for karaoke captions
    ws = text.split()
    w = np.array([len(re.sub(r'\W', '', x)) + 1.5 for x in ws], dtype=float)
    cum = np.concatenate([[0], np.cumsum(w)]) / w.sum() * (len(clip) / SR)
    sched.append({'key': key, 'text': text, 'scene': round(t0, 3), 'end': round(t0 + ln, 3), 'voice': round(s, 3), 'dur': round(len(clip) / SR, 3),
                  'words': [[x, round(s + float(cum[i]), 3), round(s + float(cum[i + 1]), 3)] for i, x in enumerate(ws)]})
    t0 += ln

sf.write(OUT / 'narration.wav', track / (np.max(np.abs(track)) + 1e-9) * 0.95, SR)
(HERE / 'schedule.js').write_text('// written by voice.py: when every line and scene starts, and when each word is spoken (real seconds)\nexport const SCHEDULE = '
                                  + json.dumps(sched, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
for s in sched:
    print(f"{s['key']:8s} scene {s['scene']:5.2f}-{s['end']:5.2f}  voice {s['voice']:5.2f}-{s['voice'] + s['dur']:5.2f}")
print('wrote', OUT / 'narration.wav')
