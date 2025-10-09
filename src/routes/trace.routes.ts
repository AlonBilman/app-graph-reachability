import { Router } from "express";
import {
  getFunctionTrace,
  getVulnerabilityTrace,
} from "../controllers/trace.controller";
import { validateQuery } from "../middleware/validate";
import { TraceQuerySchema } from "../schemas/trace.schema";

export const traceRouter = Router();
traceRouter.get(
  "/:id/trace",
  validateQuery(TraceQuerySchema),
  getFunctionTrace,
);

export const vulnTraceRouter = Router();
vulnTraceRouter.get("/:id/trace", getVulnerabilityTrace);
