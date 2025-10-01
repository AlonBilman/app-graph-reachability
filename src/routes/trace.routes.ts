import { Router } from "express";
import {
  getFunctionTrace,
  getVulnerabilityTrace,
} from "../controllers/trace.controller";

export const traceRouter = Router();
traceRouter.get("/:id/trace", getFunctionTrace);

export const vulnTraceRouter = Router();
vulnTraceRouter.get("/:id/trace", getVulnerabilityTrace);
