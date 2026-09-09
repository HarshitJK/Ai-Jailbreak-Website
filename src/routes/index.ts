import { Router } from "express";
import { login } from "./auth";
import { chat } from "./chat";
import { admin } from "./admin";

const router = Router();

router.post("/auth/login", login);
router.post("/api/chat", chat);
router.get("/api/admin", admin);

export { router as routes };