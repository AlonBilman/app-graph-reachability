import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import type { VulnDTO } from "../schemas/vulns.schema";
import type { VulnerabilityLoadResponse } from "../types";
import { ValidationError, ConflictError } from "../errors/api-error";

export const postVulns: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const vulnsData: VulnDTO[] = req.body;

    // Validate func_id existence
    const invalid = vulnsData.filter((v) => !store.hasFunction(v.func_id));
    if (invalid.length) {
      throw new ValidationError(
        `Some vulnerabilities reference unknown functions: ${invalid
          .map((v) => v.func_id)
          .join(", ")}`,
      );
    }

    // Check for duplicate vulnerability IDs
    const ids = new Set<string>();
    const dup = vulnsData.find((v) => {
      if (ids.has(v.id)) return true;
      ids.add(v.id);
      return false;
    });
    if (dup) {
      throw new ConflictError(`Duplicate vulnerability id: ${dup.id}`);
    }
    const vulnerabilities = vulnsData.map((dto) => ({
      id: dto.id,
      func_id: dto.func_id,
      severity: dto.severity,
      cwe_id: dto.cwe_id,
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
