// test/performance.test.ts
import { describe, test, expect } from "vitest";
import { Store } from "../src/store";
import { findConnectedComponents } from "../src/services/analytics";
import { F } from "./helpers";

describe("Performance benchmarks", () => {
  test("analyzes 1000+ function graph in under 1 second", () => {
    // Generate large test graph with 1000 functions and 2000 edges
    const functions = Array.from({ length: 1000 }, (_, i) =>
      F(`F${i}`, i < 10, `Function${i}`),
    );

    // Create circular edge pattern for stress testing
    const edges = Array.from({ length: 2000 }, (_, i) => ({
      from: `F${i % 1000}`,
      to: `F${(i + 1) % 1000}`,
    }));

    const store = new Store({ functions, edges });

    const start = Date.now();
    findConnectedComponents(store);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(20); // Performance requirement: sub-second
  });
});
