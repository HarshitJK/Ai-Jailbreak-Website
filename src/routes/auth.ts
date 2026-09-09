import { Request, Response } from "express";
import { verify, sign } from "jsonwebtoken";

// TODO: Replace with proper user/team lookup
const USERS: Record<string, { password: string; teamId: string }> = {
  team1: { password: "team123", teamId: "team1" },
  team2: { password: "team456", teamId: "team2" },
};

export function login(req: Request, res: Response) {
  const { teamName, password } = req.body;

  if (!USERS[teamName] || USERS[teamName].password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const teamId = USERS[teamName].teamId;
  const token = sign({ teamId }, process.env.JWT_SECRET || "jwt-secret-key", {
    expiresIn: "24h",
  });

  return res.json({ token, teamId });
}
// TODO: Add team registration, password hashing, DB integration