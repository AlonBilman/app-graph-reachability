import type { z } from "zod";
import type { RequestHandler } from "express";

//validate before reaching the controller
export const validate =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return next(
        Object.assign(new Error(`Validation error: ${msg}`), { status: 400 }),
      );
    }
    req.body = parsed.data;
    next();
  };

//validate query parameters
export const validateQuery =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return next(
        Object.assign(new Error(`Validation error: ${msg}`), { status: 400 }),
      );
    }
    req.query = parsed.data as any;
    next();
  };
