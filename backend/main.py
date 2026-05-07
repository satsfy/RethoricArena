"""FastAPI app: routes, static frontend, and the WebSocket per session."""
import asyncio
import json
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .models.schemas import SessionConfig
from . import session_manager, debate_engine

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"

app = FastAPI(title="RhetoricArena")

app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")


@app.get("/")
async def index():
    return FileResponse(str(FRONTEND / "index.html"))


@app.post("/session")
async def create_session(config: SessionConfig):
    s = session_manager.create_session(config)
    return {"session_id": s.id}


@app.get("/session/{sid}")
async def get_session(sid: str):
    s = session_manager.load(sid)
    if not s:
        raise HTTPException(404)
    return s.model_dump()


@app.get("/session/{sid}/report")
async def get_report(sid: str):
    s = session_manager.load(sid)
    if not s:
        raise HTTPException(404)
    return {"report_markdown": s.report_markdown}


@app.get("/sessions")
async def list_all():
    return session_manager.list_sessions()


@app.delete("/session/{sid}")
async def delete_session(sid: str):
    ok = session_manager.delete(sid)
    if not ok:
        raise HTTPException(404)
    return {"deleted": True}


@app.websocket("/ws/{sid}")
async def ws(ws: WebSocket, sid: str):
    await ws.accept()
    session = session_manager.load(sid)
    if not session:
        await ws.send_json({"type": "error", "message": "session not found"})
        await ws.close()
        return

    lock = asyncio.Lock()

    async def send(payload: dict):
        await ws.send_json(payload)

    await send({"type": "session_ready", "config": session.config.model_dump(), "turns": [t.model_dump() for t in session.turns]})

    # If session is brand new (no turns), kick off intro
    if not session.turns:
        async with lock:
            try:
                await debate_engine.run_intro(session, send)
            except Exception as e:
                await send({"type": "error", "message": f"intro failed: {e}"})

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type")

            if mtype == "ping":
                await send({"type": "pong"})

            elif mtype == "user_turn":
                content = msg.get("content", "")
                input_method = msg.get("input_method", "text")
                async with lock:
                    try:
                        await debate_engine.handle_user_turn(session, send, content, input_method)
                    except Exception as e:
                        await send({"type": "error", "message": f"turn failed: {e}"})

            elif mtype == "end_session_early":
                async with lock:
                    try:
                        await debate_engine.run_closing(session, send)
                    except Exception as e:
                        await send({"type": "error", "message": f"closing failed: {e}"})

            elif mtype == "request_analysis":
                async with lock:
                    try:
                        await debate_engine.run_analysis(session, send)
                    except Exception as e:
                        await send({"type": "error", "message": f"analysis failed: {e}"})

    except WebSocketDisconnect:
        return
