import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();
const PORT = Number(process.env.PORT);
createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

