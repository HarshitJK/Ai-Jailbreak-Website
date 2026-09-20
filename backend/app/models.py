"""
Pydantic models for the chat request and response.
Field names match exactly what apiClient.ts sends/expects.
"""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    team_id: str
    stage: int  # 0-indexed: 0 = Stage 1 … 4 = Stage 5
    message: str


class ChatResponse(BaseModel):
    reply: str
    stageComplete: bool
    nextStage: int | None  # 0-indexed next stage, or null