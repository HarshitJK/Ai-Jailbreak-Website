/**
 * apiClient.ts — Frontend API client for all backend communication.
 *
 * Reads the backend base URL from VITE_API_BASE_URL (set in .env).
 * When VITE_API_BASE_URL is empty (Docker/nginx setup), requests go to
 * the same origin and nginx proxies /api/* to the backend.
 *
 * ALL requests include `credentials: 'include'` so the session cookie
 * (httpOnly, set by the backend) is automatically sent on every call.
 * This is required for the JWT session to work cross-origin.
 *
 * Team identity is now derived from the session cookie server-side.
 * Callers no longer need to supply team_id in request bodies for chat routes.
 */

const API_BASE: string =
  ((import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL ?? "http://localhost:4000");

// Admin secret kept for direct API tooling (header-based fallback in backend)
const ADMIN_SECRET: string =
  ((import.meta as unknown as { env: Record<string, string> }).env
    .VITE_ADMIN_SECRET ?? "");

// ── Chat types (Round 1 — unchanged contract, team_id now optional) ───────────

export interface ChatRequest {
  stage: number;    // 0-indexed: 0 = Stage 1 … 4 = Stage 5
  message: string;
  team_id?: string; // ignored by backend — kept so old callers don't break
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

export interface MeResponse {
  team_id: string;
  team_name: string;
}

// ── Admin auth types ──────────────────────────────────────────────────────────

export interface AdminLoginRequest {
  username: string;
  password: string;
}

// ── Admin data types ──────────────────────────────────────────────────────────

/**
 * Live progress snapshot for a single team.
 * Field names mirror the teams MongoDB collection exactly.
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

// ── Round 2 API types ─────────────────────────────────────────────────────────

export interface Round2ChatRequest {
  message: string;
  // team_id omitted — comes from session cookie
}

export interface Round2ChatResponse {
  reply: string;
  stageComplete: boolean;
  currentStage: number;          // 1-indexed, reflects stage AFTER any advance
  systemMessage: string | null;  // non-null when a stage transition occurred
}

export interface Round2FlagRequest {
  flag: string;
  // team_id omitted — comes from session cookie
}

export interface Round2FlagResponse {
  correct: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",  // send session cookie automatically
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

async function apiGet<T>(path: string, extraHeaders: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    credentials: "include",  // send session cookie automatically
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail ?? `API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ── Player auth API calls ─────────────────────────────────────────────────────

/**
 * Register a new team. Returns { team_name, session_token } on success.
 * The backend also sets the httpOnly session cookie.
 */
export async function registerTeam(payload: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/register", payload);
}

/**
 * Log in an existing team.
 * The backend sets an httpOnly JWT session cookie — no token storage needed.
 */
export async function loginTeam(payload: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/login", payload);
}

/**
 * Clear the session cookie server-side (logout).
 */
export async function logoutTeam(): Promise<void> {
  await apiPost<{ ok: boolean }>("/api/logout", {});
}

/**
 * Check current session — returns team info if logged in, throws 401 if not.
 * Used by ProtectedRoute to verify the cookie is still valid.
 */
export async function getMe(): Promise<MeResponse> {
  return apiGet<MeResponse>("/api/me");
}

// ── Admin auth API calls ──────────────────────────────────────────────────────

/**
 * Log in as admin. Backend checks ADMIN_USERNAME/ADMIN_PASSWORD env vars
 * and issues an httpOnly admin_session cookie.
 */
export async function adminLogin(payload: AdminLoginRequest): Promise<void> {
  await apiPost<{ ok: boolean }>("/api/admin/login", payload);
}

/**
 * Clear the admin_session cookie (admin logout).
 */
export async function adminLogout(): Promise<void> {
  await apiPost<{ ok: boolean }>("/api/admin/logout", {});
}

// ── Chat API call (Round 1) ───────────────────────────────────────────────────

/**
 * Sends a chat message to the Round 1 backend.
 * team_id is NOT sent — the backend reads it from the session cookie.
 */
export async function sendChatMessage(
  payload: ChatRequest
): Promise<ChatResponse> {
  return apiPost<ChatResponse>("/api/chat", payload);
}

/**
 * Fetch the chat history for a specific Round 1 stage.
 */
export async function fetchRound1History(stage: number): Promise<ChatLogEntry[]> {
  return apiGet<ChatLogEntry[]>(`/api/round1/${stage}/history`);
}

/**
 * Reset chat history for a specific Round 1 stage (0-indexed).
 * Clears MongoDB logs + in-memory session store for that stage.
 */
export async function resetStageChat(stage: number): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/round1/${stage}/reset`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail ?? `API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ── Round 2 API calls ─────────────────────────────────────────────────────────

/**
 * Send a message to the Round 2 continuous chat endpoint.
 * The server tracks which stage the team is on — the caller never sends stage.
 */
export async function sendRound2ChatMessage(
  payload: Round2ChatRequest,
): Promise<Round2ChatResponse> {
  return apiPost<Round2ChatResponse>("/api/round2/chat", payload);
}

/**
 * Submit the final flag for Round 2.
 * Returns { correct: true } if the flag matches Stage 5's DETECTION_STRING.
 */
export async function submitRound2Flag(
  payload: Round2FlagRequest,
): Promise<Round2FlagResponse> {
  return apiPost<Round2FlagResponse>("/api/round2/submit-flag", payload);
}

// ── Admin data API calls ──────────────────────────────────────────────────────

/**
 * Fetch live progress for every registered team.
 * Sends both the admin_session cookie AND the legacy X-Admin-Secret header
 * so both auth paths work depending on which is available.
 */
export async function fetchAdminTeams(): Promise<AdminTeam[]> {
  return apiGet<AdminTeam[]>("/api/admin/teams", { "X-Admin-Secret": ADMIN_SECRET });
}

/**
 * Fetch the full chat_logs transcript for a single team, ordered by timestamp.
 */
export async function fetchTeamLogs(teamId: string): Promise<ChatLogEntry[]> {
  return apiGet<ChatLogEntry[]>(
    `/api/admin/teams/${encodeURIComponent(teamId)}/logs`,
    { "X-Admin-Secret": ADMIN_SECRET },
  );
}

/**
 * Manually advance a team to a target stage.
 */
export async function adminAdvanceTeam(
  teamId: string,
  round: number,
  targetStage: number
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(
    `/api/admin/teams/${encodeURIComponent(teamId)}/advance`,
    { round, target_stage: targetStage }
  );
}

// ── Timer API ─────────────────────────────────────────────────────────────────

export interface TimerResponse {
  started_at: string;
  duration_seconds: number;
}

export async function fetchRound1Timer(): Promise<TimerResponse> {
  return apiGet<TimerResponse>("/api/round1/timer");
}

// ── Leaderboard & Management APIs ─────────────────────────────────────────────

export async function fetchLeaderboardR1(): Promise<AdminTeam[]> {
  return apiGet<AdminTeam[]>("/api/admin/leaderboard/round1", { "X-Admin-Secret": ADMIN_SECRET });
}

export async function fetchLeaderboardR2(): Promise<AdminTeam[]> {
  return apiGet<AdminTeam[]>("/api/admin/leaderboard/round2", { "X-Admin-Secret": ADMIN_SECRET });
}

export async function qualifyTeam(teamId: string): Promise<{ ok: boolean, qualified: boolean }> {
  return apiPost<{ ok: boolean, qualified: boolean }>(
    `/api/admin/teams/${encodeURIComponent(teamId)}/qualify`,
    {}
  );
}

export async function deleteTeam(teamId: string): Promise<{ ok: boolean }> {
  // Use apiGet style but with DELETE method or add a custom fetch.
  // Wait, there's no apiDelete helper. Let's just use raw fetch or add apiDelete.
  const res = await fetch(`${API_BASE}/api/admin/teams/${encodeURIComponent(teamId)}`, {
    method: "DELETE",
    headers: { "X-Admin-Secret": ADMIN_SECRET },
    credentials: "include" // or "include" depending on backend auth logic, admin uses both
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete team: ${res.status} ${text}`);
  }
  return res.json();
}

export async function forceCompleteR1(teamId: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(
    `/api/admin/teams/${encodeURIComponent(teamId)}/force-complete-r1`,
    {}
  );
}

export async function unlockRound2ForAll(): Promise<{ ok: boolean; teams_unlocked: number }> {
  return apiPost<{ ok: boolean; teams_unlocked: number }>(
    `/api/admin/unlock-round2`,
    {}
  );
}
