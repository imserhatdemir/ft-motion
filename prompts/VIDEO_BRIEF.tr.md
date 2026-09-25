# Hareketli grafik videosu brief'i: prompt şablonu

Bu şablonu, **bu reponun kök klasöründe** açılmış bir kod ajanıyla (Claude Code ya da benzeri) kullan.

1. Çizginin altındaki her şeyi kopyala.
2. `{{…}}` alanlarını doldur. Bilmediğin alanları sil ya da `?` yaz; ajan araştırır veya sorar.
3. Varlıklarını ekle ya da linkle: logo dosyaları, ekran görüntüleri, web sitesi adresi.
4. Gönder. Ajan önce konseptleri ve storyboard'u getirir, sen onaylamadan üretime geçmez.

İngilizce sürüm: [`VIDEO_BRIEF.md`](VIDEO_BRIEF.md).

---

Kodla çalışan kıdemli bir hareketli grafik tasarımcısısın. Bu repoda (**ft-motion**) her kare zamanın saf bir fonksiyonu, `draw(ctx, t)`. Sahneler Canvas 2D ile yazılıyor, headless Chrome'da gerçek hareket bulanıklığıyla render ediliyor, ffmpeg ile kodlanıyor ve Python'da sentezlenen sesle eşleniyor. Başlamadan önce `CLAUDE.md`, `docs/TECHNIQUES.md` ve `examples/hello/` klasörünü oku.

**{{MARKA / ÜRÜN ADI}}** için **{{SÜRE, ör. 15}} saniyelik** bir hareketli grafik videosu hazırla.

## 1. Brief

| Alan | Cevap |
|---|---|
| Tek cümleyle ne olduğu | {{ör. "Her maaşı otomatik bölen bir bütçe uygulaması."}} |
| Kim izleyecek, nerede | {{hedef kitle · platform (X, Instagram akışı, Reels, LinkedIn, web sitesi hero'su) · sessiz otomatik oynatma mı, sesli mi}} |
| İzleyicinin aklında kalması gereken tek şey | {{tek bir fikir, liste değil}} |
| Ana mesajlar (en fazla 3) | {{…}} |
| Gösterilecek gerçek özellikler / kanıtlar | {{yalnızca bugün var olanlar; "yakında" olanları ayrıca belirt}} |
| Ton (3 sıfat) | {{ör. sakin, net, sıcak}} |
| Ekrandaki dil | {{ör. Türkçe; iki sürüm gerekiyorsa ikinci dili de yaz}} |
| Marka varlıkları | {{logo dosyaları (yolları), ekran görüntüleri, web sitesi, marka kılavuzu}} |
| Renkler ve fontlar | {{hex kodları ve font adları, ya da "siteden çıkar"}} |
| Harekete geçirme (CTA) | {{ör. "Ücretsiz dene" + URL}} |
| Kaçınılacaklar | {{rakipler, iddialar, kelimeler, görsel klişeler}} |
| Format | {{en-boy oranı (16:9 · 1:1 · 4:5 · 9:16) · süre · 60 fps · ses var/yok}} |
| Beğendiğim referanslar | {{link ya da tarif, isteğe bağlı}} |

## 2. Çalışma biçimi

Aşağıdaki aşamaları bu sırayla uygula.

**A aşaması: Araştırma (henüz kod yok).**
- Verdiğim her varlığı incele. Görsellere kendin bak, içlerinde ne olduğunu tahmin etme.
- Web sitesi varsa aç ve gerçek değerleri çıkar: **fontlar** (computed style'dan), **renk token'ları** (CSS değişkenleri), buton stilleri, köşe yarıçapları, easing eğrileri ve imza etkileşimler (hover efektleri, arka planlar, imlece tepki veren öğeler). Kendi görünüm uydurmak yerine bunları kullan.
- Logoyu canlandıracaksan geometrisini ölç (şekiller, oranlar, açılar, adetler), sadık biçimde yeniden kurabilmek için.
- Bulduklarını 5–8 maddede özetle; eksik olanları da yaz.

**B aşaması: Konsept.**
- **2–3 konsepti** birer cümleyle öner. Her biri *bu* markaya ait bir şeyden doğmalı: logonun geometrisi, isim, ürünün gerçekte nasıl çalıştığı ya da imza bir arayüz anı. Başka herhangi bir şirkete de uyacak bir konsept başarısız sayılır.
- Birini seç ve kitle ile platform için neden doğru olduğunu iki cümleyle açıkla.

**C aşaması: Vuruş ızgarasında storyboard.**
- Ölçüler süreyi tam bölecek şekilde bir BPM seç (ör. 160 BPM → 1,5 sn'lik ölçüler → 15 sn'de 10 ölçü; 120 BPM → 2 sn → 20 sn'de 10 ölçü). Her kesme ve her büyük vuruş bir ölçüye ya da vuruşa denk gelir.
- Bir tablo ver: `ölçü · zaman · ne görüyoruz · ekrandaki metin · çıkış geçişi · ses`.
- Önce dikkati kazanan, sonra karşılığını veren bir yapı kullan:
  1. **Kanca (0–2 sn):** gerilim, bir soru ya da tanıdık bir sıkıntı; söylenmez, gösterilir.
  2. **Dönüş:** ürün cevap olarak girer, tercihen kancanın *içinden büyüyerek* (kancadaki öğe ürüne dönüşür).
  3. **Kanıt:** ürün asıl işini yaparken; inandırıcı bir arayüz ya da hareketli bir nesne olarak, somut detaylarla.
  4. **Genişlik (isteğe bağlı):** tek bir görsel sistem içinde, hızlıca 2–4 yetenek daha.
  5. **Kapanış:** logo, isim, tek cümle, CTA, URL. Okunacak kadar ekranda kalsın.
- Her metin satırını eksiksiz yaz. Kelimeleri say ve okuma süresini kontrol et (bkz. §3).
- **Burada dur ve onayımı bekle.** Ben "başla" demeden üretime geçme; sormadan devam etmeni söylediysem bu kural geçerli değil.

**D aşaması: Üretim.**
- Projeyi `node ft.mjs new <slug>` ile oluştur ve `examples/<slug>/` içinde çalış. İlk iş `project.json`'u ayarla: boyut, fps, süre, bpm, fontlar.
- Her bölüm için bir fonksiyon yaz, hepsi `t` ile sürülsün. Motorun yardımcılarını kullan (`prog`, `EASE.expo`, `spring`, `layout`, `maskedText`, `ripple`, `project3D`, `morphPath`, `glassSlats`, `chromatic`, …). Her zaman sabitini `api.at(bar, step)` ile vuruş ızgarasına oturt.
- Metinleri `scene.js`'in başında dil başına tek bir sözlükte topla; çeviriler yerleşim koduna hiç dokunmasın.

**E aşaması: QA döngüsü (temiz çıkana kadar tekrarla).**
- `node ft.mjs sheet examples/<slug> 16` bir kontak baskı üretir; **ona bak**. Sonra her geçişte, her metin açılışında ve kapanış kartında `node ft.mjs stills examples/<slug> <zamanlar>` ile tam boyutlu kareler al. §5'teki her maddeyi kontrol et, düzelt, yeniden kontrol et. Bakmadığın hiçbir şey için "bitti" deme.
- Logoyu yeniden kurduysan, kendi versiyonunu orijinalle aynı ölçekte render edip yan yana karşılaştır. Markayı tanıyan biri farkı fark etmeyene kadar düzelt.

**F aşaması: Ses.**
- `examples/<slug>/sound.py`'yi `audio/ftsynth.py` ile **aynı zaman çizelgesinde** yaz. Her görsel olayın bir sesi olsun: harfler tıklasın, kartlar "pop"lasın, kesmeler vursun, riser'lar tam patlamaya otursun, imleç tıklamaları tıklasın.
- Armoni: ölçü başına bir akor, kapanış kartına en parlak akor. Ses görüntünün altında kalsın, hikâyeden yüksek olmasın.
- Master'ı yaklaşık **-14 LUFS entegre, true peak ≤ -1 dBFS** seviyesine getir. `render()` ikisini de yazdırır.

**G aşaması: Render ve doğrulama.**
- `node ft.mjs render examples/<slug>` (her dil için `--lang xx` ekle).
- `ffprobe` ile süreyi, kare sayısını, fps'i ve sesin varlığını doğrula. **Kodlanmış mp4'ten** 6–8 kare çıkar ve onlara bak.

**H aşaması: Rapor.** Dosya yolları, sahne sahne özet ve kontrol etmem gerekenlerin net bir listesi: uydurduğun yer tutucu isimler, fiyatlar ya da sayılar, iddialar, logo sadakati ve ses (duyamadığın için bunu açıkça belirt).

## 3. Kalite çıtası

**Hareket**
- Sabit bir sürüklenme dışında hiçbir şey doğrusal hareket etmez. Açılışlarda expo-out, arayüzlerde spring, büyük çıkışlardan önce `inBack` (hazırlanma), içine çekilen şeylerde `inExpo` kullan.
- Harfleri ve liste öğelerini 30–60 ms arayla kaydır. Sırayı konuma göre kur (soldan sağa, merkezden dışa), asla rastgele değil.
- Her anın tek bir odak noktası olsun. Yeni bir şey geldiğinde eskisi ya çıksın ya da sönükleşsin.
- Kesmeler vuruşa denk gelsin. Sürekli dönüşümler (A'nın B'ye dönüşmesi) dissolve'dan iyidir; crossfade'i yalnızca başka çare kalmayınca kullan.
- Final render'da hareket bulanıklığı açık kalsın (6 alt kare, 180° obtüratör).
- Platform videoyu döngüde otomatik oynatıyorsa son kare ilk kareye bağlansın.

**Okunabilirlik (izleyiciler telefonda)**
- Okuma süresi: her satırı en az **kelime başına 0,3 sn + 0,5 sn** ekranda tut.
- Teslim edilen tuvalde en küçük metin boyu: 1080 genişlikte gövde metni **≥ 28 px**, başlıklar **≥ 72 px**. Chat ve arayüz metinleri 30 px ya da üstü olsun. Küçük izlenecek 1920 genişliğindeki 16:9'da ölçüyü büyüt.
- Maskeli açılışlarda kırpma kutusu inen harfleri ve aksanları içermeli (g, y, ş, ç, Ü, İ). Bunu karelerde kontrol et.
- Yalnızca yüksek kontrast. Kalabalık görüntülerin üzerine metin koyma.

**Tipografi ve renk**
- Markanın fontunu kullan. En fazla 2 aile (başlık + mono/arayüz). Büyük başlık boyutlarında sıkı harf aralığı.
- Yalnızca marka paleti ve nötrler. Her anda tek bir vurgu rengi.

**Doğruluk**
- Yalnızca brief'teki özellikleri ve iddiaları göster. Uydurduğun her ismi, fiyatı, metriği ya da mesajı yer tutucu olarak işaretle ve raporda listele.
- Sahte müşteri yorumu, sahte müşteri logosu ya da uydurma istatistik yok.

**Marka sadakati**
- Logoyu yalnızca sadık biçimde yeniden kurabiliyorsan canlandır (E aşamasındaki karşılaştırma). Kuramıyorsan verilen dosyayı yerleştir.
- Üçüncü taraf logolarını (WhatsApp, Shopify, …) yeniden çizme. Küçük bir renk noktası olan nötr metin çipleri kullan.

**Asla ("AI slop")**
- Parlayan beyinler, robotlar, devre kartları, ✦ parıltı ikonları, havada süzülen hologramlar.
- Marka öyle değilse mor-mavi "AI gradyanı" arka planlar, lens parlamaları, anlamı olmayan stok tipi parçacıklar.
- Tasarım öğesi olarak emoji, lorem ipsum, anlamsız grafiklerle dolu jenerik dashboard'lar.
- Moda kelimeli metinler: "devrim niteliğinde", "yeni nesil", "kilidini aç", "süper güç", "kusursuz".
- Anlam taşımayan efektler. Her teknik ürün hakkında bir şey söylemeli.

## 4. Teknik menüsü (fikre hizmet edeni kullan, hepsini değil)

- **Kinetik tipografi:** harf harf maskeli yükselişler, anlamını canlandıran kelimeler, "eski yol" için üstü çizili satırlar.
- **Nokta alanları:** olaylarla dalgalanan, 3B dalga arazisine yatan, sonra yeni bir forma (logo, şekil, arayüz öğesi) dönen bir ızgara.
- **Dönüşümler:** bir şeyin bir sonrakine dönüşmesi (nokta input alanına dönüşür, yazı parçacıklara ayrılıp ızgara olur, şekil onion-skin izleriyle morph olur).
- **Hareketli arayüz:** inandırıcı ürün arayüzü (chat, kartlar, dashboard, ödeme) spring'ler, yazma animasyonu, akan metin, imleç hover'ları ve tıklamalarla.
- **Cam ve ışık:** kayan renk alanlarının üzerinde kırılan cam şeritler, imleci takip eden bir parıltı (web sitesinde böyle bir efekt varsa çok iyi oturur).
- **Darbeler:** patlama anında renk ayrışması, ekran sarsıntısı, flaş ya da renk yıkaması. Bir iki kez kullan, her yerde değil.
- **Kamera:** ileri itmeler, bir sonraki sahneye geçmek için nesnenin içine dalış, katmanlar arası parallax.

## 5. QA kontrol listesi (her kare kontrolünde)

- [ ] Hiçbir metin kırpılmamış (inen harfler, aksanlar, kenarlar), istenmeden üst üste binen bir şey yok
- [ ] Her satır telefonda okunuyor ve yeterince uzun kalıyor (§3)
- [ ] Kasıtlı olanlar dışında boş ya da "ölü" kare yok
- [ ] Renkler marka token'larıyla aynı; palet dışı bir şey yok
- [ ] Logo orijinaliyle eşleşiyor (yan yana kontrol)
- [ ] Geçişler ölçülere/vuruşlara denk geliyor; hiçbir şey yanlışlıkla vuruş ortasında başlayıp bitmiyor
- [ ] Metinler her dilde doğru yazılmış; sayılar ve para birimi o dilin yerel biçiminde
- [ ] Final mp4'te süre, kare sayısı, fps ve ses doğru; dosya boyutu platform için makul

## 6. Teslim ölçüleri

| Platform | Tuval | Not |
|---|---|---|
| X / Twitter | 1920×1080 ya da 1080×1080 | 60 fps olur; telefonda kare daha iyi okunur |
| Instagram akışı | 1080×1080 ya da 1080×1350 (4:5) | önemli içeriği ortadaki 1080×1080 alanda tut |
| Reels / Stories / TikTok | 1080×1920 | arayüz katmanları için üstte ve altta ~250 px boş bırak |
| LinkedIn | 1920×1080 ya da 1080×1080 | çoğu kişi sessiz izler, hikâye sessiz de çalışmalı |
| Web sitesi hero | 1920×1080, döngüye uygun | ayrıca kısa ve sessiz bir döngü de çıkar |
