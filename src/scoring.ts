import { Vulnerability, Severity } from "./types";

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
  const pathPenalty = Math.log2(pathLength);
  score -= pathPenalty;
  return Math.max(0, score); // min should be 0.
}
