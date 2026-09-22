"""
jwt_auth.py — JWT-based session management for team players and admins.

Env vars (read at import time):
  SESSION_SECRET  — signing secret for team session JWTs (required)
  ADMIN_USERNAME  — admin username checked at /api/admin/login
  ADMIN_PASSWORD  — admin password checked at /api/admin/login

Two cookie namespaces, completely independent:
  `session`       — issued to team players on POST /api/login
  `admin_session` — issued to admins on POST /api/admin/login

Public API:
  issue_team_cookie(response, team_id) -> None
  issue_admin_cookie(response) -> None
  clear_team_cookie(response) -> None
  clear_admin_cookie(response) -> None
  get_current_team(request) -> str            # FastAPI dependency
  get_current_admin(request) -> None          # FastAPI dependency
"""

import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response
from jose import JWTError, jwt

from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

SESSION_SECRET: str = os.getenv("SESSION_SECRET", "")
ALGORITHM = "HS256"
TEAM_SESSION_EXPIRE_HOURS = 8
ADMIN_SESSION_EXPIRE_HOURS = 8

TEAM_COOKIE_NAME  = "session"
ADMIN_COOKIE_NAME = "admin_session"

# Detect local dev (so we can omit Secure flag — HTTPS not available on localhost)
IS_LOCAL_DEV = os.getenv("FRONTEND_ORIGIN", "").startswith("http://localhost")


# ── Internal JWT helpers ──────────────────────────────────────────────────────

def _require_secret() -> str:
    if not SESSION_SECRET:
        raise RuntimeError(
            "SESSION_SECRET is not set in backend/.env. "
            "Generate a random string and paste it in."
        )
    return SESSION_SECRET


def _encode(payload: dict) -> str:
    return jwt.encode(payload, _require_secret(), algorithm=ALGORITHM)


def _decode(token: str) -> dict:
    return jwt.decode(token, _require_secret(), algorithms=[ALGORITHM])


# ── Cookie helpers ────────────────────────────────────────────────────────────

def _set_cookie(response: Response, name: str, token: str, max_age: int) -> None:
    response.set_cookie(
        key=name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=not IS_LOCAL_DEV,  # True in production (HTTPS), False for local HTTP
        path="/",
        max_age=max_age,
    )


def _clear_cookie(response: Response, name: str) -> None:
    response.delete_cookie(key=name, path="/", samesite="lax", httponly=True)


# ── Team session ──────────────────────────────────────────────────────────────

def issue_team_cookie(response: Response, team_id: str) -> None:
    """Create and set the `session` httpOnly cookie for a team player."""
    expire = datetime.now(timezone.utc) + timedelta(hours=TEAM_SESSION_EXPIRE_HOURS)
    payload = {"team_id": team_id, "exp": expire}
    token = _encode(payload)
    _set_cookie(response, TEAM_COOKIE_NAME, token, max_age=TEAM_SESSION_EXPIRE_HOURS * 3600)


def clear_team_cookie(response: Response) -> None:
    """Delete the `session` cookie (logout)."""
    _clear_cookie(response, TEAM_COOKIE_NAME)


def get_current_team(request: Request) -> str:
    """
    FastAPI dependency: read and verify the `session` cookie.
    Returns the team_id string on success.
    Raises HTTP 401 if the cookie is missing, invalid, or expired.
    """
    token = request.cookies.get(TEAM_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    try:
        payload = _decode(token)
        team_id: str = payload.get("team_id", "")
        if not team_id:
            raise ValueError("team_id missing from token payload")
        return team_id
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")


# ── Admin session ─────────────────────────────────────────────────────────────

def issue_admin_cookie(response: Response) -> None:
    """Create and set the `admin_session` httpOnly cookie."""
    expire = datetime.now(timezone.utc) + timedelta(hours=ADMIN_SESSION_EXPIRE_HOURS)
    payload = {"role": "admin", "exp": expire}
    token = _encode(payload)
    _set_cookie(response, ADMIN_COOKIE_NAME, token, max_age=ADMIN_SESSION_EXPIRE_HOURS * 3600)


def clear_admin_cookie(response: Response) -> None:
    """Delete the `admin_session` cookie (admin logout)."""
    _clear_cookie(response, ADMIN_COOKIE_NAME)


def get_current_admin(request: Request) -> None:
    """
    FastAPI dependency: read and verify the `admin_session` cookie.
    Raises HTTP 401 if missing/invalid, HTTP 403 if role != "admin".
    """
    token = request.cookies.get(ADMIN_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Admin authentication required.")
    try:
        payload = _decode(token)
        if payload.get("role") != "admin":
            raise ValueError("not an admin token")
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Admin session expired or invalid.")
