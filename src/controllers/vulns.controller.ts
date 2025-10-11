import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import type { VulnDTO } from "../schemas/vulns.schema";
import type { VulnerabilityLoadResponse } from "../types";

export const postVulns: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const vulnsData: VulnDTO[] = req.body;

    // validate funcId existence and duplicate vuln ids
    const invalid = vulnsData.filter((v) => !store.hasFunction(v.funcId));
    if (invalid.length) {
      return res.status(400).json({
        ok: false,
        error: `Some vulnerabilities reference unknown functions: ${invalid
          .map((v) => v.funcId)
          .join(", ")}`,
      });
    }
    const ids = new Set<string>();
    const dup = vulnsData.find((v) => {
      if (ids.has(v.id)) return true;
      ids.add(v.id);
      return false;
    });
    if (dup) {
      return res
        .status(400)
        .json({ ok: false, error: `Duplicate vulnerability id: ${dup.id}` });
    }
    const vulnerabilities = vulnsData.map((dto) => ({
      id: dto.id,
      funcId: dto.funcId,
      severity: dto.severity,
      cweId: dto.cweId,
      package_name: dto.package_name,
      introduced_by_ai: dto.introduced_by_ai,
    }));

    store.replaceVulnerabilities(vulnerabilities);

    const response: VulnerabilityLoadResponse = {
      ok: true,
      vulnerabilities_loaded: vulnerabilities.length,
    };

    res.json(response);
  } catch (e) {
    next(e);
  }
};
