import express from "express";
import { errorHandler } from "./middleware/errors";
import { api } from "./routes";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/", api);
  app.use(errorHandler);
  return app;
}
