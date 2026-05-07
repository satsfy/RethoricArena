from typing import AsyncIterator
from .base import build_transcript, position_phrase
from ..models.schemas import Session
from .. import llm_client


def _system(session: Session) -> str:
    cfg = session.config
    return f"""You are a formal debate moderator presiding over a live debate.
The motion is: "{cfg.motion}".
The human debater is arguing {position_phrase(cfg.user_position)}.

Rules:
- Speak in second person to the human when addressing them directly.
- Never argue a position yourself.
- Keep energy high. Reward sharpness implicitly through tone.
- Be crisp and authoritative. 2-4 sentences maximum per call.
- No throat-clearing, no platitudes."""


async def stream_open(session: Session) -> AsyncIterator[str]:
    sys = _system(session)
    user_msg = (
        "Open the debate. Introduce the motion crisply and set the stage. "
        "Then invite the first AI debater to speak. 2-3 sentences max."
    )
    async for chunk in llm_client.stream_completion(sys, [{"role": "user", "content": user_msg}], temperature=0.7, max_tokens=300):
        yield chunk


async def stream_close(session: Session) -> AsyncIterator[str]:
    sys = _system(session)
    transcript = build_transcript(session.turns)
    user_msg = (
        f"The debate has concluded. Here is the full transcript:\n\n{transcript}\n\n"
        "Now deliver a closing statement. Summarize the ground covered without taking sides. "
        "3-4 sentences. End with a line that hands judgment to the audience."
    )
    async for chunk in llm_client.stream_completion(sys, [{"role": "user", "content": user_msg}], temperature=0.7, max_tokens=400):
        yield chunk
