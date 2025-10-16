import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();
const PORT = Number(process.env.PORT ?? 3000);
if (!Number.isFinite(PORT) || PORT <= 0) {
  throw new Error("Invalid PORT environment variable");
}
createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
