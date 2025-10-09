import { Router } from "express";
import {
  getComponentAnalysis,
  getAttackPaths,
} from "../controllers/analytics.controller";
import { validateQuery } from "../middleware/validate";
import { AttackPathQuerySchema } from "../schemas/analytics.schema";

export const analyticsRouter = Router();
analyticsRouter.get("/components", getComponentAnalysis);
analyticsRouter.get(
  "/attack-paths",
  validateQuery(AttackPathQuerySchema),
  getAttackPaths,
);
