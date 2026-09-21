/**
 * apiClient.ts — Frontend API client for Round 1 chat and team auth
 *
 * Reads the backend base URL from VITE_API_BASE_URL (set in .env).
 * When VITE_API_BASE_URL is empty (Docker/nginx setup), requests go to
 * the same origin and nginx proxies /api/* to the backend.
 *
 * Round 1 chat traffic goes through sendChatMessage().
 * Team auth goes through registerTeam() and loginTeam().
 * Admin data goes through fetchAdminTeams() and fetchTeamLogs().
 *
 * Chat request shape:  { team_id, stage, message }
 *   - `stage` is the 0-indexed `active` value from main.jsx (0–4)
 *   - Backend translates it to 1-indexed internally
 *
 * Chat response shape: { reply, stageComplete, nextStage }
 *   - `nextStage` is the 0-indexed next stage, or null if all stages done
 */

const API_BASE: string =
  ((import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL ?? "http://localhost:4000");

// Admin secret read from VITE_ADMIN_SECRET — must match backend ADMIN_SECRET env var
const ADMIN_SECRET: string =
  ((import.meta as unknown as { env: Record<string, string> }).env
    .VITE_ADMIN_SECRET ?? "");

// ── Chat types (unchanged — backend contract preserved) ──────────────────────

export interface ChatRequest {
  team_id: string;
  stage: number;    // 0-indexed: 0 = Stage 1 … 4 = Stage 5
  message: string;
}

export interface ChatResponse {
  reply: string;
  stageComplete: boolean;
  nextStage: number | null;  // 0-indexed next stage, or null
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  team_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  team_name: string;
  password: string;
}

export interface AuthResponse {
  team_name: string;
  session_token: string;
}

// ── Admin types ───────────────────────────────────────────────────────────────

/**
 * Live progress snapshot for a single team.
 * Field names mirror the teams MongoDB collection exactly.
 *
 * NOTE: No elapsed-duration field exists in the schema.
 * round1_complete_at (ISO string) is the closest real value; the UI formats it.
 * round1_stage / round2_stage (0-5) serve as stages-completed counters.
 * There is no "r1Challenges" or "r2Challenges" field — round1_stage is used instead.
 */
export interface AdminTeam {
  team_name: string;
  email: string;
  round1_stage: number;                // 0 = not started, 5 = all stages done
  round1_complete_at: string | null;   // ISO datetime string, or null
  round2_stage: number;
  round2_complete_at: string | null;
  score: number;
}

/**
 * A single entry from the chat_logs collection.
 * Returned ordered by timestamp ascending.
 */
export interface ChatLogEntry {
  round: number;       // 1 or 2
  stage: number;       // 1-indexed stage number
  role: string;        // "user" | "assistant"
  message: string;
  timestamp: string;   // ISO datetime string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail ?? `API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

async function apiGet<T>(path: string, secret: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": secret,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail ?? `API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth API calls ────────────────────────────────────────────────────────────

/**
 * Register a new team. Returns { team_name, session_token } on success.
 * Throws an Error if the team name is already taken or the request fails.
 */
export async function registerTeam(payload: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/register", payload);
}

/**
 * Log in an existing team. Returns { team_name, session_token } on success.
 * Throws an Error if credentials are wrong or the request fails.
 */
export async function loginTeam(payload: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/login", payload);
}

// ── Chat API call ─────────────────────────────────────────────────────────────

/**
 * Sends a chat message to the backend and returns the AI reply plus
 * unlock status.
 *
 * Throws an Error if the network request fails or the server returns
 * a non-OK status, so callers can catch and display an error state.
 */
export async function sendChatMessage(
  payload: ChatRequest
): Promise<ChatResponse> {
  return apiPost<ChatResponse>("/api/chat", payload);
}

// ── Admin API calls ───────────────────────────────────────────────────────────

/**
 * Fetch live progress for every registered team.
 * Uses the VITE_ADMIN_SECRET env var as the X-Admin-Secret header value.
 * Returns an empty array when no teams have registered yet.
 * Throws an Error on 403 (wrong secret) or network failure.
 */
export async function fetchAdminTeams(): Promise<AdminTeam[]> {
  return apiGet<AdminTeam[]>("/api/admin/teams", ADMIN_SECRET);
}

/**
 * Fetch the full chat_logs transcript for a single team, ordered by timestamp.
 * teamId is the team_name string (as stored in chat_logs.team_id).
 * Returns an empty array if the team has no chat history yet.
 */
export async function fetchTeamLogs(teamId: string): Promise<ChatLogEntry[]> {
  return apiGet<ChatLogEntry[]>(
    `/api/admin/teams/${encodeURIComponent(teamId)}/logs`,
    ADMIN_SECRET
  );
}
