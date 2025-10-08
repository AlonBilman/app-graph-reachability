import { Store } from "../store";
import { Func, DangerousGroup } from "../types";
import { bfsAllPaths } from "./graphUtils";

// returns all paths from any entrypoint to the target function id with bfs
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
    const idPaths = getIdPaths(vuln.funcId);
    if (idPaths.length === 0) continue; //skip unreachable

    const funcPaths: Func[][] = idPaths.map((ids) =>
      ids.map((id) => store.getFunctionOrThrow(id)),
    );
    groups.push({ paths: funcPaths, vulnerability: vuln });
  }

  return groups;
}
