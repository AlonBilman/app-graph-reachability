import { Vulnerability, Severity } from "../types";

const baseScore: Record<Severity, number> = {
  critical: 8,
  high: 6,
  medium: 3,
  low: 1,
};

export function calculateScore(
  vulnerability: Vulnerability,
  pathLength: number,
): number {
  let score = baseScore[vulnerability.severity];

  if (vulnerability.reachable) score += 3;
  if (vulnerability.introduced_by_ai) score += 2;
  if (vulnerability.package_name) score += 1;

  return Math.max(0, score);
}
