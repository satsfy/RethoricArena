"""Server-side Whisper transcription for browsers without SpeechRecognition (Firefox).

Resolves a provider from env vars in this order:
  1. GROQ_API_KEY  -> https://api.groq.com/openai/v1, model whisper-large-v3-turbo (free tier)
  2. OPENAI_API_KEY -> https://api.openai.com/v1, model whisper-1

Both expose an OpenAI-compatible /audio/transcriptions endpoint, so we reuse the
already-installed openai SDK with a swapped base_url. Audio bytes are passed
straight through; we do not persist the recording.
"""
import os
from typing import Optional
from openai import AsyncOpenAI


class NoTranscriberError(RuntimeError):
    pass


def _provider() -> Optional[tuple[str, str, str]]:
    """Returns (api_key, base_url, model) for the active provider, or None."""
    groq = os.getenv("GROQ_API_KEY")
    if groq:
        return groq, "https://api.groq.com/openai/v1", "whisper-large-v3-turbo"
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return openai_key, "https://api.openai.com/v1", "whisper-1"
    return None


def is_available() -> bool:
    return _provider() is not None


async def transcribe(audio_bytes: bytes, filename: str = "recording.webm") -> str:
    p = _provider()
    if not p:
        raise NoTranscriberError(
            "No transcription provider configured. Set GROQ_API_KEY (recommended, free tier) "
            "or OPENAI_API_KEY on the server."
        )
    api_key, base_url, model = p
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    resp = await client.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model=model,
        response_format="text",
    )
    # Some SDK versions return a string directly when response_format="text".
    if isinstance(resp, str):
        return resp.strip()
    text = getattr(resp, "text", None)
    return (text or "").strip()
