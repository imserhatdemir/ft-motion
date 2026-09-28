# edit-demo: an edit request, the real diff, and the result

Motion graphics as code means a revision is a diff you can read. This example shows one full round on [`examples/reel`](../reel): a plain-language request, what the agent changed, and the two renders side by side.

![Frames from the reel before and after the edit](../../docs/edit-demo-compare.jpg)

## The request

> Speed the reel up to 150 BPM and change the accent colour from coral to electric blue. Keep the sound in sync.

## What changed

The real commit is [`demo/edit-150bpm-blue`](https://github.com/imserhatdemir/ft-motion/compare/add-reel-techniques...demo/edit-150bpm-blue) (3 files, +56 −55), saved here as [`case/change.patch`](case/change.patch). The highlights:

```diff
--- examples/reel/project.json
-  "duration": 15,
-  "bpm": 128,
+  "duration": 12.8,
+  "bpm": 150,
```

One number retimes the picture and the sound: the camera hits, every wipe and riser, the arp and the drums all sit on `api.at(...)` / `m.at(...)`, so they move with `bpm`. `duration` stays at exactly 32 beats (12.8 s).

The rest is what the tempo and colour change did *not* reach on its own:

| Where | Problem | Fix |
|---|---|---|
| `scene.js` | the accent was `CORAL`, and seven helpers (`tunnel`, `dotSphere`, `easingGraph`, `windowFrame`, `typeCode`, `glitch`, `hud`) fall back to coral when not given a colour | one `ACCENT` constant, passed to each helper |
| `scene.js` | a hard-coded `'128 BPM'` label | reads `api.bpm` |
| `scene.js` | copy quoted `900 frames` and `15 s`; the video is now 768 frames | derived from `api.duration` and `api.fps` |
| `sound.py` | one event at an absolute `14.4 s`, past the new end | moved to beat 30.7 |

The last two were found in review (looking at the frames and grepping `sound.py` for seconds), not by the request itself. That is the useful part of the workflow: the diff shows exactly which assumptions were baked in.

## Result

|  | BEFORE | AFTER |
|---|---|---|
| tempo | 128 BPM | 150 BPM |
| length | 15.0 s, 900 frames | 12.8 s, 768 frames |
| accent | coral | electric blue |
| soundtrack | −15.3 LUFS, −1.2 dBTP | −13.6 LUFS, −2.1 dBTP |

## How the video is made

`scene.js` draws only the frame around the two renders (prompt, tool calls, diff, render progress, labels, a 32-beat strip under each video that ticks at that video's own tempo). The diff lines are read from `case/change.patch`, so they cannot drift from what actually changed. `compose.mjs` then lays the two renders over the slots (each held on its first and last frame, so they can differ in length) and mixes the AFTER soundtrack over the panel's own UI sounds.

## Make your own

```bash
# 1. make your edit on a branch and save the diff
git diff main -- examples/reel > examples/edit-demo/case/change.patch

# 2. render BEFORE (on main) and AFTER (on your branch), with their own audio
python examples/reel/sound.py && node ft.mjs render examples/reel --lang en     # copy out/reel-en.mp4 aside each time

# 3. describe the case: prompt, steps, which hunks to show, labels, and when the videos start
$EDITOR examples/edit-demo/case/meta.json

# 4. panel + compose
python examples/edit-demo/sound.py
node ft.mjs render examples/edit-demo
node examples/edit-demo/compose.mjs --before before.mp4 --after after.mp4
```

In `meta.json`, each `pick` finds a hunk in the patch by file name and a substring (`key`); add `"whole": true` to show every line of the hunk instead of only the matching pair. `videoStart` must leave room for the timeline before it: the scene warns in the console if it is too early. The panel is 1080×1350 (4:5), which takes the most room in a phone feed.
