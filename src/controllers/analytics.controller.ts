import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import {
  findConnectedComponents,
  findCriticalAttackPaths,
} from "../services/analytics";
import { Severity } from "../types";

export const getComponentAnalysis: RequestHandler = (_req, res, next) => {
  try {
    const store = requireStore();
    const result = findConnectedComponents(store);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const getAttackPaths: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const { max_paths, min_severity, max_path_length } = req.query as {
      max_paths?: number;
      min_severity?: Severity;
      max_path_length?: number;
    };
    const result = findCriticalAttackPaths(
      store,
      max_paths ?? 10,
      min_severity ?? "high",
      max_path_length,
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
};
