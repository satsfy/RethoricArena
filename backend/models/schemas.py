from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.utcnow().isoformat()


class SessionConfig(BaseModel):
    motion: str
    user_position: Literal["for", "against", "devil"] = "against"
    difficulty: Literal["warmup", "standard", "hard", "brutal"] = "standard"
    time_per_turn_seconds: int = 60
    max_turns: int = 6
    debater_count: int = 2
    debater_personalities: list[str] = Field(default_factory=lambda: ["rigorous", "socratic"])
    audience_count: int = 3
    audience_personas: list[str] = Field(default_factory=lambda: ["academic", "undecided_voter", "policy_wonk"])
    input_method: Literal["voice", "text"] = "text"
    response_length: Literal["short", "medium", "long"] = "short"


class TurnMetadata(BaseModel):
    input_method: str = "text"
    word_count: int = 0
    duration_seconds: int = 0


class Turn(BaseModel):
    id: str = Field(default_factory=_uuid)
    turn_number: int
    speaker: str
    content: str
    timestamp: str = Field(default_factory=_now)
    metadata: TurnMetadata = Field(default_factory=TurnMetadata)


class Evaluation(BaseModel):
    turn_id: str
    structure_score: int = 0
    logic_score: int = 0
    rhetoric_score: int = 0
    highlight: str = ""
    blind_spot: str = ""
    tip: str = ""
    flair_moment: str = ""


class AudienceReaction(BaseModel):
    persona_id: str
    name: str
    first_impression: str = ""
    turning_point: str = ""
    what_won_you_over: str = ""
    vote: Literal["pro", "con", "undecided"] = "undecided"
    vote_reasoning: str = ""
    message_to_speaker: str = ""


class Session(BaseModel):
    id: str = Field(default_factory=_uuid)
    created_at: str = Field(default_factory=_now)
    ended_at: Optional[str] = None
    status: Literal["config", "active", "audience_reveal", "complete"] = "config"
    config: SessionConfig
    turns: list[Turn] = Field(default_factory=list)
    evaluations: list[Evaluation] = Field(default_factory=list)
    audience_reactions: list[AudienceReaction] = Field(default_factory=list)
    report_markdown: Optional[str] = None
