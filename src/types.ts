export type Severity = "low" | "medium" | "high" | "critical";

export interface Func {
  id: string;
  name: string;
  isEntrypoint: boolean;
}

export interface Edge {
  from: string;
  to: string;
}

export interface Graph {
  functions: Func[];
  edges: Edge[];
}

export interface Vulnerability {
  id: string;
  funcId: string;
  severity: Severity;
  cweId?: string;
  package_name?: string;
  introduced_by_ai?: boolean;
  reachable?: boolean;
}

export type DangerousGroup = {
  paths: Func[][];
  vulnerability: Vulnerability;
};

export interface ScoreBreakdown {
  base_severity: number;
  reachability_bonus: number;
  package_risk: number;
  ai_risk: number;
}

export interface RiskResponse {
  id: string;
  function_id: string;
  function_name: string;
  severity: Severity;
  cwe?: string;
  reachable: boolean;
  score: number;
  score_breakdown: ScoreBreakdown;
  metadata: {
    package_name?: string;
    introduced_by_ai?: boolean;
  };
}

export interface RisksListResponse {
  risks: RiskResponse[];
}

export interface TraceResponse {
  function_id: string;
  reachable: boolean;
  shortest_path?: string[];
  path_length?: number;
  total_paths_available?: number;
  all_paths?: string[][];
  shortest_path_length?: number;
  total_paths?: number;
  error?: string;
}

export interface VulnerabilityTraceResponse {
  vulnerability_id: string;
  function_id: string;
  reachable: boolean;
  shortest_path?: string[];
  path_length?: number;
  severity: Severity;
  score: number;
  error?: string;
}

export interface GraphLoadResponse {
  ok: boolean;
  functions: number;
  edges: number;
  entry_points: number;
}

export interface VulnerabilityLoadResponse {
  ok: boolean;
  vulnerabilities_loaded: number;
  reachable_count: number;
  unreachable_count: number;
}
