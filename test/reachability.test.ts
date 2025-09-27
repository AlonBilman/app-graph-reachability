import { describe, expect, test } from "vitest";
import {
  allEntryToTargetPaths,
  findDangerousPathsFromEntrypoints,
} from "../src/services/reachability";
import { Store } from "../src/store";
import type { Graph, Vulnerability, Func } from "../src/types";

const F = (id: string, isEntrypoint = false, name = id): Func => ({
  id,
  name,
  isEntrypoint,
});
const makeStore = (graph: Graph) => new Store(graph);

// A -> B -> D -> E
// A -> C -> D
const baseGraph: Graph = {
  functions: [F("A", true), F("B"), F("C"), F("D"), F("E")],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "D" },
    { from: "D", to: "E" },
  ],
};

describe("allEntryToTargetPaths", () => {
  test.each([
    [
      "basic branching to D",
      baseGraph,
      "D",
      [
        ["A", "B", "D"],
        ["A", "C", "D"],
      ],
    ],
    [
      "basic branching to E",
      baseGraph,
      "E",
      [
        ["A", "B", "D", "E"],
        ["A", "C", "D", "E"],
      ],
    ],
    [
      "multiple entrypoints",
      {
        ...baseGraph,
        functions: [...baseGraph.functions, F("X", true)],
        edges: [...baseGraph.edges, { from: "X", to: "D" }],
      } as Graph,
      "D",
      [
        ["A", "B", "D"],
        ["A", "C", "D"],
        ["X", "D"],
      ],
    ],
    ["unreachable target", baseGraph, "Z", []],
  ])("%s", (_title, graph, target, expected) => {
    const store = makeStore(graph);
    expect(allEntryToTargetPaths(store, target)).toEqual(expected);
  });
});

describe("findDangerousPathsFromEntrypoints", () => {
  test("groups by vulnerability and returns Func[][] paths", () => {
    const store = makeStore(baseGraph);
    const vulnerability: Vulnerability[] = [
      { funcId: "D", severity: "high" },
      { funcId: "E", severity: "low" },
    ];
    store.replaceVulnerabilities(vulnerability);

    const A = (id: string) => store.functions.get(id)!;

    const groups = findDangerousPathsFromEntrypoints(store);

    expect(groups).toEqual([
      {
        vulnerability: vulnerability[0],
        paths: [
          [A("A"), A("B"), A("D")],
          [A("A"), A("C"), A("D")],
        ],
      },
      {
        vulnerability: vulnerability[1],
        paths: [
          [A("A"), A("B"), A("D"), A("E")],
          [A("A"), A("C"), A("D"), A("E")],
        ],
      },
    ]);
  });

  test("skips unreachable vulnerabilities", () => {
    const store = makeStore(baseGraph);
    const vulnerability: Vulnerability[] = [
      { funcId: "D", severity: "high" },
      { funcId: "Z", severity: "critical" }, // unreachable
    ] as any;
    store.replaceVulnerabilities(vulnerability as Vulnerability[]);

    const A = (id: string) => store.functions.get(id)!;

    const groups = findDangerousPathsFromEntrypoints(store);

    expect(groups).toEqual([
      {
        vulnerability: (vulnerability as Vulnerability[])[0],
        paths: [
          [A("A"), A("B"), A("D")],
          [A("A"), A("C"), A("D")],
        ],
      },
    ]);
  });

  test("respects maxPathsPerFunc", () => {
    const store = makeStore(baseGraph);
    const vulnerability: Vulnerability[] = [
      { funcId: "D", severity: "medium" },
    ];
    store.replaceVulnerabilities(vulnerability);

    const A = (id: string) => store.functions.get(id)!;

    const groups = findDangerousPathsFromEntrypoints(store, {
      maxPathsPerFunc: 1,
    });

    expect(groups).toEqual([
      {
        vulnerability: vulnerability[0],
        paths: [[A("A"), A("B"), A("D")]], // first path by BFS order
      },
    ]);
  });
});
