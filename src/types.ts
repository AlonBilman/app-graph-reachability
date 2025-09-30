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
export interface RiskItem {
  id: string;
  function_id: string;
  cwe?: string;
  severity: Severity;
  reachable: true;
  score: number;
}
