import { z } from "zod";

export const Func = z.object({
  id: z.string(),
  name: z.string(),
  isEntrypoint: z.boolean(),
});

export const Edge = z.object({ from: z.string(), to: z.string() });

export const GraphSchema = z
  .object({
    functions: z.array(Func).nonempty(),
    edges: z.array(Edge),
  })
  .refine(
    (g) => {
      const ids = g.functions.map((f) => f.id);
      return new Set(ids).size === ids.length;
    },
    { message: "Function ids must be unique" },
  )
  .refine(
    (g) => {
      const ids = new Set(g.functions.map((f) => f.id));
      return g.edges.every((e) => ids.has(e.from) && ids.has(e.to));
    },
    { message: "All edges must reference existing function ids" },
  );

export type GraphDTO = z.infer<typeof GraphSchema>;
