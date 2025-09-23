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
  funcId: string;
  severity: Severity;
  cweId?: string;
}

export type DangerousGroup = {
  paths: Func[][];
  vulnerability: Vulnerability;
};
