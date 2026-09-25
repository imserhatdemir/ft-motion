# ft-motion

**Zamanın saf bir fonksiyonu olarak hareketli grafik.** Sahneleri düz Canvas 2D ile `draw(ctx, t)` olarak yazıyorsun. Headless Chrome'da gerçek hareket bulanıklığıyla render ediliyor, ffmpeg ile kodlanıyor ve aynı vuruş ızgarasında Python'la sentezlenen sesle eşleniyor. Timeline editörü, keyframe ya da eklenti yok. Bu yüzden kod ajanlarıyla çok iyi çalışıyor: videoyu tarif edersin, storyboard'u onaylarsın, mp4'ü alırsın.

![examples/hello kontak baskısı](docs/preview.jpg)

[English README](README.md)

## Neden

- **Deterministik.** Her kare yalnızca `t`'ye bağlı. Herhangi bir kareyi tek başına render edip inceleyebilir ve düzeltebilirsin.
- **Gerçek hareket bulanıklığı.** Her çıktı karesi 180° obtüratörle 6 alt karenin ortalaması; sert kesmeler yine sert kalıyor.
- **Görüntüye kilitli ses.** `audio/ftsynth.py` davulları, pad'leri, arayüz seslerini, whoosh'ları ve riser'ları aynı saatle üretiyor. Riser'lar tam patlama anına oturuyor, master -14 LUFS hedefliyor.
- **Ajanlar için tasarlandı.** [`prompts/VIDEO_BRIEF.tr.md`](prompts/VIDEO_BRIEF.tr.md), brief'ten teslime kadar eksiksiz bir prompt: araştırma → konsept → vuruş ızgarasında storyboard → üretim → görsel QA → ses → render. [`CLAUDE.md`](CLAUDE.md) ajanlar için çalışma kurallarını içeriyor.

## Gereksinimler

- Node.js 18+
- `numpy` ve `scipy` kurulu Python 3.10+ (`pip install -r requirements.txt`)
- `PATH` üzerinde ffmpeg
- Google Chrome, Chromium ya da Microsoft Edge (otomatik bulunur; bulunamazsa `CHROME_PATH` ile belirt)

## Hızlı başlangıç

```bash
npm install
pip install -r requirements.txt

node ft.mjs preview examples/hello        # tarayıcıda canlı önizleme
node ft.mjs sheet examples/hello 12       # kontak baskı → examples/hello/out/sheet.png
python examples/hello/sound.py            # ses → examples/hello/out/audio.wav
node ft.mjs render examples/hello         # → examples/hello/out/hello.mp4
```

Kendi projeni başlat:

```bash
node ft.mjs new lansman-teaser
node ft.mjs preview examples/lansman-teaser
```

## Bir ajanla video üret

1. Repoyu Claude Code'da (ya da başka bir kod ajanında) aç.
2. [`prompts/VIDEO_BRIEF.tr.md`](prompts/VIDEO_BRIEF.tr.md) içeriğini yapıştır, brief'i doldur; logonu, ekran görüntülerini ve web sitesi adresini ekle.
3. Bir konsept seç ve storyboard'u onayla. Ajan üretir, kendi karelerini kontrol eder, sesi yazar ve render eder.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `node ft.mjs new <ad>` | `examples/<ad>` klasörünü oluşturur |
| `node ft.mjs preview <proje>` | canlı oynatıcı: boşluk oynat/durdur, ←/→ kare, shift+←/→ saniye, `b` hareket bulanıklığı |
| `node ft.mjs stills <proje> 0,90,2.5s` | istenen karelerde ya da saniyelerde tam boyutlu PNG |
| `node ft.mjs sheet <proje> [n]` | eşit aralıklı `n` kareyi `out/sheet.png` dosyasında birleştirir |
| `node ft.mjs render <proje>` | mp4 üretir (varsa `out/audio.wav` sesini ekler) |

Seçenekler: `--lang xx` (sahneye `api.lang` olarak geçer), `--sub N` (alt kare sayısı), `--crf N`, `--out ad.mp4`.

`project.json` içinde `bpm` ızgarayı belirler: `api.at(ölçü, adım)` sahne zamanını verir. `speed` ise bütün koreografiyi esnetir; `0.75` değeri 15 saniyelik bir kurguyu 20 saniyeye çıkarır ve ses de buna uyar.

Teknik tarifler için [`docs/TECHNIQUES.md`](docs/TECHNIQUES.md) dosyasına bak.

## Lisans

MIT ([LICENSE](LICENSE)). Fontlar kendi lisanslarıyla dağıtılır (Inter ve JetBrains Mono: SIL Open Font License).
