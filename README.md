# RhetoricArena

Sharpen your arguments against AI opponents that fight back. RhetoricArena puts you on the clock, scores your reasoning in real time, and tells you exactly where you lost the room.

Pick any motion, choose your opponents, and step into the arena.

![Debate setup screen](docs/assets/image%20copy%202.png)

Two AI debaters argue their side out loud via TTS. When it's your turn, hold the mic and make your case — you have 60 seconds. No notes, no retakes.

![Live debate arena](docs/assets/image.png)

The moment you finish speaking, an evaluator breaks down your structure, logic, and rhetoric — and tells you the one thing you need to fix next turn.

![Evaluator feedback panel](docs/assets/Screenshot%20from%202026-05-07%2014-34-33.png)

At the end, the audience delivers their verdict: were they convinced? Each member explains why — or why not.

![Audience verdict](docs/assets/image%20copy.png)

## Setup

Install chrome and get a DeepSeek API key. Recommended OS: Ubuntu.

```bash
# 1. Create venv and install deps
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 2. Set your API key (already in .env if you got this from the source)
# .env should contain:
#   deepseek_api_key=sk-...

# 3. Run the server
uvicorn backend.main:app --reload --port 8000

# 4. Open in Chrome (recommended for voice input)
# http://localhost:8000
```

## Architecture

- `backend/` — FastAPI app, agents, debate engine
- `frontend/` — vanilla HTML/CSS/JS, no build step
- `storage/sessions/` — auto-created, one JSON per session

## Agents

| Agent | When | Purpose |
|---|---|---|
| Moderator | Open + close | Frames the debate |
| Debater(s) | Each AI turn | Argue the opposing side |
| Evaluator | After each user turn | Toastmasters-style feedback |
| Audience | At end | Independent reactions and votes |
| Analyst | At end | Full rhetorical report |

All run on `deepseek-chat`. Cost per session is roughly a few cents.

## Voice input

Uses the browser-native Web Speech API. Chrome only. Hold the mic button, speak, release to populate the input box. Submit normally.
