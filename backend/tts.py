"""Server-side text-to-speech via OpenAI's audio.speech endpoint.

When OPENAI_API_KEY is set, the frontend prefers this over the browser's
SpeechSynthesis (which sounds especially bad on Firefox). Each speaker
gets a distinct OpenAI voice so debaters sound like different people.
"""
import os
from typing import Optional, AsyncIterator
from openai import AsyncOpenAI


# Mapping from session speaker IDs to OpenAI voices.
# Voices on gpt-4o-mini-tts: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse.
VOICE_FOR_SPEAKER = {
    "moderator": "onyx",
    "debater_rigorous":   "echo",
    "debater_populist":   "fable",
    "debater_socratic":   "sage",
    "debater_pragmatist": "alloy",
    "debater_devil":      "ash",
}
DEFAULT_VOICE = "alloy"
TTS_MODEL = "gpt-4o-mini-tts"


class NoTTSError(RuntimeError):
    pass


def is_available() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def voice_for(speaker: Optional[str]) -> str:
    if not speaker:
        return DEFAULT_VOICE
    return VOICE_FOR_SPEAKER.get(speaker, DEFAULT_VOICE)


async def synthesize_stream(text: str, voice: str = DEFAULT_VOICE) -> AsyncIterator[bytes]:
    """Stream MP3 bytes back to the caller as soon as OpenAI emits them."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise NoTTSError("OPENAI_API_KEY not set")
    client = AsyncOpenAI(api_key=api_key)
    async with client.audio.speech.with_streaming_response.create(
        model=TTS_MODEL,
        voice=voice,
        input=text[:4000],  # OpenAI cap is 4096 chars
        response_format="mp3",
    ) as response:
        async for chunk in response.iter_bytes():
            if chunk:
                yield chunk
