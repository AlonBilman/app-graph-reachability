import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import {
  findConnectedComponents,
  findCriticalAttackPaths,
} from "../services/analytics";
import type {
  ComponentAnalysisResponseDTO,
  AttackPathAnalysisResponseDTO,
} from "../types/dto.types";
import { ResponseHelper } from "../utils/response.helper";

export const getComponentAnalysis: RequestHandler = (_req, res, next) => {
  try {
    const store = requireStore();
    const result = findConnectedComponents(store);
    ResponseHelper.success<ComponentAnalysisResponseDTO>(res, result);
  } catch (e) {
    next(e);
  }
};

export const getAttackPaths: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();

    // After validation middleware, these are already typed correctly
    const {
      max_paths = 10,
      min_severity = "high",
      max_path_length,
    } = req.query as {
      max_paths?: number;
      min_severity?: "low" | "medium" | "high" | "critical";
      max_path_length?: number;
    };

    const result = findCriticalAttackPaths(
      store,
      max_paths,
      min_severity,
      max_path_length,
    );
    ResponseHelper.success<AttackPathAnalysisResponseDTO>(res, result);
  } catch (e) {
    next(e);
  }
};
