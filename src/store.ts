import type { Func, Graph, Vulnerability } from "./types";
import type { GraphDTO } from "./schemas/graph.schema";

/**
 * In-memory representation of the graph and vulnerabilities.
 * + utility functions.
 */

interface Loaded {
  functions: Map<string, Func>;
  edges: { from: string; to: string }[];
  adjacency: Map<string, Set<string>>;
  entrypointIds: string[];
}

function loadGraph(graph: Graph | GraphDTO): Loaded {
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
  };
}

export class Store {
  private _functions: Map<string, Func>;
  private _edges: { from: string; to: string }[];
  private _adjacency: Map<string, Set<string>>;
  private _entrypointIds: string[];
  private _vulnerabilities: Vulnerability[];

  constructor(graph: Graph | GraphDTO) {
    const { functions, edges, adjacency, entrypointIds } = loadGraph(graph);
    this._functions = functions;
    this._edges = edges;
    this._adjacency = adjacency;
    this._entrypointIds = entrypointIds;
    this._vulnerabilities = [];
  }

  get functions(): ReadonlyMap<string, Func> {
    return this._functions;
  }
  get edges(): ReadonlyArray<{ from: string; to: string }> {
    return this._edges;
  }
  get adjacency(): ReadonlyMap<string, ReadonlySet<string>> {
    return this._adjacency;
  }
  get entrypointIds(): ReadonlyArray<string> {
    return this._entrypointIds;
  }
  get vulnerabilities(): ReadonlyArray<Vulnerability> {
    return this._vulnerabilities;
  }

  getNeighbors(id: string): string[] {
    return [...(this._adjacency.get(id) ?? new Set<string>())];
  }

  replaceVulnerabilities(vulnerabilities: Vulnerability[]) {
    this._vulnerabilities = vulnerabilities.slice();
  }

  hasFunction(id: string): boolean {
    return this._functions.has(id);
  }

  getFunctionOrThrow(id: string): Func {
    const fn = this._functions.get(id);
    if (!fn) throw new Error(`Function not found: ${id}`);
    return fn;
  }
}
