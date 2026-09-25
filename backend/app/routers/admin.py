"""
Admin router.

Authentication:
  POST /api/admin/login  — verifies ADMIN_USERNAME/ADMIN_PASSWORD from env,
                           issues a signed httpOnly `admin_session` JWT cookie.
  POST /api/admin/logout — clears that cookie.

All other /api/admin/* routes are protected by get_current_admin (cookie dependency).
The old X-Admin-Secret header guard (verify_admin) is kept for backwards compatibility
with any direct API tooling, but cookie auth takes precedence on the data routes.

GET  /api/admin/teams                    — live progress for every team
GET  /api/admin/teams/{team_id}/logs     — full chat history for a team
"""

import os
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.db import get_db
from app.services import session_store
from app.services.jwt_auth import (
    get_current_admin,
    issue_admin_cookie,
    clear_admin_cookie
)

router = APIRouter()


# ── Admin login request model ─────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str


# ── Admin login / logout ──────────────────────────────────────────────────────

@router.post("/api/admin/login")
async def admin_login(payload: AdminLoginRequest, response: Response):
    """
    Verify admin credentials against ADMIN_USERNAME / ADMIN_PASSWORD env vars.
    Issues a signed httpOnly `admin_session` JWT cookie valid for 8 hours.
    """
    expected_username = os.getenv("ADMIN_USERNAME", "")
    expected_password = os.getenv("ADMIN_PASSWORD", "")

    if not expected_username or not expected_password:
        raise HTTPException(
            status_code=503,
            detail="Admin credentials are not configured on this server."
)

    if payload.username != expected_username or payload.password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")

    issue_admin_cookie(response)
    return {"ok": True}


@router.post("/api/admin/logout")
async def admin_logout(response: Response):
    """Clear the admin_session cookie. Always returns 200."""
    clear_admin_cookie(response)
    return {"ok": True}



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
    round1_started_at: Optional[datetime]
    round1_stage: int                        # 0 = not started, 5 = all stages done
    round1_complete_at: Optional[datetime]   # null until all 5 stages complete
    qualified: bool
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
    dependencies=[Depends(get_current_admin)]
)
async def list_teams(
    db: AsyncIOMotorDatabase = Depends(get_db)
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
            "round1_started_at": 1,
            "round1_stage": 1,
            "round1_complete_at": 1,
            "qualified": 1,
            "round2_stage": 1,
            "round2_complete_at": 1,
            "score": 1,
        }
).sort("team_name", 1)

    teams = []
    async for doc in cursor:
        teams.append(
            AdminTeamRow(
                team_name=doc["team_name"],
                email=doc["email"],
                round1_started_at=doc.get("round1_started_at"),
                round1_stage=doc.get("round1_stage", 0),
                round1_complete_at=doc.get("round1_complete_at"),
                qualified=doc.get("qualified", False),
                round2_stage=doc.get("round2_stage", 0),
                round2_complete_at=doc.get("round2_complete_at"),
                score=doc.get("score", 0)
)
        )
    return teams


@router.get(
    "/api/admin/teams/{team_id}/logs",
    response_model=List[ChatLogRow],
    dependencies=[Depends(get_current_admin)]
)
async def get_team_logs(
    team_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
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
        }
).sort("timestamp", 1)

    logs: List[ChatLogRow] = []
    async for doc in cursor:
        logs.append(
            ChatLogRow(
                round=doc["round"],
                stage=doc["stage"],
                role=doc["role"],
                message=doc["message"],
                timestamp=doc["timestamp"]
)
        )
    return logs


from app.models import AdminAdvanceRequest
from datetime import timezone

@router.post("/api/admin/teams/{team_id}/advance",
    dependencies=[Depends(get_current_admin)]
)
async def admin_advance_team(
    team_id: str,
    payload: AdminAdvanceRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """
    Manually advance a team to a target stage without solving the challenge.
    Updates the stage tracker and logs the action to chat_logs.
    """

    if payload.round not in (1, 2) or payload.target_stage < 1 or payload.target_stage > 5:
        raise HTTPException(status_code=400, detail="Invalid round or target_stage")

    team_doc = await db["teams"].find_one({"team_name": team_id})
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found")

    update_fields = {}
    if payload.round == 1:
        # If forcing to Stage N, it means they completed N - 1 stages
        stages_completed = payload.target_stage - 1
        update_fields["round1_stage"] = stages_completed

        update_fields["round1_complete_at"] = None
        
    else:
        stages_completed = payload.target_stage - 1
        update_fields["round2_stage"] = stages_completed
        update_fields["round2_complete_at"] = None
        
        # Update in-memory session_store
        session_store.r2_set_stage(team_id, payload.target_stage)

    result = await db["teams"].update_one(
        {"team_name": team_id},
        {"$set": update_fields}
    )

    now = datetime.now(timezone.utc)
    if payload.round == 1:
        current_db_stage = team_doc.get("round1_stage", 0) + 1 # 1-indexed
        target = payload.target_stage
        
        if target > current_db_stage:
            for s in range(current_db_stage, target):
                await db["chat_logs"].insert_one({
                    "team_id": team_id,
                    "round": 1,
                    "stage": s,
                    "role": "system",
                    "message": f"Admin manually advanced team to Stage {payload.target_stage}",
                    "timestamp": now,
                })
        else:
            await db["chat_logs"].insert_one({
                "team_id": team_id,
                "round": 1,
                "stage": payload.target_stage,
                "role": "system",
                "message": f"Admin manually set team to Stage {payload.target_stage}",
                "timestamp": now,
            })
    else:
        await db["chat_logs"].insert_one({
            "team_id": team_id,
            "round": payload.round,
            "stage": payload.target_stage,
            "role": "system",
            "message": f"Admin manually advanced team to Stage {payload.target_stage}",
            "timestamp": now,
        })

    return {"ok": True, "team_id": team_id, "round": payload.round, "target_stage": payload.target_stage}

@router.get("/api/admin/leaderboard/round1", response_model=List[AdminTeamRow],
    dependencies=[Depends(get_current_admin)]
)
async def get_leaderboard_round1(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    cursor = db["teams"].find(
        {},
        {
            "_id": 0, "team_name": 1, "email": 1, "round1_started_at": 1,
            "round1_stage": 1, "round1_complete_at": 1, "qualified": 1,
            "round2_stage": 1, "round2_complete_at": 1, "score": 1
        }
    ).sort([("round1_stage", -1), ("round1_complete_at", 1)])
    
    teams = []
    async for doc in cursor:
        teams.append(AdminTeamRow(**doc))
    return teams


@router.get("/api/admin/leaderboard/round2", response_model=List[AdminTeamRow],
    dependencies=[Depends(get_current_admin)]
)
async def get_leaderboard_round2(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Only return teams that are qualified
    cursor = db["teams"].find(
        {"qualified": True},
        {
            "_id": 0, "team_name": 1, "email": 1, "round1_started_at": 1,
            "round1_stage": 1, "round1_complete_at": 1, "qualified": 1,
            "round2_stage": 1, "round2_complete_at": 1, "score": 1
        }
    ).sort([("round2_stage", -1), ("round2_complete_at", 1)])
    
    teams = []
    async for doc in cursor:
        teams.append(AdminTeamRow(**doc))
    return teams


@router.post("/api/admin/teams/{team_id}/qualify",
    dependencies=[Depends(get_current_admin)]
)
async def toggle_qualify_team(
    team_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    team_doc = await db["teams"].find_one({"team_name": team_id})
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found")
    
    new_status = not team_doc.get("qualified", False)
    await db["teams"].update_one(
        {"team_name": team_id},
        {"$set": {"qualified": new_status}}
    )
    return {"ok": True, "qualified": new_status}




@router.delete("/api/admin/teams",
    dependencies=[Depends(get_current_admin)]
)
async def delete_all_teams(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Permanently delete ALL teams and ALL chat logs.
    This is a destructive, irreversible operation — admin use only.
    """
    teams_result = await db["teams"].delete_many({})
    logs_result = await db["chat_logs"].delete_many({})
    return {
        "ok": True,
        "teams_deleted": teams_result.deleted_count,
        "logs_deleted": logs_result.deleted_count,
    }


@router.delete("/api/admin/teams/{team_id}",
    dependencies=[Depends(get_current_admin)]
)
async def delete_team(
    team_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    result = await db["teams"].delete_one({"team_name": team_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    await db["chat_logs"].delete_many({"team_id": team_id})
    return {"ok": True}


@router.post("/api/admin/teams/{team_id}/force-complete-r1",
    dependencies=[Depends(get_current_admin)]
)
async def force_complete_round1(
    team_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """
    Force-completes all 5 Round 1 stages for a single team.
    Sets round1_stage=5, round1_complete_at=now, qualified=True.
    """
    now = datetime.now(timezone.utc)
    result = await db["teams"].update_one(
        {"team_name": team_id},
        {"$set": {
            "round1_stage": 5,
            "round1_complete_at": now,
            "qualified": True,
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    await db["chat_logs"].insert_one({
        "team_id": team_id,
        "round": 1,
        "stage": 5,
        "role": "system",
        "message": "Admin force-completed all Round 1 stages.",
        "timestamp": now,
    })
    return {"ok": True, "team_id": team_id}


@router.post("/api/admin/unlock-round2",
    dependencies=[Depends(get_current_admin)]
)
async def unlock_round2_for_all(
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """
    Qualifies every registered team for Round 2 in one shot.
    Sets qualified=True for all teams regardless of Round 1 progress.
    """
    result = await db["teams"].update_many(
        {},
        {"$set": {"qualified": True}}
    )
    return {"ok": True, "teams_unlocked": result.modified_count}

@router.post("/api/admin/round2/start",
    dependencies=[Depends(get_current_admin)]
)
async def start_round2(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db["settings"].update_one(
        {"_id": "global_settings"},
        {"$set": {"round2_open": True}},
        upsert=True
    )
    return {"ok": True, "round2_open": True}

@router.post("/api/admin/round2/stop",
    dependencies=[Depends(get_current_admin)]
)
async def stop_round2(
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db["settings"].update_one(
        {"_id": "global_settings"},
        {"$set": {"round2_open": False}},
        upsert=True
    )
    return {"ok": True, "round2_open": False}
