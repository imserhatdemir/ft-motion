# Techniques

Each recipe says what it's for, which helpers to use, and where it runs in [`examples/hello/scene.js`](../examples/hello/scene.js). Helpers live in [`engine/core.js`](../engine/core.js).

## Timing

**Progress windows.** `prog(t, a, b)` maps a time window to 0→1. Feed that into an easing: `EASE.expo(prog(t, 1.2, 1.8))`. Every animation in a scene is some easing of some window.

**The beat grid.** `project.json` sets `bpm`. `api.at(bar, step)` returns the scene time of a bar plus a 16th-note step: at 160 BPM a bar is 1.5 s and a step is 93.75 ms. Put section starts, cuts and big hits on bars, and small events on steps. Sound in `sound.py` uses the same `m.at()`.

**Stagger.** `start = t0 + i * 0.04` for letter *i*. Order it by position (left→right, centre→out using `p.d`), never randomly.

**Speed.** `"speed": 0.75` in `project.json` plays the whole choreography at 75 %. A 15 s cut becomes 20 s without editing a single time constant. `ftsynth.Mix` reads the same value and keeps the sound locked to the picture.

## Easing vocabulary

| Use | Helper |
|---|---|
| reveals, arrivals | `EASE.expo` (cubic-bezier .16,1,.3,1) |
| matching a website's hover | `EASE.css` |
| UI elements, pops | `spring(t - t0, freq, damp)` (overshoots) |
| impact reactions, squash | `wobble(t - t0)` (starts at 1, decays) |
| anticipation before a big exit | `E.inBack(p, 2.4)` (dips below 0 first) |
| being sucked away, collapses | `E.inExpo` / `E.inCubic` |

## Motion blur

Enabled by `boot()` for every render. Each frame averages `subframes` renders spread over a forward half-frame shutter (180°), so hard cuts on frame boundaries stay hard. Preview it live with `b`. It costs nothing in scene code: just keep `draw()` a pure function of `t`.

## Kinetic type

- **Masked rise:** clip to a line box, then draw the text offset by `(1 - p) * size`. Size the clip box to include descenders and diacritics; `maskedText()` pads for you. Letter-by-letter reveals use `layout()` (kerning-preserving x offsets) with `ctx.fillText(ch, x0 + L.xs[i], y)`. *hello: intro()*
- **Words that do what they say:** "timing" letters staggered on a visible timeline, "rhythm" letters hopping on the beat, "contrast" split across an inverting divider (`globalCompositeOperation = 'difference'` inverts text automatically over light and dark areas).
- **Strike-through for the old way:** draw the line with `width * EASE.expo(p)`, then dim the text.
- **Typing and streaming:** type into an input with `text.slice(0, n)`; stream an agent's reply word by word. Show a blinking caret while idle and a solid one while typing.

## Dot fields

`grid(cols, rows, spacing)` gives the points. Then layer:

1. **Birth:** each dot springs in when a ring from the centre reaches it (`spring(u - arrival(d))`).
2. **Ripples:** `ripple(p, origin, t0, t)` gives a travelling ring's weight. Use it to grow dots, push them outwards and tint them. Launch ripples on beats from where the story happens (a chip, a click).
3. **Landscape:** a height field `z = -(sin(d·k - t·ω) + …) · amp`, then `project3D(x, y, z, {tilt, yaw})`. Sort by depth and scale radius and alpha by `s`. Colour peaks and troughs differently.
4. **Vortex / assembly:** per-dot progress staggered by distance; rotate and shrink towards a centre, or interpolate each dot to a target slot (a logo's dots, a shape's outline). Morph dot size and shape as they arrive.

*hello: field()*

## Transformations

- **A becomes B:** the last element of one scene is the first of the next: a dot stretches into an input field, a shape implodes into the point the next scene grows from, a sphere fills the screen and dissolves into the next background.
- **Text to particles:** `sampleDrawing(W, H, draw, step)` rasterises any drawing into coloured points. Fly them to grid positions (nearest grid point per particle) to hand over from type to a dot field.
- **Shape morphing:** `morphPath(ctx, cx, cy, R, SHAPES.square, SHAPES.star, e, rot)` interpolates radial shape functions. Push `e` through `E.outBack` for jelly overshoot. Add rotation that settles on each shape's symmetry (90° for squares, 120° for triangles, 72° for stars). **Onion skins:** redraw the shape at `t - k·30 ms` as fading outlines. *hello: morph()*

## UI in motion

- Cards: `rrect` + `spring` for entry (translate and scale from the anchor corner), `EASE.expo` for exits, and a 90–120 ms stagger.
- Chat: bubbles scale from their tail corner; content height grows with an eased height so the list scrolls smoothly (`scroll = max(0, contentBottom - areaBottom)`).
- Cursor: `pointer(ctx, x, y, scale, press)` moves along `EASE.css`; on click, press → release, a button scale dip (0.94 → spring back), a ring expanding from the click point, and a state change (label, colour, check).
- Believable details sell it: status dots, counters that increment, a badge that pops on a cart icon, variant swatches with a selection ring that slides.

## Glass and light

`glassSlats(ctx, W, H, bg, {angle, width, drift, refraction})`. `bg(g)` paints soft colour blobs (`radialBlob`) into an offscreen backdrop. Each diagonal slat shows the backdrop displaced (fake refraction), with a bright leading edge and faint prismatic fringes. Add a blob that follows your animated cursor to echo "mouse-reactive" hero sections. *hello: end()*

## Impacts (use sparingly)

- `chromatic(ctx, color, offset, draw, {light})`: an RGB split that decays over about 0.3 s. It uses `lighter` on dark backgrounds and `multiply` on light ones.
- `shake(t, [[time, px], …])`: noise-driven camera shake that decays.
- A flash or colour wash over the frame, fading in about 0.1–0.5 s.

## Logo fidelity

To animate a logo you must rebuild it procedurally: circles, ellipses, rings of dots, strokes. Measure proportions from the supplied file, render your version and the original side by side at the same scale, and iterate. If you can't match it, place the PNG/SVG with `ctx.drawImage` instead of approximating.

## 3D with three.js (engine/three.js)

For character animation and real 3D sets. *cat-crossing: the whole scene*

- **Contract:** build meshes, lights and materials once in `setup(api)`; in `draw(ctx, t)` set *every* transform, material value and camera from `t`, then `gl.render(ctx, scene, camera)`. Don't read last frame's state. Motion blur calls `draw` several times per frame at nearby times, so anything accumulated breaks it.
- **Cartoon look:** `toon(color, { rim })` is a `MeshToonMaterial` with a hard 3-step ramp and an optional rim light. `ink(mesh, width)` adds an inverted-hull outline that shares the mesh's geometry. Use smooth normals (spheres, capsules, `RoundedBoxGeometry`): hard box corners split the hull. Warm key light, cool hemisphere fill, soft shadows and a gradient sky dome keep it in "feature animation" territory.
- **Characters from primitives:** nest groups (root → squash → rig → hip → head), pivot limbs at the joint, and drive every channel with keyframes `key(t, [[time, value, ease], …])` on the beat grid. Classic principles map to single numbers: squash & stretch (`wobble` on landings, stretch along hop arcs), anticipation (crouch + wiggle before a pounce), follow-through (the tail lags), exaggeration (eye scale, pupil size, fur puff).
- **Gaits without state:** derive the walk phase from distance travelled along a keyframed path (sum `|Δz|` over sub-steps up to `t`), so feet never slide and the result is still a pure function of time.
- **Tails, ropes, ribbons:** `new Sweep(n, radial)` is a tube with fixed topology; `update(points, radius(s))` re-poses it in place each frame.
- **Traffic and other agents:** give each one a closed-form position `x(t)` (constant speed, or brake with constant deceleration to a stop line and pull away later). Velocity and acceleration come from finite differences, which also drive wheel spin, braking dive and speed stretch.
- **Cameras:** a list of shots `[endTime, t => [position, lookAt, fov]]`; cutting on a frame boundary keeps motion-blur cuts hard.
- **Speed:** SwiftShader renders roughly 0.5–1 s per subframe at 1080p. Cull what's off screen (`visible = false`), keep sphere segments modest, and use 3 subframes instead of 6.

## Sound (audio/ftsynth.py)

- `Mix.from_project(__file__)` reads duration, bpm and speed.
- Drums: `m.drums(bar, kick=[…], snare=[…], hats=range(…), root=midi)` on a 16-step grid; kicks duck the pads and bass automatically.
- Harmony: `m.pad(t, chord('Em9'), dur=m.bar)`, one chord per bar and the brightest on the lockup.
- UI foley: `pop()`, `keyclick()` (`m.typing(t0, t1, chars)`), `mouseclick()`, `blip()`, `pluck()` (pitched per event, e.g. ascending per letter), `bell()`.
- Movement: `m.whoosh(t, dur, f0, f1)` for passes, `m.riser(t0, t1)` and `m.suck(t0, t1)`, which end *exactly* on `t1`, `m.roll(t0, t1)`, `m.impact(t)`.
- `m.render()` applies reverb, sidechain and soft-clip, writes `out/audio.wav`, and prints integrated LUFS and true peak (aim for about -14 LUFS and ≤ -1 dBFS).

## Rendering gotchas

- Canvases are CPU-backed in render mode (`willReadFrequently`). GPU compositing of repeated `difference`/`lighter` blends produced patchy frames when averaged for motion blur.
- Film grain inflates bitrate enormously and platforms re-encode it to mush. Leave it out.
- Fonts come from `@fontsource/*` packages and are preloaded before the first frame. Include every glyph you use in `fonts.sample` (Turkish İ ı ş ğ, currency symbols) so the right unicode subsets load.
- Don't use `Math.random()`, `Date` or `performance.now()` in scenes. Use `hash(n)` and `noise1(x)`.
