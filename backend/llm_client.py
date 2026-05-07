"""DeepSeek client wrapper. OpenAI-compatible API.

API key resolution order per call:
  1. The key set on the current async context via set_api_key()
  2. The DEEPSEEK_API_KEY env var
  3. The lowercase deepseek_api_key env var (.env fallback)

If no key is available, calls raise NoAPIKeyError so the caller can prompt the
user. Clients are constructed per-call (cheap) so a single process can serve
many users with different keys.
"""
import os
import contextvars
from typing import AsyncIterator, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.deepseek.com"
MODEL_FAST = "deepseek-chat"
MODEL_DEEP = "deepseek-chat"

_api_key_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "deepseek_api_key", default=None
)


class NoAPIKeyError(RuntimeError):
    pass


def set_api_key(key: Optional[str]) -> None:
    """Bind a key to the current async context (per WebSocket session)."""
    _api_key_var.set(key)


def server_has_key() -> bool:
    return bool(os.getenv("DEEPSEEK_API_KEY") or os.getenv("deepseek_api_key"))


def _resolve_key() -> str:
    key = _api_key_var.get() or os.getenv("DEEPSEEK_API_KEY") or os.getenv("deepseek_api_key")
    if not key:
        raise NoAPIKeyError(
            "No DeepSeek API key available. Set one in the app or via DEEPSEEK_API_KEY env var."
        )
    return key


def _client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=_resolve_key(), base_url=BASE_URL)


async def stream_completion(
    system_prompt: str,
    messages: list[dict],
    model: str = MODEL_FAST,
    temperature: float = 0.8,
    max_tokens: int = 1024,
    response_format: Optional[dict] = None,
) -> AsyncIterator[str]:
    """Yield text chunks as they arrive."""
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    kwargs = {
        "model": model,
        "messages": full_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    if response_format:
        kwargs["response_format"] = response_format

    stream = await _client().chat.completions.create(**kwargs)
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def complete(
    system_prompt: str,
    messages: list[dict],
    model: str = MODEL_FAST,
    temperature: float = 0.7,
    max_tokens: int = 2048,
    response_format: Optional[dict] = None,
) -> str:
    """Non-streaming completion. Returns full text."""
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    kwargs = {
        "model": model,
        "messages": full_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        kwargs["response_format"] = response_format
    resp = await _client().chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""
