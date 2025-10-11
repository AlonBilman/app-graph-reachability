import type { ErrorRequestHandler } from "express";
import { ApiError } from "../errors/api-error";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  res.setHeader("Content-Type", "application/json");

  // Handle custom ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: {
        message: err.message,
        code: err.code,
        status: err.status,
        ...("details" in err && { details: (err as any).details }),
      },
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        status: 400,
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      error: {
        message: err.message,
        status: err.status,
      },
    });
  }

  // Default error
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      message: "Internal Server Error",
      code: "INTERNAL_ERROR",
      status: 500,
    },
  });
};
