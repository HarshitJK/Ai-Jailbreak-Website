"""
Stubbed async function call_llm(system_prompt, history, message) -> str,
TODO comment for wiring the real anthropic Python SDK later.
"""

from typing import List, Tuple


class HistoryEntry:
    role: str  # "user" | "assistant"
    content: str


async def call_llm(system_prompt: str, history: List[HistoryEntry], message: str) -> str:
    """
    PLACEHOLDER — returns a clearly labeled stub response.
    Wire the real anthropic SDK call here in the next pass.
    """
    # ── TODO: replace this block with the real anthropic call ────────
    #
    # Example (using anthropic SDK):
    #
    # import anthropic
    # import os
    # from dotenv import load_dotenv
    # load_dotenv()
    #
    # client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    # response = await client.messages.create(
    #     model="claude-opus-4-5",
    #     max_tokens=1024,
    #     system=system_prompt,
    #     messages=[
    #         *[{"role": h.role, "content": h.content} for h in history],
    #         {"role": "user", "content": message},
    #     ],
    # )
    # return response.content[0].text if response.content else ""
    #
    # ──────────────────────────────────────────────────────────────────

    return (
        "[PLACEHOLDER LLM RESPONSE — real anthropic call not wired yet]\n"
        f'Received message: "{message}"\n'
        f"System prompt length: {len(system_prompt)} chars\n"
        f"History turns: {len(history)}\n\n"
        "This is a test response. Set ANTHROPIC_API_KEY and wire call_llm() to activate real AI replies."
    )