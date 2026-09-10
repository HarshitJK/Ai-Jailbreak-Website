// TODO: This should be Redis-backed in production
const memoryStore: Record<string, any[]> = {};

export function getHistory(teamId: string, stage: number): any[] {
  return memoryStore[`${teamId}:${stage}] || [];
}

export function addHistory(teamId: string, stage: number, userMessage: string, aiResponse: string): void {
  if (!memoryStore[`${teamId}:${stage}`]) {
    memoryStore[`${teamId}:${stage}`] = [];
  }
  memoryStore[`${teamId}:${stage}`].push({ role: "user", content: userMessage });
  memoryStore[`${teamId}:${stage}`].push({ role: "assistant", content: aiResponse });
}