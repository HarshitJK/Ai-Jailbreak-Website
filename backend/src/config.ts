import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  // TODO: populate before the real Anthropic call pass
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
};
