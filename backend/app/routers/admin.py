"""
GET /api/admin/teams             — live progress for every team (teams collection)
GET /api/admin/teams/{team_id}/logs — full chat history for a team (chat_logs collection)

Both routes are protected by the ADMIN_SECRET environment variable.  The caller
must send the matching value in the X-Admin-Secret request header; any mismatch
returns HTTP 403.
"""

import os
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.db import get_db

router = APIRouter()


# ── Admin-auth dependency ─────────────────────────────────────────────────────

def verify_admin(x_admin_secret: Optional[str] = Header(default=None)) -> None:
    """
    Dependency that checks the X-Admin-Secret header against the ADMIN_SECRET
    environment variable.  Raises HTTP 403 on any mismatch or if the env var
    is not configured.
    """
    expected = os.getenv("ADMIN_SECRET", "")
    if not expected:
        raise HTTPException(
            status_code=403,
            detail="Admin access is not configured on this server.",
        )
    if x_admin_secret != expected:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing admin secret.",
        )


# ── Response models ───────────────────────────────────────────────────────────

class AdminTeamRow(BaseModel):
    """
    Live progress snapshot for a single team.
    Field names match exactly what is stored in the teams collection.
    Fields that the UI would like but that do not exist in the schema are
    intentionally omitted rather than fabricated.

    NOTE — no elapsed-duration field exists in the schema.  round1_complete_at
    (UTC datetime) is the closest real data; the frontend formats it for display.
    NOTE — round1_stage (0-5) is used as the stages-completed counter; the
    frontend renders it as "X / 5".  Same for round2_stage.
    """
    team_name: str
    email: str
    round1_stage: int                        # 0 = not started, 5 = all stages done
    round1_complete_at: Optional[datetime]   # null until all 5 stages complete
    round2_stage: int
    round2_complete_at: Optional[datetime]
    score: int


class ChatLogRow(BaseModel):
    """Mirrors a chat_logs MongoDB document (read-only)."""
    round: int       # 1 or 2
    stage: int       # 1-indexed stage number
    role: str        # "user" | "assistant"
    message: str
    timestamp: datetime


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/api/admin/teams",
    response_model=List[AdminTeamRow],
    dependencies=[Depends(verify_admin)],
)
async def list_teams(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> List[AdminTeamRow]:
    """
    Return every team's live progress, sorted by team_name ascending.
    Returns an empty list (not an error) when no teams have registered yet.
    """
    cursor = db["teams"].find(
        {},
        {
            "_id": 0,
            "team_name": 1,
            "email": 1,
            "round1_stage": 1,
            "round1_complete_at": 1,
            "round2_stage": 1,
            "round2_complete_at": 1,
            "score": 1,
        },
    ).sort("team_name", 1)

    teams = []
    async for doc in cursor:
        teams.append(
            AdminTeamRow(
                team_name=doc["team_name"],
                email=doc["email"],
                round1_stage=doc.get("round1_stage", 0),
                round1_complete_at=doc.get("round1_complete_at"),
                round2_stage=doc.get("round2_stage", 0),
                round2_complete_at=doc.get("round2_complete_at"),
                score=doc.get("score", 0),
            )
        )
    return teams


@router.get(
    "/api/admin/teams/{team_id}/logs",
    response_model=List[ChatLogRow],
    dependencies=[Depends(verify_admin)],
)
async def get_team_logs(
    team_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> List[ChatLogRow]:
    """
    Return the full chat history for the given team (team_name string),
    ordered chronologically (timestamp ascending).
    Returns an empty list if the team has no chat history yet.
    """
    cursor = db["chat_logs"].find(
        {"team_id": team_id},
        {
            "_id": 0,
            "round": 1,
            "stage": 1,
            "role": 1,
            "message": 1,
            "timestamp": 1,
        },
    ).sort("timestamp", 1)

    logs: List[ChatLogRow] = []
    async for doc in cursor:
        logs.append(
            ChatLogRow(
                round=doc["round"],
                stage=doc["stage"],
                role=doc["role"],
                message=doc["message"],
                timestamp=doc["timestamp"],
            )
        )
    return logs
