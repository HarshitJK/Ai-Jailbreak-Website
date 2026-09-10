import { createApp } from "./app";

createApp().listen(3000, () => {
  console.log("Backend server running on http://localhost:3000");
});