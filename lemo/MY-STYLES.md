# Make a style your own

A user picks a style from the library, changes what they want in it, gives it a new name and keeps it as **their own style**. It lives outside the library and never changes it. Then they can name it like any library style when they ask for a film.

Use this guide when the user wants to change a style ("I want to change this style", "make my own version", "我想改风格", "做成我自己的风格"), or when they name a style that is in their own folder. Everything else in a film follows [`AGENTS.md`](AGENTS.md) as usual.

## Where it lives

- Their styles live in **`~/lemo-my-styles/`**, outside the library, in both clone and skill mode, so library updates, `git pull` and uninstalling never touch them. Use another folder only if the user names one.
- Each style has its own folder, `~/lemo-my-styles/<slug>/`. `~/lemo-my-styles/README.md` lists them all (one line each: English and Chinese name, slug, base style, what changed). It's how you find a style by name.
- Never write into `styles/` or edit the library's guides for this.

## 1. Pick the base

The user names a library style (see **Finding the style** in `AGENTS.md`). One base only. If they want to mix two styles, pick the one whose §1 *Essence* is closest and take only what they want from the other, as changes.

## 2. Show what can change

Read the base `STYLE.md` in full, then show the user, in their language, a short list in three groups. Use what this style's own sections say, with concrete examples from it, not generic words:

| Group | Sections of `STYLE.md` | What to tell the user |
|---|---|---|
| **Safe to change** | §3 colour (the palette within its logic), §4 type, §5 motion (tempo, how much moves), §7 sound palette (instruments, density), §8 native moves (add or swap one) | the style stays itself; give 2–3 ideas for each |
| **Changes its character** | §2 materials and rendering, the colour logic itself in §3, §6 camera grammar | possible; say what the style loses with each change |
| **Can't change** | §1 essence (and its "what it is not"), §10 engine | changing these is a different style, not a version of this one. Say so and suggest a closer base |

Also tell them what **doesn't need their own style at all**: story, structure, opening, ending, cast, sets, pacing and voice (§11 *Variation space*) are free in every film. If that's all they want, they just say it when they ask for a film.

Every change must be something the code can draw, as in the library: no image or video generation, which the user may not have. If a change needs pictures (a photo texture, a painted background), use the user's own images or openly licensed ones (CC0, CC BY), named in `CREDITS`; if that can't work, say so and offer the closest change that code can draw.

Ask what they want to change and what to call it (English, Chinese, or both). Up to five changes is a good size for one round; more changes make the result hard to judge. The name and slug must not match a library style.

## 3. Write it down

In `~/lemo-my-styles/<slug>/`:

- **`STYLE.md`**: a full copy of the base `STYLE.md` with the changes written into their sections, so it reads like any style prompt (same 11 sections, no "see the base" gaps). Change the title to the new name, and add one line under it: `Based on <base name> (<base slug>) from Lemo-Opuscar.` Rewrite relative links (`DEMO.md`, `demo/…`) as `$LIB/styles/<base slug>/…`. Keep every pitfall in §9 that still applies; add new ones the changes bring.
- **`style.json`**: `slug`, `en`, `cn`, `based_on` (the base slug), `library_version` (`git -C "$LIB" rev-parse --short HEAD`, or the plugin version when `$LIB` isn't a git clone), `created`, and `line` / `line_cn` (one sentence each on what the style is).
- **`CHANGES.md`**: one row per change: section, base, now, why. This is what the user approves and what you check the test film against.
- Add the style's line to `~/lemo-my-styles/README.md`.

## 4. Prove the look

Render one style frame with the real drawing code (start from the base style's techniques, `DEMO.md` first; copy code into the test project, never edit the library). Put it next to a frame of the base style, so the changes are visible side by side, and check it against the new `STYLE.md`. Save it as `~/lemo-my-styles/<slug>/styleframe.jpg`.

**Show it to the user and wait.** If they want more changes, update `STYLE.md` and `CHANGES.md` and render again.

## 5. The test film (15–30 s)

A short film whose job is to show the style working, not a full production:

- **Topic**: the user's own if they give one; otherwise pick a simple one with movement and a little light (a kite on a windy beach, the first tram of the morning). Not the base demo's story.
- **Every change in `CHANGES.md` is clearly on screen** at least once, and the style's native move appears once.
- Music and sound effects, no voice and no subtitles unless the user asks (a voice is a separate test).
- Treatment: one structure is enough (no three candidates). No storyboard.
- Build it as a normal project (`films/<slug>-test/` in a clone, `<slug>-test/` in the user's folder in skill mode) with the usual checks for picture and sound (DIRECTOR.md §11; no LemoLab sign-off).
- Copy the film and its poster to `~/lemo-my-styles/<slug>/test.mp4` and `test.jpg`.

Tell the user where the style folder and the test film are, and list each change with the second where it can be seen.

## 6. Revise or use it

- **Not right yet**: change `STYLE.md` and `CHANGES.md`, then render the style frame and the test film again.
- **Using it**: when the user names it, read `~/lemo-my-styles/<slug>/STYLE.md` in place of a library `STYLE.md` and follow the normal workflow in `AGENTS.md`. For techniques, the demo is the base style's (`$LIB/styles/<based_on>/DEMO.md`). The films are the user's: no LemoLab credit, no watermark.
- **After a library update**: if the base `STYLE.md` changed since `library_version`, mention it once and offer to bring the useful fixes into their copy. Don't change their style without asking.
