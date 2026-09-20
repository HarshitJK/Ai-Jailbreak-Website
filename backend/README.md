# AI Jailbreak Backend — Round 1

Express + TypeScript backend skeleton for Round 1 of the Prompt Heist AI Jailbreak competition.

## Stack

- **Node.js** + **Express** (v4)
- **TypeScript** (compiled with `ts-node` in dev)
- **CORS** locked to frontend origin via `.env`
- **In-memory session store** (Map-based — survives server process only)

## Project Structure

```
backend/
├── src/
│   ├── index.ts              Express entrypoint
│   ├── app.ts                App factory (CORS, routes)
│   ├── config.ts             Env-var config
│   ├── routes/
│   │   └── chat.ts           POST /api/chat
│   ├── personas/
│   │   ├── stage1.ts  →  Stage 1: Math-Truth Defender (2+2=5)
│   │   ├── stage2.ts  →  Stage 2: Keyword Keeper (hidden word)
│   │   ├── stage3.ts  →  Stage 3: Human Impostor (deny being AI)
│   │   ├── stage4.ts  →  Stage 4: Steganographic Leaker (hidden code)
│   │   ├── stage5.ts  →  Stage 5: Double-Speak Leaker (restricted info)
│   │   └── stage6.ts  →  Stage 6: Context Poisoner (multi-turn memory)
│   └── services/
│       ├── llmClient.ts      Stubbed callLLM() — wire Anthropic SDK here
│       └── sessionStore.ts   In-memory Map keyed by `${team_id}:${stage}`
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

```bash
cd backend
cp .env.example .env        # edit PORT, FRONTEND_ORIGIN
npm install
npm run dev                  # starts on http://localhost:4000
```

## Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `4000` | Server listen port |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allow-origin |
| `ANTHROPIC_API_KEY` | _(empty)_ | Leave empty until next pass |

## API

### `GET /api/health`
Returns `{ status: "ok", timestamp: "..." }`.

### `POST /api/chat`
**Request body:**
```json
{
  "team_id": "TEAM",
  "stage": 0,
  "message": "your prompt here"
}
```
> `stage` is **0-indexed** (0 = Stage 1, 5 = Stage 6) — the frontend's `active` value is sent directly.

**Response body:**
```json
{
  "reply": "...",
  "stageComplete": false,
  "nextStage": null
}
```
When `stageComplete` is `true`, `nextStage` is the 0-indexed next stage number (or `null` if all done).

## What's Stubbed / TODO

1. **`llmClient.ts`** — `callLLM()` returns a placeholder string. Wire the real Anthropic SDK call here. See the commented-out example in that file.
2. **Persona `SYSTEM_PROMPT`** — each `personas/stageN.ts` has a placeholder system prompt. Replace with the real adversarial persona text.
3. **Persona `SECRET`** — each persona has a `SECRET` string starting with `"TODO:"`. Replace with the actual phrase/keyword the AI must produce for unlock. Until replaced, stages will **never auto-unlock** (safe default).
4. **Session store** — currently in-memory (lost on restart). Replace `sessionStore.ts` with a Redis-backed implementation for production.

## Testing Without a Real API Key

Start the server (`npm run dev`) and make a test request:
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"team_id":"TEST","stage":0,"message":"hello world"}'
```
You will receive a clearly labeled `[PLACEHOLDER LLM RESPONSE]` — enough to test the full frontend-to-backend round trip.
