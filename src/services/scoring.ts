import type {
  Vulnerability,
  Severity,
  ScoreBreakdown,
} from "../types/domain.types";

export const baseScore: Record<Severity, number> = {
  critical: 8,
  high: 6,
  medium: 3,
  low: 1,
};

export const hierarchyLevels: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const scoringFactors = {
  reachability_bonus: 3,
  package_risk: 1,
  ai_risk: 2,
};

export function getScoreBreakdown(
  vulnerability: Vulnerability,
  factors = scoringFactors,
): ScoreBreakdown {
  return {
    base_severity: baseScore[vulnerability.severity],
    reachability_bonus: vulnerability.reachable
      ? factors.reachability_bonus
      : 0,
    package_risk: vulnerability.package_name ? factors.package_risk : 0,
    ai_risk: vulnerability.introduced_by_ai ? factors.ai_risk : 0,
  };
}

export function calculateTotalScore(breakdown: ScoreBreakdown): number {
  return (
    breakdown.base_severity +
    breakdown.reachability_bonus +
    breakdown.package_risk +
    breakdown.ai_risk
  );
}

export function getExploitDifficulty(
  pathLength: number,
): "low" | "medium" | "high" {
  if (pathLength <= 3) return "low";
  if (pathLength <= 6) return "medium";
  return "high";
}
