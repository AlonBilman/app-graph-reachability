import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors/api-error";

/**
 * Centralized error handling middleware
 * Converts all errors into consistent JSON responses
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Log all errors with request context
  const logContext = {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  };

  // Handle known API errors
  if (err instanceof ApiError) {
    console.error(`[${err.code}] ${err.message}`, logContext);
    return res.status(err.status).json({
      ok: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    console.error("[VALIDATION_ERROR] Zod validation failed", {
      ...logContext,
      errors: err.issues,
    });
    return res.status(400).json({
      ok: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.issues,
      },
    });
  }

  // Handle unknown errors
  console.error("[INTERNAL_ERROR] Unexpected error:", err, logContext);

  return res.status(500).json({
    ok: false,
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
      // Include stack trace only in development
      ...(process.env.NODE_ENV === "development" && {
        stack: err instanceof Error ? err.stack : undefined,
      }),
    },
  });
};
