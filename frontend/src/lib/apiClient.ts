/**
 * apiClient.ts — Frontend API client for Round 1 chat
 *
 * Reads the backend base URL from VITE_API_BASE_URL (set in .env).
 * All Round 1 chat traffic goes through sendChatMessage().
 *
 * Request shape:  { team_id, stage, message }
 *   - `stage` is the 0-indexed `active` value from main.jsx (0–5)
 *   - Backend translates it to 1-indexed internally
 *
 * Response shape: { reply, stageComplete, nextStage }
 *   - `nextStage` is the 0-indexed next stage, or null if all stages done
 */

const API_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL ?? "http://localhost:4000";

export interface ChatRequest {
  team_id: string;
  stage: number;    // 0-indexed: 0 = Stage 1 … 5 = Stage 6
  message: string;
}

export interface ChatResponse {
  reply: string;
  stageComplete: boolean;
  nextStage: number | null;  // 0-indexed next stage, or null
}

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
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ??
        `API error ${res.status}: ${res.statusText}`
    );
  }

  return res.json() as Promise<ChatResponse>;
}
