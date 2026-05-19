"""Orchestrates the turn loop and agent calls. Streams everything via a callback."""
from typing import Awaitable, Callable
from .models.schemas import Session, Turn, TurnMetadata
from .agents import moderator, debater, evaluator, audience, analyst
from . import session_manager


SendFn = Callable[[dict], Awaitable[None]]


def _next_debater_index(session: Session) -> int:
    debater_turns = [t for t in session.turns if t.speaker.startswith("debater_")]
    return len(debater_turns) % session.config.debater_count


def _user_turn_count(session: Session) -> int:
    return sum(1 for t in session.turns if t.speaker == "user")


async def _stream_agent(
    session: Session,
    send: SendFn,
    speaker: str,
    stream_iter,
) -> str:
    """Stream a single-part agent (moderator, analyst) as plain text tokens."""
    await send({"type": "stream_start", "speaker": speaker})
    buf = []
    async for token in stream_iter:
        buf.append(token)
        await send({"type": "stream_token", "speaker": speaker, "token": token})
    await send({"type": "stream_end", "speaker": speaker})
    full = "".join(buf).strip()

    turn = Turn(
        turn_number=len(session.turns) + 1,
        speaker=speaker,
        content=full,
        metadata=TurnMetadata(input_method="text", word_count=len(full.split())),
    )
    session.turns.append(turn)
    session_manager.save(session)
    await send({"type": "turn_saved", "turn": turn.model_dump()})
    return full


async def _stream_debater(
    session: Session,
    send: SendFn,
    speaker: str,
    stream_iter,
) -> str:
    """Stream a debater turn that emits (part, text) tuples.

    The 'scratch' part is the model's setup/thinking; only the 'speech' part
    is meant to be displayed in the arena and spoken aloud. Both are sent to
    the client (tagged with `part`) and both are persisted on the turn so the
    UI can choose to reveal the scratchpad after the fact.
    """
    await send({"type": "stream_start", "speaker": speaker})
    scratch_buf: list[str] = []
    speech_buf: list[str] = []
    async for part, text in stream_iter:
        if part == "scratch":
            scratch_buf.append(text)
        else:
            speech_buf.append(text)
        await send({
            "type": "stream_token",
            "speaker": speaker,
            "token": text,
            "part": part,
        })
    await send({"type": "stream_end", "speaker": speaker})

    speech = "".join(speech_buf).strip()
    scratch = "".join(scratch_buf).strip() or None
    # Defensive: if the model never emitted the marker, treat everything as
    # speech so the user still hears something.
    if not speech and scratch:
        speech = scratch
        scratch = None

    turn = Turn(
        turn_number=len(session.turns) + 1,
        speaker=speaker,
        content=speech,
        scratch=scratch,
        metadata=TurnMetadata(input_method="text", word_count=len(speech.split())),
    )
    session.turns.append(turn)
    session_manager.save(session)
    await send({"type": "turn_saved", "turn": turn.model_dump()})
    return speech


async def run_intro(session: Session, send: SendFn) -> None:
    """Moderator opens. If there are debaters, first one gives opening argument."""
    await _stream_agent(session, send, "moderator", moderator.stream_open(session))

    if session.config.debater_count > 0 and session.config.debater_personalities:
        first_personality = session.config.debater_personalities[0]
        speaker = f"debater_{first_personality}"
        await _stream_debater(
            session, send, speaker,
            debater.stream_turn(session, first_personality, is_opening=True),
        )

    await send({
        "type": "timer_start",
        "seconds": session.config.time_per_turn_seconds,
    })


async def handle_user_turn(session: Session, send: SendFn, content: str, input_method: str = "text") -> None:
    """Receive user's submission, evaluate, then either AI turn or closing."""
    if not content.strip():
        content = "[No response - speaker yielded the floor]"

    user_turn = Turn(
        turn_number=len(session.turns) + 1,
        speaker="user",
        content=content,
        metadata=TurnMetadata(input_method=input_method, word_count=len(content.split())),
    )
    session.turns.append(user_turn)
    session_manager.save(session)
    await send({"type": "turn_saved", "turn": user_turn.model_dump()})

    try:
        eval_result = await evaluator.evaluate(session, user_turn)
        session.evaluations.append(eval_result)
        session_manager.save(session)
        await send({"type": "eval_complete", "evaluation": eval_result.model_dump()})
    except Exception as e:
        await send({"type": "error", "message": f"Evaluator failed: {e}"})

    if _user_turn_count(session) >= session.config.max_turns:
        await run_closing(session, send)
        return

    if session.config.debater_count > 0 and session.config.debater_personalities:
        idx = _next_debater_index(session)
        personality = session.config.debater_personalities[idx]
        speaker = f"debater_{personality}"
        await _stream_debater(session, send, speaker, debater.stream_turn(session, personality))

    await send({
        "type": "timer_start",
        "seconds": session.config.time_per_turn_seconds,
    })


async def run_closing(session: Session, send: SendFn) -> None:
    """Moderator closes. If audience configured, reveal their reactions; otherwise skip to analysis prompt."""
    await _stream_agent(session, send, "moderator", moderator.stream_close(session))
    session.status = "audience_reveal"
    session_manager.save(session)

    if session.config.audience_count == 0:
        await send({"type": "audience_reveal_start", "skipped": True})
        return

    await send({"type": "audience_reveal_start", "skipped": False})

    try:
        reactions = await audience.gather_reactions(session)
        session.audience_reactions = reactions
        session_manager.save(session)
        for r in reactions:
            await send({"type": "audience_member_ready", "reaction": r.model_dump()})
    except Exception as e:
        await send({"type": "error", "message": f"Audience failed: {e}"})


async def run_analysis(session: Session, send: SendFn) -> None:
    """Stream the final analyst report."""
    await send({"type": "stream_start", "speaker": "analyst"})
    buf = []
    try:
        async for token in analyst.stream_report(session):
            buf.append(token)
            await send({"type": "stream_token", "speaker": "analyst", "token": token})
    except Exception as e:
        await send({"type": "error", "message": f"Analyst failed: {e}"})
        return
    await send({"type": "stream_end", "speaker": "analyst"})

    report = "".join(buf).strip()
    session.report_markdown = report
    session.status = "complete"
    from datetime import datetime
    session.ended_at = datetime.utcnow().isoformat()
    session_manager.save(session)
    await send({"type": "analysis_complete", "report_markdown": report})
