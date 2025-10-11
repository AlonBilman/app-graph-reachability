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
import { mockReq, mockRes, F, V } from "./helpers";

describe("controller validation & error paths", () => {
  const runValidate = (schema: unknown, body: any) => {
    const req = mockReq({ body });
    const res = mockRes();
    const next = vi.fn();
    const mw = validate(schema as any);
    mw(req, res, next);
    return { next, req, res };
  };

  test("POST /vulns with invalid funcId -> 400", () => {
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

    const vulnsRes = mockRes();
    postVulns(
      mockReq({
        body: [{ id: "V-1", funcId: "NON_EXISTENT", severity: "high" }],
      }),
      vulnsRes,
      vi.fn(),
    );

    const out = vulnsRes._get();
    expect(out.statusCode).toBe(400);
    expect(out.jsonBody).toHaveProperty("ok", false);
    expect(String(out.jsonBody.error)).toMatch(/unknown functions/i);
  });

  test("POST /vulns duplicate vulnerability id -> 400", () => {
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

    const dupRes = mockRes();
    postVulns(
      mockReq({
        body: [
          { id: "V1", funcId: "F1", severity: "high" },
          { id: "V1", funcId: "F1", severity: "low" },
        ],
      }),
      dupRes,
      vi.fn(),
    );

    const out = dupRes._get();
    expect(out.statusCode).toBe(400);
    expect(out.jsonBody).toHaveProperty("ok", false);
    expect(String(out.jsonBody.error)).toMatch(/duplicate vulnerability id/i);
  });

  describe("POST /graph -> validate(GraphSchema) -> 400", () => {
    test.each([
      {
        name: "duplicate function ids",
        body: {
          functions: [
            { id: "A", name: "A", isEntrypoint: true },
            { id: "A", name: "A-dup", isEntrypoint: false },
          ],
          edges: [],
        },
        expectMsg: "Function ids must be unique",
      },
      {
        name: "edge references missing functions",
        body: {
          functions: [{ id: "A", name: "A", isEntrypoint: true }],
          edges: [{ from: "A", to: "B" }],
        },
        expectMsg: "All edges must reference existing function ids",
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

    const traceRes = mockRes();
    getFunctionTrace(mockReq({ params: { id: "MISSING" } }), traceRes, vi.fn());

    const out = traceRes._get();
    expect(out.statusCode).toBe(404);
    expect(out.jsonBody).toHaveProperty("function_id", "MISSING");
    expect(out.jsonBody).toHaveProperty("error");
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

    const vulnTraceRes = mockRes();
    getVulnerabilityTrace(
      mockReq({ params: { id: "NO_SUCH" } }),
      vulnTraceRes,
      vi.fn(),
    );

    const out = vulnTraceRes._get();
    expect(out.statusCode).toBe(404);
    expect(out.jsonBody).toHaveProperty("error");
  });

  test("validate(VulnsSchema) -> missing funcId field -> 400 (case-insensitive)", () => {
    const { next } = runValidate(VulnsSchema, [{ id: "V-1", severity: "high" }]);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(String(err.message)).toMatch(/funcid/i);
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
});
