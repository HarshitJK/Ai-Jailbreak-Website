/**
 * chat.ts — POST /api/chat
 *
 * Request body:
 *   { team_id: string, stage: number (0-indexed from frontend), message: string }
 *
 * Response body:
 *   { reply: string, stageComplete: boolean, nextStage: number | null }
 *
 * Stage indexing:
 *   - Frontend sends `active` which is 0-indexed (0–4)
 *   - Backend converts to 1-indexed internally (1–5) for persona loading
 */

import { Router, Request, Response } from "express";
import { callLLM } from "../services/llmClient";
import {
  getHistory,
  addToHistory,
  isStageComplete,
  markStageComplete,
} from "../services/sessionStore";

// ── Load all 5 stage personas ─────────────────────────────────────────────
import * as stage1 from "../personas/stage1";
import * as stage2 from "../personas/stage2";
import * as stage3 from "../personas/stage3";
import * as stage4 from "../personas/stage4";
import * as stage5 from "../personas/stage5";

const TOTAL_STAGES = 5;

const personas: Record<number, { SYSTEM_PROMPT: string; DETECTION_STRING: string }> = {
  1: stage1,
  2: stage2,
  3: stage3,
  4: stage4,
  5: stage5,
};

/**
 * Checks whether the AI's reply satisfies the stage's unlock condition.
 *
 * Strategy: case-insensitive substring match against the stage's DETECTION_STRING.
 * Each stage persona exports a DETECTION_STRING constant that the real LLM
 * should output when successfully jailbroken.
 */
function checkUnlockCondition(
  stageNum: number,
  aiReply: string,
  _userMessage: string
): boolean {
  const { DETECTION_STRING } = personas[stageNum];
  // Case-insensitive substring match
  return aiReply.toLowerCase().includes(DETECTION_STRING.toLowerCase());
}

export const chatRouter = Router();

chatRouter.post("/", async (req: Request, res: Response) => {
  const { team_id, stage: stageRaw, message } = req.body as {
    team_id: unknown;
    stage: unknown;
    message: unknown;
  };

  // ── Validation ────────────────────────────────────────────────────────────
  if (
    typeof team_id !== "string" || !team_id.trim() ||
    typeof message !== "string" || !message.trim() ||
    typeof stageRaw !== "number" ||
    !Number.isInteger(stageRaw) ||
    stageRaw < 0 ||
    stageRaw > TOTAL_STAGES - 1
  ) {
    return res.status(400).json({
      error:
        "Missing or invalid fields. Expected: { team_id: string, stage: number (0–4), message: string }",
    });
  }

  // Frontend sends 0-indexed; convert to 1-indexed for persona lookup
  const stageNum = stageRaw + 1; // 1–5
  const teamId = team_id.trim();
  const userMessage = message.trim();

  // ── Guard: already completed? ──────────────────────────────────────────────
  if (isStageComplete(teamId, stageNum)) {
    return res.json({
      reply: `Stage ${stageNum} is already complete. Move to the next challenge!`,
      stageComplete: true,
      nextStage: stageNum < TOTAL_STAGES ? stageRaw + 1 : null,
    });
  }

  const persona = personas[stageNum];
  const history = getHistory(teamId, stageNum);

  // ── Call LLM (stubbed) ────────────────────────────────────────────────────
  let reply: string;
  try {
    reply = await callLLM(persona.SYSTEM_PROMPT, history, userMessage);
  } catch (err) {
    console.error("[chat] LLM error:", err);
    return res.status(500).json({ error: "LLM call failed" });
  }

  // ── Persist history ───────────────────────────────────────────────────────
  addToHistory(teamId, stageNum, userMessage, reply);

  // ── Check unlock condition ────────────────────────────────────────────────
  const stageComplete = checkUnlockCondition(stageNum, reply, userMessage);
  if (stageComplete) {
    markStageComplete(teamId, stageNum);
  }

  const nextStage: number | null =
    stageComplete && stageNum < TOTAL_STAGES ? stageRaw + 1 : null;

  return res.json({ reply, stageComplete, nextStage });
});
