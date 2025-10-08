import { Router } from "express";
import { getComponentAnalysis } from "../controllers/analytics.controller";

export const analyticsRouter = Router();
analyticsRouter.get("/components", getComponentAnalysis);
