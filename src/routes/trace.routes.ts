import { Router } from "express";
import {
  getFunctionTrace,
  getVulnerabilityTrace,
} from "../controllers/trace.controller";
import { validateQuery, validateParams } from "../middleware/validate";
import { TraceQuerySchema } from "../schemas/trace.schema";
import { IdParamSchema } from "../schemas/common";

export const traceRouter = Router();
traceRouter.get(
  "/:id/trace",
  validateParams(IdParamSchema),
  validateQuery(TraceQuerySchema),
  getFunctionTrace,
);

export const vulnTraceRouter = Router();
vulnTraceRouter.get(
  "/:id/trace",
  validateParams(IdParamSchema),
  validateQuery(TraceQuerySchema),
  getVulnerabilityTrace,
);
