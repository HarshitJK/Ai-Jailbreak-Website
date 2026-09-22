"""
Pydantic models for the chat request/response and MongoDB documents.
Field names match exactly what apiClient.ts sends/expects.
String IDs (not raw ObjectId) are used in any model returned to the frontend.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Chat models (unchanged — frontend contract preserved) ─────────────────────

class ChatRequest(BaseModel):
    team_id: Optional[str] = None  # ignored — team identity now comes from session cookie
    stage: int  # 0-indexed: 0 = Stage 1 … 4 = Stage 5
    message: str


class ChatResponse(BaseModel):
    reply: str
    stageComplete: bool
    nextStage: int | None  # 0-indexed next stage, or null


# ── Auth request/response models ──────────────────────────────────────────────

class TeamCreate(BaseModel):
    """Payload for POST /api/register."""
    team_name: str
    email: str
    password: str


class TeamLogin(BaseModel):
    """Payload for POST /api/login."""
    team_name: str
    password: str


class AuthResponse(BaseModel):
    """Returned to the frontend on successful register or login."""
    team_name: str
    session_token: str


# ── Internal DB document shapes ───────────────────────────────────────────────

class TeamInDB(BaseModel):
    """Mirrors the teams MongoDB document. _id stored as string for safety."""
    id: Optional[str] = None          # stringified ObjectId
    team_name: str
    email: str
    password_hash: str
    session_token: Optional[str] = None
    round1_stage: int = 0
    round1_complete_at: Optional[datetime] = None
    round2_stage: int = 0
    round2_complete_at: Optional[datetime] = None
    score: int = 0
    created_at: datetime


class ChatLogEntry(BaseModel):
    """Mirrors a chat_logs MongoDB document."""
    team_id: str            # team_name (string, not ObjectId)
    round: int              # 1 or 2
    stage: int              # 1-indexed stage number
    role: str               # "user" | "assistant"
    timestamp: datetime


class AdminAdvanceRequest(BaseModel):
    """Payload for POST /api/admin/teams/{team_id}/advance."""
    round: int         # 1 or 2
    target_stage: int  # 1-5