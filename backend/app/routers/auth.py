"""
POST /api/register — creates a team document in MongoDB with a bcrypt-hashed password.
POST /api/login    — verifies credentials, issues an opaque session token.
"""

import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import bcrypt

from app.db import get_db
from app.models import TeamCreate, TeamLogin, AuthResponse

router = APIRouter()


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _new_token() -> str:
    return uuid.uuid4().hex


# ── Register ─────────────────────────────────────────────────────────────────

@router.post("/api/register", response_model=AuthResponse, status_code=201)
async def register(
    payload: TeamCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Create a new team.
    Returns AuthResponse { team_name, session_token } on success.
    """
    team_name = payload.team_name.strip()
    email = payload.email.strip()
    password = payload.password

    if not team_name or not email or not password:
        raise HTTPException(status_code=400, detail="team_name, email, and password are required.")

    # Check for duplicate team name
    existing = await db["teams"].find_one({"team_name": team_name})
    if existing:
        raise HTTPException(status_code=409, detail="Team name already taken.")

    token = _new_token()
    doc = {
        "team_name": team_name,
        "email": email,
        "password_hash": _hash_password(password),
        "session_token": token,
        "round1_stage": 0,
        "round1_complete_at": None,
        "round2_stage": 0,
        "round2_complete_at": None,
        "score": 0,
        "created_at": datetime.now(timezone.utc),
    }

    await db["teams"].insert_one(doc)

    # Ensure unique index on team_name (idempotent — safe to call repeatedly)
    await db["teams"].create_index("team_name", unique=True)

    return AuthResponse(team_name=team_name, session_token=token)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/api/login", response_model=AuthResponse)
async def login(
    payload: TeamLogin,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Verify team credentials and return a fresh session token.
    """
    team_name = payload.team_name.strip()
    password = payload.password

    if not team_name or not password:
        raise HTTPException(status_code=400, detail="team_name and password are required.")

    team_doc = await db["teams"].find_one({"team_name": team_name})
    if not team_doc or not _verify_password(password, team_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid team name or password.")

    # Issue a fresh token on every login
    token = _new_token()
    await db["teams"].update_one(
        {"team_name": team_name},
        {"$set": {"session_token": token}},
    )

    return AuthResponse(team_name=team_name, session_token=token)
