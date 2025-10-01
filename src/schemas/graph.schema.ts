import { z } from "zod";

export const Func = z.object({
  id: z.string(),
  name: z.string(),
  isEntrypoint: z.boolean(),
});
export const Edge = z.object({ from: z.string(), to: z.string() });
export const GraphSchema = z.object({
  functions: z.array(Func).nonempty(), //at least one function
  edges: z.array(Edge),
});
export type GraphDTO = z.infer<typeof GraphSchema>;
