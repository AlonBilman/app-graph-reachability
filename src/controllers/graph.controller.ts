import type { RequestHandler } from "express";
import { Store } from "../store";
import type { GraphDTO } from "../schemas/graph.schema";
import type { GraphLoadResponse } from "../types";
import { GraphNotLoadedError } from "../errors/api-error";

let store: Store | null = null;

export const getStore = () => store;

export const requireStore = () => {
  if (!store) throw new GraphNotLoadedError();
  return store;
};

export const postGraph: RequestHandler = (req, res, next) => {
  try {
    const graphData: GraphDTO = req.body;
    store = new Store(graphData);

    const response: GraphLoadResponse = {
      ok: true,
      functions: store.functions.size,
      edges: store.edges.length,
      entry_points: store.entrypointIds.length,
    };

    res.json(response);
  } catch (e) {
    next(e);
  }
};
