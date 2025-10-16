import type { RequestHandler } from "express";
import { Store } from "../store";
import type { GraphDTO } from "../schemas/graph.schema";
import type {
  GraphLoadResponseDTO,
  GraphResponseDTO,
} from "../types/dto.types";
import { DTOMapper } from "../utils/dto.mapper";
import { GraphNotLoadedError } from "../errors/api-error";
import { ResponseHelper } from "../utils/response.helper";

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

    const response: GraphLoadResponseDTO = {
      ok: true,
      functions: store.functions.size,
      edges: store.edges.length,
      entry_points: store.entrypointIds.length,
    };

    ResponseHelper.created(res, response);
  } catch (e) {
    next(e);
  }
};

export const getGraph: RequestHandler = (_req, res, next) => {
  try {
    const currentStore = requireStore();
    const functions = currentStore.getAllFunctions();
    const edges = currentStore.getAllEdges();

    const response: GraphResponseDTO = {
      functions: DTOMapper.functionsToDTO(functions),
      edges: DTOMapper.edgesToDTO(edges),
    };

    ResponseHelper.success(res, response);
  } catch (e) {
    next(e);
  }
};
