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

    const teamId = team_id;
    const systemPrompt = getStagePrompt(round, stage);
    const history = getHistory(teamId, stage);

    const response = await callAnthropic({
      system: systemPrompt,
      history,
      userMessage: message,
    });

    addHistory(teamId, stage, message, response);

    return res.json({ response });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}