import type { Store } from "../store";
import type { ComponentAnalysis, Severity } from "../types";
import { findConnectedComponents as findComponents } from "./graph-utils";
import { bfsReachable } from "./graph-utils";

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
    if (mainComponentSet.has(vuln.funcId)) {
      mainVulnCount++;
    }
    if (reachable.has(vuln.funcId)) {
      reachableVulnCount++;
    }
    if (deadCodeSet.has(vuln.funcId)) {
      isolatedVulnCount++;
    }
    if (!vulnsByFunc.has(vuln.funcId)) {
      vulnsByFunc.set(vuln.funcId, []);
    }
    vulnsByFunc.get(vuln.funcId)!.push(vuln.id);
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
