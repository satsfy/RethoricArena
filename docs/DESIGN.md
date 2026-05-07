# RhetoricArena — End-to-End Design Document

> A local browser-based multi-agent debate training system powered by LLM <To Be Determined Below>.

---

## 0. Overview

RhetoricArena drops you into a live adversarial debate against one or more AI agents
that are explicitly trying to dismantle your arguments. A separate Evaluator agent
gives you Toastmasters-style feedback after each of your turns. A silent Audience
panel observes the whole session and votes at the end. A final Analyst agent produces
a comprehensive rhetorical report when you close the session.

Everything runs locally on your Ubuntu machine. The browser is the UI. The Anthropic
API is the engine.

---

## 1. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | Python 3.11 + FastAPI | Async-native, easy WebSocket support, great Anthropic SDK |
| Server | Uvicorn | ASGI server, hot-reload for dev |
| Frontend | Vanilla HTML + CSS + JS | No build step, just open in browser |
| Voice Input | Web Speech API (browser native) | Free, no external service, Chrome/Edge support |
| AI | <To Be Determined Below> | Streaming support, clean API |
| Models | <To Be Determined Below> | Balance of speed and depth |
| Real-time | WebSocket (FastAPI built-in) | Stream tokens live to browser |
| Storage | JSON files (one per session) | No DB dependency, trivially readable |
| Config | `.env` file | API key stored locally, never leaves machine |

### Key dependencies (requirements.txt)
```
fastapi
uvicorn[standard]
anthropic
python-dotenv
pydantic
```


## 2. System Architecture

```
Browser (localhost:8678)
  |
  |-- HTTP GET /          --> serves index.html + static assets
  |-- WebSocket /ws/{id}  --> bidirectional real-time channel
  |-- HTTP POST /session  --> create session, returns session_id
  |-- HTTP GET /session/{id}/report  --> fetch final report JSON
  |
FastAPI Backend
  |
  |-- DebateEngine        --> orchestrates the turn loop
  |     |-- ModeratorAgent
  |     |-- DebaterAgent x1-3
  |     |-- EvaluatorAgent
  |     |-- AudienceAgent x2-3  (called only at end)
  |     |-- AnalystAgent        (called only at end)
  |
  |-- SessionManager      --> loads/saves session state to disk
  |-- StreamingRouter     --> forwards Anthropic token stream to WebSocket
  |
storage/sessions/{session_id}.json
```

### Request/response flow for a single turn

```
User speaks (voice or text)
  --> Browser captures text
  --> WS message: { type: "user_turn", content: "..." }
  --> DebateEngine receives turn
  --> Saves Turn to session JSON
  --> Calls EvaluatorAgent (streaming)
      --> StreamingRouter sends tokens to browser as { type: "eval_token", token: "..." }
  --> Calls next DebaterAgent (streaming)
      --> StreamingRouter sends tokens to browser as { type: "debater_token", agent_id: 1, token: "..." }
  --> Sends { type: "turn_complete", next_speaker: "user", timer_seconds: 60 }
  --> Timer starts in browser
```

---

## 3. Agent System Design

Each agent is a Python class that wraps a LLM (<To Be Determined Below>) API call. They all share a common
`BaseAgent` interface: they receive the current session state (full transcript) and
return a streaming response.

### 3.1 Moderator Agent

**Model:** `<To Be Determined Below>`  
**Called:** Session open, session close, optionally between rounds if things stall  
**Purpose:** Introduces the motion, sets the stage, wraps up the debate  

**System prompt template:**
```
You are a formal debate moderator. The motion is: "{motion}".
The human debater is arguing {user_position}.
Your job is to:
- Open the debate with a crisp, authoritative introduction (2-3 sentences max)
- When closing, summarize what ground was covered without taking sides
- Keep energy high. You are not neutral on rhetoric quality — you reward sharpness.
Speak in second person to the human when addressing them directly.
Never argue a position yourself.
```

**Output format:** Plain prose, 3-5 sentences max per call.

---

### 3.2 Debater Agent(s)

**Model:** `<To Be Determined Below>`  
**Called:** Once per AI turn (after user turn, or to open the debate)  
**Instances:** 1-3, each with a distinct personality  
**Purpose:** Argue the opposing side aggressively and intelligently  

**Configurable personalities (user picks at session config):**

| ID | Name | Style |
|---|---|---|
| `rigorous` | The Academic | Cites studies, logical syllogisms, demands definitions, exposes vague claims |
| `populist` | The Firebrand | Emotional appeals, rhetorical questions, re-frames issues for the crowd |
| `socratic` | The Questioner | Never asserts; only asks questions that expose contradictions in your argument |
| `pragmatist` | The Realist | "That sounds nice in theory, but in practice..." — always grounds you |
| `devil` | The Contrarian | Finds the most uncomfortable counterpoint in everything you say |

**System prompt template:**
```
You are {name}, a debater with the following style: {style_description}.
The motion is: "{motion}". You are AGAINST the human debater's position.

Your job in each turn:
1. Directly attack the weakest point in the human's last argument
2. Advance your own strongest point on the motion
3. If another AI debater spoke before you, you may briefly agree or add to their point

Rules:
- Be sharp, not cruel. Wit over heat.
- Keep responses to 120-180 words. Punchy. No fluff.
- Never summarize what the human said — just engage with it.
- Difficulty level: {difficulty}. At "brutal" level, do not give an inch.
- End with a question or challenge that forces the human to respond.
```

**Context passed:** Full transcript (all turns so far), tagged by speaker.

**Difficulty effect on prompting:**

| Difficulty | Modifier |
|---|---|
| Warm-Up | "Be patient. Acknowledge any valid points the human makes before countering." |
| Standard | No modifier. |
| Hard | "Give no credit to the human's arguments. Find the flaw in everything." |
| Brutal | "Treat every human turn as if it was delivered by someone who has no idea what they're talking about. Expose this clearly." |

---

### 3.3 Evaluator Agent

**Model:** `<To Be Determined Below>`  
**Called:** Immediately after each user turn  
**Purpose:** Toastmasters-style feedback card shown to user before the next AI turn  
**Visibility:** Only the user sees this. The debaters do NOT have evaluator output in their context.  

**System prompt:**
```
You are a Toastmasters-certified speech evaluator and rhetoric coach.
You just heard a debater's response in a live debate. Evaluate ONLY their turn — not the
whole debate. Be specific. Be kind but honest. Never be vague.

Return a JSON object with exactly these fields:
{
  "structure_score": <1-10>,
  "logic_score": <1-10>,
  "rhetoric_score": <1-10>,
  "highlight": "<one specific thing they did well, max 20 words>",
  "blind_spot": "<the one thing their argument left exposed, max 25 words>",
  "tip": "<one concrete, actionable improvement for the NEXT turn, max 30 words>",
  "flair_moment": "<a vivid one-liner summarizing their performance, like a sports commentator>"
}

Do not include any prose outside the JSON object.
```

**How scores are used in the UI:**
- Shown as a slide-in card after each user turn
- Three animated score bars
- `highlight` and `tip` shown as large text
- `flair_moment` shown in a stylized banner
- Card auto-dismisses after 12 seconds or user clicks "Continue"

---

### 3.4 Audience Agent(s)

**Model:** `<To Be Determined Below>`  
**Called:** Once at the very end of the session  
**Instances:** 2-3, each with a distinct persona  
**Purpose:** Give independent impressions of the debate and cast a vote  
**During the debate:** Silent. They do not generate any output mid-session.  

**Configurable personas:**

| ID | Name | Persona |
|---|---|---|
| `academic` | Prof. Chen | Evaluates logical rigor and evidence quality |
| `undecided_voter` | Maya | Emotionally driven, responds to narrative and relatability |
| `policy_wonk` | Dmitri | Cares about practical feasibility and specificity |
| `skeptic` | Ren | Starts hostile to all positions, needs to be won over |
| `rhetorician` | Isabella | Judges purely on rhetorical craft, style, and delivery |

**System prompt template:**
```
You are {name}. {persona_description}.
You watched a full debate on the motion: "{motion}".
The human was arguing {user_position}.

Now give your honest reaction. Return a JSON object with:
{
  "first_impression": "<your gut reaction after the first human turn, max 30 words>",
  "turning_point": "<the moment that most changed your view, max 40 words>",
  "what_won_you_over": "<or what failed to. max 40 words>",
  "vote": "pro" | "con" | "undecided",
  "vote_reasoning": "<2 sentences max>",
  "message_to_speaker": "<direct, honest advice to the human, max 40 words>"
}
```

**Context passed:** Full session transcript only. No evaluator data.

---

### 3.5 Analyst Agent

**Model:** `<To Be Determined Below>`  
**Called:** Once, after audience votes are collected  
**Purpose:** Full session report with rhetorical arc analysis  

**System prompt:**
```
You are a master rhetoric coach and competitive debate judge with 20 years of experience.
You have just watched a full debate session. You have access to:
- The full transcript (every turn by every speaker)
- The per-turn evaluator scores and notes
- The audience member reactions and votes

Produce a comprehensive post-session analysis. Format it in clean markdown with these sections:

## Overall Performance
A 3-4 sentence holistic summary. What was the human's game?

## Scores Summary
A table: Structure | Logic | Rhetoric | Presence | Overall (average the per-turn evaluator scores)

## Rhetorical Arc
How did the human's performance change over the session? Did they warm up? Fade? Peak early?
Reference specific turns.

## Best Moment
Quote the human's strongest argument verbatim (or near-verbatim) and explain why it landed.

## Critical Weakness
The single most persistent flaw. Be specific. Give an example from the session.

## What the Audience Saw
Synthesize the audience votes and reactions into a coherent picture.

## If You Did This Again Tomorrow
Three concrete, specific, actionable recommendations. Numbered. No fluff.

## Verdict
One punchy final sentence.
```

**Context passed:** Full transcript + all evaluator JSON outputs + all audience JSON outputs.

---

## 4. Data Models

All session data is stored as a single JSON file: `storage/sessions/{session_id}.json`

### Session
```json
{
  "id": "uuid",
  "created_at": "ISO8601",
  "ended_at": "ISO8601 or null",
  "status": "config | active | audience_reveal | complete",
  "config": {
    "motion": "AI should replace human judges in criminal courts",
    "user_position": "against",
    "difficulty": "hard",
    "time_per_turn_seconds": 60,
    "debater_count": 2,
    "debater_personalities": ["rigorous", "socratic"],
    "audience_count": 3,
    "audience_personas": ["academic", "undecided_voter", "skeptic"]
  },
  "turns": [ ...Turn objects... ],
  "evaluations": [ ...Evaluation objects... ],
  "audience_reactions": [ ...AudienceReaction objects... ],
  "report_markdown": "string or null"
}
```

### Turn
```json
{
  "id": "uuid",
  "turn_number": 4,
  "speaker": "user | moderator | debater_rigorous | debater_socratic | evaluator",
  "content": "The full text of the turn",
  "timestamp": "ISO8601",
  "metadata": {
    "input_method": "voice | text",
    "word_count": 134,
    "duration_seconds": 47
  }
}
```

### Evaluation
```json
{
  "turn_id": "uuid referencing a user turn",
  "structure_score": 7,
  "logic_score": 5,
  "rhetoric_score": 8,
  "highlight": "Strong opening analogy that grounded the abstract claim",
  "blind_spot": "Left the burden-of-proof challenge completely unanswered",
  "tip": "Address the Questioner's last question directly before pivoting to your own point",
  "flair_moment": "Confident entrance, shaky middle, strong landing"
}
```

### AudienceReaction
```json
{
  "persona_id": "academic",
  "name": "Prof. Chen",
  "first_impression": "Promising framing but relied on assertion over evidence",
  "turning_point": "Turn 6 — the human finally cited a real-world example",
  "what_won_you_over": "The closing reframe was genuinely clever",
  "vote": "undecided",
  "vote_reasoning": "Strong rhetoric, weak evidence base. I'd need more.",
  "message_to_speaker": "You're a natural speaker. Now learn to be a rigorous one."
}
```

---

## 5. Debate Flow — State Machine

```
[CONFIG]
  User sets: motion, position, difficulty, debater count/styles,
             audience personas, time per turn
  --> Click "Enter the Arena"

[INTRO]
  ModeratorAgent generates opening (streamed to browser)
  First DebaterAgent makes opening argument (streamed)
  --> Timer starts for user

[USER_TURN]
  Browser shows countdown timer
  User speaks (Web Speech API transcribes) or types
  On submit OR timer expiry:
    - Turn saved
    - State --> EVALUATION

[EVALUATION]
  EvaluatorAgent called with user's turn text
  Evaluation card slides in (streamed JSON parsed on completion)
  Timer: 12 seconds auto-dismiss, or user clicks "Continue"
  --> State --> AI_TURN

[AI_TURN]
  Determine next debater (round-robin if multiple)
  DebaterAgent generates response (streamed)
  On completion:
    - Turn saved
    - If session_turn_count < max_turns: --> USER_TURN
    - Else: --> CLOSING

[CLOSING]
  ModeratorAgent generates closing statement
  --> State --> AUDIENCE_REVEAL

[AUDIENCE_REVEAL]
  All AudienceAgents called in parallel (Promise.all equivalent)
  Dramatic reveal animation in browser
  Audience members appear one by one
  Each member: notes revealed (typewriter) --> vote flips
  Final tally shown
  --> "View Full Analysis" button --> State --> ANALYSIS

[ANALYSIS]
  AnalystAgent called with full context
  Report streamed into the report view
  User can scroll, save, start new session
  Report saved to session JSON

[COMPLETE]
  Session file finalized
```

### Turn limits
- Default: 6 user turns (configurable 3-10)
- Each "round" = 1 AI turn + 1 user turn
- With 2 debaters: both speak before user responds (counts as one round)

---

## 6. WebSocket Protocol

The frontend and backend communicate exclusively over a single WebSocket per session.

### Frontend --> Backend messages

```json
{ "type": "user_turn", "content": "The text of what the user said", "input_method": "voice" }
{ "type": "skip_evaluation" }
{ "type": "end_session_early" }
{ "type": "ping" }
```

### Backend --> Frontend messages

```json
{ "type": "session_ready", "config": { ...session config... } }
{ "type": "stream_start", "speaker": "moderator | debater_rigorous | evaluator | analyst" }
{ "type": "stream_token", "speaker": "debater_rigorous", "token": "But" }
{ "type": "stream_end", "speaker": "debater_rigorous" }
{ "type": "turn_saved", "turn": { ...Turn object... } }
{ "type": "eval_complete", "evaluation": { ...Evaluation object... } }
{ "type": "timer_start", "seconds": 60 }
{ "type": "audience_reveal_start" }
{ "type": "audience_member_ready", "reaction": { ...AudienceReaction object... } }
{ "type": "analysis_complete", "report_markdown": "..." }
{ "type": "error", "message": "..." }
```

---

## 7. UI/UX Design

### Aesthetic direction: "The Colosseum"
Dark, high-contrast, arena energy. Think debate hall meets broadcast studio.
Stone-and-steel color palette. Sharp typography. Tension in every interaction.

**Color palette:**
- Background: `#0e0e0f` (near-black)
- Surface: `#1a1a1d`
- Border: `#2e2e35`
- Accent: `#e8c547` (amber/gold — debate trophy energy)
- Danger/timer: `#e84747` (red for low time)
- Text primary: `#f0ede6` (warm white)
- Text muted: `#7a7a8a`

**Typography:**
- Display/headings: `Playfair Display` (gravitas, oratory tradition)
- Body/transcript: `IBM Plex Mono` (clean, court-record feel)
- UI labels: `DM Sans`

---

### Screen 1: Config / Lobby

```
┌─────────────────────────────────────────────────────────────────┐
│  RHETORIC ARENA                                     [amber logo] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   THE MOTION                                                    │
│   ┌────────────────────────────────────────────────────────┐   │
│   │  "This house believes that..."                         │   │
│   │  [user types the motion here]                          │   │
│   └────────────────────────────────────────────────────────┘   │
│                                                                 │
│   YOUR POSITION        [FOR]  [AGAINST]  [DEVIL'S ADVOCATE]    │
│                                                                 │
│   OPPONENTS            [1]  [2]  [3]                           │
│   Debater 1:           [The Academic ▼]                        │
│   Debater 2:           [The Questioner ▼]                      │
│                                                                 │
│   AUDIENCE             [2]  [3]                                │
│   Member 1:            [Prof. Chen ▼]                          │
│   Member 2:            [Maya ▼]                                │
│   Member 3:            [Dmitri ▼]                              │
│                                                                 │
│   DIFFICULTY           ●─────────────○  [Hard]                 │
│   TIME PER TURN        [30s] [60s] [90s] [2min]                │
│   MAX TURNS            [━━━━●━━━━] 6                           │
│                                                                 │
│   INPUT METHOD         [🎤 Voice]  [⌨️  Text]                   │
│                                                                 │
│            ┌────────────────────────────┐                      │
│            │      ENTER THE ARENA       │                      │
│            └────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

**UX notes:**
- Motion field has placeholder examples that cycle on focus
- Personality dropdowns show a one-line description on hover
- "Enter the Arena" button is disabled until motion + position are filled
- On click: brief screen flash, then arena loads

---

### Screen 2: The Arena (main debate view)

```
┌─────────────────────────────────────────────────────────────────┐
│ ◈ RHETORIC ARENA   [MOTION PILL: "AI should replace judges..."] │
│                                              Turn 3/6  [■ End]  │
├──────────────────────────────────┬──────────────────────────────┤
│  ARENA                           │  AUDIENCE                    │
│                                  │                              │
│  ┌──────────────────────────┐   │  ○ Prof. Chen                │
│  │ THE ACADEMIC             │   │    observing...              │
│  │ ══════════════════════   │   │                              │
│  │ "Your claim rests on a   │   │  ○ Maya                      │
│  │  false equivalence.      │   │    observing...              │
│  │  Define 'justice'        │   │                              │
│  │  before you invoke it."  │   │  ○ Dmitri                    │
│  └──────────────────────────┘   │    observing...              │
│                                  │                              │
│  ┌──────────────────────────┐   │  [silhouettes are greyed,    │
│  │ THE QUESTIONER           │   │   reveal at end]             │
│  │ ──── ● Speaking ────     │   │                              │
│  │ "Can you give me a       │   │                              │
│  │  single case where..."   │   │                              │
│  │  [tokens streaming in]   │   │                              │
│  └──────────────────────────┘   │                              │
│                                  │                              │
├──────────────────────────────────┴──────────────────────────────┤
│  TRANSCRIPT                                           [▲ scroll] │
│  ─────────────────────────────────────────────────────────────  │
│  [MODERATOR] Welcome to the arena. The motion before us...      │
│  [ACADEMIC]  The burden of proof lies with the affirmative...   │
│  [YOU]       The current system has demonstrable failure...     │
│  [ACADEMIC]  Failure by whose metric? You've assumed...         │
│  [YOU]       ▌ (current turn shown here while typing/speaking)  │
├─────────────────────────────────────────────────────────────────┤
│  YOUR TURN                                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  [text area or voice waveform visualization]           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [🎤 HOLD TO SPEAK]   [⌨️ TYPE]       ●●●●●●●●●● 00:42         │
│                                       [timer bar drains, red <10s]│
└─────────────────────────────────────────────────────────────────┘
```

**UX notes on the Arena:**
- Debater panels pulse amber when actively streaming
- Speaking indicator is a subtle animated dot
- Transcript is scrollable; current turn is pinned to bottom
- Timer bar drains left-to-right; turns red at 10 seconds
- At 0 seconds: whatever is in the input box is auto-submitted
- Voice mode: hold the mic button, speak, release to submit
- Text mode: type and hit Enter or Submit
- "End Session Early" button always visible in header

---

### Screen 3: Evaluator Card (slides in after each user turn)

```
┌─────────────────────────────────────────────────────────┐
│  EVALUATOR FEEDBACK — Turn 3                   [✕ skip]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  STRUCTURE  ████████░░  7/10                            │
│  LOGIC      █████░░░░░  5/10                            │
│  RHETORIC   ████████░░  8/10                            │
│                                                          │
│  ⭐ HIGHLIGHT                                            │
│  "Strong analogy in your opening — it grounded          │
│   an abstract claim immediately."                        │
│                                                          │
│  ⚠ BLIND SPOT                                            │
│  "You never addressed the burden of proof               │
│   challenge from The Academic."                          │
│                                                          │
│  → TIP FOR NEXT TURN                                    │
│  "Answer the Questioner's question directly,            │
│   then pivot — don't skip past it."                     │
│                                                          │
│  ─────────────────────────────────────────────          │
│  "Confident entrance, shaky middle, strong landing."    │
│  ─────────────────────────────────────────────          │
│                                                          │
│              [ CONTINUE TO NEXT ROUND ]                  │
└─────────────────────────────────────────────────────────┘
```

**UX notes:**
- Card slides in from the right over the arena
- Score bars animate up on appear
- Auto-dismisses after 12 seconds (countdown shown)
- Clicking anywhere outside the card also dismisses it
- Card data is saved; user can review all cards in final report

---

### Screen 4: Audience Reveal

```
┌─────────────────────────────────────────────────────────────────┐
│                      THE VERDICT                                 │
│           "The audience has made their decision."                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────────────────┐  ┌────────────────────┐               │
│   │  PROF. CHEN        │  │  MAYA              │               │
│   │  The Academic      │  │  The Undecided     │               │
│   │                    │  │                    │               │
│   │  "Promising start, │  │  "You finally      │               │
│   │   weak on          │  │   spoke to me in   │               │
│   │   evidence."       │  │   turn 5."         │               │
│   │                    │  │                    │               │
│   │   [ UNDECIDED ]    │  │   [    FOR    ]    │               │
│   └────────────────────┘  └────────────────────┘               │
│                                                                  │
│   ┌────────────────────┐                                        │
│   │  DMITRI            │       TALLY                            │
│   │  The Policy Wonk   │                                        │
│   │                    │       FOR:       1                     │
│   │  "Too abstract.    │       AGAINST:   1                     │
│   │   No policy path." │       UNDECIDED: 1                     │
│   │                    │                                        │
│   │  [  AGAINST  ]     │                                        │
│   └────────────────────┘                                        │
│                                                                  │
│                [ VIEW FULL ANALYSIS ]                            │
└─────────────────────────────────────────────────────────────────┘
```

**UX notes:**
- Audience silhouettes were visible but greyed during the debate
- On this screen: dramatic "lights up" animation reveals them
- Each card fades in sequentially (0.5s apart)
- Notes appear with typewriter effect
- Vote flips in with a card-flip animation (amber for FOR, grey for AGAINST, white for UNDECIDED)
- Tally increments as each vote reveals

---

### Screen 5: Final Analysis Report

```
┌─────────────────────────────────────────────────────────────────┐
│  POST-DEBATE ANALYSIS                           [💾 Save Report] │
├───────────────────────┬─────────────────────────────────────────┤
│  OVERVIEW             │                                          │
│  TURN-BY-TURN         │  ## Overall Performance                  │
│  RECOMMENDATIONS      │  You entered with confidence and a clear │
│  RAW TRANSCRIPT       │  thesis. However, you repeatedly...      │
│                       │                                          │
│  ─────────────────    │  ## Scores Summary                       │
│  Session: 32 min      │  | Metric    | Score |                   │
│  Turns: 6/6           │  | Structure | 7.2   |                   │
│  Voice: yes           │  | Logic     | 5.8   |                   │
│  Words spoken: 812    │  | Rhetoric  | 7.9   |                   │
│                       │  | Overall   | 7.0   |                   │
│                       │                                          │
│                       │  ## Rhetorical Arc                       │
│                       │  Streamed in here, full markdown...      │
│                       │                                          │
│                       │  [continues scrolling]                   │
├───────────────────────┴─────────────────────────────────────────┤
│  [ 🔄 NEW SESSION ]                [ 📄 SAVE AS MARKDOWN ]       │
└─────────────────────────────────────────────────────────────────┘
```

**UX notes:**
- Report streams in live (user watches it being written)
- Left sidebar has section navigation
- "Save as Markdown" downloads the report as a `.md` file
  (named `rhetoric-arena-{date}-{motion-slug}.md`)
- Raw Transcript tab shows the full session transcript, speaker-tagged

---

## 8. Voice Input Design

The Web Speech API is used for real-time transcription. It is entirely browser-side.

**Browser support:** Chrome (best), Edge (good), Firefox (partial). Recommend Chrome.

**Flow:**
1. User holds the mic button (or toggles it)
2. `SpeechRecognition.start()` begins
3. `onresult` events feed interim transcripts into the text area live
4. On button release: `SpeechRecognition.stop()`
5. Final transcript from `event.results` is submitted as the turn
6. If the timer hits 0 while voice is active: `stop()` is called and result is submitted automatically

**Filler word detection (client-side):**
As interim results come in, the frontend scans for filler words (`um`, `uh`, `like`, `you know`, `basically`, `sort of`) and highlights them in amber in the live transcript area. This is cosmetic only during the turn; the evaluator agent does its own analysis post-turn.

**Fallback:** If voice fails (permission denied, browser unsupported), the UI silently falls back to text input mode.

---

## 9. Context Management Strategy

LLM model <To Be Determined Below> has a context window limit. Long sessions will accumulate large transcripts.

**Strategy: Rolling summary compression**

- Turns 1-4: always included verbatim in agent context
- Turns 5+: a rolling summary is generated every 4 turns by calling `<To Be Determined Below>` with:
  ```
  Summarize the following debate turns into 150 words max, preserving:
  - Key arguments made by each side
  - Claims that were left unanswered
  - Any significant rhetorical moves
  ```
- This summary replaces the older turns in the context sent to agents
- The raw turns are always stored in the session JSON (for the final analyst)
- The Analyst Agent receives the FULL raw transcript at the end (it only runs once)

**Estimated context usage per agent call:**
- Debater (mid-session, 6 turns): ~2,000-4,000 tokens
- Evaluator: ~500-800 tokens (only needs user's last turn)
- Audience (end): ~5,000-8,000 tokens
- Analyst (end): ~10,000-15,000 tokens

---

## 10. File & Folder Structure

```
rhetoric-arena/
│
├── backend/
│   ├── main.py                    # FastAPI app, routes, WebSocket handler
│   ├── debate_engine.py           # Orchestrates turn loop and agent calls
│   ├── session_manager.py         # Load/save session JSON files
│   ├── streaming.py               # Routes Anthropic stream to WebSocket
│   │
│   ├── agents/
│   │   ├── base_agent.py          # Shared interface: build_context(), call(), stream()
│   │   ├── moderator.py
│   │   ├── debater.py             # Instantiated per personality
│   │   ├── evaluator.py
│   │   ├── audience.py            # Instantiated per persona
│   │   └── analyst.py
│   │
│   ├── prompts/
│   │   ├── moderator.txt          # System prompt templates
│   │   ├── debater_base.txt
│   │   ├── debater_personalities/ # One file per personality
│   │   │   ├── rigorous.txt
│   │   │   ├── socratic.txt
│   │   │   └── ...
│   │   ├── evaluator.txt
│   │   ├── audience_base.txt
│   │   ├── audience_personas/
│   │   │   ├── academic.txt
│   │   │   └── ...
│   │   └── analyst.txt
│   │
│   ├── models/
│   │   └── schemas.py             # Pydantic models for Session, Turn, Evaluation, etc.
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── index.html                 # Serves config screen and arena (SPA)
│   ├── css/
│   │   └── styles.css             # All styles, CSS variables, animations
│   └── js/
│       ├── app.js                 # Main controller, screen routing
│       ├── config.js              # Config screen logic
│       ├── arena.js               # Arena screen logic, turn management
│       ├── speech.js              # Web Speech API wrapper
│       ├── timer.js               # Countdown timer component
│       ├── websocket.js           # WS connection, message dispatch
│       ├── evaluator_card.js      # Evaluator card render and dismiss
│       ├── audience_reveal.js     # Audience reveal animation
│       └── report.js              # Report screen, markdown rendering
│
├── storage/
│   └── sessions/                  # Auto-created, one JSON per session
│
├── .env.example                   # ANTHROPIC_API_KEY=sk-ant-...
├── .env                           # (gitignored)
├── .gitignore
└── README.md
```

---

## 11. Local Setup (README contents)

```bash
# 1. Clone or create the project
mkdir rhetoric-arena && cd rhetoric-arena

# 2. Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 3. Set your API key
cp .env.example .env
# Edit .env and add your API KEY for LLM <To Be Determined Below>

# 4. Run the server
uvicorn backend.main:app --reload --port 8678

# 5. Open the app
# Open Chrome and go to: http://localhost:8678
# Chrome is required for Web Speech API voice input
```

The frontend is served as static files by FastAPI. No separate frontend server needed.

---

## 12. API Routes (FastAPI)

```
GET  /                        Serve index.html
GET  /static/{path}           Serve CSS/JS assets

POST /session                 Create a new session
                              Body: SessionConfig
                              Returns: { session_id: uuid }

GET  /session/{id}            Get current session state

GET  /session/{id}/report     Get final report markdown

WS   /ws/{session_id}         Main real-time channel (one per session)

GET  /sessions                List all past sessions (for history)

DELETE /session/{id}          Delete a session and its file
```

---

## 13. Configuration Options (User-facing)

All of these are set in the Config screen before a session starts:

| Setting | Options | Default |
|---|---|---|
| Motion | Free text | (required) |
| User position | For / Against / Devil's Advocate | Against |
| Difficulty | Warm-Up / Standard / Hard / Brutal | Standard |
| Time per turn | 30s / 60s / 90s / 120s | 60s |
| Max turns | 3-10 | 6 |
| Debater count | 1 / 2 / 3 | 2 |
| Debater personalities | dropdown per slot | Academic, Questioner |
| Audience count | 2 / 3 | 3 |
| Audience personas | dropdown per slot | Chen, Maya, Dmitri |
| Input method | Voice / Text | Voice |
| Auto-submit on timer | On / Off | On |

---

## 14. Edge Cases & Considerations

**User submits empty turn:** If timer expires and input is empty, auto-submit with a placeholder
`"[No response - speaker yielded the floor]"`. The evaluator will note this as a forfeit of the turn.

**API timeout / error mid-stream:** Display a red error banner. Allow user to retry the current turn.
Session state is not corrupted because turns are only saved on completion.

**Very long user turns (wall-of-text):** Evaluator prompt instructs it to evaluate up to 300 words;
anything beyond is noted as "over time" in the feedback.

**Session accidentally closed:** The session JSON is always up-to-date after each turn.
Re-loading the app could show a "Resume last session?" prompt (stretch goal).

**Parallel audience API calls:** All audience agents are called in parallel at session end
using `asyncio.gather()`. This is intentional: they should not influence each other.

**Privacy:** Nothing leaves the machine except API calls to Anthropic. No analytics, no database,
no cloud storage. Session files live in `storage/sessions/` on disk.

**Rate limits:** Anthropic rate limits apply. At "Brutal" difficulty with 3 debaters, each AI turn
makes 3 sequential API calls. This is fine for personal use but worth noting.

---

## 15. Stretch Goals (Post-MVP)

- **Session history browser** — view and replay past sessions
- **Custom debater personas** — user writes their own personality prompts
- **Scoring over time** — track rhetoric scores across multiple sessions with charts
- **Export to PDF** — pretty-printed session report
- **Debate modes** — Oxford format, Socratic dialogue mode, press conference mode
- **Steelman mode** — debaters first steelman your position, THEN attack it
- **Recording** — capture actual audio + transcript for playback
- **Multi-user mode** — you and a friend vs the AI panel (same LAN)

---

*Design version 1.0 — ready for implementation.*

------------

## MODEL DISCUSSION - The solution 

Good, I have everything I need. Here's the honest breakdown:

---

## Current API Prices (May 2026, per 1M tokens)

| Model | Input | Output | Vibe |
|---|---|---|---|
| **Claude Haiku 4.5** | ~$0.80 | ~$4.00 | Your current "cheap" option |
| **Claude Sonnet 4.6** | ~$3.00 | ~$15.00 | Your current "too much" option |
| **GPT-5.4 Mini** | ~$0.75 | ~$3.00 | Comparable to Haiku |
| **Gemini 2.5 Flash-Lite** | $0.10 | $0.40 | Very cheap, solid quality |
| **Gemini 2.5 Flash** | $0.30 | $2.50 | Great sweet spot |
| **DeepSeek V4 Flash** | $0.14 | $0.28 | Cheapest serious model |
| **DeepSeek V4 Pro** | $0.44\* | $0.87\* | Promo price until May 31 |

*\*DeepSeek V4 Pro is 75% off right now through May 31, after that it reverts to ~$1.74/$3.48.*

---

## My recommendation: **DeepSeek V4 Flash** as the main workhorse

Here's why it fits RhetoricArena specifically:

**Cost for a 30-min session estimate:**
- With Haiku: ~$0.15-0.40
- With DeepSeek V4 Flash: **~$0.02-0.06**. Essentially free for personal use.

DeepSeek V4 Flash is a 284B MoE model with only 13B parameters active at inference time, running at 83 tokens/second, and recommended for chat, coding, and high-volume pipelines. That speed matters a lot for your use case since the debate agents need to stream responses fast enough to feel live.

The DeepSeek API uses OpenAI-compatible endpoints, which means if you build with the design we made (using the OpenAI Python SDK pointed at a different base URL), switching from Claude to DeepSeek is literally two lines of code:

```python
# Change this:
base_url = "https://api.anthropic.com"
# To this:
base_url = "https://api.deepseek.com"
```

DeepSeek V4 automatically caches prompt prefixes. When subsequent requests share the same prefix, cached tokens are billed at just 20% of the normal input rate, with no setup required. For RhetoricArena this is huge, because every agent call reuses the same system prompt + the same growing transcript. You'd effectively pay cache prices on 60-80% of your input tokens after the first turn.

---

## Suggested model split for RhetoricArena

| Agent | Recommended | Why |
|---|---|---|
| Debaters (x1-3) | DeepSeek V4 Flash | Fast streaming, needs to feel snappy |
| Evaluator | DeepSeek V4 Flash | Structured JSON output, simple task |
| Audience (x2-3) | DeepSeek V4 Flash | Called once at end, no rush |
| Analyst | DeepSeek V4 Pro (or Gemini 2.5 Flash) | The one place you want depth |

Using DeepSeek V4 Pro for just the Analyst (one call per session) is basically free even at full price. During the current promo it's especially worth it.

---

## The Gemini angle

Gemini 2.5 Flash-Lite at $0.10/$0.40 per million tokens is Google's most cost-effective option, and Google offers a free tier with up to 1,500 requests per day on Flash models via Google AI Studio. That free tier is genuinely useful for testing, but the API is less OpenAI-compatible than DeepSeek and the integration is slightly more work.

**Gemini 2.5 Flash** ($0.30/$2.50) is the better pick if you want Google, not Flash-Lite. It has proper reasoning built in and is excellent at following complex system prompts, which matters for persona-heavy agents.

---

## Bottom line

For your use case (personal, local, low volume), **DeepSeek V4 Flash** is the call. It's the cheapest capable model on the market right now, the API is a drop-in for OpenAI's format, streaming works cleanly, and the quality is solidly in the "Haiku tier" for conversational tasks while being 5-10x cheaper. If you want a fallback or prefer not to deal with a Chinese provider, **Gemini 2.5 Flash** is the runner-up.