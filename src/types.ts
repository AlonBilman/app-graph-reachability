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
  vulnerability_id?: string;
  function_id: string;
  reachable: boolean;
  shortest_path?: string[];
  path_length?: number;
  total_paths_available?: number;
  all_paths?: string[][];
  shortest_path_length?: number;
  total_paths?: number;
  error?: string;
  severity?: Severity;
  score?: number;
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
}

export interface ComponentAnalysis {
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
export interface AttackPath {
  vulnerability_id: string;
  severity: Severity;
  path: string[];
  path_length: number;
  risk_score: number;
  exploit_difficulty: "low" | "medium" | "high";
  total_paths?: number;
  entry_point_accessible?: boolean;
}

export interface AttackPathAnalysis {
  critical_paths: AttackPath[];
  summary: {
    total_critical_paths: number;
    shortest_path_length: number;
    most_vulnerable_entry_point: string | null;
    average_path_length: number;
  };
  generated_at: string;
}

export interface FunctionImpact {
  function_id: string;
  dependent_functions: string[];
  dependent_entry_points: string[];
  affected_vulnerabilities: string[];
  impact_scope: Severity;
  impact_score: number;
  total_dependents: number;
}

export interface SecurityReport {
  generated_at: string;
  graph_metadata: {
    total_functions: number;
    entry_points: number;
    total_edges: number;
  };
  vulnerability_summary: {
    total_vulnerabilities: number;
    reachable_vulnerabilities: number;
    unreachable_vulnerabilities: number;
    reachability_percentage: number;
  };
  severity_breakdown: {
    critical: { total: number; reachable: number };
    high: { total: number; reachable: number };
    medium: { total: number; reachable: number };
    low: { total: number; reachable: number };
  };
  top_risks: Array<{
    vulnerability_id: string;
    func_id: string;
    severity: Severity;
    shortest_path_length: number;
    risk_score: number;
  }>;
  recommendations: string[];
}
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  entries: number;
  memory_usage_mb: number;
  hit_count: number;
  miss_count: number;
}

export interface PathAnalysisResult {
  paths: string[][];
  analysis: {
    total_paths: number;
    shortest_path_length: number;
    longest_path_length: number;
    average_path_length: number;
    computed_at: Date;
  };
}

export interface ComponentAnalysisQuery {
  include_isolated?: boolean;
  min_component_size?: number;
}

export interface AttackPathQuery {
  max_paths?: number;
  min_severity?: Severity;
  max_path_length?: number;
}

export interface SecurityReportQuery {
  include_recommendations?: boolean;
  severity_filter?: Severity;
}
