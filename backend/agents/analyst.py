from typing import AsyncIterator
import json
from .base import build_transcript, position_phrase
from ..models.schemas import Session
from .. import llm_client


SYSTEM = """You are a master rhetoric coach and competitive debate judge with 20 years of experience.
You have just watched a full debate session. You have access to the full transcript, per-turn
evaluator scores, and audience reactions.

Produce a comprehensive post-session analysis in clean GitHub-flavored markdown with these sections:

## Overall Performance
A 3-4 sentence holistic summary. What was the human's game?

## Scores Summary
A markdown table: | Metric | Score | with rows for Structure, Logic, Rhetoric, and Overall (the average of the three). Use one decimal.

## Rhetorical Arc
How did the human's performance change over the session? Did they warm up, fade, peak early? Reference specific turns.

## Best Moment
Quote the human's strongest argument verbatim or near-verbatim and explain why it landed.

## Critical Weakness
The single most persistent flaw. Be specific. Give an example from the session.

## What the Audience Saw
Synthesize the audience votes and reactions into a coherent picture.

## If You Did This Again Tomorrow
Three concrete, specific, actionable recommendations. Numbered. No fluff.

## Verdict
One punchy final sentence.

Style rules: avoid em-dashes, avoid hedging language, write with the directness of a coach giving honest feedback after a real fight."""


async def stream_report(session: Session) -> AsyncIterator[str]:
    transcript = build_transcript(session.turns)
    evals_dump = json.dumps([e.model_dump() for e in session.evaluations], indent=2)
    audience_dump = json.dumps([a.model_dump() for a in session.audience_reactions], indent=2)

    user_msg = (
        f"Motion: \"{session.config.motion}\"\n"
        f"Human position: {position_phrase(session.config.user_position)}\n"
        f"Difficulty: {session.config.difficulty}\n\n"
        f"FULL TRANSCRIPT:\n{transcript}\n\n"
        f"PER-TURN EVALUATOR SCORES:\n{evals_dump}\n\n"
        f"AUDIENCE REACTIONS:\n{audience_dump}\n\n"
        "Now produce the full markdown analysis."
    )

    async for chunk in llm_client.stream_completion(
        SYSTEM,
        [{"role": "user", "content": user_msg}],
        temperature=0.6,
        max_tokens=2500,
    ):
        yield chunk
