# AI Jailbreak Backend — Round 1

FastAPI + Python backend for Round 1 of the Prompt Heist AI Jailbreak competition.

## Stack

- **Python 3.9+** + **FastAPI** (modern, high-performance web framework)
- **Uvicorn** (ASGI server)
- **Pydantic** (data validation and settings management)
- **python-dotenv** (environment variable management)
- **Anthropic SDK** (stubbed for later wiring)
- **CORS** locked to frontend origin via `.env`
- **In-memory session store** (dict-based — survives server process only)

## Project Structure

```
backend/
├── app/
│   ├── main.py              FastAPI app factory; mounts routers
│   ├── routers/
│   │   ├── chat.py          POST /api/chat
│   │   └── health.py        GET /api/health
│   ├── personas/
│   │   ├── stage1.py        SYSTEM_PROMPT + DETECTION_STRING (Circuit Voice)
│   │   ├── stage2.py        SYSTEM_PROMPT + DETECTION_STRING (Professor Vera)
│   │   ├── stage3.py        SYSTEM_PROMPT + DETECTION_STRING (NovaAssist)
│   │   ├── stage4.py        SYSTEM_PROMPT + DETECTION_STRING (TalentGate)
│   │   └── stage5.py        SYSTEM_PROMPT + DETECTION_STRING (Aegis)
│   ├── services/
│   │   ├── llm_client.py    Stubbed async call_llm() — wire anthropic SDK later
│   │   └── session_store.py In-memory dict keyed by f"{team_id}:{stage}"
│   └── models.py            Pydantic models for chat request/response
├── .env.example             PORT=, FRONTEND_ORIGIN=, ANTHROPIC_API_KEY=
├── requirements.txt         fastapi, uvicorn[standard], pydantic, python-dotenv, anthropic
└── README.md                This file
```

## Quick Start

```bash
cd backend
cp .env.example .env         # edit PORT, FRONTEND_ORIGIN if needed
pip install -r requirements.txt
uvicorn app.main:app --reload  # starts on http://localhost:4000
```

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `4000` | Server listen port |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allow-origin |
| `ANTHROPIC_API_KEY` | _(empty)_ | Leave empty until later pass |

## API

### `GET /api/health`

Returns `{ status: "ok" }`.

### `POST /api/chat`

**Request body:**
```json
{
  "team_id": "TEAM",
  "stage": 0,
  "message": "your prompt here"
}
```
> `stage` is **0-indexed** (0 = Stage 1, 4 = Stage 5) — the frontend's `active` value is sent directly.

**Response body:**
```json
{
  "reply": "...",
  "stageComplete": false,
  "nextStage": null
}
```
When `stageComplete` is `true`, `nextStage` is the 0-indexed next stage number (or `null` if all stages done).

## What's Stubbed / TODO

1. **`app/services/llm_client.py`** — `call_llm()` returns a placeholder string. Wire the real Anthropic SDK call here.
2. **Session store** — currently in-memory (lost on restart). Replace `app/services/session_store.py` with a Redis-backed implementation for production.

## Testing Without a Real API Key

Start the server (`uvicorn app.main:app --reload`) and make a test request:

```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"team_id":"TEST","stage":0,"message":"hello world"}'
```

You will receive a clearly labeled `[PLACEHOLDER LLM RESPONSE]` — enough to test the full frontend-to-backend round trip.

## Migration Notes

This backend is a drop-in replacement for the original Node/Express/TypeScript backend. The frontend (`apiClient.ts`) requires **zero changes** after this migration because:

- Endpoint path remains `/api/chat`
- Request shape remains `{ team_id, stage, message }` (stage 0-indexed)
- Response shape remains `{ reply, stageComplete, nextStage }` (nextStage 0-indexed or null)
- All persona SYSTEM_PROMPT and DETECTION_STRING values are copied verbatim
- Stage-unlock logic (case-insensitive substring match) is identical
- CORS configuration mirrors the original
- Health check endpoint unchanged