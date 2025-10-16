export type Severity = "low" | "medium" | "high" | "critical";

export interface Func {
  id: string;
  name: string;
  is_entrypoint: boolean;
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
  func_id: string;
  severity: Severity;
  cwe_id?: string;
  package_name?: string;
  introduced_by_ai?: boolean;
  reachable?: boolean;
}

export interface ScoreBreakdown {
  base_severity: number;
  reachability_bonus: number;
  package_risk: number;
  ai_risk: number;
}

export type DangerousGroup = {
  paths: Func[][];
  vulnerability: Vulnerability;
};

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
