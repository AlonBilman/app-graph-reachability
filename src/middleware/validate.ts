import type { z } from "zod";
import type { RequestHandler } from "express";
import { ValidationError } from "../errors/api-error";

/**
 * Validate request body against a Zod schema
 */
export const validate =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      let errorMessage = "Request body validation failed";
      if (firstIssue) {
        const path =
          firstIssue.path.length > 0 ? firstIssue.path.join(".") : "";
        errorMessage = path
          ? `${path}: ${firstIssue.message}`
          : firstIssue.message;
      }
      return next(new ValidationError(errorMessage, parsed.error.issues));
    }
    req.body = parsed.data;
    next();
  };

/**
 * Validate query parameters against a Zod schema
 */
export const validateQuery =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      let errorMessage = "Query parameter validation failed";
      if (firstIssue) {
        const path =
          firstIssue.path.length > 0 ? firstIssue.path.join(".") : "";
        errorMessage = path
          ? `${path}: ${firstIssue.message}`
          : firstIssue.message;
      }
      return next(new ValidationError(errorMessage, parsed.error.issues));
    }
    req.query = parsed.data as typeof req.query;
    next();
  };

/**
 * Validate route parameters against a Zod schema
 */
export const validateParams =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      let errorMessage = "Route parameter validation failed";
      if (firstIssue) {
        const path =
          firstIssue.path.length > 0 ? firstIssue.path.join(".") : "";
        errorMessage = path
          ? `${path}: ${firstIssue.message}`
          : firstIssue.message;
      }
      return next(new ValidationError(errorMessage, parsed.error.issues));
    }
    req.params = parsed.data as typeof req.params;
    next();
  };
