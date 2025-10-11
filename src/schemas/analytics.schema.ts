import { z } from "zod";
import { Severity } from "./common";

export const ComponentQuerySchema = z.object({
  //adding schema for consistency
});

export type ComponentQueryDTO = z.infer<typeof ComponentQuerySchema>;

export const AttackPathQuerySchema = z.object({
  max_paths: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: "max_paths must be a positive integer",
    }),
  min_severity: Severity.optional(),
  max_path_length: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: "max_path_length must be a positive integer",
    }),
});

export type AttackPathQueryDTO = z.infer<typeof AttackPathQuerySchema>;
