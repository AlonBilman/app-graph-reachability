import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import { allEntryToTargetPaths } from "../services/reachability";
import {
  calculateTotalScore,
  getScoreBreakdown,
  hierarchyLevels,
} from "../services/scoring";
import type { Severity, RisksListResponse, RiskResponse } from "../types";

export const getRisks: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const minSeverity = req.query.min_severity as Severity | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const reachableOnly = req.query.reachable_only !== "false";

    const risks: RiskResponse[] = store.vulnerabilities
      //Im not sure if its the right approach, but Id like to skip bad vulns instead of crashing.
      .filter((vuln) => {
        const exists = store.hasFunction(vuln.funcId);
        if (!exists) {
          console.warn(
            `Skipping vulnerability ${vuln.id}: function ${vuln.funcId} not found`,
          );
        }
        return exists;
      })
      .map((vuln) => {
        const paths = allEntryToTargetPaths(store, vuln.funcId);
        const reachable = paths.length > 0;
        const func = store.getFunctionOrThrow(vuln.funcId);

        const vulnWithReachability = { ...vuln, reachable };
        const scoreBreakdown = getScoreBreakdown(vulnWithReachability);
        const score = calculateTotalScore(scoreBreakdown);

        return {
          id: vuln.id,
          function_id: vuln.funcId,
          function_name: func.name,
          severity: vuln.severity,
          cwe: vuln.cweId,
          reachable,
          score,
          score_breakdown: scoreBreakdown,
          metadata: {
            package_name: vuln.package_name,
            introduced_by_ai: vuln.introduced_by_ai,
          },
        };
      })
      //filtering and sorting according to the query
      .filter((risk) => !reachableOnly || risk.reachable)
      .filter(
        (risk) =>
          !minSeverity ||
          hierarchyLevels[risk.severity] >= hierarchyLevels[minSeverity],
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const response: RisksListResponse = { risks };
    res.json(response);
  } catch (error) {
    next(error);
  }
};
