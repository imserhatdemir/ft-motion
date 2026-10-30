<div align="center">

# Lemo-Opuscar

**<!--n-->51<!--/n--> film styles, each with a short film made entirely in code.**<br>
Pick a style, bring your own story, and let your coding agent direct the film.<br>
<sub><!--n-->51<!--/n--> 种影片风格，每种都配一支完全用代码做出来的短片 · 🇨🇳 中文用户请看 <a href="README.zh-CN.md">简体中文说明</a></sub>

<a href="https://lemomo-ai.github.io/lemo-opuscar/"><img alt="Watch the gallery" src="https://img.shields.io/badge/-%E2%96%B6%20Watch%20the%20gallery-E8553A?style=for-the-badge"></a> <a href="README.zh-CN.md"><img alt="简体中文" src="https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-555?style=for-the-badge"></a> <a href="https://github.com/lemomo-ai/lemo-opuscar/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/lemomo-ai/lemo-opuscar?style=for-the-badge&color=F5B700&label=stars"></a> <a href="#licence"><img alt="MIT · CC BY 4.0" src="https://img.shields.io/badge/licence-MIT%20%C2%B7%20CC%20BY%204.0-2EA44F?style=for-the-badge"></a>

⚠️ **Built for Claude.** The styles are tuned for Claude Opus 5.5;<br>
other models may not reproduce them well, so use them with care.

🆕 **2026-10-19 · [Make a style your own](#make-a-style-your-own)**: change a style, give it your own name, get a 15–30 s test film.<br>
🆕 **2026-10-16 · [Evidence Films](https://lemomo-ai.github.io/lemo-opuscar/#evidence-films)**: 8 new styles that film real material, every number measured or sourced. [See them ↓](#evidence-films)

<sub>Official repo: [github.com/lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) · by Lemomo ([@lemomo_ai](https://x.com/lemomo_ai))</sub>

</div>

## 🎬 Feature presentation: OPUSCAR 98

<table><tr>
<td width="50%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/opuscar98/"><img src="docs/opuscar98.jpg" alt="OPUSCAR 98 — 98 Years of Best Picture"></a><br><b>▶ The film</b> · 1927 – 2025 · 6:31<br><sub>One Clawd walks through all 98 Best Picture winners, each one redrawn in a style that fits the film.</sub></td>
<td width="50%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/opuscar98/#styles"><img src="docs/opuscar98-styles.jpg" alt="OPUSCAR 98 — all 98 styles open"></a><br><b>All 98 styles, open</b> · 77 in 2D · 4 in 2.5D · 17 in 3D<br><sub>Each film's style tag, a frame, a style prompt to reuse on your own topic, and the shots and direction. Also as <a href="https://lemomo-ai.github.io/lemo-opuscar/opuscar98/styles.json">JSON</a>.</sub></td>
</tr></table>

<div align="center">

Every frame, every note and every cut was written in code by Claude Opus 5.5.<br>
[**▶ Watch**](https://lemomo-ai.github.io/lemo-opuscar/opuscar98/) · [**All 98 styles**](https://lemomo-ai.github.io/lemo-opuscar/opuscar98/#styles) · [**Download 1080p**](https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/opuscar98.mp4)

</div>

## 👋 About me

I'm **Lemomo** ([@lemomo-ai](https://github.com/lemomo-ai)). More about me on my profile.

> **Not an awesome list.** Every film here was made by me, with Claude Opus 5.5.<br>
> The styles are tuned for Opus 5.5; other models may not reproduce them.

![All styles](docs/cover.jpg)

Every film was directed, drawn, scored and mixed by an AI agent writing code:

- 🎨 **Picture**: canvas and WebGL pages, rendered frame by frame
- 🎵 **Music**: original scores from free sample libraries
- 🎙️ **Voice**: text-to-speech narration

No video generation, no stock footage.

## How to use

Two ways in; the skill is the easiest.

### Option 1: install the skill (recommended)

In your terminal:

```sh
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
```

Then use it from any folder.

- On first use it downloads the guides, tools and style prompts to `~/lemo-opuscar`, shared by all your films.
- Each film's project, from source to finished video, goes in the folder you started from.
- For other agents, copy [`plugin/skills/lemo-opuscar/`](plugin/skills/lemo-opuscar/) into their skills folder.

### Option 2: clone the repo

```sh
git clone https://github.com/lemomo-ai/lemo-opuscar.git
cd lemo-opuscar
claude
```

Films go into `films/<name>/` inside the repo.

### Then just say what you want

> Make a 45-second film in the **watercolor** style about the coffee farm my family runs. Warm female narrator.

> Make a 40-second **LiDAR Survey** film about the old quarry in the hills behind our town, from public laser-scan data.

Name the style in English or Chinese; the [style index](styles/README.md) lists them all.

It asks you once, up front:

- anything it can't decide about your topic;
- whether you have your own **voice, music or other material**;
- whether you want to see a **storyboard** first. Say yes and it stops once to show you the key shots in the real style; otherwise it goes straight to the finished film.

The agent reads three guides and works like a small studio:

| File | What it gives the agent |
|---|---|
| [`DIRECTOR.md`](DIRECTOR.md) | how to direct: story, sound, rhythm, camera, performance, self-checks |
| [`TECHNIQUE.md`](TECHNIQUE.md) | how to build: frame-by-frame rendering, voice, music, mixing |
| `styles/<style>/STYLE.md` | what the style looks and sounds like; the story is yours |

### Make a style your own

Like a style but want it a little different? Pick one and say so:

> I want to change the **Ukiyo-e** style into my own version.

1. It tells you what can change in that style: what's safe to change, what changes its character, and what can't change without becoming a different style.
2. You say what to change and give it a name.
3. It writes your style to `~/lemo-my-styles/<name>/`, outside the library, and shows you a style frame next to the original.
4. Once you approve, it makes a **15–30 second test film** that shows every change.

After that, name your style like any other: *"Make a 30-second film in my **Night Ukiyo-e** style about…"*. Library updates never touch it. The steps the agent follows are in [`MY-STYLES.md`](MY-STYLES.md).

### Before you start

- A film takes an agent about 30–60 minutes and a fair amount of tokens.
- You need Node 20+, ffmpeg and Python 3.11+ (or [uv](https://docs.astral.sh/uv/)); the agent installs the rest.
- Default output 1920×1080, 24 fps; other sizes on request.

### Update or uninstall

Update, then restart Claude Code (the library in `~/lemo-opuscar` updates itself on the next film):

```sh
claude plugin marketplace update lemolab && claude plugin update lemo-opuscar@lemolab
```

After an update, ask for a film as usual; to make a style your own, see [above](#make-a-style-your-own).

Uninstall, then delete `~/lemo-opuscar`:

```sh
claude plugin uninstall lemo-opuscar@lemolab
```

Your own styles in `~/lemo-my-styles/` stay through updates and uninstalls; delete that folder yourself if you don't want them.

If a step stays stuck, [open an issue](https://github.com/lemomo-ai/lemo-opuscar/issues).

## The styles

Click a frame for its `STYLE.md`.

<!-- styles:start -->

### Evidence Films

<table>
<tr>
<td width="33%" valign="top"><a href="styles/satellite-briefing/STYLE.md"><img src="docs/frames/satellite-briefing.jpg" alt="Satellite Briefing"></a><br><b>Satellite Briefing</b><br><i>The Map Still Says Sea</i><br><sub>A satellite follows the map to the Aral Sea and finds a desert; the only part that came back is the part someone dammed.</sub></td>
<td width="33%" valign="top"><a href="styles/briefing-board/STYLE.md"><img src="docs/frames/briefing-board.jpg" alt="Engineering Briefing Board"></a><br><b>Engineering Briefing Board</b><br><i>The Ship Decides</i><br><sub>A river needs a bridge; four bridge types are tested on one briefing wall, and the ship that must pass underneath picks the winner.</sub></td>
<td width="33%" valign="top"><a href="styles/lidar-survey/STYLE.md"><img src="docs/frames/lidar-survey.jpg" alt="LiDAR Survey"></a><br><b>LiDAR Survey</b><br><i>The Fields Under the Forest</i><br><sub>A laser survey strips the canopy off a Connecticut forest, layer by layer, and finds the stone walls of the farms that were there: 3.4 km of them, measured.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/white-model/STYLE.md"><img src="docs/frames/white-model.jpg" alt="Projection on White Model"></a><br><b>Projection on White Model</b><br><i>How a Flattened City Grew Back</i><br><sub>A projector lights Rotterdam&#x27;s white model layer by layer: what stood before 1940, the decades that filled the hole, the towers, and the winter shadow the tallest one casts on the pre-war roofs.</sub></td>
<td width="33%" valign="top"><a href="styles/data-physical/STYLE.md"><img src="docs/frames/data-physical.jpg" alt="Data Physicalization"></a><br><b>Data Physicalization</b><br><i>Two Spirals</i><br><sub>Twelve years of wind and solar capacity stacked as real plates on a walnut dial: wind led in 2014, solar passed it in 2021, and by 2025 the ratio has turned the other way round.</sub></td>
<td width="33%" valign="top"><a href="styles/teardown/STYLE.md"><img src="docs/frames/teardown.jpg" alt="Exploded Teardown"></a><br><b>Exploded Teardown</b><br><i>21 Keys, Opened</i><br><sub>One half of an open-source keyboard comes apart in a single orbit, dives under its circuit board to the chip, the lights and the sockets, then closes with its real dimensions drawn on it.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/microscope/STYLE.md"><img src="docs/frames/microscope.jpg" alt="Microscope Story"></a><br><b>Microscope Story</b><br><i>Measured Blue</i><br><sub>One continuous camera takes a liver slide from the eye down to a single nucleus; two circles 1.4 mm apart are counted pixel by pixel, and one holds 2.4 times the blue.</sub></td>
<td width="33%" valign="top"><a href="styles/archive-lighttable/STYLE.md"><img src="docs/frames/archive-lighttable.jpg" alt="Archive Light Table"></a><br><b>Archive Light Table</b><br><i>Two Seconds Short</i><br><sub>The telegram said the longest flight lasted 57 seconds and the newspaper printed it; under a loupe, the Wright brothers&#x27; glass negatives and the Library of Congress record say 59.</sub></td>
</tr>
</table>

### Hand-drawn & Painting

<table>
<tr>
<td width="33%" valign="top"><a href="styles/crayon-book/STYLE.md"><img src="docs/frames/crayon-book.jpg" alt="Crayon Picture Book"></a><br><b>Crayon Picture Book</b><br><i>The Moon Can&#x27;t Sleep</i><br><sub>The moon can&#x27;t sleep, so a little girl climbs onto the roof to sing it a lullaby.</sub></td>
<td width="33%" valign="top"><a href="styles/watercolor/STYLE.md"><img src="docs/frames/watercolor.jpg" alt="Watercolor Brush"></a><br><b>Watercolor Brush</b><br><i>Follow the Rain</i><br><sub>Follow the rain from Australia&#x27;s red desert heart to its green coast in one unbroken painted walk.</sub></td>
<td width="33%" valign="top"><a href="styles/ink-wash/STYLE.md"><img src="docs/frames/ink-wash.jpg" alt="Chinese Ink Wash"></a><br><b>Chinese Ink Wash</b><br><i>The Swordsman and the River</i><br><sub>A swordsman crosses the river on the water and splits the current with a single stroke.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/impasto/STYLE.md"><img src="docs/frames/impasto.jpg" alt="Impasto Oil Painting"></a><br><b>Impasto Oil Painting</b><br><i>The Colour of Rain</i><br><sub>In a grey, rainy square one red umbrella opens, and a waltz paints the whole plaza in colour.</sub></td>
<td width="33%" valign="top"><a href="styles/one-line/STYLE.md"><img src="docs/frames/one-line.jpg" alt="One-line Drawing"></a><br><b>One-line Drawing</b><br><i>The Line That Never Lifted</i><br><sub>One unbroken line draws a whole life, then the pen passes to a child.</sub></td>
<td width="33%" valign="top"><a href="styles/whiteboard/STYLE.md"><img src="docs/frames/whiteboard.jpg" alt="Whiteboard Explainer"></a><br><b>Whiteboard Explainer</b><br><i>Einstein in Your Pocket</i><br><sub>How your phone knows where you are: GPS, atomic clocks, and the 38 microseconds relativity adds every day.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/urban-sketch/STYLE.md"><img src="docs/frames/urban-sketch.jpg" alt="Urban Sketch · Pen &amp; Wash"></a><br><b>Urban Sketch · Pen &amp; Wash</b><br><i>Where the Wind Went</i><br><sub>A park that is only a pen sketch; wherever the wind carries her straw hat, colour follows.</sub></td>
</tr>
</table>

### East Asian Traditions

<table>
<tr>
<td width="33%" valign="top"><a href="styles/shadow-puppet/STYLE.md"><img src="docs/frames/shadow-puppet.jpg" alt="Shadow Puppetry"></a><br><b>Shadow Puppetry</b><br><i>Hou Yi Shoots the Suns</i><br><sub>Ten suns scorch the earth until the archer Hou Yi draws his bow, told with leather puppets on a lit screen.</sub></td>
<td width="33%" valign="top"><a href="styles/ukiyoe/STYLE.md"><img src="docs/frames/ukiyoe.jpg" alt="Ukiyo-e"></a><br><b>Ukiyo-e</b><br><i>A Journey Toward the Mountain</i><br><sub>A traveller walks toward a distant mountain; every shot is a woodblock print, ending in a great wave.</sub></td>
<td width="33%" valign="top"><a href="styles/papercut-red/STYLE.md"><img src="docs/frames/papercut-red.jpg" alt="Red Paper-cut"></a><br><b>Red Paper-cut</b><br><i>Nian Comes to Town</i><br><sub>On New Year&#x27;s Eve the beast Nian comes to town, and one girl&#x27;s giant paper-cut lights up the village to scare it off.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/paper-lantern/STYLE.md"><img src="docs/frames/paper-lantern.jpg" alt="Paper-cut Lightbox"></a><br><b>Paper-cut Lightbox</b><br><i>A Mooncake&#x27;s Longing</i><br><sub>A single mooncake tells the Mid-Autumn story of reunion and longing inside a glowing paper-cut lightbox.</sub></td>
</tr>
</table>

### Print & Printmaking

<table>
<tr>
<td width="33%" valign="top"><a href="styles/risograph/STYLE.md"><img src="docs/frames/risograph.jpg" alt="Risograph Print"></a><br><b>Risograph Print</b><br><i>Sunday Ride</i><br><sub>A Sunday-morning bike ride through the city — bakery, park, riverside — in two misregistered inks.</sub></td>
<td width="33%" valign="top"><a href="styles/halftone-dossier/STYLE.md"><img src="docs/frames/halftone-dossier.jpg" alt="Halftone Dossier"></a><br><b>Halftone Dossier</b><br><i>Case File: Chubby</i><br><sub>A chubby orange cat stands trial for testing gravity and 4 a.m. parkour, and walks free.</sub></td>
<td width="33%" valign="top"><a href="styles/woodcut/STYLE.md"><img src="docs/frames/woodcut.jpg" alt="Woodcut Print"></a><br><b>Woodcut Print</b><br><i>The Bell Founder</i><br><sub>A village spends a whole winter casting one bell; the first time it rings, the snow stops.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/engraving/STYLE.md"><img src="docs/frames/engraving.jpg" alt="Copperplate Engraving"></a><br><b>Copperplate Engraving</b><br><i>The Honeybee, Plate VII</i><br><sub>A natural-history plate engraves itself: the burin cuts the copper, the bee builds up line by line, and a watercolour wash brings it to life.</sub></td>
<td width="33%" valign="top"><a href="styles/silkscreen-poster/STYLE.md"><img src="docs/frames/silkscreen-poster.jpg" alt="Silkscreen Travel Poster"></a><br><b>Silkscreen Travel Poster</b><br><i>Three Trails</i><br><sub>Three trail posters are screen-printed one ink at a time, then climbed in one long take from noon to dusk.</sub></td>
</tr>
</table>

### Graphic & Type

<table>
<tr>
<td width="33%" valign="top"><a href="styles/swiss-motion/STYLE.md"><img src="docs/frames/swiss-motion.jpg" alt="Swiss Motion Graphics"></a><br><b>Swiss Motion Graphics</b><br><i>Five Rules for a Poster</i><br><sub>A concert poster lays itself out by five Swiss design rules; the fifth is to break just one.</sub></td>
<td width="33%" valign="top"><a href="styles/spy-titles/STYLE.md"><img src="docs/frames/spy-titles.jpg" alt="60s Spy Title Sequence"></a><br><b>60s Spy Title Sequence</b><br><i>The Velvet Cipher</i><br><sub>Opening titles for an imaginary 1964 spy film: a chase for a stolen key until the shapes lock into the title.</sub></td>
<td width="33%" valign="top"><a href="styles/art-deco/STYLE.md"><img src="docs/frames/art-deco.jpg" alt="Art Deco"></a><br><b>Art Deco</b><br><i>Midnight at the Starlight Hotel</i><br><sub>A grand hotel, 1930: a bellboy races lifts and revolving doors to deliver one letter before midnight.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/blueprint/STYLE.md"><img src="docs/frames/blueprint.jpg" alt="Blueprint"></a><br><b>Blueprint</b><br><i>Patent Pending: The Cloud Catcher</i><br><sub>An inventor&#x27;s blueprint draws, explodes and assembles a cloud-catching machine, and its revision cloud starts to rain.</sub></td>
<td width="33%" valign="top"><a href="styles/stained-glass/STYLE.md"><img src="docs/frames/stained-glass.jpg" alt="Stained Glass"></a><br><b>Stained Glass</b><br><i>The Dragon of the East Window</i><br><sub>Sunlight crosses a cathedral window from dawn to dusk, waking each pane of a knight-and-dragon tale.</sub></td>
<td width="33%" valign="top"><a href="styles/pictogram-motion/STYLE.md"><img src="docs/frames/pictogram-motion.jpg" alt="Pictogram Motion"></a><br><b>Pictogram Motion</b><br><i>Aichi-Nagoya 2026 — All 43 Sports</i><br><sub>All 43 sports of the 2026 Asian Games as beat-locked geometric pictograms.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/ascii-crt/STYLE.md"><img src="docs/frames/ascii-crt.jpg" alt="ASCII / CRT Terminal"></a><br><b>ASCII / CRT Terminal</b><br><i>Tranquility.log</i><br><sub>A moon-base AI wakes after forty years to a signal from Earth, and replies by drawing “home” in characters.</sub></td>
</tr>
</table>

### Information & Keynote

<table>
<tr>
<td width="33%" valign="top"><a href="styles/dataviz/STYLE.md"><img src="docs/frames/dataviz.jpg" alt="Data Storytelling"></a><br><b>Data Storytelling</b><br><i>A Hundred Summers</i><br><sub>A hundred years of summer temperatures, where the chart itself tells the story.</sub></td>
<td width="33%" valign="top"><a href="styles/iso-infographic/STYLE.md"><img src="docs/frames/iso-infographic.jpg" alt="Isometric Infographic"></a><br><b>Isometric Infographic</b><br><i>From Bean to Cup</i><br><sub>A coffee&#x27;s journey from the plantation to your hands, across one isometric world.</sub></td>
<td width="33%" valign="top"><a href="styles/dark-keynote/STYLE.md"><img src="docs/frames/dark-keynote.jpg" alt="Dark Tech Keynote"></a><br><b>Dark Tech Keynote</b><br><i>Room to Think</i><br><sub>Launch film for Tidy, a fictional app: one buried cursor snaps hundreds of windows back into place.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/living-screencast/STYLE.md"><img src="docs/frames/living-screencast.jpg" alt="Living Screencast"></a><br><b>Living Screencast</b><br><i>Clawd Moves In</i><br><sub>Clawd, the Claude Code pixel mascot, hops out of the terminal into the Claude app and acts out plan mode, diff comments and self-checks in a one-take screencast.</sub></td>
<td width="33%" valign="top"><a href="styles/hologram-hud/STYLE.md"><img src="docs/frames/hologram-hud.jpg" alt="Sci-fi Hologram HUD"></a><br><b>Sci-fi Hologram HUD</b><br><i>Volt · Spec Scan</i><br><sub>An e-bike is scanned into a hologram; target boxes lock onto the battery, motor and brakes, and each spec rolls into place.</sub></td>
</tr>
</table>

### Cartoon & Anime

<table>
<tr>
<td width="33%" valign="top"><a href="styles/rubber-hose/STYLE.md"><img src="docs/frames/rubber-hose.jpg" alt="1930s Rubber Hose Cartoon"></a><br><b>1930s Rubber Hose Cartoon</b><br><i>Coffee Cup Chase</i><br><sub>A coffee cup chases a runaway sugar cube around the kitchen, 1930s-cartoon style.</sub></td>
<td width="33%" valign="top"><a href="styles/cel-anime-80s/STYLE.md"><img src="docs/frames/cel-anime-80s.jpg" alt="80s Cel Anime"></a><br><b>80s Cel Anime</b><br><i>City Lights, 1987</i><br><sub>A courier girl rides through a rain-soaked neon city to deliver a tape before the dawn launch.</sub></td>
<td width="33%" valign="top"><a href="styles/scifi-toon/STYLE.md"><img src="docs/frames/scifi-toon.jpg" alt="Sci-Fi Sitcom Toon"></a><br><b>Sci-Fi Sitcom Toon</b><br><i>Coffee Run</i><br><sub>A jaded genius opens a portal just to buy coffee and tumbles through ever-stranger universes.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/midcentury-toon/STYLE.md"><img src="docs/frames/midcentury-toon.jpg" alt="Mid-century Cartoon"></a><br><b>Mid-century Cartoon</b><br><i>Meet Pip</i><br><sub>A robot vacuum set up in three steps, told like a 1950s classroom film: place the dock, connect the app, press start.</sub></td>
</tr>
</table>

### Games

<table>
<tr>
<td width="33%" valign="top"><a href="styles/pixel-rpg/STYLE.md"><img src="docs/frames/pixel-rpg.jpg" alt="16-bit Pixel RPG"></a><br><b>16-bit Pixel RPG</b><br><i>The Last Save Point</i><br><sub>At the final boss door a hero saves the game, and the save screen replays the whole journey.</sub></td>
<td width="33%" valign="top"><a href="styles/hd-2d/STYLE.md"><img src="docs/frames/hd-2d.jpg" alt="HD-2D"></a><br><b>HD-2D</b><br><i>The Lampbearer</i><br><sub>The lighthouse goes dark; a girl carries the last flame through a night forest and up the storm cliffs.</sub></td>
<td width="33%" valign="top"><a href="styles/microgame/STYLE.md"><img src="docs/frames/microgame.jpg" alt="Microgame Frenzy"></a><br><b>Microgame Frenzy</b><br><i>Five-Second Astronaut</i><br><sub>A clumsy cadet survives a five-second boot camp, faster and faster, until the boss: landing home.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/game-show/STYLE.md"><img src="docs/frames/game-show.jpg" alt="Game Show Flat"></a><br><b>Game Show Flat</b><br><i>Rhythm of AI, 1997 → 2026</i><br><sub>The history of AI as a rhythm game: models take the stage on the beat, and a report card closes the show.</sub></td>
</tr>
</table>

### Cinema & Eras

<table>
<tr>
<td width="33%" valign="top"><a href="styles/silent-film/STYLE.md"><img src="docs/frames/silent-film.jpg" alt="1920s Silent Film"></a><br><b>1920s Silent Film</b><br><i>The Runaway Loaf</i><br><sub>A baker&#x27;s boy chases a runaway loaf downhill, then breaks it in half for a hungry girl.</sub></td>
<td width="33%" valign="top"><a href="styles/backrooms/STYLE.md"><img src="docs/frames/backrooms.jpg" alt="Liminal Found Footage"></a><br><b>Liminal Found Footage</b><br><i>Night Shift Orientation</i><br><sub>A new night-shift hire films their first night in an endless yellow office, following the rules on the wall.</sub></td>
</tr>
</table>

### Materials & 3D

<table>
<tr>
<td width="33%" valign="top"><a href="styles/brick-toy/STYLE.md"><img src="docs/frames/brick-toy.jpg" alt="Brick Toy"></a><br><b>Brick Toy</b><br><i>Rocket from Spare Parts</i><br><sub>A brick astronaut builds a rocket from spare parts and flies to a brick moon.</sub></td>
<td width="33%" valign="top"><a href="styles/paper-popup/STYLE.md"><img src="docs/frames/paper-popup.jpg" alt="Paper Pop-up Book"></a><br><b>Paper Pop-up Book</b><br><i>Pip&#x27;s Paper Adventure</i><br><sub>A pop-up book opens on a desk; a sprite named Pip adventures through paper worlds and jumps out into ours.</sub></td>
<td width="33%" valign="top"><a href="styles/tilt-shift/STYLE.md"><img src="docs/frames/tilt-shift.jpg" alt="Tilt-Shift Miniature"></a><br><b>Tilt-Shift Miniature</b><br><i>Toy Town Rush Hour</i><br><sub>Morning rush hour in a town that looks like a model: traffic, trains and tiny people.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/lowpoly-island/STYLE.md"><img src="docs/frames/lowpoly-island.jpg" alt="Low-poly Isometric Island"></a><br><b>Low-poly Isometric Island</b><br><i>The Island That Grew</i><br><sub>An island and its village grow tile by tile from an empty sea, each tile a note, into a starry night.</sub></td>
<td width="33%" valign="top"><a href="styles/glass-product/STYLE.md"><img src="docs/frames/glass-product.jpg" alt="Glass Product Render"></a><br><b>Glass Product Render</b><br><i>Aura — Hear the Light</i><br><sub>Unboxing and close-ups of Aura, fictional glass earbuds, in strip-light sweeps and caustics.</sub></td>
</tr>
</table>
<!-- styles:end -->

## Star history

<a href="https://www.star-history.com/#lemomo-ai/lemo-opuscar&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=lemomo-ai/lemo-opuscar&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=lemomo-ai/lemo-opuscar&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=lemomo-ai/lemo-opuscar&type=Date" />
 </picture>
</a>

### Thank you for every star

A thank-you film at each milestone, made in code like everything here.<br>
Click a poster to watch on the <a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/">thank-you page</a>.

<table><tr>
<td width="33%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars2000"><img src="docs/thanks/thanks-2000.jpg" alt="2000 stars · Refresh (50 s)"></a><br><sub>2,000 stars · Refresh (50 s)</sub></td>
<td width="33%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars800"><img src="docs/thanks/thanks-800.jpg" alt="800 stars · Reverse Shot (39 s)"></a><br><sub>800 stars · Reverse Shot (39 s)</sub></td>
<td width="33%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars300"><img src="docs/thanks/thanks-300.jpg" alt="300 stars · The Lamplighter (18 s)"></a><br><sub>300 stars · The Lamplighter (18 s)</sub></td>
</tr></table>

## Licence

Made by **LemoLab × Claude Opus 5.5**.

- **Code and docs**: MIT.
- **Demo films and their stills** (in `styles/`, the gallery and the Releases): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You may share, adapt and use them commercially; credit **LemoLab** with a link to this repository, and say if you changed them.
- **Films you make with the library**: yours, no credit needed.
- **Third-party assets in the demos**: they keep their own licences (see each demo's `CREDITS`).

You are responsible for the materials you use in your films.

## More from LemoLab

- 📸 **[lemo-wake](https://github.com/lemomo-ai/lemo-wake)**: one picture in, a seamless loop of about five seconds out.
- 🍋 **[lemo-mod](https://github.com/lemomo-ai/lemo-mod)**: re-skin Claude Code with 21 styles, in the terminal and the desktop app.
- 🟥 **[Stampy](https://github.com/lemomo-ai/lemo-stampy)**: a tiny Mac menu bar stamp that marks your copies "For XX use only".

---

<div align="center">

⭐ **Star this repo**<br>
👀 **Watch → Custom → Releases** to hear about new versions<br>
𝕏 Follow [@lemomo_ai](https://x.com/lemomo_ai)

<sub>LemoLab · by Lemomo</sub>

</div>
