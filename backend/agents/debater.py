from typing import AsyncIterator
from .base import build_transcript, opposing_phrase
from .personas import DEBATER_PERSONALITIES, DIFFICULTY_MODIFIERS
from ..models.schemas import Session
from .. import llm_client


_LENGTH_WORDS = {"short": "60-80", "medium": "120-160", "long": "200-260"}
_LENGTH_TOKENS = {"short": 250, "medium": 450, "long": 700}


def _system(session: Session, personality_id: str) -> str:
    cfg = session.config
    p = DEBATER_PERSONALITIES.get(personality_id, DEBATER_PERSONALITIES["rigorous"])
    diff_mod = DIFFICULTY_MODIFIERS.get(cfg.difficulty, DIFFICULTY_MODIFIERS["standard"])
    words = _LENGTH_WORDS.get(cfg.response_length, _LENGTH_WORDS["short"])

    return f"""You are {p['name']}, a debater with this style:
{p['style']}

The motion is: "{cfg.motion}".
You are debating {opposing_phrase(cfg.user_position)}

Your job each turn:
1. Directly attack the weakest point in the human's last argument.
2. Advance your own strongest point on the motion.
3. If another AI debater spoke before you in this exchange, you may briefly build on their point.

Rules:
- Be sharp, not cruel. Wit over heat.
- {words} words. Punchy. No filler.
- Never summarize what the human said. Engage with it directly.
- End with a question or challenge that forces the human to respond.
- Speak in first person, in your own distinctive voice.
- Never break character. Never reference being an AI.

Difficulty: {cfg.difficulty}. {diff_mod}"""


async def stream_turn(session: Session, personality_id: str, is_opening: bool = False) -> AsyncIterator[str]:
    sys = _system(session, personality_id)
    transcript = build_transcript(session.turns)
    max_tokens = _LENGTH_TOKENS.get(session.config.response_length, _LENGTH_TOKENS["short"])

    if is_opening:
        user_msg = (
            "You are opening the debate as the first AI speaker. Lay out your strongest opening "
            "argument against the human's position. End with a sharp challenge that demands a response."
        )
    else:
        user_msg = (
            f"Here is the debate transcript so far:\n\n{transcript}\n\n"
            "Now deliver your next turn. Respond to the human's last argument first, then advance your own point. "
            "End with a challenge or question."
        )

    async for chunk in llm_client.stream_completion(
        sys,
        [{"role": "user", "content": user_msg}],
        temperature=0.85,
        max_tokens=max_tokens,
    ):
        yield chunk
