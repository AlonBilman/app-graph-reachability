import { Router } from "express";
import { graphRouter } from "./graph.routes";
import { vulnsRouter } from "./vulns.routes";
import { risksRouter } from "./risks.routes";
import { traceRouter } from "./trace.routes";
import { vulnTraceRouter } from "./trace.routes";
import { analyticsRouter } from "./analytics.routes";

export const api = Router();
api.use("/graph", graphRouter); // POST /graph
api.use("/vulns", vulnsRouter); // POST /vulnerabilities
api.use("/risks", risksRouter); // GET  /risks
api.use("/functions", traceRouter); // GET  /functions/:id/trace
api.use("/vulns", vulnTraceRouter); // Add convenience endpoint
api.use("/analytics", analyticsRouter); // Analytics endpoints
