"""
llm_client.py — thin provider abstraction around LLM backends.

Env vars (all read at import time via python-dotenv):
  LLM_PROVIDER  — "groq" (default) | "anthropic"  (extend as needed)
  GROQ_API_KEY  — required when LLM_PROVIDER=groq
  GROQ_MODEL    — Groq model ID, default "openai/gpt-oss-20b"
  ANTHROPIC_API_KEY — required when LLM_PROVIDER=anthropic (unused by default)

Public API:
  async def call_llm(system_prompt: str, history: list, message: str, model: str | None = None) -> str

  `model` overrides the GROQ_MODEL env default for per-stage model selection.
  Pass None (or omit) to fall back to the env default.

history is the List[Dict[str, str]] that session_store returns:
  [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
which is exactly the OpenAI/Groq messages format, so no conversion needed.
"""

import os
import json
from typing import List, Dict

from dotenv import load_dotenv

from app.services import round2_tools

load_dotenv()

LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter").lower()
GROQ_MODEL: str   = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct:free")


# ── Provider: Groq ────────────────────────────────────────────────────────────

async def _call_groq(
    system_prompt: str,
    history: List[Dict[str, str]],
    message: str,
    model: str = GROQ_MODEL,
    tools: list = None,
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
        while True:
            kwargs = {}
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
                
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=500,
                **kwargs
            )
            
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            
            if not tool_calls:
                content = response_message.content
                if content is None:
                    raise RuntimeError("Groq returned an empty response (content=None).")
                return content
            
            assistant_msg = {
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    } for tc in tool_calls
                ]
            }
            if response_message.content:
                assistant_msg["content"] = response_message.content
            messages.append(assistant_msg)
            
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    function_args = {}
                
                if hasattr(round2_tools, function_name):
                    func = getattr(round2_tools, function_name)
                    try:
                        function_response = func(**function_args)
                    except Exception as e:
                        function_response = {"error": str(e)}
                else:
                    function_response = {"error": f"Function {function_name} not found"}
                
                messages.append(
                    {
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": json.dumps(function_response),
                    }
                )
    except Exception as exc:
        raise RuntimeError(f"Groq API call failed: {exc}") from exc


# ── Provider: Anthropic (future switch — not active by default) ───────────────

async def _call_anthropic(
    system_prompt: str,
    history: List[Dict[str, str]],
    message: str,
    model: str = GROQ_MODEL,
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
            max_tokens=500,
            system=system_prompt,
            messages=messages,
        )
    except Exception as exc:
        raise RuntimeError(f"Anthropic API call failed: {exc}") from exc

    if not response.content:
        raise RuntimeError("Anthropic returned an empty response.")
    return response.content[0].text


# ── Provider: OpenRouter ──────────────────────────────────────────────────────

async def _call_openrouter(
    system_prompt: str,
    history: List[Dict[str, str]],
    message: str,
    model: str,
    tools: list = None,
) -> str:
    """
    Call OpenRouter's chat-completions endpoint using the official `openai` SDK.
    """
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set in backend/.env. "
            "Paste your key in and restart the server."
        )

    try:
        from openai import AsyncOpenAI
    except ImportError as exc:
        raise RuntimeError(
            "The `openai` package is not installed. "
            "Run: pip install openai  (or rebuild the Docker image)."
        ) from exc

    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    
    # Optional headers for OpenRouter
    extra_headers = {
        "HTTP-Referer": "https://github.com/harshitjk/Ai-Jailbreak-Website",
        "X-Title": "AI Jailbreak 2026",
    }

    messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": message},
    ]

    try:
        while True:
            kwargs = {}
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
                
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=500,
                extra_headers=extra_headers,
                **kwargs
            )
            
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            
            if not tool_calls:
                content = response_message.content
                if content is None:
                    return "I'm sorry, I cannot provide a response to that."
                return content
            
            assistant_msg = {
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    } for tc in tool_calls
                ]
            }
            if response_message.content:
                assistant_msg["content"] = response_message.content
            messages.append(assistant_msg)
            
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    function_args = {}
                
                if hasattr(round2_tools, function_name):
                    func = getattr(round2_tools, function_name)
                    try:
                        function_response = func(**function_args)
                    except Exception as e:
                        function_response = {"error": str(e)}
                else:
                    function_response = {"error": f"Function {function_name} not found"}
                
                messages.append(
                    {
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": json.dumps(function_response),
                    }
                )
    except Exception as exc:
        raise RuntimeError(f"OpenRouter API call failed: {exc}") from exc


# ── Public entry point (signature unchanged — chat.py never needs to change) ──

async def call_llm(
    system_prompt: str,
    history: List[Dict[str, str]],
    message: str,
    model: str | None = None,
    tools: list = None,
) -> str:
    """
    Route the request to the configured LLM provider.

    `model` selects the model to use; if None, falls back to the GROQ_MODEL
    env default. This allows per-stage model overrides without touching env vars.

    Raises RuntimeError (not silently caught) so chat.py can surface a
    meaningful HTTP 500 to the frontend rather than returning a stub string
    that would falsely pass the detection check.
    """
    if model is not None:
        resolved_model = model
    else:
        if LLM_PROVIDER == "openrouter":
            resolved_model = OPENROUTER_MODEL
        else:
            resolved_model = GROQ_MODEL

    if LLM_PROVIDER == "openrouter":
        return await _call_openrouter(system_prompt, history, message, model=resolved_model, tools=tools)
    elif LLM_PROVIDER == "groq":
        return await _call_groq(system_prompt, history, message, model=resolved_model, tools=tools)
    elif LLM_PROVIDER == "anthropic":
        return await _call_anthropic(system_prompt, history, message, model=resolved_model)
    else:
        raise RuntimeError(
            f"Unknown LLM_PROVIDER '{LLM_PROVIDER}'. "
            "Valid values: 'openrouter', 'groq', 'anthropic'."
        )