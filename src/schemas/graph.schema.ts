import { z } from "zod";

export const Func = z.object({
  id: z
    .string()
    .min(1, "Function ID cannot be empty")
    .max(100, "Function ID too long")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Function ID must be alphanumeric with underscores/hyphens only",
    ),
  name: z
    .string()
    .min(1, "Function name cannot be empty")
    .max(200, "Function name too long"),
  is_entrypoint: z.boolean(),
});

export const Edge = z.object({
  from: z.string().min(1, "Edge 'from' cannot be empty"),
  to: z.string().min(1, "Edge 'to' cannot be empty"),
});

export const GraphSchema = z
  .object({
    functions: z
      .array(Func)
      .nonempty("Graph must have at least one function")
      .max(10000, "Too many functions (max: 10000)"),
    edges: z.array(Edge).max(50000, "Too many edges (max: 50000)"),
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
  )
  .refine(
    (g) => {
      // Prevent self-loops
      return g.edges.every((e) => e.from !== e.to);
    },
    {
      message: "Self-loops not allowed (function cannot call itself directly)",
    },
  )
  .refine(
    (g) => {
      // Prevent duplicate edges
      const edgeSet = new Set(g.edges.map((e) => `${e.from}->${e.to}`));
      return edgeSet.size === g.edges.length;
    },
    { message: "Duplicate edges not allowed" },
  );

export type GraphDTO = z.infer<typeof GraphSchema>;
