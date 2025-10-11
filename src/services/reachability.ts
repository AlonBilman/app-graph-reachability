import { Store } from "../store";
import { Func, DangerousGroup } from "../types";
import { bfsAllPaths } from "./graph-utils";

/**
 * Finds all paths from any entrypoint to the target function (DIRECTED).
 * Uses BFS for each entrypoint.
 * @param store - The in-memory graph store
 * @param target - Target function ID
 */
export function allEntryToTargetPaths(
  store: Store,
  target: string,
): string[][] {
  const results: string[][] = [];
  for (const entry of store.entrypointIds) {
    const paths = bfsAllPaths(store, entry, target);
    results.push(...paths);
  }
  return results;
}

/**
 * For each vulnerability, finds all exploit paths from entrypoints to the vulnerable function.
 * Groups results by vulnerability.
 * @param store - The in-memory graph store
 * @param opts - Optional: maxPathsPerFunc to limit number of paths per vulnerability
 */
export function findDangerousPathsFromEntrypoints(
  store: Store,
  opts?: { maxPathsPerFunc?: number },
): DangerousGroup[] {
  const maxPathsPerFunc = opts?.maxPathsPerFunc ?? Infinity;

  //cache bfs results once per target
  const pathCache = new Map<string, string[][]>();

  const getIdPaths = (funcId: string): string[][] => {
    if (!pathCache.has(funcId)) {
      const paths = allEntryToTargetPaths(store, funcId);
      //cap total paths per function (maxPathsPerFunc)
      pathCache.set(funcId, paths.slice(0, maxPathsPerFunc));
    }
    return pathCache.get(funcId)!;
  };

  const groups: DangerousGroup[] = [];

  for (const vuln of store.vulnerabilities) {
    const idPaths = getIdPaths(vuln.func_id);
    if (idPaths.length === 0) continue; //skip unreachable

    const funcPaths: Func[][] = idPaths.map((ids) =>
      ids.map((id) => store.getFunctionOrThrow(id)),
    );
    groups.push({ paths: funcPaths, vulnerability: vuln });
  }

  return groups;
}
