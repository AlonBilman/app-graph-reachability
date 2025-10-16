import { z } from "zod"; //my guardian angel

export const Severity = z.enum(["low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof Severity>;

export const IdParamSchema = z.object({
  id: z.string().min(1, "ID cannot be empty"),
});
