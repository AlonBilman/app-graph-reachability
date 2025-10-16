// test/performance.test.ts
import { describe, test, expect } from "vitest";
import { Store } from "../src/store";
import { findConnectedComponents } from "../src/services/analytics";
import { F } from "./helpers";

describe("Performance benchmarks", () => {
  test("analyzes 1000+ function graph in under 300ms", () => {
    // Generate large test graph with 1000 functions and 2000 edges
    const functions = Array.from({ length: 1000 }, (_, i) =>
      F(`F${i}`, i < 10, `Function${i}`),
    );

    // Create realistic edge pattern with NO DUPLICATES
    // Pattern: Each function connects to next 2 functions (creates complex graph)
    const edges: Array<{ from: string; to: string }> = [];
    for (let i = 0; i < 1000; i++) {
      // Connect to next function (wraps around at end)
      edges.push({
        from: `F${i}`,
        to: `F${(i + 1) % 1000}`,
      });
      // Connect to function 2 steps ahead (creates branching)
      edges.push({
        from: `F${i}`,
        to: `F${(i + 2) % 1000}`,
      });
    }

    // Verify we have 2000 unique edges
    expect(edges.length).toBe(2000);
    const uniqueEdges = new Set(edges.map((e) => `${e.from}->${e.to}`));
    expect(uniqueEdges.size).toBe(2000); // All edges are unique

    const store = new Store({ functions, edges });

    const start = Date.now();
    findConnectedComponents(store);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(300);
  });

  test("handles large graphs with complex branching patterns", () => {
    // Create a more realistic enterprise graph structure
    const functions = Array.from({ length: 500 }, (_, i) =>
      F(`F${i}`, i < 5, `Function${i}`),
    );

    // Create realistic patterns:
    // - Entry points connect to many services
    // - Services connect to multiple utilities
    // - Some isolated clusters
    const edges: Array<{ from: string; to: string }> = [];

    // Entry points (0-4) fan out to services (5-50)
    for (let entry = 0; entry < 5; entry++) {
      for (let service = 5; service < 50; service += 5) {
        edges.push({ from: `F${entry}`, to: `F${service}` });
      }
    }

    // Services (5-50) connect to utilities (51-200)
    for (let service = 5; service < 50; service++) {
      for (let util = 51; util < 200; util += 10) {
        edges.push({ from: `F${service}`, to: `F${util}` });
      }
    }

    // Create some isolated clusters (300-400)
    for (let i = 300; i < 400; i++) {
      edges.push({ from: `F${i}`, to: `F${i + 1}` });
    }

    const store = new Store({ functions, edges });

    const start = Date.now();
    const result = findConnectedComponents(store);
    const duration = Date.now() - start;

    // Should find multiple components
    expect(result.total_components).toBeGreaterThan(1);
    // Should be fast
    expect(duration).toBeLessThan(150);
  });
});
