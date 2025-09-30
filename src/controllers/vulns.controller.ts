import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import type { VulnDTO } from "../schemas/vulns.schema";

export const postVulns: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const vulnsData: VulnDTO[] = req.body;

    const vulnerabilities = vulnsData.map((dto) => ({
      id: dto.id,
      funcId: dto.funcId,
      severity: dto.severity,
      cweId: dto.cweId,
      package_name: dto.package_name,
      introduced_by_ai: dto.introduced_by_ai,
    }));

    store.replaceVulnerabilities(vulnerabilities);

    res.json({
      ok: true,
      vulnerabilities_loaded: vulnerabilities.length,
    });
  } catch (e) {
    next(e);
  }
};
