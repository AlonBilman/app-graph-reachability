import { z } from "zod";
import { Severity } from "./common";

export const VulnerabilityDTOSchema = z.object({
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

export const VulnerabilityLoadRequestDTOSchema = z
  .array(VulnerabilityDTOSchema)
  .max(1000, "Too many vulnerabilities (max: 1000)");

export type VulnerabilityDTO = z.infer<typeof VulnerabilityDTOSchema>;
export type VulnerabilityLoadRequestDTO = z.infer<
  typeof VulnerabilityLoadRequestDTOSchema
>;
