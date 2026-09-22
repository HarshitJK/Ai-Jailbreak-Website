"""
In-memory session store for both rounds.

Round 1 — keyed by f"{team_id}:{stage}" (one history per team+stage).
Round 2 — keyed by team_id alone (one continuous conversation across all 5 stages;
           current_stage is tracked server-side so the frontend never needs to send it).

Both stores can be swapped for Redis later without changing the calling code.
"""

from typing import List, Dict, Set


# ── Round 1 store ─────────────────────────────────────────────────────────────

# In-memory store: key → ordered list of {"role": str, "content": str} message pairs
_store: Dict[str, List[Dict[str, str]]] = {}

# Completed stages tracking: team_id -> Set of completed stage numbers
_completed_stages: Dict[str, Set[int]] = {}


# ── Round 2 store ─────────────────────────────────────────────────────────────

# Each entry: { "history": [...], "current_stage": int (1-5) }
_r2_store: Dict[str, Dict] = {}


def _key(team_id: str, stage: int) -> str:
    """Generate store key for team_id and stage (stage is 1-indexed on backend)."""
    return f"{team_id}:{stage}"


def get_history(team_id: str, stage: int) -> List[Dict[str, str]]:
    """Returns the full conversation history for a team+stage pair."""
    return _store.get(_key(team_id, stage), [])


def add_to_history(
    team_id: str, stage: int, user_message: str, assistant_reply: str
) -> None:
    """Appends a user message and the assistant's reply to the history."""
    key = _key(team_id, stage)
    existing = _store.get(key, [])
    _store[key] = [
        *existing,
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": assistant_reply},
    ]


def mark_stage_complete(team_id: str, stage: int) -> None:
    """Marks a specific stage as complete for a team."""
    if team_id not in _completed_stages:
        _completed_stages[team_id] = set()
    _completed_stages[team_id].add(stage)


def is_stage_complete(team_id: str, stage: int) -> bool:
    """Returns True if the stage is marked complete for the team."""
    return stage in _completed_stages.get(team_id, set())


def clear_team(team_id: str) -> None:
    """Clears all round-1 and round-2 data for a team (e.g. on logout)."""
    # Remove all round-1 keys matching this teamId
    keys_to_delete = [k for k in _store.keys() if k.startswith(f"{team_id}:")]
    for k in keys_to_delete:
        del _store[k]
    _completed_stages.pop(team_id, None)
    # Also clear round-2 session
    _r2_store.pop(team_id, None)


# ── Round 2 session helpers ───────────────────────────────────────────────────

def _r2_init(team_id: str) -> None:
    """Initialise a Round 2 session for a team if one does not exist yet."""
    if team_id not in _r2_store:
        _r2_store[team_id] = {"history": [], "current_stage": 1}


def r2_get_session(team_id: str) -> Dict:
    """
    Returns the Round 2 session dict for a team.
    The dict has shape: { "history": List[Dict], "current_stage": int (1-5) }.
    Creates a fresh session (stage 1, empty history) on first access.
    """
    _r2_init(team_id)
    return _r2_store[team_id]


def r2_add_to_history(team_id: str, user_message: str, assistant_reply: str) -> None:
    """Appends a user/assistant exchange to the Round 2 continuous history."""
    _r2_init(team_id)
    _r2_store[team_id]["history"].extend([
        {"role": "user",      "content": user_message},
        {"role": "assistant", "content": assistant_reply},
    ])


def r2_advance_stage(team_id: str) -> int:
    """
    Increments current_stage by 1 (capped at 5).
    Returns the NEW stage number after advancing.
    """
    _r2_init(team_id)
    current = _r2_store[team_id]["current_stage"]
    new_stage = min(current + 1, 5)
    _r2_store[team_id]["current_stage"] = new_stage
    return new_stage


def r2_clear_team(team_id: str) -> None:
    """Clears the Round 2 session for a team (e.g. on admin reset)."""
    _r2_store.pop(team_id, None)