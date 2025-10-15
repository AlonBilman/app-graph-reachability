import { describe, test, expect, vi } from "vitest";
import { postGraph } from "../src/controllers/graph.controller";
import { postVulns } from "../src/controllers/vulns.controller";
import {
  getFunctionTrace,
  getVulnerabilityTrace,
} from "../src/controllers/trace.controller";
import { validate, validateQuery } from "../src/middleware/validate";
import { GraphSchema } from "../src/schemas/graph.schema";
import { VulnsSchema } from "../src/schemas/vulns.schema";
import { TraceQuerySchema } from "../src/schemas/trace.schema";
import { mockReq, mockRes, F } from "./helpers";

describe("controller validation & error paths", () => {
  const runValidate = (schema: unknown, body: any) => {
    const req = mockReq({ body });
    const res = mockRes();
    const next = vi.fn();
    const mw = validate(schema as any);
    mw(req, res, next);
    return { next, req, res };
  };

  test("POST /vulns with invalid func_id -> validation error", () => {
    postGraph(
      mockReq({
        body: {
          functions: [F("F1", true)],
          edges: [],
        },
      }),
      mockRes(),
      vi.fn(),
    );

    const next = vi.fn();
    postVulns(
      mockReq({
        body: [{ id: "V-1", func_id: "NON_EXISTENT", severity: "high" }],
      }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/unknown functions/i);
  });

  test("POST /vulns duplicate vulnerability id -> conflict error", () => {
    postGraph(
      mockReq({
        body: {
          functions: [F("F1", true)],
          edges: [],
        },
      }),
      mockRes(),
      vi.fn(),
    );

    const next = vi.fn();
    postVulns(
      mockReq({
        body: [
          { id: "V1", func_id: "F1", severity: "high" },
          { id: "V1", func_id: "F1", severity: "low" },
        ],
      }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/duplicate vulnerability id/i);
  });

  describe("POST /graph -> validate(GraphSchema) -> 400", () => {
    test.each([
      {
        name: "duplicate function ids",
        body: {
          functions: [
            { id: "A", name: "A", is_entrypoint: true },
            { id: "A", name: "A-dup", is_entrypoint: false },
          ],
          edges: [],
        },
        expectMsg: "Function ids must be unique",
      },
      {
        name: "edge references missing functions",
        body: {
          functions: [{ id: "A", name: "A", is_entrypoint: true }],
          edges: [{ from: "A", to: "B" }],
        },
        expectMsg: "All edges must reference existing function ids",
      },
      {
        name: "self-loop not allowed",
        body: {
          functions: [{ id: "A", name: "A", is_entrypoint: true }],
          edges: [{ from: "A", to: "A" }],
        },
        expectMsg: "Self-loops not allowed",
      },
      {
        name: "duplicate edges not allowed",
        body: {
          functions: [
            { id: "A", name: "A", is_entrypoint: true },
            { id: "B", name: "B", is_entrypoint: false },
          ],
          edges: [
            { from: "A", to: "B" },
            { from: "A", to: "B" },
          ],
        },
        expectMsg: "Duplicate edges not allowed",
      },
    ])("$name", ({ body, expectMsg }) => {
      const { next } = runValidate(GraphSchema, body);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(400);
      expect(String(err.message)).toContain(expectMsg);
    });
  });

  test("GET /functions/:id/trace when function missing -> 404", () => {
    postGraph(
      mockReq({
        body: {
          functions: [F("F_exist", true)],
          edges: [],
        },
      }),
      mockRes(),
      vi.fn(),
    );

    const next = vi.fn();
    getFunctionTrace(
      mockReq({ params: { id: "MISSING" }, query: {} }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(404);
    expect(err.message).toContain("Function not found");
  });

  test("GET /vulns/:id/trace when vulnerability missing -> 404", () => {
    postGraph(
      mockReq({
        body: {
          functions: [F("F1", true)],
          edges: [],
        },
      }),
      mockRes(),
      vi.fn(),
    );

    const next = vi.fn();
    getVulnerabilityTrace(
      mockReq({ params: { id: "NO_SUCH" }, query: {} }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(404);
    expect(err.message).toContain("Vulnerability not found");
  });

  test("validate(VulnsSchema) -> missing func_id field -> 400", () => {
    const { next } = runValidate(VulnsSchema, [
      { id: "V-1", severity: "high" },
    ]);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(String(err.message)).toMatch(/func_id/i);
  });

  test("validateQuery(TraceQuerySchema) should transform types", () => {
    const req = mockReq({ query: { all_paths: "true", limit: "5" } });
    const res = mockRes();
    const next = vi.fn();

    const mw = validateQuery(TraceQuerySchema as any);
    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query.all_paths).toBe(true);
    expect(req.query.limit).toBe(5);
  });

  test("validate(VulnsSchema) -> valid data passes", () => {
    const { next, req } = runValidate(VulnsSchema, [
      {
        id: "V1",
        func_id: "F1",
        severity: "high",
        cwe_id: "CWE-089",
        package_name: "test-pkg",
        introduced_by_ai: false,
      },
    ]);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeUndefined(); // No error
    expect(req.body[0].func_id).toBe("F1");
  });
});
