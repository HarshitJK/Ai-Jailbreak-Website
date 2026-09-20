/**
 * llmClient.ts — Stubbed LLM caller
 *
 * TODO (later pass): replace the placeholder body with a real Anthropic SDK call.
 * The Anthropic API key is read from config.anthropicApiKey.
 *
 * Interface contract:
 *   callLLM(systemPrompt, history, message) → Promise<string>
 *
 * The real implementation should pass `systemPrompt` as the `system` field,
 * `history` as the `messages` array (role/content pairs from prior turns),
 * and the current `message` as the final user turn.
 */

export interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

/**
 * PLACEHOLDER — returns a clearly labeled stub response.
 * Wire the real Anthropic SDK call here in the next pass.
 */
export async function callLLM(
  systemPrompt: string,
  history: HistoryEntry[],
  message: string
): Promise<string> {
  // ── TODO: replace this block with the real Anthropic call ────────────────
  //
  // Example (using @anthropic-ai/sdk):
  //
  // import Anthropic from "@anthropic-ai/sdk";
  // import { config } from "../config";
  //
  // const client = new Anthropic({ apiKey: config.anthropicApiKey });
  // const response = await client.messages.create({
  //   model: "claude-opus-4-5",
  //   max_tokens: 1024,
  //   system: systemPrompt,
  //   messages: [
  //     ...history,
  //     { role: "user", content: message },
  //   ],
  // });
  // return response.content[0].type === "text" ? response.content[0].text : "";
  //
  // ─────────────────────────────────────────────────────────────────────────

  return (
    `[PLACEHOLDER LLM RESPONSE — real Anthropic call not wired yet]\n` +
    `Received message: "${message}"\n` +
    `System prompt length: ${systemPrompt.length} chars\n` +
    `History turns: ${history.length}\n\n` +
    `This is a test response. Set ANTHROPIC_API_KEY and wire callLLM() to activate real AI replies.`
  );
}
