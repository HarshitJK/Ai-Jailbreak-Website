import { Request, Response } from "express";
import { authenticateToken } from "../middleware/authMiddleware";

export function admin(req: Request, res: Response) {
  return res.json({ message: "Admin endpoint - TODO: implement progress and transcripts" });
}