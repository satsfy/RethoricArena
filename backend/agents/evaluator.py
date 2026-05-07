import json
from .base import build_transcript
from ..models.schemas import Session, Turn, Evaluation
from .. import llm_client


SYSTEM = """You are a Toastmasters-certified speech evaluator and rhetoric coach.
You just heard a debater's response in a live debate. Evaluate ONLY their turn, not the whole debate.
Be specific. Be kind but honest. Never be vague.

Return ONLY a JSON object with exactly these fields and nothing else:
{
  "structure_score": <integer 1-10>,
  "logic_score": <integer 1-10>,
  "rhetoric_score": <integer 1-10>,
  "highlight": "<one specific thing they did well, max 20 words>",
  "blind_spot": "<the one thing their argument left exposed, max 25 words>",
  "tip": "<one concrete actionable improvement for the next turn, max 30 words>",
  "flair_moment": "<a vivid one-liner like a sports commentator, max 15 words>"
}"""


async def evaluate(session: Session, user_turn: Turn) -> Evaluation:
    context_transcript = build_transcript([t for t in session.turns if t.id != user_turn.id])
    user_msg = (
        f"Motion: \"{session.config.motion}\"\n"
        f"The human is arguing {session.config.user_position}.\n\n"
        f"Recent debate context:\n{context_transcript[-2000:] if context_transcript else '(this is the first turn)'}\n\n"
        f"The human's turn to evaluate:\n\"\"\"\n{user_turn.content}\n\"\"\"\n\n"
        "Return the JSON evaluation now."
    )

    raw = await llm_client.complete(
        SYSTEM,
        [{"role": "user", "content": user_msg}],
        temperature=0.5,
        max_tokens=600,
        response_format={"type": "json_object"},
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {}

    def _clamp(v, default=5):
        try:
            n = int(v)
            return max(1, min(10, n))
        except (ValueError, TypeError):
            return default

    return Evaluation(
        turn_id=user_turn.id,
        structure_score=_clamp(data.get("structure_score")),
        logic_score=_clamp(data.get("logic_score")),
        rhetoric_score=_clamp(data.get("rhetoric_score")),
        highlight=str(data.get("highlight", "") or "")[:200],
        blind_spot=str(data.get("blind_spot", "") or "")[:300],
        tip=str(data.get("tip", "") or "")[:300],
        flair_moment=str(data.get("flair_moment", "") or "")[:200],
    )
