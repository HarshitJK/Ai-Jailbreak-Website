// TODO: This should be Redis-backed in production
// For now, use in-memory storage with a real Redis connection

// In-memory fallback store
const memoryStore: Record<string, any[]> = {};

export function getHistory(teamId: string, stage: number): any[] {
  // TODO: Connect to Redis: return await redis.get(`history:${teamId}:${stage}`);
  return memoryStore[`${teamId}:${stage}] || [];
}

export function addHistory(teamId: string, stage: number, userMessage: string, aiResponse: string): void {
  // TODO: Connect to Redis: await redis.set(`history:${teamId}:${stage}`, updatedHistory)
  if (!memoryStore[`${teamId}:${stage}`]) {
    memoryStore[`${teamId}:${stage}`] = [];
  }
  memoryStore[`${teamId}:${stage}`].push({ role: "user", content: userMessage });
  memoryStore[`${teamId}:${stage}`].push({ role: "assistant", content: aiResponse });
}
// TODO: Add history expiration, cleanup, Redis connection