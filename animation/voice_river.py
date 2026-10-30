"""animation/voice_river.py: Turkish voice-over for src/scenes/river.js with Ahenk (https://github.com/ozguradmin/ahenk-turkish-tts), a LoRA on openbmb/VoxCPM2.
Run with a Python that has torch (CUDA), voxcpm and trnorm:   C:\vox\Scripts\python.exe animation/voice_river.py
One built-in voice (f022), so every line is the same person. Each line carries its own acting instruction. The script
  1. generates every line and keeps a take whose pace is natural for its word count,
  2. lays the lines one after the other on a 30 s timeline (scene length = clip + air, snapped to an eighth note; the closing scene takes the slack),
  3. writes out/river_narration.wav (ONE file) and src/scenes/river_schedule.js (RSCHED: scene times and a start time for every word).
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
TOTAL, BEAT, GAP = 30.0, 0.25, 0.3

LINES = [
    ('summit', 'Her şey, dağın tepesine düşen bir damlayla başlar.', 'Mysterious and intriguing, like telling a story, soft and low.'),
    ('slope', 'Yağmur ve eriyen kar, yokuş aşağı akar.', 'Calm and flowing, gentle and clear.'),
    ('creek', 'Damlalar birleşir, minik bir dere olur.', 'Warm and curious, light and playful.'),
    ('valley', 'Dereler buluşur, güçlenir ve vadiyi oyar.', 'Building energy, confident and strong.'),
    ('river', 'Sonunda koca bir nehir olup denize ulaşır.', 'Wide and majestic, impressed, with wonder.'),
    ('sky', 'Sonra buharlaşıp yeniden yağmur olur.', 'Soft and thoughtful, voice fading gently at the end.'),
]
EXTRA = {'summit': 1.0, 'slope': 0.75, 'creek': 0.75, 'valley': 0.75, 'river': 1.5}   # air after the line, where the picture needs room

repo = snapshot_download('ozgurguler/ahenk-tts-tr', allow_patterns=['lora_*', '*.py', 'instructions_tr.json'])
sys.path.insert(0, repo)
from instruction_pick import compose, pick   # noqa: E402  (reviewed earlier: pure text helpers)
from pause_clean import clean                # noqa: E402

cfg = json.loads(Path(repo, 'lora_config.json').read_text(encoding='utf-8'))['lora_config']
tts = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, lora_config=LoRAConfig(**cfg), lora_weights_path=repo)
SR = tts.tts_model.sample_rate


def trim(wav):
    k = int(0.01 * SR)
    env = np.convolve(np.abs(wav), np.ones(k) / k, mode='same')
    idx = np.where(env > 0.02 * env.max())[0]
    return wav[max(0, idx[0] - int(0.06 * SR)):min(len(wav), idx[-1] + int(0.1 * SR))]


def say(text, emotion):
    instruction, model_text, _ = pick(emotion, normalize(text), 'auto')
    wav = tts.generate(text=compose(instruction, model_text), cfg_value=2.0, inference_timesteps=16, normalize=False)
    return trim(np.asarray(clean(wav, SR)[0], dtype=np.float32))


clips = []
for key, text, emo in LINES:
    words = len(text.split())
    wav = say(text, emo)
    for _ in range(3):   # a clip that is slow or rushed for its word count gets another try
        if 0.4 <= len(wav) / SR / words <= 0.62:
            break
        wav = min((wav, say(text, emo)), key=lambda w: abs(len(w) / SR / words - 0.5))
    clips.append(wav)
    print(f'{key:7s} {len(wav) / SR:.2f}s  {words} words  "{text}"', flush=True)

lens = [np.ceil((len(c) / SR + GAP) / BEAT) * BEAT for c in clips]
if sum(lens) > TOTAL - 2.0:
    raise SystemExit(f'narration is {sum(lens):.1f}s: too long for {TOTAL}s with a closing scene, shorten a line and run again')
slack = TOTAL - sum(lens) - 2.0
k = min(1.0, max(0.0, slack) / sum(EXTRA.values()))
lens = [ln + EXTRA.get(key, 0) * k for (key, _, _), ln in zip(LINES, lens)]
lens = [np.round(ln / BEAT) * BEAT for ln in lens]
lens[-1] += TOTAL - sum(lens)
print('scene lengths', [float(x) for x in lens], 'sum', float(sum(lens)))

track = np.zeros(int(TOTAL * SR), dtype=np.float32)
sched, t0 = [], 0.0
for (key, text, emo), clip, ln in zip(LINES, clips, lens):
    s = t0 + 0.12
    track[int(s * SR):int(s * SR) + len(clip)] += clip
    ws = text.split()
    w = np.array([len(re.sub(r'\W', '', x)) + 1.5 for x in ws], dtype=float)
    cum = np.concatenate([[0], np.cumsum(w)]) / w.sum() * (len(clip) / SR)
    sched.append({'key': key, 'text': text, 'scene': round(t0, 3), 'end': round(t0 + ln, 3), 'voice': round(s, 3), 'dur': round(len(clip) / SR, 3),
                  'words': [[x, round(s + float(cum[i]), 3), round(s + float(cum[i + 1]), 3)] for i, x in enumerate(ws)]})
    t0 += ln

sf.write(OUT / 'river_narration.wav', track / (np.max(np.abs(track)) + 1e-9) * 0.95, SR)
(HERE / 'src' / 'scenes' / 'river_schedule.js').write_text('// written by animation/voice_river.py: when each narration line starts and when each word is spoken (seconds)\nconst RSCHED = '
                                                          + json.dumps(sched, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
for s in sched:
    print(f"{s['key']:7s} scene {s['scene']:5.2f}-{s['end']:5.2f}  voice {s['voice']:5.2f}-{s['voice'] + s['dur']:5.2f}")
print('wrote', OUT / 'river_narration.wav')
