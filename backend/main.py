"""FastAPI app: routes, static frontend, and the WebSocket per session."""
import asyncio
import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

from .models.schemas import SessionConfig
from . import session_manager, debate_engine, llm_client, transcribe, tts

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"

app = FastAPI(title="RhetoricArena")


class NoStaticCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/") or request.url.path == "/":
            response.headers["Cache-Control"] = "no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response


app.add_middleware(NoStaticCacheMiddleware)
app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")

# In-memory: session_id -> user-supplied DeepSeek API key.
# Never persisted to disk. Cleared on process restart.
_session_keys: dict[str, str] = {}


class SessionCreatePayload(BaseModel):
    config: SessionConfig
    api_key: Optional[str] = None


@app.get("/")
async def index():
    return FileResponse(str(FRONTEND / "index.html"))


@app.get("/api/config")
async def app_config():
    """Tells the frontend whether the server has its own API key, and whether
    server-side voice transcription is available (for browsers that lack the
    Web Speech API, like Firefox).
    """
    return {
        "server_has_key": llm_client.server_has_key(),
        "transcription_available": transcribe.is_available(),
        "tts_available": tts.is_available(),
    }


class TTSPayload(BaseModel):
    text: str
    speaker: Optional[str] = None


@app.post("/api/tts")
async def tts_endpoint(payload: TTSPayload):
    if not tts.is_available():
        raise HTTPException(status_code=503, detail="Server TTS is not configured.")
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Empty text.")
    voice = tts.voice_for(payload.speaker)
    return StreamingResponse(
        tts.synthesize_stream(payload.text, voice),
        media_type="audio/mpeg",
    )


@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    if not transcribe.is_available():
        raise HTTPException(status_code=503, detail="Server transcription is not configured.")
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio upload.")
    try:
        text = await transcribe.transcribe(data, filename=audio.filename or "recording.webm")
    except transcribe.NoTranscriberError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    return {"transcript": text}


@app.post("/session")
async def create_session(payload: SessionCreatePayload):
    s = session_manager.create_session(payload.config)
    if payload.api_key:
        _session_keys[s.id] = payload.api_key.strip()
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
    _session_keys.pop(sid, None)
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

    # Bind the user-provided key (if any) to this WebSocket's async context.
    # Falls back to env var inside the LLM client when None.
    llm_client.set_api_key(_session_keys.get(sid))

    if not _session_keys.get(sid) and not llm_client.server_has_key():
        await ws.send_json({"type": "error", "message": "No DeepSeek API key configured. Refresh and add a key."})
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
            except llm_client.NoAPIKeyError as e:
                await send({"type": "error", "message": str(e)})
                await ws.close()
                return
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
                    except llm_client.NoAPIKeyError as e:
                        await send({"type": "error", "message": str(e)})
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
