import { z } from "zod";
import { Severity } from "./common";

export const RisksQuerySchema = z.object({
  min_severity: Severity.optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
    .refine((v) => Number.isInteger(v) && v > 0, {
      message: "limit must be a positive integer",
    }),
  reachable_only: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
});
