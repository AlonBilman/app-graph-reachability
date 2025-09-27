import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as any).status ?? 500;
  res.status(status).json({ error: err.message ?? "Internal Server Error" });
};
