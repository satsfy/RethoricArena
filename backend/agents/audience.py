import json
import asyncio
from .base import build_transcript, position_phrase
from .personas import AUDIENCE_PERSONAS
from ..models.schemas import Session, AudienceReaction
from .. import llm_client


def _system(name: str, description: str) -> str:
    return f"""You are {name}. {description}
You watched a full live debate from start to finish.

Return ONLY a JSON object with exactly these fields:
{{
  "first_impression": "<your gut reaction after the human's first turn, max 30 words>",
  "turning_point": "<the moment that most changed your view, reference a specific turn, max 40 words>",
  "what_won_you_over": "<what won you over, or what failed to. max 40 words>",
  "vote": "pro" | "con" | "undecided",
  "vote_reasoning": "<2 sentences max>",
  "message_to_speaker": "<direct, honest, in-character advice to the human, max 40 words>"
}}

The vote should be cast from your own ideological lens. "pro" means you side with the motion, "con" means against."""


async def _react(session: Session, persona_id: str) -> AudienceReaction:
    persona = AUDIENCE_PERSONAS.get(persona_id)
    if not persona:
        persona = AUDIENCE_PERSONAS["academic"]
        persona_id = "academic"

    transcript = build_transcript(session.turns)
    user_msg = (
        f"Motion: \"{session.config.motion}\"\n"
        f"The human argued {position_phrase(session.config.user_position)}.\n\n"
        f"Full transcript:\n\n{transcript}\n\n"
        "Now give your honest reaction as JSON."
    )

    raw = await llm_client.complete(
        _system(persona["name"], persona["description"]),
        [{"role": "user", "content": user_msg}],
        temperature=0.8,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {}

    vote = data.get("vote", "undecided")
    if vote not in ("pro", "con", "undecided"):
        vote = "undecided"

    return AudienceReaction(
        persona_id=persona_id,
        name=persona["name"],
        first_impression=str(data.get("first_impression", "") or "")[:300],
        turning_point=str(data.get("turning_point", "") or "")[:400],
        what_won_you_over=str(data.get("what_won_you_over", "") or "")[:400],
        vote=vote,
        vote_reasoning=str(data.get("vote_reasoning", "") or "")[:400],
        message_to_speaker=str(data.get("message_to_speaker", "") or "")[:400],
    )


async def gather_reactions(session: Session) -> list[AudienceReaction]:
    persona_ids = session.config.audience_personas[: session.config.audience_count]
    return await asyncio.gather(*[_react(session, pid) for pid in persona_ids])
