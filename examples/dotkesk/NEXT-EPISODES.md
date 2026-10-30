# dotkesk: episodes 08–13 (proposals, not produced yet)

Six new 9:16 shorts written against [`BRIEF.md`](BRIEF.md). The first seven episodes sold features one at a time: tracking, refunds, carts. This set moves the series to the brief's main message, **"Not a chatbot. An AI Shopping Agent."**, and to its core idea that *the conversation is the new shopping interface*.

Status: **content only.** No `voice.py`, `scene.js` or audio exists yet. Each episode below has its narration as ready-to-paste `LINES`, the picture line by line, the kit pieces it needs, a claims check and a post caption. Answer the remaining [open questions](#open-questions) before production; episodes 11–13 depend on them.

| # | Title | Brief category | One thing to remember | ~Length |
|---|---|---|---|---|
| 08 | Not a chatbot | A · education (titles 1, 4) | A chatbot sends a link; an agent shows the right products in the chat | 22 s |
| 09 | Say it like you would to a friend | C · demo (titles 2, 7, 11) | Customers describe the need; the agent finds matches in the real catalog | 24 s |
| 10 | The next interface | D · future (titles 3, 12) | Search box and filters are the old interface; conversation is the next one | 21 s |
| 11 | Your agent, your rules | C · demo (titles 5, 8) | You decide what the agent answers and when a person takes over | 23 s |
| 12 | One inbox | B · problem → solution (title 9) | Every conversation in one place, with its status and history | 21 s |
| 13 | What are your customers asking? | B · problem → solution | Conversations show what your product pages are missing | 23 s |

Shared across all six:
- **Look:** light theme, hero glass, voice A, paged captions.
- **Structure:** the turn (logo forms on "dotkesk"), then proof, payoff, and the standard end card.
- **Last line every time:** `Follow @dotkesk, and book your free demo.`
- **Timing:** narration runs at about 2.7 words a second. Each episode's spoken lines total 40–55 words.

---

## 08 · Not a chatbot

**Hook (first 1.5 s, on screen):** a split screen labelled `CHATBOT` | `AI SHOPPING AGENT`. On the left, an old bot bubble: *"Click here to see our products → "*.

| key | narration | picture |
|---|---|---|
| hook | Your customer asked for running shoes. Your chatbot sent a link. | Left pane: the customer's bubble *"Running shoes for rainy days?"*, then the bot's reply: a link plus menu buttons `1 Orders · 2 Returns · 3 Other`. The right pane is greyed out. |
| pain | Click here. Pick a category. Try the filters. Good luck. | The link opens a category page. On each phrase, filter chips multiply (Size · Colour · Price · Brand · Surface · Width…). The pointer wanders and the page greys. |
| turn | dotkesk is not a chatbot. It's an AI shopping agent. | The chips break into dots and fly into the logo on "dotkesk". The split label flips to `AI SHOPPING AGENT` and the left pane slides away. |
| proof | It asks what they need, finds the right products in your catalog, and shows them right in the chat. | Chat: the agent asks *"Trail or road? What size?"*; the customer replies *"Road, 42."*; a **product carousel** of three cards (photo, name, price, size chips) springs into the chat on "shows them". One card is tapped and its size 42 lights up. |
| payoff | Turn conversations into commerce. | The carousel card's *Add to cart* is pressed. Payoff check: **"Not a chatbot."**, sub *"An AI Shopping Agent"*. |
| end | Follow @dotkesk, and book your free demo. | End card |

```python
LINES = [
    {'key': 'hook', 'text': 'Your customer asked for running shoes. Your chatbot sent a link.', 'min': 3.25},
    {'key': 'pain', 'text': 'Click here. Pick a category. Try the filters. Good luck.', 'min': 3.0},
    {'key': 'turn', 'text': "dotkesk is not a chatbot. It's an AI shopping agent.", 'say': "Dot-kesk is not a chatbot. It's an A.I. shopping agent.", 'min': 3.25},
    {'key': 'proof', 'text': 'It asks what they need, finds the right products in your catalog, and shows them right in the chat.', 'min': 6.0},
    {'key': 'payoff', 'text': 'Turn conversations into commerce.', 'min': 2.5},
    END,
]
```

- **New kit piece:** `productCarousel(items)`, a horizontal row of 2–3 product cards inside a chat slot (photo, name, price, variant chips). Episodes 09 and 13 reuse it.
- **Claims:** the chatbot side is a generic pattern, not a named competitor (§12). "Turn conversations into commerce" is the brief's own slogan, used as a purpose.
- **Placeholders:** the product names and prices on the three cards, and size 42.
- **Caption:** *Your store deserves more than a chatbot. A chatbot sends a link; an AI shopping agent asks what your customer needs and shows the right products right in the chat. 👉 Free demo: link in bio #aiagent #ecommerce #conversationalcommerce #chatbot #onlinestore #dotkesk*

---

## 09 · Say it like you would to a friend

**Hook:** a blinking chat input on a clean screen; the customer's sentence types itself.

| key | narration | picture |
|---|---|---|
| hook | What if your customers could just say what they want? | An empty store search box shrinks into the corner; a chat input grows in the centre. |
| ask | A birthday gift for a friend. Around sixty dollars. She loves minimal design. | The sentence types into the input word by word with the voice, then sends as a bubble. |
| turn | dotkesk understands the need, not just the keywords. | The logo forms. **Through the agent's eyes:** three phrases lift out of the bubble as tags (`GIFT` · `≈ $60` · `MINIMAL`). |
| proof | It searches your real catalog and shows three matches, with photos, prices and colours, right in the chat. | A grid of catalog tiles (24 items) filters down as the tags apply: non-matching tiles drop out, three remain and fly into the chat as a carousel. On "colours" each card's colour dots light up. |
| payoff | Let customers discover products through conversation. | The customer taps a colour on one card; payoff: **"Found in one conversation."** |
| end | Follow @dotkesk, and book your free demo. | End card |

```python
LINES = [
    {'key': 'hook', 'text': 'What if your customers could just say what they want?', 'min': 3.0},
    {'key': 'ask', 'text': 'A birthday gift for a friend. Around sixty dollars. She loves minimal design.', 'min': 4.25},
    {'key': 'turn', 'text': 'dotkesk understands the need, not just the keywords.', 'say': 'Dot-kesk understands the need, not just the keywords.', 'min': 3.0},
    {'key': 'proof', 'text': 'It searches your real catalog and shows three matches, with photos, prices and colours, right in the chat.', 'min': 6.5},
    {'key': 'payoff', 'text': 'Let customers discover products through conversation.', 'min': 2.75},
    END,
]
```

- **New kit pieces:** `typeInput(text, words)` (an input that types in step with the word times) and the carousel from 08.
- **Claims:** "your real catalog" matches brief §1. No claim about how often it finds the right product.
- **Placeholders:** the $60 budget (the brief's example is 2,000 TL; a Turkish version would use that), the three products and their colours.
- **Caption:** *What if your customers could just say what they want? "A birthday gift, around $60, she loves minimal design." Your AI shopping agent finds matches in your own catalog and shows them right in the chat. 👉 Free demo: link in bio #conversationalcommerce #productdiscovery #aiagent #ecommerce #dotkesk*

---

## 10 · The next interface

A brand film, closer to the brief's vision (§6) than to a demo. Kinetic type and UI morphs, no customer story.

| key | narration | picture |
|---|---|---|
| hook | Search box. Filters. Category pages. | Each named piece snaps onto an empty page and builds the classic store layout as a wireframe: search bar, filter sidebar, product grid. |
| old | That's how online shopping has always worked. | The layout settles and gets a little busier (more filters, pagination). The camera pulls back; it looks like every store. |
| shift | But your customers don't think in filters. They think in sentences. | On "filters" the sidebar crumbles into the logo's dashes. On "sentences" the search bar stretches into a chat input and a sentence types itself: *"Something warm for a weekend in the mountains."* |
| turn | At dotkesk, we believe the next interface for commerce is a conversation. | The logo forms. The grid reorganises into a conversation: bubble, three product cards, a reply. |
| payoff | The future of shopping starts with a conversation. | The words *"starts with a conversation."* rise as kinetic type over the chat. |
| end | Follow @dotkesk, and book your free demo. | End card |

```python
LINES = [
    {'key': 'hook', 'text': 'Search box. Filters. Category pages.', 'min': 2.75},
    {'key': 'old', 'text': "That's how online shopping has always worked.", 'min': 2.75},
    {'key': 'shift', 'text': "But your customers don't think in filters. They think in sentences.", 'min': 3.75},
    {'key': 'turn', 'text': 'At dotkesk, we believe the next interface for commerce is a conversation.', 'say': 'At dot-kesk, we believe the next interface for commerce is a conversation.', 'min': 4.0},
    {'key': 'payoff', 'text': 'The future of shopping starts with a conversation.', 'min': 2.75},
    END,
]
```

- **New kit piece:** `wireStore()`, a wireframe store page whose parts (search, sidebar, grid) can be pulled apart and turned into dots.
- **Claims:** "we believe" keeps it a vision (brief §6), not a market claim. No dates and no "twenty years".
- **Placeholders:** the example sentence only.
- **Caption:** *Search box. Filters. Category pages. That's how online shopping has always worked. We believe the next interface for commerce is a conversation. #agenticcommerce #futureofecommerce #conversationalcommerce #aiagent #dotkesk*
- **Note:** this one sells nothing directly, which the brief asks for (§12: not every post is a sales pitch). The end card's demo button still closes it.

---

## 11 · Your agent, your rules

**Hook:** the objection itself, in big type: *"Will the AI say the wrong thing?"*

| key | narration | picture |
|---|---|---|
| hook | Worried an AI will say the wrong thing to your customers? | The question is set as kinetic type; a chat bubble behind it wobbles. |
| turn | With dotkesk, you set the rules. | The logo forms and lands as the avatar of an **agent settings** card. |
| rules | What it answers. Which steps it follows. When a person takes over. | Three sections fill in on the three phrases. **Answers:** `Products ✓ · Shipping ✓ · Returns ✓ · Custom pricing ✗`. **Steps:** `Order status → find order → send tracking`. **Hand over when:** `customer asks for a person · refund above $200 · order is damaged`. Toggles switch on word by word. |
| proof | A customer asks for a manager? The chat goes to your team, with the whole conversation attached. | Chat: *"Can I talk to a manager?"*. The matching rule lights up in the card, then a handoff card appears: `Handed to Selin · Support`, with the conversation's timeline sliding in beside it. |
| payoff | Automation and people, working together. | Two avatars, the logo disc and a person, side by side; payoff **"You decide."** |
| end | Follow @dotkesk, and book your free demo. | End card |

```python
LINES = [
    {'key': 'hook', 'text': 'Worried an AI will say the wrong thing to your customers?', 'min': 3.25},
    {'key': 'turn', 'text': 'With dotkesk, you set the rules.', 'say': 'With dot-kesk, you set the rules.', 'min': 2.5},
    {'key': 'rules', 'text': 'What it answers. Which steps it follows. When a person takes over.', 'min': 4.5},
    {'key': 'proof', 'text': 'A customer asks for a manager? The chat goes to your team, with the whole conversation attached.', 'min': 5.75},
    {'key': 'payoff', 'text': 'Automation and people, working together.', 'min': 2.5},
    END,
]
```

- **New kit piece:** `ruleCard(sections)`, the agent-settings card: titled sections, rows with toggles, and a rule that can light up when it fires.
- **Claims:** brief §3 (workflow management, handoff criteria). It never says the AI will not make mistakes; the point is the business's control. "With the whole conversation attached" assumes the handoff carries the history ([open question 3](#open-questions)).
- **Placeholders:** the rule values ($200, the topic list) and Selin · Support.
- **Caption:** *Worried an AI will say the wrong thing? With dotkesk you decide what your agent answers, which steps it follows and exactly when a person takes over. Automation and people, working together. 👉 Free demo: link in bio #aiagent #customerservice #humanhandoff #ecommerce #dotkesk*

---

## 12 · One inbox

Episode 03 joined channels to the store. This one is the **team's view**: the inbox the team works from every morning.

| key | narration | picture |
|---|---|---|
| hook | Monday, nine a.m. Messages everywhere. | Notification cards rain in from several channels and pile up; the clock reads 9:00. |
| pain | Which ones did the AI handle? Which ones need you? | The pile shakes. Two question marks appear as kinetic type over it. |
| turn | dotkesk puts every conversation in one inbox. | The cards break into dots that orbit into the logo, which docks at the top of an **inbox** window. The cards drop in as tidy rows. |
| proof | Handled by AI, waiting for your team, or resolved. Each one with the customer's full history. | Three status tabs light up on their words (`AI handling · Needs you · Resolved`, counts as placeholders). One row is tapped and a side panel opens: tags `VIP · Lead`, the order history, the AI's replies, and `Assigned: Selin · Sales` (the site's demo labels). |
| payoff | Every conversation, under control. | The *Needs you* tab empties to 0 with a check; payoff **"One inbox."** |
| end | Follow @dotkesk, and book your free demo. | End card |

```python
LINES = [
    {'key': 'hook', 'text': 'Monday, 9 a.m. Messages everywhere.', 'say': 'Monday, nine A.M. Messages everywhere.', 'min': 2.5},
    {'key': 'pain', 'text': 'Which ones did the AI handle? Which ones need you?', 'min': 3.25},
    {'key': 'turn', 'text': 'dotkesk puts every conversation in one inbox.', 'say': 'Dot-kesk puts every conversation in one inbox.', 'min': 3.0},
    {'key': 'proof', 'text': "Handled by AI, waiting for your team, or resolved. Each one with the customer's full history.", 'min': 5.75},
    {'key': 'payoff', 'text': 'Every conversation, under control.', 'min': 2.25},
    END,
]
```

- **New kit piece:** `inboxWindow(rows, tabs)`, a list of conversations with channel dot, name, last message and status chip, plus a detail side panel.
- **Claims:** brief §3 (unified inbox). The rows can use all six live channels: WhatsApp, Instagram, Telegram, Messenger, e-mail and web chat. The status tabs must match the real product's statuses ([open question 4](#open-questions)).
- **Placeholders:** names, messages, tab counts, Selin · Sales.
- **Caption:** *Monday, 9 a.m., messages everywhere. Which ones did the AI handle, and which ones need you? dotkesk puts every conversation in one inbox, each with its status and the customer's full history. 👉 Free demo: link in bio #unifiedinbox #customerexperience #ecommerce #aiagent #dotkesk*

---

## 13 · What are your customers asking?

Analytics shown with concrete labels, not a generic dashboard (the series rule against meaningless charts). Every number on screen carries a **Sample data** tag.

| key | narration | picture |
|---|---|---|
| hook | Do you know what your customers asked most this week? | Question bubbles stream past, too fast to read. |
| turn | dotkesk shows you. | The bubbles sort themselves into dots and gather into the logo, which opens an **analytics** card tagged `Sample data`. |
| proof | How many conversations came in, the questions that keep coming back, and which chats needed a person. | Three blocks on the three phrases: a 7-day bar chart of conversations; a *Top questions* list (*"Does it run small?" · "When will it ship?" · "Is it machine-washable?"*, with counts); a *Handed to team* ring. |
| insight | So you can fix the product page, instead of answering the same question again. | The top question lifts out of the list, flies onto a product page and becomes a line in its details: *"Machine-washable at 30°."* A check appears. |
| payoff | Every conversation is a signal. | The bars ripple into dots; payoff **"Listen to your conversations."** |
| end | Follow @dotkesk, and book your free demo. | End card |

```python
LINES = [
    {'key': 'hook', 'text': 'Do you know what your customers asked most this week?', 'min': 3.0},
    {'key': 'turn', 'text': 'dotkesk shows you.', 'say': 'Dot-kesk shows you.', 'min': 2.0, 'extra': 0.25},
    {'key': 'proof', 'text': 'How many conversations came in, the questions that keep coming back, and which chats needed a person.', 'min': 6.0},
    {'key': 'insight', 'text': 'So you can fix the product page, instead of answering the same question again.', 'min': 4.25},
    {'key': 'payoff', 'text': 'Every conversation is a signal.', 'min': 2.25},
    END,
]
```

- **New kit piece:** `analyticsCard(blocks)`, with a bar chart, a ranked list and a ring, a `Sample data` tag built in, and a list row that can fly out.
- **Claims:** brief §3 (analytics: volume, interactions, support processes). No conversion, revenue or "time saved" figures (§8F, §12). Whether *Top questions* exists as a view in the product is [open question 2](#open-questions).
- **Placeholders:** all numbers, the questions, the product line.
- **Caption:** *Do you know what your customers asked most this week? dotkesk shows the conversations, the questions that keep coming back, and the chats that needed a person, so you can fix the product page instead of answering the same question again. #ecommerceanalytics #customerinsights #aiagent #ecommerce #dotkesk*

---

## Open questions

These change what can be shown. Answer them before production.

1. ~~**Live channels and integrations today.**~~ **Answered (2026-10-30): everything on the site is live.** Channels: WhatsApp, Instagram, Telegram, Messenger, e-mail, web chat. Stores: ikas, Shopify, WooCommerce. Episodes 03 and 04 are fine as they are; episode 12 can show all six channels on its rows.
2. **Analytics.** Is there a *top questions / topics* view, or only volume and handoff counts? If only the latter, episode 13's middle block becomes "busiest hours" or "most-asked-about products".
3. **Handoff.** Does the person who takes over see the whole conversation and the order? Is there a configurable rules screen (episode 11) or is it set up for the customer?
4. **Inbox statuses.** What does the product call the statuses (e.g. *AI handling / Needs you / Resolved*)?
5. **Product cards in chat.** Do the cards show price and variants (colour, size) today, on which channels (web chat only, or WhatsApp too)? Affects 08 and 09.
6. **End card tagline.** Keep "AI Commerce OS" (the site's wording) or switch to "AI Shopping Agent" (the brief's positioning) for 08–13?
7. **Real screenshots.** Screenshots of the real inbox, agent settings and analytics would let these be rebuilt from the real UI (brief §8C, §10) instead of drawn from the site's demo.

## Production notes

- Suggested order: **08 → 09 → 10 → 11 → 12 → 13**. 08–10 can start now; question 5 only affects how much the carousel cards show. 11–13 still depend on questions 2–4.
- Each episode follows the usual path: copy `examples/dotkesk-07`, paste `LINES` (with `END` as in the other `voice.py` files), then `voice.py → sound.py → sheet → render`. Voice A is unchanged.
- New kit pieces to build once and reuse: `productCarousel`, `typeInput`, `wireStore`, `ruleCard`, `inboxWindow`, `analyticsCard`.
- Add each episode's placeholders and caption to `POSTS.md` when it is produced.
