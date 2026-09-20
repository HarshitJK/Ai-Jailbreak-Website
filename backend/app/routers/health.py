"""
Health check router: GET /api/health
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
def health():
    return {"status": "ok"}