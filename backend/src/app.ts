import express from "express";
import cors from "cors";
import { config } from "./config";
import { chatRouter } from "./routes/chat";

export function createApp() {
  const app = express();

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.frontendOrigin,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  );

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json());

  // ── Health check ──────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── Round 1 chat ─────────────────────────────────────────────────────────
  app.use("/api/chat", chatRouter);

  return app;
}
