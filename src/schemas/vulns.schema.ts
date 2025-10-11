import { z } from "zod";
import { Severity } from "./common";

export const Vulnerability = z.object({
  id: z
    .string()
    .min(1, "Vulnerability ID cannot be empty")
    .max(100, "Vulnerability ID too long"),
  func_id: z.string().min(1, "Function ID cannot be empty"),
  severity: Severity,
  cwe_id: z.string().optional(),
  package_name: z.string().optional(),
  introduced_by_ai: z.boolean().optional(),
});

export const VulnsSchema = z
  .array(Vulnerability)
  .max(1000, "Too many vulnerabilities (max: 1000)");

export type VulnDTO = z.infer<typeof Vulnerability>;
