import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import { allEntryToTargetPaths } from "../services/reachability";
import { calculateTotalScore, getScoreBreakdown } from "../services/scoring";
import type { TraceResponse } from "../types";

function buildTraceResponse(
  functionId: string,
  paths: string[][],
  allPaths: boolean,
  limit: number,
): TraceResponse {
  const response: TraceResponse = {
    function_id: functionId,
    reachable: paths.length > 0,
  };

  if (paths.length === 0) {
    return response;
  }

  if (allPaths) {
    response.all_paths = paths.slice(0, limit);
    response.shortest_path_length = Math.min(...paths.map((p) => p.length));
    response.total_paths = paths.length;
  } else {
    const shortestPath = paths.reduce((shortest, current) =>
      current.length < shortest.length ? current : shortest,
    );
    response.shortest_path = shortestPath;
    response.path_length = shortestPath.length;
    response.total_paths_available = paths.length;
  }

  return response;
}

export const getFunctionTrace: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const functionId = req.params.id;
    const { all_paths = false, limit = 10 } = req.query as {
      all_paths?: boolean;
      limit?: number;
    };

    if (!store.hasFunction(functionId)) {
      return res.status(404).json({
        function_id: functionId,
        error: "Function not found",
      });
    }

    const paths = allEntryToTargetPaths(store, functionId);
    const response = buildTraceResponse(functionId, paths, all_paths, limit);

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getVulnerabilityTrace: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const vulnId = req.params.id;

    const vulnerability = store.vulnerabilities.find((v) => v.id === vulnId);
    if (!vulnerability) {
      return res.status(404).json({ error: "Vulnerability not found" });
    }

    const paths = allEntryToTargetPaths(store, vulnerability.funcId);
    const vulnWithReachability = {
      ...vulnerability,
      reachable: paths.length > 0,
    };
    const scoreBreakdown = getScoreBreakdown(vulnWithReachability);
    const score = calculateTotalScore(scoreBreakdown);
    const response = buildTraceResponse(
      vulnerability.funcId,
      paths,
      false,
      Infinity,
    );
    //add vulnerability details to response
    response.vulnerability_id = vulnId;
    response.severity = vulnerability.severity;
    response.score = score;

    if (paths.length === 0) {
      response.error = "No path exists from entry points to this function";
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};
