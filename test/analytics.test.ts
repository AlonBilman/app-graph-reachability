import { describe, expect, test, beforeEach } from "vitest";
import { Store } from "../src/store";
import { findConnectedComponents } from "../src/services/analytics";
import type { Graph, Vulnerability, Func } from "../src/types";

const F = (id: string, isEntrypoint = false, name = id): Func => ({
  id,
  name,
  isEntrypoint,
});
const makeStore = (graph: Graph) => new Store(graph);
const V = (
  id: string,
  funcId: string,
  severity: Vulnerability["severity"],
): Vulnerability => ({
  id,
  funcId,
  severity,
  reachable: false,
});

// A -> B -> C -> D -> E  (main component with entrypoint A)
// "isolated" is a singleton component
const baseGraph: Graph = {
  functions: [F("A", true), F("B"), F("C"), F("D"), F("E"), F("isolated")],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "D" },
    { from: "D", to: "E" },
  ],
};

describe("analytics", () => {
  let store: Store;

  beforeEach(() => {
    store = makeStore(baseGraph);
  });

  describe("findConnectedComponents", () => {
    test("identifies main component with entrypoints and vulnerabilities", () => {
      store.replaceVulnerabilities([
        V("V1", "C", "high"),
        V("V2", "isolated", "critical"),
      ]);

      const result = findConnectedComponents(store);

      expect(result.total_components).toBe(2);
      expect(result.main_component.size).toBe(5);
      expect(result.main_component.entry_points).toBe(1);
      expect(result.main_component.vulnerabilities).toBe(1);
    });

    type IsolatedCase = {
      name: string;
      graph: Graph;
      vulns: Vulnerability[];
      expectedTotal: number;
      expectedIsolatedCount: number;
      check?: (r: ReturnType<typeof findConnectedComponents>) => void;
    };

    test.each<IsolatedCase>([
      {
        name: "one isolated w/ vuln + one clean isolated",
        graph: {
          functions: [F("A", true), F("B"), F("isolated1"), F("isolated2")],
          edges: [{ from: "A", to: "B" }],
        },
        vulns: [V("V1", "isolated1", "medium")],
        expectedTotal: 3,
        expectedIsolatedCount: 2,
        check: (r) => {
          const iso = r.isolated_components.find(
            (c) => c.functions[0] === "isolated1",
          );
          expect(iso).toBeDefined();
          expect(iso?.vulnerabilities).toEqual(["V1"]);
          expect(iso?.risk_level).toBe("medium");
        },
      },
      {
        name: "single isolated without vulnerabilities -> low risk",
        graph: {
          functions: [F("A", true), F("B"), F("isolated")],
          edges: [{ from: "A", to: "B" }],
        },
        vulns: [],
        expectedTotal: 2,
        expectedIsolatedCount: 1,
        check: (r) => {
          expect(r.isolated_components[0].risk_level).toBe("low");
        },
      },
    ])(
      "detects isolated components correctly: $name",
      ({ graph, vulns, expectedTotal, expectedIsolatedCount, check }) => {
        const s = new Store(graph);
        s.replaceVulnerabilities(vulns);

        const result = findConnectedComponents(s);

        expect(result.total_components).toBe(expectedTotal);
        expect(result.isolated_components.length).toBe(expectedIsolatedCount);
        check?.(result);
      },
    );

    type ReachabilityCase = {
      name: string;
      graph: Graph;
      vulns: Vulnerability[];
      expected: { reachable: number; isolated: number; dead: number };
    };

    test.each<ReachabilityCase>([
      {
        name: "entry -> reachable; plus deadCode & isolated",
        graph: {
          functions: [
            F("entry", true),
            F("reachable"),
            F("deadCode"),
            F("isolated"),
          ],
          edges: [{ from: "entry", to: "reachable" }],
        },
        vulns: [
          V("V1", "reachable", "high"),
          V("V2", "deadCode", "critical"),
          V("V3", "isolated", "low"),
        ],
        expected: { reachable: 1, isolated: 2, dead: 2 },
      },
      {
        name: "two reachable, one dead, one isolated",
        graph: {
          functions: [F("E", true), F("R1"), F("R2"), F("D1")],
          edges: [
            { from: "E", to: "R1" },
            { from: "R1", to: "R2" },
            { from: "D1", to: "R2" }, // make D1 non-isolated but still unreachable
          ],
        },
        vulns: [V("V1", "R1", "medium"), V("V2", "D1", "low")],
        expected: { reachable: 1, isolated: 1, dead: 1 },
      },
    ])(
      "calculates dead code & reachability: $name",
      ({ graph, vulns, expected }) => {
        const s = new Store(graph);
        s.replaceVulnerabilities(vulns);

        const r = findConnectedComponents(s);

        expect(r.security_impact.reachable_vulnerabilities).toBe(
          expected.reachable,
        );
        expect(r.security_impact.isolated_vulnerabilities).toBe(
          expected.isolated,
        );
        expect(r.security_impact.dead_code_functions).toBe(expected.dead);
      },
    );

    type CoverageCase = {
      name: string;
      graph: Graph;
      expectedCoverage: number;
    };

    test.each<CoverageCase>([
      {
        name: "baseGraph 5/6 = 83%",
        graph: baseGraph,
        expectedCoverage: 83,
      },
      {
        name: "3 of 4 in main = 75%",
        graph: {
          functions: [F("A", true), F("B"), F("C"), F("isolated")],
          edges: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
          ],
        },
        expectedCoverage: 75,
      },
    ])(
      "calculates main component coverage percentage: $name",
      ({ graph, expectedCoverage }) => {
        const s = new Store(graph);
        s.replaceVulnerabilities([]);

        const result = findConnectedComponents(s);
        expect(result.security_impact.main_component_coverage).toBe(
          expectedCoverage,
        );
      },
    );

    type NoVulnsCase = {
      name: string;
      graph: Graph;
    };

    test.each<NoVulnsCase>([
      {
        name: "linear chain",
        graph: {
          functions: [F("A", true), F("B"), F("C")],
          edges: [
            { from: "A", to: "B" },
            { from: "B", to: "C" },
          ],
        },
      },
      {
        name: "branching",
        graph: {
          functions: [F("A", true), F("B"), F("C"), F("D")],
          edges: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
            { from: "C", to: "D" },
          ],
        },
      },
    ])("handles graph with no vulnerabilities: $name", ({ graph }) => {
      const s = new Store(graph);
      s.replaceVulnerabilities([]);

      const result = findConnectedComponents(s);
      expect(result.main_component.vulnerabilities).toBe(0);
      expect(result.security_impact.reachable_vulnerabilities).toBe(0);
      expect(result.security_impact.isolated_vulnerabilities).toBe(0);
    });

    test("handles multiple entrypoints in main component", () => {
      const graph: Graph = {
        functions: [F("A", true), F("B", true), F("C"), F("D")],
        edges: [
          { from: "A", to: "C" },
          { from: "B", to: "D" },
          { from: "C", to: "D" },
        ],
      };
      const s = new Store(graph);
      s.replaceVulnerabilities([]);

      const result = findConnectedComponents(s);

      expect(result.main_component.entry_points).toBe(2);
      expect(result.total_components).toBe(1);
    });

    test("assigns low risk level to isolated components without vulnerabilities (baseGraph)", () => {
      store.replaceVulnerabilities([]);
      const result = findConnectedComponents(store);
      expect(result.isolated_components[0].risk_level).toBe("low");
    });
  });
});
