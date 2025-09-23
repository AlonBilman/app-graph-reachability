import type { Func, Graph, Vulnerability } from "./types";

/**
 * In-memory representation of the graph and vulnerabilities.
 * + utility functions.
 */
export interface Store {
  functions: Map<string, Func>;
  edges: { from: string; to: string }[];
  adjacency: Map<string, Set<string>>;
  entrypointIds: string[];
  vulnerabilities: Vulnerability[];
}

export function loadGraph(graph: Graph): Store {
  const functions = new Map<string, Func>();
  const entrypointIds: string[] = [];
  for (const fn of graph.functions) {
    if (fn.isEntrypoint) entrypointIds.push(fn.id);
    functions.set(fn.id, fn);
  }

  //init adjacency sets
  const adjacency = new Map<string, Set<string>>();
  for (const id of functions.keys()) {
    adjacency.set(id, new Set());
  }

  //validate and copy edges
  const edges: { from: string; to: string }[] = [];
  for (const edge of graph.edges) {
    if (!functions.has(edge.from) || !functions.has(edge.to)) {
      throw new Error(
        `Edge refers to non-existent function: ${edge.from} -> ${edge.to}`,
      );
    }
    edges.push(edge);
    adjacency.get(edge.from)!.add(edge.to);
  }

  return {
    functions,
    edges,
    adjacency,
    entrypointIds,
    vulnerabilities: [],
  };
}

export function getNeighbors(store: Store, id: string): string[] {
  return [...(store.adjacency.get(id) ?? new Set<string>())];
}

export function replaceVulnerabilities(
  store: Store,
  vulnerabilities: Vulnerability[],
) {
  store.vulnerabilities = vulnerabilities.slice();
}
