import type { RequestHandler } from "express";
import { Store } from "../store";
import type { Graph } from "../types";

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
    store = new Store(req.body as Graph);
    res.json({
      ok: true,
      functions: store.functions.size,
      edges: store.edges.length,
      entrypoints: store.entrypointIds.length,
    });
  } catch (ex) {
    next(ex);
  }
};
