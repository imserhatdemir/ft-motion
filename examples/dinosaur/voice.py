"""examples/dinosaur: Turkish voice-over with Ahenk (https://github.com/ozguradmin/ahenk-turkish-tts): a LoRA on openbmb/VoxCPM2.
Run with a Python that has torch (CUDA), voxcpm and trnorm:   C:\vox\Scripts\python.exe examples/dinosaur/voice.py
Ahenk has ONE built-in voice (f022, a low, velvety female narrator), so every line is the same person by construction; there is no
reference clip. Each line gets an emotion instruction (calm, sad, empathetic ...) so it reads like a story. Writes ONE file,
out/narration.wav (30 s, mono): lines sit at fixed REAL seconds (project.json plays at speed 0.6, so scene time / 0.6).

Credit (CC BY 4.0, required): "Ahenk (https://github.com/ozguradmin/ahenk-turkish-tts), CC BY 4.0". The audio is AI-generated; say so when you post it."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from huggingface_hub import snapshot_download
from trnorm import normalize
from voxcpm import VoxCPM
from voxcpm.model.voxcpm import LoRAConfig

OUT = Path(__file__).resolve().parent / 'out'
OUT.mkdir(parents=True, exist_ok=True)
TOTAL = 30.0
SLOW = 0.92                                   # atempo on top of the model's own pace: a story, not a bulletin

# (start second in the final video, text, emotion, longest it may run). Impact is at 7.5 s, the %75 at 20.0 s, the bird at 22.5 s.
LINES = [
    (0.3, '66 milyon yıl önce, bu dünya dinozorlarındı.', 'calm', 3.9),
    (4.2, 'Sonra, gökyüzünde bir ışık belirdi.', 'calm', 3.5),
    (7.9, 'Her şey, saniyeler içinde değişti.', 'sad', 4.1),
    (12.3, 'Kül gökyüzünü kapladı.', 'sad', 2.8),
    (15.3, 'Bitkiler öldü. Besin zinciri çöktü.', 'sad', 4.3),
    (19.9, 'Türlerin dörtte üçü... yok oldu.', 'sad', 3.1),
    (23.1, 'Ama hepsi... gitmedi.', 'empathetic', 2.0),
    (25.4, 'Kuşlar, hayatta kalan dinozorlardır.', 'empathetic', 4.4),
]

repo = snapshot_download('ozgurguler/ahenk-tts-tr', allow_patterns=['lora_*', '*.py', 'instructions_tr.json'])
sys.path.insert(0, repo)
from instruction_pick import compose, pick   # noqa: E402  (reviewed: pure text/number helpers)
from pause_clean import clean                # noqa: E402

cfg = json.loads(Path(repo, 'lora_config.json').read_text(encoding='utf-8'))['lora_config']
tts = VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, lora_config=LoRAConfig(**cfg), lora_weights_path=repo)
SR = tts.tts_model.sample_rate
tmp = Path(tempfile.mkdtemp())


def tempo(wav, rate):
    src, dst = tmp / 'a.wav', tmp / 'b.wav'
    sf.write(src, wav, SR)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-filter:a', f'atempo={rate:.3f}', str(dst)], check=True)
    return sf.read(dst)[0]


def say(text, emotion):
    instruction, model_text, _ = pick(emotion, normalize(text), 'auto')
    wav = tts.generate(text=compose(instruction, model_text), cfg_value=2.0, inference_timesteps=16, normalize=False)
    return np.asarray(clean(wav, SR)[0], dtype=np.float32)


track = np.zeros(int(TOTAL * SR), dtype=np.float32)
for start, text, emotion, room in LINES:
    best = None
    for attempt in range(4):
        wav = tempo(say(text, emotion), SLOW)
        if best is None or len(wav) < len(best):
            best = wav
        if len(wav) / SR <= room:
            break
    wav = best
    if len(wav) / SR > room:   # last resort: squeeze it (at most 15 % faster) so two lines never overlap
        wav = tempo(wav, min(1.15, len(wav) / SR / (room * 0.97)))
    i = int(start * SR)
    assert not track[i:i + len(wav)].any(), f'line at {start}s overlaps the previous one: one voice at a time'
    track[i:i + len(wav)] += wav[:len(track) - i]
    print(f'{start:5.2f}s  {len(wav) / SR:.2f}s (window {room:.1f}s) [{emotion}] "{text}"' + ('   <- TOO LONG' if len(wav) / SR > room else ''), flush=True)

sf.write(OUT / 'narration.wav', track / (np.max(np.abs(track)) + 1e-9) * 0.95, SR)
print('wrote', OUT / 'narration.wav')
