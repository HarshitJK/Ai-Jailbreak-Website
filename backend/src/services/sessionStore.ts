/**
 * sessionStore.ts — In-memory conversation history store
 *
 * Key format: `${team_id}:${stage}` (e.g. "TEAM:1")
 * Stage is 1-indexed on the backend.
 *
 * TODO (later pass): replace with a Redis-backed store for production.
 * The Map will be lost on server restart — acceptable for dev/demo.
 */

import { HistoryEntry } from "./llmClient";

// In-memory store: key → ordered array of {role, content} message pairs
const store = new Map<string, HistoryEntry[]>();

function key(teamId: string, stage: number): string {
  return `${teamId}:${stage}`;
}

/** Returns the full conversation history for a team+stage pair. */
export function getHistory(teamId: string, stage: number): HistoryEntry[] {
  return store.get(key(teamId, stage)) ?? [];
}

/**
 * Appends a user message and the assistant's reply to the history.
 * This keeps the history consistent with the Anthropic messages format.
 */
export function addToHistory(
  teamId: string,
  stage: number,
  userMessage: string,
  assistantReply: string
): void {
  const k = key(teamId, stage);
  const existing = store.get(k) ?? [];
  store.set(k, [
    ...existing,
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantReply },
  ]);
}

/** Marks a specific stage as complete for a team. */
const completedStages = new Map<string, Set<number>>();

export function markStageComplete(teamId: string, stage: number): void {
  if (!completedStages.has(teamId)) {
    completedStages.set(teamId, new Set());
  }
  completedStages.get(teamId)!.add(stage);
}

export function isStageComplete(teamId: string, stage: number): boolean {
  return completedStages.get(teamId)?.has(stage) ?? false;
}

/** Clears all data for a team (e.g. on logout). Not called yet — wired later. */
export function clearTeam(teamId: string): void {
  // Remove all keys matching this teamId
  for (const k of store.keys()) {
    if (k.startsWith(`${teamId}:`)) store.delete(k);
  }
  completedStages.delete(teamId);
}
