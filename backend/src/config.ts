import "dotenv/config";

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "jwt-secret-key",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "anthropic-api-key",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
};