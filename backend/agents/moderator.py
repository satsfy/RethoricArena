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


_OPEN_TOKENS  = {"short": 120, "medium": 200, "long": 300}
_CLOSE_TOKENS = {"short": 150, "medium": 280, "long": 420}


async def stream_open(session: Session) -> AsyncIterator[str]:
    sys = _system(session)
    max_tokens = _OPEN_TOKENS.get(session.config.response_length, _OPEN_TOKENS["short"])
    sentences = "1-2 sentences" if session.config.response_length == "short" else "2-3 sentences"
    cfg = session.config
    # The AI debater speaks first when present; otherwise the human opens.
    if cfg.debater_count > 0 and cfg.debater_personalities:
        invite = (
            "An AI debater will speak first, opposing the human's position. "
            "End by inviting that AI debater to deliver the opening argument. "
            "Do not refer to the human speaking first."
        )
    else:
        invite = (
            "There are no AI opponents in this session. "
            "End by inviting the human debater to deliver their opening statement."
        )
    user_msg = (
        f"Open the debate. Introduce the motion crisply and set the stage. "
        f"{invite} {sentences} max."
    )
    async for chunk in llm_client.stream_completion(sys, [{"role": "user", "content": user_msg}], temperature=0.7, max_tokens=max_tokens):
        yield chunk


async def stream_close(session: Session) -> AsyncIterator[str]:
    sys = _system(session)
    transcript = build_transcript(session.turns)
    max_tokens = _CLOSE_TOKENS.get(session.config.response_length, _CLOSE_TOKENS["short"])
    sentences = "2-3 sentences" if session.config.response_length == "short" else "3-4 sentences"
    user_msg = (
        f"The debate has concluded. Here is the full transcript:\n\n{transcript}\n\n"
        f"Now deliver a closing statement. Summarize the ground covered without taking sides. "
        f"{sentences}. End with a line that hands judgment to the audience."
    )
    async for chunk in llm_client.stream_completion(sys, [{"role": "user", "content": user_msg}], temperature=0.7, max_tokens=max_tokens):
        yield chunk
