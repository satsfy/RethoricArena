"""Load/save session JSON files."""
import json
from pathlib import Path
from .models.schemas import Session, SessionConfig

STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "sessions"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def _path(session_id: str) -> Path:
    return STORAGE_DIR / f"{session_id}.json"


def create_session(config: SessionConfig) -> Session:
    s = Session(config=config, status="active")
    save(s)
    return s


def save(session: Session) -> None:
    p = _path(session.id)
    p.write_text(json.dumps(session.model_dump(), indent=2))


def load(session_id: str) -> Session | None:
    p = _path(session_id)
    if not p.exists():
        return None
    data = json.loads(p.read_text())
    return Session(**data)


def list_sessions() -> list[dict]:
    out = []
    for f in sorted(STORAGE_DIR.glob("*.json"), reverse=True):
        try:
            d = json.loads(f.read_text())
            out.append({
                "id": d["id"],
                "created_at": d["created_at"],
                "motion": d["config"]["motion"],
                "status": d["status"],
                "turns": len(d.get("turns", [])),
            })
        except Exception:
            continue
    return out


def delete(session_id: str) -> bool:
    p = _path(session_id)
    if p.exists():
        p.unlink()
        return True
    return False
