import { createServer } from "./index";

createServer().listen(3000, () => {
  console.log("Backend server running on http://localhost:3000");
});