import { describe, expect, test, beforeEach } from "vitest";
import { Store } from "../src/store";
import {
  bfsAllPaths,
  findConnectedComponents,
  getUndirectedNeighbors,
  bfsReachable,
  invalidateReverseAdj,
} from "../src/services/graph-utils";
import { F } from "./helpers";

const makeStore = (graph: any) => new Store(graph);

const baseGraph = {
  functions: [
    F("A", true),
    F("B"),
    F("C"),
    F("D"),
    F("E"),
    F("X", true),
    F("Y"),
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
    { from: "C", to: "D" },
    { from: "D", to: "E" },
    { from: "X", to: "D" },
  ],
};

describe("graphUtils", () => {
  let store: Store;

  beforeEach(() => {
    store = makeStore(baseGraph);
  });

  describe("bfsAllPaths", () => {
    test.each([
      [
        "finds all directed paths from A to D",
        "A",
        "D",
        [
          ["A", "B", "D"],
          ["A", "C", "D"],
        ],
      ],
      [
        "finds all directed paths from A to E",
        "A",
        "E",
        [
          ["A", "B", "D", "E"],
          ["A", "C", "D", "E"],
        ],
      ],
      ["finds all directed paths from X to D", "X", "D", [["X", "D"]]],
      ["returns empty for unreachable target", "A", "Y", []],
    ])("%s", (_desc, source, target, expected) => {
      expect(bfsAllPaths(store, source, target)).toEqual(expected);
    });
  });

  describe("findConnectedComponents", () => {
    test.each([
      [
        "finds all undirected components in baseGraph",
        baseGraph,
        [["A", "B", "C", "D", "E", "X"], ["Y"]],
      ],
      [
        "single component graph",
        { functions: [F("A", true)], edges: [] },
        [["A"]],
      ],
      [
        "two disconnected nodes",
        { functions: [F("A", true), F("B")], edges: [] },
        [["A"], ["B"]],
      ],
    ])("%s", (_desc, graph, expected) => {
      const s = makeStore(graph);
      const components = findConnectedComponents(s);
      const sorted = components
        .map((c) => c.sort())
        .sort((a, b) => b.length - a.length);
      const expectedSorted = expected
        .map((c) => c.sort())
        .sort((a, b) => b.length - a.length);
      expect(sorted).toEqual(expectedSorted);
    });
  });

  describe("getUndirectedNeighbors", () => {
    test.each([
      ["returns all neighbors of D", "D", ["B", "C", "E", "X"]],
      ["returns empty for Y", "Y", []],
    ])("%s", (_desc, node, expected) => {
      expect(getUndirectedNeighbors(store, node).sort()).toEqual(
        expected.sort(),
      );
    });
  });

  describe("bfsReachable", () => {
    test.each([
      ["from A: should reach A, B, C, D, E", ["A"], ["A", "B", "C", "D", "E"]],
      ["from X: should reach X, D, E", ["X"], ["X", "D", "E"]],
      ["from Y: only itself", ["Y"], ["Y"]],
      [
        "from A and X: all except Y",
        ["A", "X"],
        ["A", "B", "C", "D", "E", "X"],
      ],
    ])("%s", (_desc, sources, expected) => {
      expect(Array.from(bfsReachable(store, sources)).sort()).toEqual(
        expected.sort(),
      );
    });
  });

  describe("invalidateReverseAdj", () => {
    test("clears the reverse adjacency cache and still works", () => {
      invalidateReverseAdj(store);
      expect(getUndirectedNeighbors(store, "D").sort()).toEqual(
        ["B", "C", "E", "X"].sort(),
      );
    });
  });
});
