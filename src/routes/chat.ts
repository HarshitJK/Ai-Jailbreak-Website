import { Request, Response } from "express";
import { getHistory, addHistory } from "../services/sessionStore";
import { getStagePrompt } from "../services/stagePrompts";
import { callAnthropic } from "../services/anthropicClient";

export async function chat(req: Request, res: Response) {
  try {
    const { team_id, round, stage, message } = req.body;

    if (!team_id || !round || !stage || !message) {
      return res.status(400).json({ error: "Missing required fields: team_id, round, stage, message" });
    }

    // TODO: Add auth middleware verification
    const teamId = team_id;

    // Load system prompt for this stage
    const systemPrompt = getStagePrompt(round, stage);

    // Load team's conversation history from Redis
    const history = getHistory(teamId, stage);

    // Call Anthropic AI
    const response = await callAnthropic({
      system: systemPrompt,
      history,
      userMessage: message,
    });

    // TODO: Save updated history back to Redis
    addHistory(teamId, stage, message, response);

    return res.json({ response });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
// TODO: Add per-stage logic, memory management, stage transition