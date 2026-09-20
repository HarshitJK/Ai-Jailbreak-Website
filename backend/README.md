# AI Jailbreak Backend — Round 1

FastAPI + Python backend for Round 1 of the Prompt Heist AI Jailbreak competition.

## Stack

- **Python 3.12** + **FastAPI** (modern, high-performance web framework)
- **Uvicorn** (ASGI server)
- **Pydantic** (data validation and settings management)
- **python-dotenv** (environment variable management)
- **Anthropic SDK** (stubbed for later wiring)
- **Motor** (async MongoDB driver — persistent chat logs + team credentials)
- **Passlib + bcrypt** (password hashing)
- **CORS** locked to frontend origin via `.env`
- **In-memory session store** (dict-based — fast LLM conversation buffer, survives server process only)

## Project Structure

```
backend/
├── app/
│   ├── main.py              FastAPI app factory; mounts routers, lifespan hooks
│   ├── db.py                Motor async MongoDB client + get_db() dependency
│   ├── models.py            Pydantic models (chat + auth + DB documents)
│   ├── routers/
│   │   ├── auth.py          POST /api/register, POST /api/login
│   │   ├── chat.py          POST /api/chat (write-through to MongoDB)
│   │   └── health.py        GET /api/health
│   ├── personas/
│   │   ├── stage1.py        SYSTEM_PROMPT + DETECTION_STRING (Circuit Voice)
│   │   ├── stage2.py        SYSTEM_PROMPT + DETECTION_STRING (Professor Vera)
│   │   ├── stage3.py        SYSTEM_PROMPT + DETECTION_STRING (NovaAssist)
│   │   ├── stage4.py        SYSTEM_PROMPT + DETECTION_STRING (TalentGate)
│   │   └── stage5.py        SYSTEM_PROMPT + DETECTION_STRING (Aegis)
│   └── services/
│       ├── llm_client.py    Stubbed async call_llm() — wire anthropic SDK later
│       └── session_store.py In-memory dict keyed by f"{team_id}:{stage}"
├── Dockerfile               Production container (python:3.12-slim)
├── .env.example             PORT=, FRONTEND_ORIGIN=, ANTHROPIC_API_KEY=, MONGO_URI=, MONGO_DB_NAME=
├── .dockerignore
├── requirements.txt         fastapi, uvicorn, pydantic, python-dotenv, anthropic, motor, passlib[bcrypt]
└── README.md                This file
```

## Run with Docker

The easiest way to run the entire stack (frontend + backend + MongoDB) is with Docker Compose.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Setup

```bash
# 1. Copy the backend env template (no credentials needed to start)
cp backend/.env.example backend/.env

# 2. Optionally set ANTHROPIC_API_KEY in backend/.env for real LLM responses
#    (leave empty to use the stubbed placeholder responses)

# 3. Build and start all three services
docker compose up --build
```

### Service URLs

| Service | URL |
|---------|-----|
| **Frontend** (nginx SPA) | http://localhost:3000 |
| **Backend** (FastAPI) | http://localhost:4000 |
| **Backend docs** | http://localhost:4000/docs |

> [!NOTE]
> MongoDB is internal-only (no host port). If you need direct access (e.g. MongoDB Compass), uncomment the `ports` lines under the `mongo` service in `docker-compose.yml`.

### Stopping

```bash
docker compose down          # stop containers, keep data volume
docker compose down -v       # stop containers AND delete MongoDB data
```

---

## Quick Start (Local Dev, No Docker)

```bash
cd backend
cp .env.example .env         # edit MONGO_URI to mongodb://localhost:27017
pip install -r requirements.txt
uvicorn app.main:app --reload --port 4000
```

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `4000` | Server listen port |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allow-origin |
| `ANTHROPIC_API_KEY` | _(empty)_ | Leave empty until later pass |
| `MONGO_URI` | `mongodb://localhost:27017` | Use `mongodb://mongo:27017` inside Docker |
| `MONGO_DB_NAME` | `ai_jailbreak` | MongoDB database name |

## MongoDB Collections

### `teams`
```
{ _id, team_name (unique), email, password_hash, session_token,
  round1_stage, round1_complete_at, round2_stage, round2_complete_at,
  score, created_at }
```

### `chat_logs`
```
{ _id, team_id (team_name), round, stage, role, message, timestamp }
```

## API

### `GET /api/health`

Returns `{ status: "ok" }`.

### `POST /api/register`

**Request body:**
```json
{ "team_name": "TEAM", "email": "team@example.com", "password": "1234" }
```
**Response:** `{ "team_name": "TEAM", "session_token": "<uuid>" }` (201)

### `POST /api/login`

**Request body:**
```json
{ "team_name": "TEAM", "password": "1234" }
```
**Response:** `{ "team_name": "TEAM", "session_token": "<uuid>" }` (200)

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

Every message is written to the `chat_logs` MongoDB collection. Stage completions update the team's doc in `teams`.

## What's Stubbed / TODO

1. **`app/services/llm_client.py`** — `call_llm()` returns a placeholder string. Wire the real Anthropic SDK call here.
2. **Session store** — currently in-memory (lost on restart). The MongoDB chat_logs provide permanent records; the in-memory store is the fast LLM conversation buffer.

## Migration Notes

This backend is a drop-in replacement for the original Node/Express/TypeScript backend. The frontend (`apiClient.ts`) requires **zero changes** to the chat endpoint because:

- Endpoint path remains `/api/chat`
- Request shape remains `{ team_id, stage, message }` (stage 0-indexed)
- Response shape remains `{ reply, stageComplete, nextStage }` (nextStage 0-indexed or null)
- All persona SYSTEM_PROMPT and DETECTION_STRING values are copied verbatim
- Stage-unlock logic (case-insensitive substring match) is identical
- CORS configuration mirrors the original
- Health check endpoint unchanged