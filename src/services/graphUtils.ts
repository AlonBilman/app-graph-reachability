import { Store } from "../store";

/**
 * Reverse-adjacency cache.
 * Keyed by Store instance, rebuilt on first use.
 */
const reverseAdjCache: WeakMap<Store, Map<string, string[]>> = new WeakMap();

function buildReverseAdj(store: Store): Map<string, string[]> {
  const rev = new Map<string, string[]>();
  for (const { from, to } of store.edges) {
    let arr = rev.get(to);
    if (!arr) rev.set(to, (arr = []));
    arr.push(from);
  }
  return rev;
}

function getReverseAdj(store: Store): Map<string, string[]> {
  let rev = reverseAdjCache.get(store);
  if (!rev) {
    rev = buildReverseAdj(store);
    reverseAdjCache.set(store, rev);
  }
  return rev;
}

export function invalidateReverseAdj(store: Store): void {
  reverseAdjCache.delete(store);
}

/**
 *  Find all paths from source to target (DIRECTED)
 *
 */
export function bfsAllPaths(
  store: Store,
  source: string,
  target: string,
): string[][] {
  const results: string[][] = [];
  type Item = { path: string[]; seen: Set<string> };

  const queue: Item[] = [{ path: [source], seen: new Set([source]) }];
  let head = 0;

  while (head < queue.length) {
    const { path, seen } = queue[head++];
    const last = path[path.length - 1];

    if (last === target) {
      results.push(path);
      continue;
    }

    const neighbors = store.getNeighbors(last) ?? [];
    for (const nb of neighbors) {
      if (!seen.has(nb)) {
        // extend
        const nextPath = [...path, nb];
        const nextSeen = new Set(seen);
        nextSeen.add(nb);
        queue.push({ path: nextPath, seen: nextSeen });
      }
    }
  }

  return results;
}

/**
 * DFS: Find all connected components (UNDIRECTED)
 *
 */
export function findConnectedComponents(store: Store): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];
  const rev = getReverseAdj(store);

  for (const fnId of store.functions.keys()) {
    if (visited.has(fnId)) continue;

    const stack = [fnId];
    const component: string[] = [];

    while (stack.length) {
      const curr = stack.pop()!;
      if (visited.has(curr)) continue;

      visited.add(curr);
      component.push(curr);

      const out = store.getNeighbors(curr) ?? [];
      const inc = rev.get(curr) ?? [];

      const neighbors = new Set([...out, ...inc]);

      for (const nb of neighbors) {
        if (!visited.has(nb)) stack.push(nb);
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Get undirected neighbors for a node
 *  
 */
export function getUndirectedNeighbors(store: Store, id: string): string[] {
  const out = store.getNeighbors(id) ?? [];
  const inc = getReverseAdj(store).get(id) ?? [];
  return Array.from(new Set([...out, ...inc]));
}
/**
 * Find all reachable nodes from a set of sources (DIRECTED)
 * 
 */
export function bfsReachable(store: Store, sources: string[]): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [];

  // seed
  for (const s of sources) {
    if (!visited.has(s)) {
      visited.add(s);
      queue.push(s);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const neighbors = store.getNeighbors(curr) ?? [];
    for (const nb of neighbors) {
      if (!visited.has(nb)) {
        visited.add(nb); // mark on enqueue to avoid duplicates
        queue.push(nb);
      }
    }
  }
  return visited;
}