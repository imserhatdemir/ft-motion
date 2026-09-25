# Motion video brief — prompt template

Use this with a coding agent (Claude Code or similar) opened **in the root of this repository**.

1. Copy everything below the line.
2. Fill in the `{{…}}` fields. Anything you don't know, delete or write `?`. The agent will research it or ask.
3. Attach or link your assets: logo files, screenshots, the website URL.
4. Send it. The agent comes back with concepts and a storyboard first, and only builds after you approve.

A Turkish version lives in [`VIDEO_BRIEF.tr.md`](VIDEO_BRIEF.tr.md).

---

You are a senior motion designer who works entirely in code. In this repository (**ft-motion**) every frame is a pure function of time, `draw(ctx, t)`. Scenes are Canvas 2D, rendered in headless Chrome with real motion blur, encoded with ffmpeg, and scored with sound synthesized in Python. Read `CLAUDE.md`, `docs/TECHNIQUES.md` and `examples/hello/` before you start.

Make a **{{DURATION, e.g. 15}}-second** motion graphics video for **{{BRAND / PRODUCT NAME}}**.

## 1. The brief

| Field | Answer |
|---|---|
| What it is, in one sentence | {{e.g. "A budgeting app that splits every paycheck automatically."}} |
| Who watches, and where | {{audience · platform (X, Instagram feed, Reels, LinkedIn, website hero) · autoplay muted or with sound}} |
| The one thing viewers must remember | {{a single idea, not a list}} |
| Key messages (max 3) | {{…}} |
| Real features / proof to show | {{only things that exist today; say which are "coming soon"}} |
| Tone (3 adjectives) | {{e.g. calm, precise, warm}} |
| On-screen language | {{e.g. English; add a second language if you need two versions}} |
| Brand assets | {{logo files (paths), screenshots, website URL, brand guide}} |
| Colours & fonts | {{hex codes and font names, or "extract from the website"}} |
| Call to action | {{e.g. "Start free trial" + URL}} |
| Must avoid | {{competitors, claims, words, visual clichés}} |
| Format | {{aspect ratio (16:9 · 1:1 · 4:5 · 9:16) · duration · 60 fps · sound yes/no}} |
| References I like | {{links or descriptions, optional}} |

## 2. How to work

Work in these phases, in this order.

**Phase A: Research (no code yet).**
- Read every asset I gave you. Look at images yourself; don't guess what's in them.
- If there's a website, open it and pull the real **fonts** (from computed styles), **colour tokens** (CSS variables), button styles, corner radii, easing curves and any signature interaction (hover effects, backgrounds, cursor-reactive elements). Use these instead of inventing a look.
- If the logo will be animated, measure its geometry (shapes, proportions, angles, counts) so you can rebuild it faithfully.
- Summarise what you found in 5–8 bullets, including anything missing.

**Phase B: Concept.**
- Propose **2–3 concepts**, each in a single line. Each must come from something that belongs to *this* brand: the logo's geometry, the name, how the product actually works, or a signature UI moment. A concept that would fit any other company is a failed concept.
- Pick one and explain in two sentences why it's right for the audience and the platform.

**Phase C: Storyboard on a beat grid.**
- Choose a BPM so that bars divide the duration evenly (e.g. 160 BPM → 1.5 s bars → 10 bars in 15 s; 120 BPM → 2 s bars → 10 bars in 20 s). Every cut and every major hit lands on a bar or a beat.
- Give me a table: `bar · time · what we see · on-screen copy · transition out · sound`.
- Use a shape that earns attention and then pays it off:
  1. **Hook (0–2 s):** tension, a question, or a familiar pain, shown rather than said.
  2. **Turn:** the product enters as the answer, ideally *growing out of* the hook (the thing from the hook becomes the product).
  3. **Proof:** the product doing its real job, as a believable UI or object in motion, with concrete details.
  4. **Breadth (optional):** 2–4 more capabilities, fast, in one visual system.
  5. **Lockup:** logo, name, one line, CTA, URL. Hold it long enough to read.
- Write every line of copy out in full. Count words and check the reading time (see §3).
- **Stop here and wait for my approval.** Don't build until I say go, unless I've told you to go ahead without asking.

**Phase D: Build.**
- Create the project with `node ft.mjs new <slug>` and work in `examples/<slug>/`. Set `project.json` first: size, fps, duration, bpm, fonts.
- One function per section, all driven by `t`, using the engine's helpers (`prog`, `EASE.expo`, `spring`, `layout`, `maskedText`, `ripple`, `project3D`, `morphPath`, `glassSlats`, `chromatic`, …). Put every time constant on the beat grid, using `api.at(bar, step)`.
- Put copy in one dictionary per language at the top of `scene.js`, so translations never touch layout code.

**Phase E: QA loop (repeat until clean).**
- `node ft.mjs sheet examples/<slug> 16` gives you a contact sheet. **Look at it.** Then `node ft.mjs stills examples/<slug> <times>` gives full-size frames at every transition, every text reveal and the lockup. Check each item in §5. Fix and re-check. Don't declare anything done that you haven't looked at.
- If you rebuilt the logo, render your version next to the original at the same scale and compare them side by side. Iterate until someone who knows the brand wouldn't notice.

**Phase F: Sound.**
- Write `examples/<slug>/sound.py` with `audio/ftsynth.py` on the **same timeline**. Every visual event gets a sound: letters tick, cards pop, cuts hit, risers land exactly on the drop, cursor clicks click.
- Harmony: one chord per bar. The lockup gets the brightest chord. Keep it under the picture, never louder than the story.
- Master to about **-14 LUFS integrated, true peak ≤ -1 dBFS**. `render()` prints both.

**Phase G: Render and verify.**
- `node ft.mjs render examples/<slug>` (add `--lang xx` for each language).
- Verify with `ffprobe`: duration, frame count, fps, audio present. Pull 6–8 frames from the **encoded mp4** and look at them.

**Phase H: Report.** File paths, a scene-by-scene summary, and a clear list of anything I must check: placeholder names, prices or numbers you invented, claims, logo fidelity, and the sound (you can't hear it, so say so).

## 3. Quality bar

**Motion**
- Nothing moves linearly except constant drift. Use expo-out for reveals, springs for UI, `inBack` (anticipation) before big exits, `inExpo` for things being sucked away.
- Stagger letters and list items by 30–60 ms. Stagger by position (left→right, centre→out), never randomly.
- Give each moment one focal point. When something new arrives, the old thing leaves or dims.
- Cuts land on the beat. Continuous transformations (A becomes B) beat dissolves; use a crossfade only when nothing else works.
- Keep motion blur on for the final render (6 subframes, 180° shutter).
- If the platform autoplays in a loop, make the last frame lead back into the first.

**Legibility (people watch on phones)**
- Reading time: hold any line for at least **0.3 s per word + 0.5 s**.
- Minimum text height on the delivered canvas: body **≥ 28 px at 1080 wide**, headlines **≥ 72 px**. Chat or UI text should be 30 px or more. Scale up for 1920-wide 16:9 when it will be seen small.
- Masked reveals: the clip box must include descenders and diacritics (g, y, ş, ç, Ü, İ). Check them in stills.
- High contrast only. No text over busy imagery.

**Typography and colour**
- Use the brand's font. At most 2 families (display + mono/UI). Tight tracking on large display sizes.
- Use only the brand palette plus neutrals. One accent per moment.

**Truth**
- Show only features and claims that are in the brief. Mark every invented name, price, metric or message as a placeholder and list it in your report.
- No fake testimonials, fake logos of customers, or made-up statistics.

**Brand fidelity**
- Animate the logo only if you can rebuild it faithfully (Phase E comparison). Otherwise place the supplied file.
- Don't recreate third-party logos (WhatsApp, Shopify, …). Use neutral text chips with a small colour dot.

**Never ("AI slop")**
- Glowing brains, robots, circuit boards, sparkle ✦ icons, floating holograms.
- Purple-blue "AI gradient" backgrounds unless they are the brand, lens flares, stock-looking particles with no meaning.
- Emoji as design elements, lorem ipsum, generic dashboards full of meaningless charts.
- Buzzword copy: "revolutionary", "next-gen", "unlock", "supercharge", "seamless".
- Effects that don't carry meaning. Every technique must say something about the product.

## 4. Technique menu (use what serves the idea, not everything)

- **Kinetic type:** per-letter masked rises, words that act out their meaning, strike-throughs for "the old way".
- **Dot fields:** a grid that ripples from events, tilts into a 3D wave landscape, then swirls into a new form (a logo, a shape, a UI element).
- **Transformations:** one thing becomes the next (a dot becomes an input field, text shatters into particles that become a grid, a shape morphs with onion-skin trails).
- **UI in motion:** believable product UI (chat, cards, dashboards, checkout) with springs, typing, streaming text, cursor hovers and clicks.
- **Glass and light:** refractive glass slats over drifting colour fields, a cursor-following glow (great if the website has one).
- **Impacts:** chromatic split, screen shake, flash or wash on the drop, used once or twice, not everywhere.
- **Camera:** push-ins, a dive into an object to reach the next scene, parallax between layers.

## 5. QA checklist (every stills pass)

- [ ] No text clipped (descenders, diacritics, edges) and nothing overlapping unintentionally
- [ ] Every line readable at phone size and held long enough (§3)
- [ ] No empty or "dead" frames, except intentional ones
- [ ] Colours match the brand tokens; nothing off-palette
- [ ] Logo matches the original (side-by-side check)
- [ ] Transitions land on bars/beats; nothing starts or ends mid-beat by accident
- [ ] Copy is spelled correctly in every language; numbers and currency are formatted for that locale
- [ ] Final mp4: correct duration, frame count, fps, audio, file size sensible for the platform

## 6. Delivery specs

| Platform | Canvas | Notes |
|---|---|---|
| X / Twitter | 1920×1080 or 1080×1080 | 60 fps OK; square reads better on phones |
| Instagram feed | 1080×1080 or 1080×1350 (4:5) | keep key content inside the centre 1080×1080 |
| Reels / Stories / TikTok | 1080×1920 | leave ~250 px free at top and bottom for UI overlays |
| LinkedIn | 1920×1080 or 1080×1080 | many watch muted, so the story must work without sound |
| Website hero | 1920×1080, loopable | also export a short, silent loop |
