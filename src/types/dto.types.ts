import type { Severity } from "./domain.types";

//request DTOs
export interface GraphLoadRequestDTO {
  functions: FunctionDTO[];
  edges: EdgeDTO[];
}

export interface FunctionDTO {
  id: string;
  name: string;
  is_entrypoint: boolean;
}

export interface EdgeDTO {
  from: string;
  to: string;
}

export interface VulnerabilityDTO {
  id: string;
  func_id: string;
  severity: Severity;
  cwe_id?: string;
  package_name?: string;
  introduced_by_ai?: boolean;
}

//response DTOs
export interface GraphLoadResponseDTO {
  ok: boolean;
  functions: number;
  edges: number;
  entry_points: number;
}

export interface VulnerabilityLoadResponseDTO {
  ok: boolean;
  vulnerabilities_loaded: number;
}

export interface GraphResponseDTO {
  functions: FunctionDTO[];
  edges: EdgeDTO[];
}

export interface VulnerabilitiesResponseDTO {
  vulnerabilities: VulnerabilityDTO[];
}

export interface TraceResponseDTO {
  vulnerability_id?: string;
  function_id: string;
  reachable: boolean;
  shortest_path?: string[];
  path_length?: number;
  total_paths_available?: number;
  all_paths?: string[][];
  shortest_path_length?: number;
  total_paths?: number;
  severity?: Severity;
  score?: number;
  error?: string;
}

export interface RiskResponseDTO {
  id: string;
  function_id: string;
  function_name: string;
  severity: Severity;
  cwe?: string;
  reachable: boolean;
  score: number;
  score_breakdown: ScoreBreakdownDTO;
  metadata: {
    package_name?: string;
    introduced_by_ai?: boolean;
  };
}

export interface ScoreBreakdownDTO {
  base_severity: number;
  reachability_bonus: number;
  package_risk: number;
  ai_risk: number;
}

export interface RisksListResponseDTO {
  risks: RiskResponseDTO[];
}

export interface ComponentAnalysisResponseDTO {
  total_components: number;
  main_component: {
    size: number;
    entry_points: number;
    vulnerabilities: number;
  };
  isolated_components: Array<{
    functions: string[];
    vulnerabilities: string[];
    risk_level: Severity;
  }>;
  security_impact: {
    reachable_vulnerabilities: number;
    isolated_vulnerabilities: number;
    dead_code_functions: number;
    main_component_coverage: number;
  };
}

export interface AttackPathDTO {
  vulnerability_id: string;
  severity: Severity;
  path: string[];
  path_length: number;
  risk_score: number;
  exploit_difficulty: "low" | "medium" | "high";
  total_paths?: number;
  entry_point_accessible?: boolean;
}

export interface AttackPathAnalysisResponseDTO {
  critical_paths: AttackPathDTO[];
  summary: {
    total_critical_paths: number;
    shortest_path_length: number;
    most_vulnerable_entry_point: string | null;
    average_path_length: number;
  };
  generated_at: string;
}
