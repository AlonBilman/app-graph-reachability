import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import { allEntryToTargetPaths } from "../services/reachability";
import {
  calculateTotalScore,
  getScoreBreakdown,
  hierarchyLevels,
} from "../services/scoring";
import type { RisksListResponse, RiskResponse, Severity } from "../types";

export const getRisks: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const { min_severity, limit, reachable_only } = req.query as {
      min_severity?: Severity;
      limit?: number;
      reachable_only?: boolean;
    };

    const risks: RiskResponse[] = store.vulnerabilities
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
      .filter((risk) => !reachable_only || risk.reachable)
      .filter(
        (risk) =>
          !min_severity ||
          hierarchyLevels[risk.severity] >= hierarchyLevels[min_severity],
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const response: RisksListResponse = { risks };
    res.json(response);
  } catch (error) {
    next(error);
  }
};
