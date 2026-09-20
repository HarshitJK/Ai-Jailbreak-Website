"""
In-memory dict keyed by f"{team_id}:{stage}" holding conversation history and completion state.
Same behavior as the TS Map version, structured so it can be swapped for Redis later.
"""

from typing import List, Tuple, Dict, Set


# In-memory store: key → ordered list of {"role": str, "content": str} message pairs
_store: Dict[str, List[Dict[str, str]]] = {}

# Completed stages tracking: team_id -> Set of completed stage numbers
_completed_stages: Dict[str, Set[int]] = {}


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
    """Clears all data for a team (e.g. on logout). Not called yet — wired later."""
    # Remove all keys matching this teamId
    keys_to_delete = [k for k in _store.keys() if k.startswith(f"{team_id}:")]
    for k in keys_to_delete:
        del _store[k]
    _completed_stages.pop(team_id, None)