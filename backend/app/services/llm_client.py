"""
llm_client.py — thin provider abstraction around LLM backends.

Env vars (all read at import time via python-dotenv):
  LLM_PROVIDER  — "groq" (default) | "anthropic"  (extend as needed)
  GROQ_API_KEY  — required when LLM_PROVIDER=groq
  GROQ_MODEL    — Groq model ID, default "openai/gpt-oss-20b"
  ANTHROPIC_API_KEY — required when LLM_PROVIDER=anthropic (unused by default)

Public API (unchanged — chat.py never needs to change):
  async def call_llm(system_prompt: str, history: list, message: str) -> str

history is the List[Dict[str, str]] that session_store returns:
  [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
which is exactly the OpenAI/Groq messages format, so no conversion needed.
"""

import os
from typing import List, Dict

from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq").lower()
GROQ_MODEL: str   = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")


# ── Provider: Groq ────────────────────────────────────────────────────────────

async def _call_groq(
    system_prompt: str,
    history: List[Dict[str, str]],
    message: str,
) -> str:
    """
    Call Groq's chat-completions endpoint using the official `groq` SDK
    (AsyncGroq — fully async, no thread-pool overhead).

    Messages array shape:
        [system] → [prior turns from history] → [new user message]

    The `history` list is already in {"role": ..., "content": ...} format
    as produced by session_store.add_to_history(), so it slots in directly.
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set in backend/.env. "
            "Paste your key in and restart the server."
        )

    # Import here so the module still loads (without crashing) even if the
    # `groq` package is not yet installed in the current environment.
    try:
        from groq import AsyncGroq
    except ImportError as exc:
        raise RuntimeError(
            "The `groq` package is not installed. "
            "Run: pip install groq  (or rebuild the Docker image)."
        ) from exc

    client = AsyncGroq(api_key=api_key)

    messages = [
        {"role": "system", "content": system_prompt},
        *history,                                   # prior turns (already dicts)
        {"role": "user",   "content": message},
    ]

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
        )
    except Exception as exc:
        raise RuntimeError(f"Groq API call failed: {exc}") from exc

    content = response.choices[0].message.content
    if content is None:
        raise RuntimeError("Groq returned an empty response (content=None).")
    return content


# ── Provider: Anthropic (future switch — not active by default) ───────────────

async def _call_anthropic(
    system_prompt: str,
    history: List[Dict[str, str]],
    message: str,
) -> str:
    """
    Call Anthropic's Messages API using the `anthropic` SDK.
    Activate by setting LLM_PROVIDER=anthropic in backend/.env.

    Note: Anthropic's API takes `system` as a separate top-level param,
    not as a message in the array, so the history list is passed as-is
    and the new user turn is appended.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set in backend/.env. "
            "Paste your key in and restart the server."
        )

    try:
        import anthropic
    except ImportError as exc:
        raise RuntimeError(
            "The `anthropic` package is not installed. "
            "Run: pip install anthropic  (or rebuild the Docker image)."
        ) from exc

    client = anthropic.AsyncAnthropic(api_key=api_key)

    messages = [
        *history,
        {"role": "user", "content": message},
    ]

    try:
        response = await client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-opus-4-5"),
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
    except Exception as exc:
        raise RuntimeError(f"Anthropic API call failed: {exc}") from exc

    if not response.content:
        raise RuntimeError("Anthropic returned an empty response.")
    return response.content[0].text


# ── Public entry point (signature unchanged — chat.py never needs to change) ──

async def call_llm(
    system_prompt: str,
    history: List[Dict[str, str]],
    message: str,
) -> str:
    """
    Route the request to the configured LLM provider.

    Raises RuntimeError (not silently caught) so chat.py can surface a
    meaningful HTTP 500 to the frontend rather than returning a stub string
    that would falsely pass the detection check.
    """
    if LLM_PROVIDER == "groq":
        return await _call_groq(system_prompt, history, message)
    elif LLM_PROVIDER == "anthropic":
        return await _call_anthropic(system_prompt, history, message)
    else:
        raise RuntimeError(
            f"Unknown LLM_PROVIDER '{LLM_PROVIDER}'. "
            "Valid values: 'groq', 'anthropic'."
        )