"""
POST /api/chat — same path/shape as the current frontend expects.
Implements stage-unlock logic exactly as the TS version did.
Write-through to MongoDB: every message is logged to chat_logs,
and stage completions update the teams collection.
"""

import os
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models import ChatRequest, ChatResponse
from app.services import llm_client, session_store
from app.db import get_db

# Import all stage personas
from app.personas import stage1, stage2, stage3, stage4, stage5

# Load all 5 stage personas
PERSONAS: Dict[int, Dict[str, str]] = {
    1: {"SYSTEM_PROMPT": stage1.SYSTEM_PROMPT, "DETECTION_STRING": stage1.DETECTION_STRING},
    2: {"SYSTEM_PROMPT": stage2.SYSTEM_PROMPT, "DETECTION_STRING": stage2.DETECTION_STRING},
    3: {"SYSTEM_PROMPT": stage3.SYSTEM_PROMPT, "DETECTION_STRING": stage3.DETECTION_STRING},
    4: {"SYSTEM_PROMPT": stage4.SYSTEM_PROMPT, "DETECTION_STRING": stage4.DETECTION_STRING},
    5: {"SYSTEM_PROMPT": stage5.SYSTEM_PROMPT, "DETECTION_STRING": stage5.DETECTION_STRING},
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

        await db["teams"].update_one(
            {"team_name": team_id},
            {"$set": update_fields},
        )
    except Exception:
        # DB update failures must never break the chat response
        pass


@router.post("/api/chat")
async def chat_endpoint(
    payload: ChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> ChatResponse:
    team_id = payload.team_id.strip()
    stage_raw = payload.stage  # 0-indexed from frontend
    user_message = payload.message.strip()

    # Validation (mirrors TS version exactly)
    if (
        not team_id
        or not isinstance(stage_raw, int)
        or stage_raw < 0
        or stage_raw >= TOTAL_STAGES
        or not user_message
    ):
        raise HTTPException(
            status_code=400,
            detail="Missing or invalid fields. Expected: { team_id: string, stage: number (0–4), message: string }",
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

    # Call LLM (stubbed)
    reply = await llm_client.call_llm(persona["SYSTEM_PROMPT"], history, user_message)

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