import { Vulnerability, Severity, ScoreBreakdown } from "../types";

const baseScore: Record<Severity, number> = {
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

export function getScoreBreakdown(
  vulnerability: Vulnerability,
): ScoreBreakdown {
  const scoreBreakdown: ScoreBreakdown = {
    base_severity: baseScore[vulnerability.severity],
    reachability_bonus: vulnerability.reachable ? 3 : 0,
    package_risk: vulnerability.package_name ? 1 : 0,
    ai_risk: vulnerability.introduced_by_ai ? 2 : 0,
  };

  return scoreBreakdown;
}

export function calculateTotalScore(breakdown: ScoreBreakdown): number {
  return (
    breakdown.base_severity +
    breakdown.reachability_bonus +
    breakdown.package_risk +
    breakdown.ai_risk
  );
}
