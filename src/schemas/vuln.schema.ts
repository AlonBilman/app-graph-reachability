import { z } from "zod";
import { Severity } from "./common";

export const Vulnerability = z.object({
  funcId: z.string(),
  severity: Severity,
  cweId: z.string().optional(),
});
export const VulnsSchema = z.array(Vulnerability);
export type VulnDTO = z.infer<typeof Vulnerability>;
