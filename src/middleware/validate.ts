import type { z } from "zod";
import type { RequestHandler, Request } from "express";
import { ValidationError } from "../errors/api-error";

function createValidator<
  T extends keyof Pick<Request, "body" | "query" | "params">,
>(key: T, defaultMessage: string) {
  return (schema: z.ZodType): RequestHandler =>
    (req, _res, next) => {
      const parsed = schema.safeParse(req[key]);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.join(".") ?? "";
        const msg = issue
          ? path
            ? `${path}: ${issue.message}`
            : issue.message
          : defaultMessage;
        return next(new ValidationError(msg, parsed.error.issues));
      }
      (req as any)[key] = parsed.data;
      next();
    };
}

export const validate = createValidator(
  "body",
  "Request body validation failed",
);
export const validateQuery = createValidator(
  "query",
  "Query parameter validation failed",
);
export const validateParams = createValidator(
  "params",
  "Route parameter validation failed",
);
