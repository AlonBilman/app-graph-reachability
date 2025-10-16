import type {
  Func,
  Edge,
  Vulnerability,
  ScoreBreakdown,
} from "../types/domain.types";
import type {
  FunctionDTO,
  EdgeDTO,
  VulnerabilityDTO,
  ScoreBreakdownDTO,
} from "../types/dto.types";

/**
 * DTOMapper - Converts between domain types and API DTOs
 *
 */
export class DTOMapper {
  static functionToDTO(func: Func): FunctionDTO {
    return {
      id: func.id,
      name: func.name,
      is_entrypoint: func.is_entrypoint,
    };
  }

  static edgeToDTO(edge: Edge): EdgeDTO {
    return {
      from: edge.from,
      to: edge.to,
    };
  }

  static vulnerabilityToDTO(vuln: Vulnerability): VulnerabilityDTO {
    return {
      id: vuln.id,
      func_id: vuln.func_id,
      severity: vuln.severity,
      cwe_id: vuln.cwe_id,
      package_name: vuln.package_name,
      introduced_by_ai: vuln.introduced_by_ai,
    };
  }

  static scoreBreakdownToDTO(breakdown: ScoreBreakdown): ScoreBreakdownDTO {
    return {
      base_severity: breakdown.base_severity,
      reachability_bonus: breakdown.reachability_bonus,
      package_risk: breakdown.package_risk,
      ai_risk: breakdown.ai_risk,
    };
  }

  static functionFromDTO(dto: FunctionDTO): Func {
    return {
      id: dto.id,
      name: dto.name,
      is_entrypoint: dto.is_entrypoint,
    };
  }

  static edgeFromDTO(dto: EdgeDTO): Edge {
    return {
      from: dto.from,
      to: dto.to,
    };
  }

  static vulnerabilityFromDTO(dto: VulnerabilityDTO): Vulnerability {
    return {
      id: dto.id,
      func_id: dto.func_id,
      severity: dto.severity,
      cwe_id: dto.cwe_id,
      package_name: dto.package_name,
      introduced_by_ai: dto.introduced_by_ai,
    };
  }

  static functionsToDTO(funcs: Func[]): FunctionDTO[] {
    return funcs.map((f) => this.functionToDTO(f));
  }

  static edgesToDTO(edges: Edge[]): EdgeDTO[] {
    return edges.map((e) => this.edgeToDTO(e));
  }

  static vulnerabilitiesToDTO(vulns: Vulnerability[]): VulnerabilityDTO[] {
    return vulns.map((v) => this.vulnerabilityToDTO(v));
  }

  static functionsFromDTO(dtos: FunctionDTO[]): Func[] {
    return dtos.map((dto) => this.functionFromDTO(dto));
  }

  static edgesFromDTO(dtos: EdgeDTO[]): Edge[] {
    return dtos.map((dto) => this.edgeFromDTO(dto));
  }

  static vulnerabilitiesFromDTO(dtos: VulnerabilityDTO[]): Vulnerability[] {
    return dtos.map((dto) => this.vulnerabilityFromDTO(dto));
  }
}
