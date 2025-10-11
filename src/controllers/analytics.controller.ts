import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import {
  findConnectedComponents,
  findCriticalAttackPaths,
} from "../services/analytics";
import { Severity } from "../types";
import type {
  AttackPathQueryDTO,
  ComponentQueryDTO,
} from "../schemas/analytics.schema";

export const getComponentAnalysis: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    // unused
    const _q = req.query as ComponentQueryDTO;
    const result = findConnectedComponents(store);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const getAttackPaths: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const { max_paths, min_severity, max_path_length } =
      req.query as AttackPathQueryDTO;
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
