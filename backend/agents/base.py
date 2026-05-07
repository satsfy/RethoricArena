"""Shared transcript builder for agent context."""
from ..models.schemas import Session, Turn
from .personas import DEBATER_PERSONALITIES


SPEAKER_LABELS = {
    "user": "HUMAN",
    "moderator": "MODERATOR",
}


def speaker_label(speaker: str) -> str:
    if speaker in SPEAKER_LABELS:
        return SPEAKER_LABELS[speaker]
    if speaker.startswith("debater_"):
        pid = speaker.replace("debater_", "")
        p = DEBATER_PERSONALITIES.get(pid)
        return p["name"].upper() if p else pid.upper()
    return speaker.upper()


def build_transcript(turns: list[Turn], exclude_evaluator: bool = True) -> str:
    """Build readable transcript string from session turns."""
    lines = []
    for t in turns:
        if exclude_evaluator and t.speaker == "evaluator":
            continue
        lines.append(f"[{speaker_label(t.speaker)}]: {t.content}")
    return "\n\n".join(lines)


def position_phrase(pos: str) -> str:
    return {
        "for": "FOR the motion (in favor)",
        "against": "AGAINST the motion (in opposition)",
        "devil": "as Devil's Advocate against the motion",
    }.get(pos, pos)


def opposing_phrase(pos: str) -> str:
    """How the AI debater opposes the user."""
    if pos == "for":
        return "AGAINST the motion. The human is FOR it."
    return "FOR the motion. The human is AGAINST it."
