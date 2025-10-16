import { describe, expect, test } from "vitest";
import {
  allEntryToTargetPaths,
  findDangerousPathsFromEntrypoints,
} from "../src/services/reachability";
import { Store } from "../src/store";
import type { Graph, Vulnerability } from "../src/types/domain.types";
import { F, V } from "./helpers";

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
  type VulnCase = [
    desc: string,
    vulns: Vulnerability[],
    expected: { vulnIdx: number; paths: string[][] }[],
    opts?: { maxPathsPerFunc?: number },
  ];

  const vulnCases: VulnCase[] = [
    [
      "groups by vulnerability and returns Func[][] paths",
      [V("1", "D", "high"), V("2", "E", "low")],
      [
        {
          vulnIdx: 0,
          paths: [
            ["A", "B", "D"],
            ["A", "C", "D"],
          ],
        },
        {
          vulnIdx: 1,
          paths: [
            ["A", "B", "D", "E"],
            ["A", "C", "D", "E"],
          ],
        },
      ],
      undefined,
    ],
    [
      "skips unreachable vulnerabilities",
      [V("1", "D", "high"), V("2", "Z", "critical")],
      [
        {
          vulnIdx: 0,
          paths: [
            ["A", "B", "D"],
            ["A", "C", "D"],
          ],
        },
      ],
      undefined,
    ],
    [
      "respects maxPathsPerFunc",
      [V("1", "D", "medium")],
      [
        {
          vulnIdx: 0,
          paths: [["A", "B", "D"]],
        },
      ],
      { maxPathsPerFunc: 1 },
    ],
  ];

  test.each(vulnCases)("%s", (_desc, vulns, expected, opts) => {
    const store = makeStore(baseGraph);
    store.replaceVulnerabilities(vulns);
    const groups = findDangerousPathsFromEntrypoints(store, opts);

    const actual = groups.map((g) => ({
      vulnerability: g.vulnerability,
      paths: g.paths.map((p) => p.map((f) => f.id)),
    }));
    const expectedProjected = expected.map(
      (e: { vulnIdx: number; paths: string[][] }) => ({
        vulnerability: vulns[e.vulnIdx],
        paths: e.paths,
      }),
    );

    expect(actual).toHaveLength(expectedProjected.length);
    expect(actual).toStrictEqual(expectedProjected);
  });
});
