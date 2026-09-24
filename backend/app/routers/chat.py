"""
POST /api/chat — same path/shape as the current frontend expects.
Implements stage-unlock logic exactly as the TS version did.
Write-through to MongoDB: every message is logged to chat_logs,
and stage completions update the teams collection.

team_id is now derived from the verified session cookie (get_current_team),
not from the request body — removes the spoofing risk.
"""

import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.models import ChatRequest, ChatResponse
from app.services import llm_client, session_store
from app.services.jwt_auth import get_current_team
from app.db import get_db

# Import all stage personas
from app.personas import stage1, stage2, stage3, stage4, stage5

# Load all 5 stage personas
PERSONAS: Dict[int, Dict[str, str]] = {
    1: {"SYSTEM_PROMPT": stage1.SYSTEM_PROMPT, "DETECTION_STRING": stage1.DETECTION_STRING, "MODEL": stage1.MODEL},
    2: {"SYSTEM_PROMPT": stage2.SYSTEM_PROMPT, "DETECTION_STRING": stage2.DETECTION_STRING, "MODEL": stage2.MODEL},
    3: {"SYSTEM_PROMPT": stage3.SYSTEM_PROMPT, "DETECTION_STRING": stage3.DETECTION_STRING, "MODEL": stage3.MODEL},
    4: {"SYSTEM_PROMPT": stage4.SYSTEM_PROMPT, "DETECTION_STRING": stage4.DETECTION_STRING, "MODEL": stage4.MODEL},
    5: {"SYSTEM_PROMPT": stage5.SYSTEM_PROMPT, "DETECTION_STRING": stage5.DETECTION_STRING, "MODEL": stage5.MODEL},
}

TOTAL_STAGES = 5


def check_unlock_condition(stage_num: int, ai_reply: str, _user_message: str) -> bool:
    """
    Checks whether the AI's reply satisfies the stage's unlock condition.
    Strategy: case-insensitive substring match against the stage's DETECTION_STRING.
    Each stage persona exports a DETECTION_STRING constant that the real LLM
    should output when successfully jailbroken.
    """
    detection_string = PERSONAS[stage_num]["DETECTION_STRING"]
    # Case-insensitive substring match
    return detection_string.lower() in ai_reply.lower()


class ChatLogRow(BaseModel):
    round: int
    stage: int
    role: str
    message: str
    timestamp: datetime


router = APIRouter()


async def _log_message(
    db: AsyncIOMotorDatabase,
    team_id: str,
    stage_num: int,
    role: str,
    message: str,
) -> None:
    """Fire-and-forget: write a chat log entry to MongoDB."""
    try:
        await db["chat_logs"].insert_one({
            "team_id": team_id,
            "round": 1,
            "stage": stage_num,
            "role": role,
            "message": message,
            "timestamp": datetime.now(timezone.utc),
        })
    except Exception:
        # Logging failures must never break the chat response
        pass


async def _mark_stage_complete_in_db(
    db: AsyncIOMotorDatabase,
    team_id: str,
    stage_num: int,
) -> None:
    """Update the team's round1_stage and (if all done) round1_complete_at."""
    try:
        update_fields: Dict = {"round1_stage": stage_num}
        if stage_num >= TOTAL_STAGES:
            update_fields["round1_complete_at"] = datetime.now(timezone.utc)
            update_fields["qualified"] = True

        await db["teams"].update_one(
            {"team_name": team_id},
            {"$set": update_fields},
        )
    except Exception:
        # DB update failures must never break the chat response
        pass


class TimerResponse(BaseModel):
    started_at: datetime
    duration_seconds: int

@router.get("/api/round1/timer")
async def get_round1_timer(
    team_id: str = Depends(get_current_team),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> TimerResponse:
    team_doc = await db["teams"].find_one({"team_name": team_id})
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found.")

    started_at = team_doc.get("round1_started_at")
    if not started_at:
        started_at = datetime.now(timezone.utc)
        await db["teams"].update_one(
            {"team_name": team_id},
            {"$set": {"round1_started_at": started_at}}
        )
    elif started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)

    return TimerResponse(
        started_at=started_at,
        duration_seconds=2700, # 45 minutes
    )

@router.post("/api/chat")
async def chat_endpoint(
    payload: ChatRequest,
    team_id: str = Depends(get_current_team),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> ChatResponse:
    # team_id comes from the verified session cookie — body field ignored even if sent
    stage_raw = payload.stage  # 0-indexed from frontend
    user_message = payload.message.strip()

    # Validation
    if (
        not isinstance(stage_raw, int)
        or stage_raw < 0
        or stage_raw >= TOTAL_STAGES
        or not user_message
    ):
        raise HTTPException(
            status_code=400,
            detail="Missing or invalid fields. Expected: { stage: number (0–4), message: string }",
        )

    # Validate that the team has unlocked this stage
    team_doc = await db["teams"].find_one({"team_name": team_id})
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found.")

    current_unlocked_stage = team_doc.get("round1_stage", 0)
    if stage_raw > current_unlocked_stage:
        raise HTTPException(
            status_code=403,
            detail=f"Stage {stage_raw + 1} is locked. You must complete the previous stages first."
        )

    # Check timer (45 minutes)
    started_at = team_doc.get("round1_started_at")
    if started_at:
        elapsed = (datetime.now(timezone.utc) - started_at.replace(tzinfo=timezone.utc)).total_seconds()
        if elapsed > 2700:
            raise HTTPException(
                status_code=403,
                detail="Time's up! 45 minutes have elapsed."
            )

    # Frontend sends 0-indexed; convert to 1-indexed for persona lookup
    stage_num = stage_raw + 1  # 1–5

    # Guard: already completed?
    if session_store.is_stage_complete(team_id, stage_num):
        return ChatResponse(
            reply=f"Stage {stage_num} is already complete. Move to the next challenge!",
            stageComplete=True,
            nextStage=stage_raw + 1 if stage_num < TOTAL_STAGES else None,
        )

    # Get persona and history
    persona = PERSONAS[stage_num]
    history = session_store.get_history(team_id, stage_num)

    # Enforce rate limit
    rate_limit_msg = session_store.check_rate_limit(team_id, round_num=1)
    if rate_limit_msg:
        return ChatResponse(
            reply=rate_limit_msg,
            stageComplete=False,
            nextStage=None,
        )

    # Call LLM with the stage's assigned model
    reply = await llm_client.call_llm(persona["SYSTEM_PROMPT"], history, user_message, model=persona["MODEL"])

    # Persist history to in-memory store (fast path — unchanged)
    session_store.add_to_history(team_id, stage_num, user_message, reply)

    # Write-through to MongoDB: log user message and AI reply
    await _log_message(db, team_id, stage_num, "user", user_message)
    await _log_message(db, team_id, stage_num, "assistant", reply)

    # Check unlock condition
    stage_complete = check_unlock_condition(stage_num, reply, user_message)
    if stage_complete:
        session_store.mark_stage_complete(team_id, stage_num)
        # Update team's progress in MongoDB
        await _mark_stage_complete_in_db(db, team_id, stage_num)

    # Calculate nextStage: 0-indexed next stage, or null if all stages done
    next_stage: Optional[int] = (
        stage_raw + 1 if stage_complete and stage_num < TOTAL_STAGES else None
    )

    return ChatResponse(
        reply=reply,
        stageComplete=stage_complete,
        nextStage=next_stage,
    )


@router.get("/api/round1/{stage}/history", response_model=List[ChatLogRow])
async def get_round1_history(
    stage: int,
    team_id: str = Depends(get_current_team),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> List[ChatLogRow]:
    """
    Return chronological chat history for a specific Round 1 stage for the current team.
    `stage` parameter is 0-indexed to match the frontend conventions.
    """
    if stage < 0 or stage >= TOTAL_STAGES:
        raise HTTPException(status_code=400, detail="Invalid stage")

    stage_num = stage + 1  # 1-indexed for DB

    cursor = db["chat_logs"].find(
        {"team_id": team_id, "round": 1, "stage": stage_num},
        {"_id": 0, "round": 1, "stage": 1, "role": 1, "message": 1, "timestamp": 1},
    ).sort("timestamp", 1)

    logs = []
    async for doc in cursor:
        logs.append(ChatLogRow(**doc))

    return logs


@router.delete("/api/round1/{stage}/reset")
async def reset_stage_chat(
    stage: int,
    team_id: str = Depends(get_current_team),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Reset the chat history for a specific Round 1 stage.
    - Deletes all chat_logs for this team + stage from MongoDB.
    - Clears in-memory history and completion flag for this stage.
    - Decrements round1_stage in teams collection if needed so the stage
      is no longer locked out.
    stage param is 0-indexed (same as frontend convention).
    """
    if stage < 0 or stage >= TOTAL_STAGES:
        raise HTTPException(status_code=400, detail="Invalid stage")

    stage_num = stage + 1  # 1-indexed for DB and session_store

    # Clear MongoDB logs for this stage
    await db["chat_logs"].delete_many({
        "team_id": team_id,
        "round": 1,
        "stage": stage_num,
    })

    # Clear in-memory history + completion flag
    session_store.clear_stage(team_id, stage_num)

    # Roll back round1_stage in the teams collection if they had completed this stage
    team_doc = await db["teams"].find_one({"team_name": team_id})
    if team_doc:
        current_db_stage = team_doc.get("round1_stage", 0)
        if current_db_stage >= stage_num:
            # Reset progress back to previous stage (stage_num - 1)
            new_stage = stage_num - 1
            update = {"round1_stage": new_stage}
            if new_stage < TOTAL_STAGES:
                update["round1_complete_at"] = None
            await db["teams"].update_one(
                {"team_name": team_id},
                {"$set": update}
            )

    return {"ok": True, "stage_reset": stage_num}