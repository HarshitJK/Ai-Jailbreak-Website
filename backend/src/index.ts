import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`[server] Running on http://localhost:${config.port}`);
  console.log(`[server] CORS allowed for: ${config.frontendOrigin}`);
  console.log(`[server] GET  /api/health`);
  console.log(`[server] POST /api/chat`);
});
