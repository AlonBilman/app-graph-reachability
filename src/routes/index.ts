import { Router } from "express";
import { graphRouter } from "./graph.routes";
import { vulnsRouter } from "./vulns.routes";
// import { risksRouter } from "./risks.routes";
// import { traceRouter } from "./trace.routes";
// import { vulnTraceRouter } from "./vuln-trace.routes";

export const api = Router();
api.use("/graph", graphRouter); // POST /graph
api.use("/vulns", vulnsRouter); // POST /vulnerabilities
// api.use("/vuln-trace", vulnTraceRouter); // Add convenience endpoint
// api.use("/risks", risksRouter);       // GET  /risks
// api.use("/functions", traceRouter);   // GET  /functions/:id/trace
