import { describe, expect, test, beforeEach } from "vitest";
import { Store } from "../src/store";
import {
  findConnectedComponents,
  findCriticalAttackPaths,
} from "../src/services/analytics";
import type { Graph, Vulnerability } from "../src/types/domain.types";
import { F, V } from "./helpers";

const makeStore = (graph: Graph) => new Store(graph);

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

  describe("findCriticalAttackPaths", () => {
    test.each([
      [
        "returns empty if no high/critical vulnerabilities",
        [V("V1", "B", "medium"), V("V2", "C", "low")],
        [],
        0,
      ],
      [
        "finds attack paths for high/critical vulnerabilities only",
        [
          V("V1", "C", "critical"),
          V("V2", "B", "high"),
          V("V3", "A", "medium"),
        ],
        ["V1", "V2"],
        2,
      ],
    ])("%s", (_desc, vulns, expectedVulnIds, expectedCount) => {
      const graph: Graph = {
        functions: [F("A", true), F("B"), F("C")],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
        ],
      };
      const s = new Store(graph);
      s.replaceVulnerabilities(vulns);
      const { critical_paths } = findCriticalAttackPaths(s, 5, "high");
      const vulnIds = critical_paths.map((p) => p.vulnerability_id);
      expectedVulnIds.forEach((id) => expect(vulnIds).toContain(id));
      expect(critical_paths.length).toBe(expectedCount);
    });

    test.each([
      [
        "respects maxPaths and maxPathLength",
        {
          functions: [F("E", true), F("A"), F("B"), F("C"), F("D")],
          edges: [
            { from: "E", to: "A" },
            { from: "A", to: "B" },
            { from: "B", to: "C" },
            { from: "C", to: "D" },
          ],
        },
        [V("V1", "D", "critical")],
        1,
        5,
        1,
        4,
        0,
      ],
    ])(
      "%s",
      (
        _desc,
        graph,
        vulns,
        expectedCount1,
        pathLen1,
        _expectedCount2,
        pathLen2,
        expectedCount3,
      ) => {
        const s = new Store(graph);
        s.replaceVulnerabilities(vulns);
        let result = findCriticalAttackPaths(s, 1, "high", pathLen1);
        expect(result.critical_paths.length).toBe(expectedCount1);
        if (expectedCount1 > 0) {
          expect(result.critical_paths[0].path_length).toBe(pathLen1);
        }
        result = findCriticalAttackPaths(s, 1, "high", pathLen2);
        expect(result.critical_paths.length).toBe(expectedCount3);
      },
    );

    test("calculates risk_score and exploit_difficulty using scoring service", () => {
      const graph: Graph = {
        functions: [F("A", true), F("B")],
        edges: [{ from: "A", to: "B" }],
      };
      const s = new Store(graph);
      s.replaceVulnerabilities([
        V("V1", "B", "critical", {
          package_name: "pkg",
          introduced_by_ai: true,
        }),
      ]);
      const result = findCriticalAttackPaths(s, 5, "high");
      expect(result.critical_paths.length).toBe(1);
      const path = result.critical_paths[0];
      expect(path.risk_score).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(path.exploit_difficulty);
      expect(path.entry_point_accessible).toBe(true);
    });

    test.each([
      [
        "summary fields are correct",
        [V("V1", "C", "critical"), V("V2", "B", "high")],
        "A",
      ],
    ])("%s", (_desc, vulns, expectedMostVulnerableEntry) => {
      const graph: Graph = {
        functions: [F("A", true), F("B"), F("C")],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
        ],
      };
      const s = new Store(graph);
      s.replaceVulnerabilities(vulns);
      const result = findCriticalAttackPaths(s, 5, "high");
      expect(result.summary.total_critical_paths).toBe(
        result.critical_paths.length,
      );
      expect(result.summary.shortest_path_length).toBe(
        Math.min(...result.critical_paths.map((p) => p.path_length)),
      );
      expect(result.summary.average_path_length).toBeGreaterThan(0);
      expect(result.summary.most_vulnerable_entry_point).toBe(
        expectedMostVulnerableEntry,
      );
      expect(typeof result.generated_at).toBe("string");
    });
  });
});
