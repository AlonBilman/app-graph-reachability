import type { RequestHandler } from "express";
import { Store } from "../store";
import type { GraphDTO } from "../schemas/graph.schema";

let store: Store | null = null;

export const getStore = () => store;

export const requireStore = () => {
  if (!store)
    throw Object.assign(new Error("Graph not loaded. POST /graph first."), {
      status: 400,
    });
  return store;
};

export const postGraph: RequestHandler = (req, res, next) => {
  try {
    const graphData: GraphDTO = req.body;
    store = new Store(graphData);
    res.json({
      ok: true,
      functions: store.functions.size,
      edges: store.edges.length,
      entrypoints: store.entrypointIds.length,
    });
  } catch (e) {
    next(e);
  }
};
