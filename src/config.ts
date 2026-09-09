import "dotenv/config";

// TODO: Validate required env vars in production
export const config = {
  port: process.env.PORT || 3000,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
  jwtSecret: process.env.JWT_SECRET || "jwt-secret-key",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "anthropic-api-key",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
};
// TODO: Add proper config validation and environment checks