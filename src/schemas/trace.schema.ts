import { z } from "zod";

export const TraceQuerySchema = z.object({
  all_paths: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => Number.isInteger(v) && v > 0, {
      message: "limit must be a positive integer",
    }),
});
