"""Debater agent.

Each turn produces two parts in a single LLM call:

  1. A short SETUP (the model's scratchpad: what to attack, the angle, the
     concrete claim, how to avoid sounding scripted).
  2. The actual SPEECH (what gets shown in the arena and spoken aloud).

The setup exists for two reasons. First, it gives the model space to burn off
its default openers ("That sounds nice in theory...", "While X may seem...")
and formulaic closers ("Name one example of...") *before* it commits to the
spoken answer. Second, it gives the human a window into the model's reasoning
when the UI is configured to reveal it.

Parts are separated by a literal marker:

    <<<SPEECH>>>

Everything before the marker is setup; everything after is speech. The parser
below tolerates the marker being split across streaming chunks.
"""
import re
from typing import AsyncIterator, Tuple
from .base import build_transcript, opposing_phrase
from .personas import DEBATER_PERSONALITIES, DIFFICULTY_MODIFIERS
from ..models.schemas import Session
from .. import llm_client


_LENGTH_WORDS = {"short": "60-80", "medium": "120-160", "long": "200-260"}
# Bumped a bit to leave room for the setup section.
_LENGTH_TOKENS = {"short": 500, "medium": 700, "long": 950}

# Canonical marker the prompt asks for. The parser also accepts common
# misspellings the model tends to produce: <<SPEECH>>, <<<SPEECH>>, [SPEECH],
# ===SPEECH===, **SPEECH**. The contract is that "SPEECH" appears on its own
# line surrounded by some kind of bracket/decoration.
SPEECH_MARKER = "<<<SPEECH>>>"
_MARKER_RE = re.compile(
    r'(?:<+|\[+|=+|\*+)\s*SPEECH\s*(?:>+|\]+|=+|\*+)',
    re.IGNORECASE,
)
# Pattern for stray marker-decoration lines (lone "<<", ">>", "===", "***")
# that the model sometimes scatters around the marker. Stripped only from the
# very head of the speech section.
_DECOR_LINE_RE = re.compile(r'^\s*[<>=*\[\]]+\s*$', re.MULTILINE)
# Max bytes any tolerated marker variant can occupy; we hold this many bytes
# back at the tail of the scratch buffer so a marker split across chunks is
# still detectable.
_MARKER_LOOKBACK = 32


def _system(session: Session, personality_id: str) -> str:
    cfg = session.config
    p = DEBATER_PERSONALITIES.get(personality_id, DEBATER_PERSONALITIES["rigorous"])
    diff_mod = DIFFICULTY_MODIFIERS.get(cfg.difficulty, DIFFICULTY_MODIFIERS["standard"])
    words = _LENGTH_WORDS.get(cfg.response_length, _LENGTH_WORDS["short"])

    return f"""You are {p['name']}, a debater. Your style:
{p['style']}

THE MOTION: "{cfg.motion}"
You are debating {opposing_phrase(cfg.user_position)}

How you debate:
- Engage with what the human ACTUALLY said. Quote a specific phrase if it sharpens the attack.
- Pick ONE weak point and pressure it. Don't try to refute everything in one turn.
- Make a positive case of your own, not only attacks. State a claim and give a concrete reason or example.
- Speak in first person, in your own voice. Never break character. Never reference being an AI.
- Aim for {words} words in the SPEECH portion. Punchy. No filler.

HARD RULES (these are not stylistic suggestions, they are constraints):
- Do NOT open with formulaic phrases. Banned openers include: "That sounds nice in theory, but...", "While X may seem Y...", "You make an interesting point, however...", "Let me address...", "Ah, yes, the classic...", "Make no mistake,...". Just start with your argument.
- Do NOT end with a generic "name one example of X" or "tell me one case where Y" challenge. Those sound scripted and unnatural. Vary your endings: sometimes a sharp claim, sometimes a reframing, sometimes a sliver of concession, sometimes a real question only if the question genuinely lands.
- Do NOT recap what the human said back to them.
- Do NOT use "First, ... Second, ... Finally, ..." scaffolding in a short turn.
- No em-dashes. No semicolons. No throat-clearing ("it's worth noting that", "at its core").
- Don't be cruel. Be sharp.

Difficulty: {cfg.difficulty}. {diff_mod}

================================================================
OUTPUT FORMAT (mandatory):

First write a SETUP block: 2 to 4 short, honest sentences for yourself.
Cover, roughly:
  - what is the human's actual weakest move (quote the phrase if useful)
  - what angle you'll take
  - what your one positive claim is
  - one ending move you will NOT use, so you don't reach for it

Then on its own line write the marker EXACTLY as shown, with all 12
characters intact (three left angle brackets, the word SPEECH in caps,
three right angle brackets, nothing else):

{SPEECH_MARKER}

Then write the SPEECH: your actual debate response. Only the text after
the marker is shown to the audience and spoken aloud. The setup is your
private scratchpad. Be direct and unpolished in it. Do not include the
word "SETUP:" or any header inside the setup, and do not put the marker
anywhere except on its own line between the two sections.
================================================================
"""


class _SetupSpeechParser:
    """Splits a streamed response into ('scratch', text) and ('speech', text) parts.

    Handles the marker being split across chunks by holding back a small tail
    buffer (just under the marker length) until we either see the marker or
    know it can't be there.
    """

    def __init__(self) -> None:
        self.buf = ""
        self.in_speech = False
        self._speech_emitted = False

    def _emit_speech(self, results, text):
        if not self._speech_emitted:
            text = text.lstrip("\r\n\t ")
            # Eat any leading decoration-only lines (">>", "===", "***", "[]"
            # etc.) the model sometimes scatters around the marker before the
            # real speech begins.
            while text:
                m = re.match(r'^[<>=*\[\]]+\s*(?:\n|$)', text)
                if not m:
                    break
                text = text[m.end():].lstrip("\r\n\t ")
            # Also handle a leftover prefix on the SAME line as the first real
            # sentence ("> Privacy is...").
            text = re.sub(r'^[<>=*\[\]]+\s*', '', text)
            if not text:
                # Whole chunk was decoration. Stay in pre-emit mode so the
                # next chunk gets the same cleanup.
                return
            self._speech_emitted = True
        results.append(("speech", text))

    def feed(self, chunk: str):
        results = []
        if not chunk:
            return results
        self.buf += chunk

        if self.in_speech:
            text = self.buf
            self.buf = ""
            self._emit_speech(results, text)
            return results

        m = _MARKER_RE.search(self.buf)
        if m:
            scratch_part = self.buf[:m.start()]
            after = self.buf[m.end():]
            if scratch_part:
                results.append(("scratch", scratch_part))
            self.in_speech = True
            self.buf = ""
            if after:
                self._emit_speech(results, after)
            return results

        # Marker not seen yet. Flush everything except a tail that *could* still
        # be a partial marker (or a partial variant of one). Holding back a
        # generous lookback window keeps us correct even when the model splits
        # the marker across many tiny streaming chunks.
        if len(self.buf) > _MARKER_LOOKBACK:
            emit = self.buf[:-_MARKER_LOOKBACK]
            self.buf = self.buf[-_MARKER_LOOKBACK:]
            if emit:
                results.append(("scratch", emit))
        return results

    def flush(self):
        if not self.buf:
            return []
        text = self.buf
        self.buf = ""
        if self.in_speech:
            results = []
            self._emit_speech(results, text)
            return results
        return [("scratch", text)]


async def stream_turn(
    session: Session,
    personality_id: str,
    is_opening: bool = False,
) -> AsyncIterator[Tuple[str, str]]:
    """Yield (part, text) tuples where part is 'scratch' or 'speech'."""
    sys = _system(session, personality_id)
    transcript = build_transcript(session.turns)
    max_tokens = _LENGTH_TOKENS.get(session.config.response_length, _LENGTH_TOKENS["short"])

    if is_opening:
        user_msg = (
            "You are opening the debate as the first AI speaker. The human has not spoken yet, "
            "so do your setup as: what's the sharpest opening angle against the human's position, "
            "what concrete claim or example will you anchor on, and how will you avoid a scripted "
            "opener or closer.\n\n"
            "Then deliver your opening argument in the SPEECH portion. Stake your strongest claim "
            "and give one concrete reason or example. Do NOT end on a generic challenge question."
        )
    else:
        user_msg = (
            f"Here is the debate transcript so far:\n\n{transcript}\n\n"
            "Now deliver your next turn. In the SETUP, identify the one weakest move in the human's "
            "last argument (quote the phrase if helpful) and pick your angle. In the SPEECH, "
            "respond to that move directly, then advance your own positive claim with a concrete "
            "reason or example. End however the moment calls for; do NOT default to 'name one X' "
            "or 'tell me one case where Y'."
        )

    parser = _SetupSpeechParser()
    async for chunk in llm_client.stream_completion(
        sys,
        [{"role": "user", "content": user_msg}],
        temperature=0.85,
        max_tokens=max_tokens,
    ):
        for part, text in parser.feed(chunk):
            yield part, text
    for part, text in parser.flush():
        yield part, text
