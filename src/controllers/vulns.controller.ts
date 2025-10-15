import type { RequestHandler } from "express";
import { requireStore } from "./graph.controller";
import type { VulnerabilityLoadRequestDTO } from "../schemas/vulns.schema";
import type {
  VulnerabilityLoadResponseDTO,
  VulnerabilitiesResponseDTO,
} from "../types/dto.types";
import { DTOMapper } from "../utils/dto.mapper";
import { ValidationError, ConflictError } from "../errors/api-error";
import { ResponseHelper } from "../utils/response.helper";

export const postVulns: RequestHandler = (req, res, next) => {
  try {
    const store = requireStore();
    const vulnsData: VulnerabilityLoadRequestDTO = req.body;

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

    const vulnerabilities = DTOMapper.vulnerabilitiesFromDTO(vulnsData);

    store.replaceVulnerabilities(vulnerabilities);

    const response: VulnerabilityLoadResponseDTO = {
      ok: true,
      vulnerabilities_loaded: vulnerabilities.length,
    };

    ResponseHelper.created(res, response);
  } catch (e) {
    next(e);
  }
};

export const getVulns: RequestHandler = (_req, res, next) => {
  try {
    const store = requireStore();
    const vulnerabilities = store.getAllVulnerabilities();

    const response: VulnerabilitiesResponseDTO = {
      vulnerabilities: DTOMapper.vulnerabilitiesToDTO(vulnerabilities),
    };

    ResponseHelper.success(res, response);
  } catch (e) {
    next(e);
  }
};
