import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import { findConnectedComponents } from "../services/analytics";

export const getComponentAnalysis: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const result = findConnectedComponents(store);
    res.json(result);
  } catch (e) {
    next(e);
  }
};
