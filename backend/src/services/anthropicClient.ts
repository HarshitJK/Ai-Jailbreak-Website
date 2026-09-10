// TODO: This should use the actual Anthropic SDK/API key in production
export async function callAnthropic({ system, history, userMessage }: {
  system: string;
  history: any[];
  userMessage: string;
}) {
  return `AI response to: "${userMessage}" with system prompt: "${system.substring(0, 30)}..."`;
}