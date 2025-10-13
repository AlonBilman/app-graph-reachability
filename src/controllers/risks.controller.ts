import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import { allEntryToTargetPaths } from "../services/reachability";
import {
  calculateTotalScore,
  getScoreBreakdown,
  hierarchyLevels,
} from "../services/scoring";
import type { RisksListResponse, RiskResponse } from "../types";
import type { RisksQueryDTO } from "../schemas/risks.schema";

export const getRisks: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const { min_severity, limit, reachable_only } = req.query as RisksQueryDTO;

    const risks: RiskResponse[] = store.vulnerabilities
      .filter((vuln) => {
        const exists = store.hasFunction(vuln.func_id);
        if (!exists) {
          console.warn(
            `Skipping vulnerability ${vuln.id}: function ${vuln.func_id} not found`,
          );
        }
        return exists;
      })
      .map((vuln) => {
        const paths = allEntryToTargetPaths(store, vuln.func_id);
        const reachable = paths.length > 0;
        const func = store.getFunctionOrThrow(vuln.func_id);

        const vulnWithReachability = { ...vuln, reachable };
        const scoreBreakdown = getScoreBreakdown(vulnWithReachability);
        const score = calculateTotalScore(scoreBreakdown);

        return {
          id: vuln.id,
          function_id: vuln.func_id,
          function_name: func.name,
          severity: vuln.severity,
          cwe: vuln.cwe_id,
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
