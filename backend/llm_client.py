"""DeepSeek client wrapper. OpenAI-compatible API."""
import os
from typing import AsyncIterator, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("deepseek_api_key") or os.getenv("DEEPSEEK_API_KEY")
if not API_KEY:
    raise RuntimeError("Missing deepseek_api_key in .env")

BASE_URL = "https://api.deepseek.com"
MODEL_FAST = "deepseek-chat"
MODEL_DEEP = "deepseek-chat"

_client = AsyncOpenAI(api_key=API_KEY, base_url=BASE_URL)


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

    stream = await _client.chat.completions.create(**kwargs)
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
    resp = await _client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""
