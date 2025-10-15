import type { Store } from "../store";
import type {
  ComponentAnalysis,
  Severity,
  AttackPathAnalysis,
  AttackPath,
} from "../types/domain.types";
import {
  findConnectedComponents as findComponents,
  bfsReachable,
} from "./graph-utils";
import {
  calculateTotalScore,
  hierarchyLevels,
  getExploitDifficulty,
  getScoreBreakdown,
} from "./scoring";
import { findDangerousPathsFromEntrypoints } from "./reachability";

/**
 * Analyze connected components and compute security metrics.
 * Identifies the main component, isolated components, dead code, and security impact.
 * @param store - The in-memory graph store
 */
export function findConnectedComponents(store: Store): ComponentAnalysis {
  const components = findComponents(store);
  const entrypoints = new Set(store.entrypointIds);

  // Identify main component (largest with most entrypoints)
  const mainIdx = findMainComponentIndex(components, entrypoints);
  const mainComponent = components[mainIdx];
  const mainComponentSet = new Set(mainComponent);

  // Reachability from all entrypoints
  const reachable = bfsReachable(store, [...store.entrypointIds]);
  const deadCodeSet = new Set(
    Array.from(store.functions.keys()).filter((id) => !reachable.has(id)),
  );

  // Single pass through vulnerabilities for efficient counting
  const vulnMetrics = analyzeVulnerabilities(
    store.vulnerabilities,
    mainComponentSet,
    reachable,
    deadCodeSet,
  );

  // Build isolated component details
  const isolatedComponents = buildIsolatedComponents(
    components,
    mainIdx,
    vulnMetrics.vulnsByFunc,
    store,
  );

  return {
    total_components: components.length,
    main_component: {
      size: mainComponent.length,
      entry_points: components[mainIdx].filter((id) => entrypoints.has(id))
        .length,
      vulnerabilities: vulnMetrics.mainVulnCount,
    },
    isolated_components: isolatedComponents,
    security_impact: {
      reachable_vulnerabilities: vulnMetrics.reachableVulnCount,
      isolated_vulnerabilities: vulnMetrics.isolatedVulnCount,
      dead_code_functions: deadCodeSet.size,
      main_component_coverage: Math.round(
        (mainComponent.length / store.functions.size) * 100,
      ),
    },
  };
}

/**
 * Find the main component (largest with most entrypoints).
 */
function findMainComponentIndex(
  components: string[][],
  entrypoints: Set<string>,
): number {
  let mainIdx = 0;
  let maxEntrypoints = 0;

  components.forEach((comp, idx) => {
    const entryCount = comp.filter((id) => entrypoints.has(id)).length;
    if (
      entryCount > maxEntrypoints ||
      (entryCount === maxEntrypoints &&
        comp.length > components[mainIdx].length)
    ) {
      mainIdx = idx;
      maxEntrypoints = entryCount;
    }
  });

  return mainIdx;
}

/**
 * Analyze vulnerabilities.
 */
function analyzeVulnerabilities(
  vulnerabilities: readonly any[],
  mainComponentSet: Set<string>,
  reachable: Set<string>,
  deadCodeSet: Set<string>,
) {
  let mainVulnCount = 0;
  let reachableVulnCount = 0;
  let isolatedVulnCount = 0;
  const vulnsByFunc = new Map<string, string[]>();

  for (const vuln of vulnerabilities) {
    if (mainComponentSet.has(vuln.func_id)) {
      mainVulnCount++;
    }
    if (reachable.has(vuln.func_id)) {
      reachableVulnCount++;
    }
    if (deadCodeSet.has(vuln.func_id)) {
      isolatedVulnCount++;
    }
    if (!vulnsByFunc.has(vuln.func_id)) {
      vulnsByFunc.set(vuln.func_id, []);
    }
    vulnsByFunc.get(vuln.func_id)!.push(vuln.id);
  }

  return {
    mainVulnCount,
    reachableVulnCount,
    isolatedVulnCount,
    vulnsByFunc,
  };
}

/**
 * Build isolated component details (single-node, non-main components).
 */
function buildIsolatedComponents(
  components: string[][],
  mainIdx: number,
  vulnsByFunc: Map<string, string[]>,
  store: Store,
) {
  return components
    .filter((comp, idx) => idx !== mainIdx && comp.length === 1)
    .map((comp) => {
      const fnId = comp[0];
      const vulnIds = vulnsByFunc.get(fnId) || [];
      const vulns = store.vulnerabilities.filter((v) => vulnIds.includes(v.id));

      return {
        functions: [fnId],
        vulnerabilities: vulnIds,
        risk_level: vulns.length ? vulns[0].severity : ("low" as Severity),
      };
    });
}

/**
 * Find critical attack paths for high/critical vulnerabilities.
 * Returns an AttackPathAnalysis object with summary.
 * @param store - The in-memory graph store
 * @param maxPaths - Max paths to return per vulnerability (default 10)
 * @param minSeverity - Minimum severity to consider (default "high")
 * @param maxPathLength - Optional max path length to include
 */
export function findCriticalAttackPaths(
  store: Store,
  maxPaths: number = 10,
  minSeverity: Severity = "high",
  maxPathLength?: number,
): AttackPathAnalysis {
  const groups = findDangerousPathsFromEntrypoints(store, {
    maxPathsPerFunc: maxPaths,
  });
  const attackPaths: AttackPath[] = [];

  for (const group of groups) {
    if (
      hierarchyLevels[group.vulnerability.severity] <
      hierarchyLevels[minSeverity]
    )
      continue;

    for (const path of group.paths) {
      if (maxPathLength && path.length > maxPathLength) continue;

      const vulnWithReachability = { ...group.vulnerability, reachable: true };
      const scoreBreakdown = getScoreBreakdown(vulnWithReachability);
      const risk_score = calculateTotalScore(scoreBreakdown);

      const exploit_difficulty = getExploitDifficulty(path.length);

      attackPaths.push({
        vulnerability_id: group.vulnerability.id,
        severity: group.vulnerability.severity,
        path: path.map((f) => f.id),
        path_length: path.length,
        risk_score,
        exploit_difficulty,
        total_paths: group.paths.length,
        entry_point_accessible: true,
      });
    }
  }

  // summary stats
  const shortest = attackPaths.length
    ? Math.min(...attackPaths.map((p) => p.path_length))
    : 0;
  const avg = attackPaths.length
    ? Math.round(
        attackPaths.reduce((sum, p) => sum + p.path_length, 0) /
          attackPaths.length,
      )
    : 0;
  const entrypointCounts: Record<string, number> = {};
  for (const ap of attackPaths) {
    const entry = ap.path[0];
    entrypointCounts[entry] = (entrypointCounts[entry] || 0) + 1;
  }
  const mostVulnerableEntryPoint =
    Object.entries(entrypointCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    null;

  return {
    critical_paths: attackPaths,
    summary: {
      total_critical_paths: attackPaths.length,
      shortest_path_length: shortest,
      most_vulnerable_entry_point: mostVulnerableEntryPoint,
      average_path_length: avg,
    },
    generated_at: new Date().toISOString(),
  };
}
