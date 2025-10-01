import { z } from "zod";
import { Severity } from "./common";

export const Vulnerability = z.object({
  id: z.string(),
  funcId: z.string(),
  severity: Severity,
  cweId: z.string().optional(),
  package_name: z.string().optional(),
  introduced_by_ai: z.boolean().optional(),
});

export const VulnsSchema = z.array(Vulnerability);
export type VulnDTO = z.infer<typeof Vulnerability>;
