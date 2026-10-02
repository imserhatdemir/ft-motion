# dotkesk-agents: a 64 s launch film for dotkesk's AI agent builder (English)

A 16:9, 120 BPM product film for [dotkesk](https://dotkesk.com) ("AI Commerce OS"). The palette is the logo's lime → green on a light ground, with navy ink.

| Bars | Time | Scene |
|---|---|---|
| 0–3 | 0–8 s | 3:12 a.m. The clock flips from 03:11 to 03:12, and a closed shop sits on a green planet. Customer messages rain in from WhatsApp, Instagram and Telegram, and the unread counter climbs. |
| 4–5 | 8–12 s | The dotkesk mark arrives and takes orbit. A green arc goes out to every bubble, each one gets a check, and the badge reads "All answered". |
| 6–7 | 12–16 s | The camera dives into the sphere, a light wave washes the frame, and the lockup builds: the mark, "dotkesk", AI COMMERCE OS. |
| 8 | 16–18 s | The real AI Agents page in a browser window with a lime/green halo. The cursor clicks **New Agent**. |
| 9–12 | 18–26 s | The flow editor. Nodes are dragged from the list and connected: Message Received → Fixed Message → Search Knowledge Base → Generate Reply → Send Message. |
| 13–17 | 26–36 s | The camera pushes in on the Search Knowledge Base panel (Hybrid RAG; 5 / 0.18 / 1800), then Generate Reply (tone, max characters), then **Active** and **Save**. |
| 18–21 | 36–44 s | A test chat. The question runs through the flow (the nodes light up in order), followed by the greeting and the answer. |
| 22 | 44–46 s | The window pulls back and the mark pops out, flooding the frame. |
| 23–28 | 46–58 s | Six cards: Flow Builder · Hybrid RAG · Track Shipment · Hand Off to Human · Templates · Evaluation. |
| 29–31 | 58–64 s | "Try it at dotkesk.com", then the end card. |

```bash
node ft.mjs sheet examples/dotkesk-agents 24
python examples/dotkesk-agents/sound.py     # ≈ -14 LUFS, ≤ -1 dBTP
node ft.mjs render examples/dotkesk-agents
```

**The mark** (`logo.js`) is rebuilt from the supplied 1024 px logo. The sphere and its gradient were sampled from it. The three orbit rings were fitted to the 52 visible dot centroids: centre (513, 511), 27° rotation, 0.6 axis ratio. Every dot keeps its measured arc position, size and angle, so the still mark matches the master to a hairline. `spin` moves the dots along their orbits, and `rings` / `sphere` build it in. On light grounds it sits on its navy badge, as in the app's sidebar.

**The app UI** is redrawn from screenshots of `app.dotkesk.com/agents` in screenshot pixels, scaled by `APP`, so positions match the real layout. Turkish UI strings are shown in English.

**Copy and VO.** Copy lives in `COPY.en` and caption timing in `CAP_AT`. Captions double as a voice-over script; save a read as `vo.wav` and `sound.py` mixes it in.

**Placeholders.** The 3:12 time, the "47 unread" count, the customer messages, the agent name "Order Assistant", the channel chip "@mystore", the test-chat question and the store's shipping answer are all invented.
