"""
Round 2 router — /api/round2/chat and /api/round2/submit-flag.

Round 2 is a single continuous conversation across all 5 stages.
The server tracks which stage a team is on (current_stage in session_store);
the frontend never sends or tracks stage numbers.

POST /api/round2/chat
    Body:   { team_id: str, message: str }
    Return: { reply, stageComplete, currentStage, systemMessage }

POST /api/round2/submit-flag
    Body:   { team_id: str, flag: str }
    Return: { correct: bool }
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.db import get_db
from app.services import llm_client, session_store
from app.services.jwt_auth import get_current_team
from app.personas.round2 import stage1, stage2, stage3, stage4, stage5

# ── Persona registry (1-indexed) ──────────────────────────────────────────────

PERSONAS = {
    1: {"SYSTEM_PROMPT": stage1.SYSTEM_PROMPT, "DETECTION_STRING": stage1.DETECTION_STRING, "MODEL": stage1.MODEL},
    2: {"SYSTEM_PROMPT": stage2.SYSTEM_PROMPT, "DETECTION_STRING": stage2.DETECTION_STRING, "MODEL": stage2.MODEL},
    3: {"SYSTEM_PROMPT": stage3.SYSTEM_PROMPT, "DETECTION_STRING": stage3.DETECTION_STRING, "MODEL": stage3.MODEL},
    4: {"SYSTEM_PROMPT": stage4.SYSTEM_PROMPT, "DETECTION_STRING": stage4.DETECTION_STRING, "MODEL": stage4.MODEL},
    5: {"SYSTEM_PROMPT": stage5.SYSTEM_PROMPT, "DETECTION_STRING": stage5.DETECTION_STRING, "MODEL": stage5.MODEL},
}

TOTAL_STAGES = 5

# Transition messages shown in the chat when the player advances between stages.
TRANSITION_MESSAGES = {
    1: "Connection rerouted — transferring to HR Assistant.",
    2: "Access escalated — connecting to IT Helpdesk.",
    3: "Credentials verified — routing to Escalation Gate.",
    4: "Gate cleared — entering Admin Console.",
}

# ── Request / response models ─────────────────────────────────────────────────

class Round2ChatRequest(BaseModel):
    message: str
    # team_id intentionally omitted — comes from session cookie


class Round2ChatResponse(BaseModel):
    reply: str
    stageComplete: bool
    currentStage: int          # 1-indexed stage AFTER any advance
    systemMessage: Optional[str] = None   # non-null when a stage transition occurred


class Round2FlagRequest(BaseModel):
    flag: str
    # team_id intentionally omitted — comes from session cookie


class Round2FlagResponse(BaseModel):
    correct: bool

# ── Router ────────────────────────────────────────────────────────────────────

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _log_message(
    db: AsyncIOMotorDatabase,
    team_id: str,
    stage_num: int,
    role: str,
    message: str,
) -> None:
    """Fire-and-forget: write a round-2 chat log entry to MongoDB."""
    try:
        await db["chat_logs"].insert_one({
            "team_id": team_id,
            "round": 2,
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
    new_stage: int,
) -> None:
    """Update round2_stage (and round2_complete_at when all stages done) in MongoDB."""
    try:
        update_fields = {"round2_stage": new_stage}
        if new_stage >= TOTAL_STAGES:
            update_fields["round2_complete_at"] = datetime.now(timezone.utc)

        await db["teams"].update_one(
            {"team_name": team_id},
            {"$set": update_fields},
        )
    except Exception:
        # DB update failures must never break the chat response
        pass


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/api/round2/chat")
async def round2_chat(
    payload: Round2ChatRequest,
    team_id: str = Depends(get_current_team),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Round2ChatResponse:
    user_message = payload.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="Missing fields. Expected: { message: string }",
        )

    # Retrieve (or initialise) the team's continuous round-2 session
    session = session_store.r2_get_session(team_id)
    current_stage: int = session["current_stage"]
    history = session["history"]  # shared across all stages

    # Load the persona for the current stage
    persona = PERSONAS[current_stage]

    # Call the LLM — pass the full cross-stage history so context carries over
    reply = await llm_client.call_llm(
        system_prompt=persona["SYSTEM_PROMPT"],
        history=history,
        message=user_message,
        model=persona["MODEL"],
    )

    # Persist the exchange to the shared history
    session_store.r2_add_to_history(team_id, user_message, reply)

    # Log to MongoDB (non-blocking failures)
    await _log_message(db, team_id, current_stage, "user", user_message)
    await _log_message(db, team_id, current_stage, "assistant", reply)

    # Check whether the current stage's detection string appears in the reply
    detection = persona["DETECTION_STRING"]
    stage_complete = detection.lower() in reply.lower()

    system_message: Optional[str] = None

    if stage_complete and current_stage < TOTAL_STAGES:
        # Advance to the next stage
        new_stage = session_store.r2_advance_stage(team_id)
        system_message = TRANSITION_MESSAGES.get(current_stage)

        # Update DB progress
        await _mark_stage_complete_in_db(db, team_id, new_stage - 1)  # stages completed = new_stage - 1

        current_stage = new_stage

    elif stage_complete and current_stage == TOTAL_STAGES:
        # All 5 stages complete
        await _mark_stage_complete_in_db(db, team_id, TOTAL_STAGES)

    return Round2ChatResponse(
        reply=reply,
        stageComplete=stage_complete,
        currentStage=current_stage,
        systemMessage=system_message,
    )


@router.post("/api/round2/submit-flag")
async def round2_submit_flag(
    payload: Round2FlagRequest,
    team_id: str = Depends(get_current_team),
) -> Round2FlagResponse:
    """
    Compare the submitted flag against Stage 5's DETECTION_STRING.

    # TODO: replace with per-team unique flag lookup once Mongo team records support it.
    """
    submitted = payload.flag.strip()

    if not submitted:
        raise HTTPException(
            status_code=400,
            detail="Missing fields. Expected: { flag: string }",
        )

    final_flag = PERSONAS[TOTAL_STAGES]["DETECTION_STRING"]
    correct = final_flag.lower() in submitted.lower()

    return Round2FlagResponse(correct=correct)
