/**
 * Bubble Burst Score computation.
 *
 * Produces a 0–100 composite score from 5 sub-components (0–20 each):
 *   1. Industry Strain       — CapEx/Sales ratio deviation from 10% baseline
 *   2. Enterprise ROI Failure — % of AI initiatives missing expected ROI
 *   3. Valuation Decoupling  — Nasdaq 100 P/E relative to historical average
 *   4. Funding Quality       — VC funding trend (contracting = higher danger)
 *   5. Compute Economics     — Compute-to-Revenue ratio for pure-play AI
 */

export type BubbleLevel = "stable" | "elevated" | "critical" | "burst";

export interface ScoreComponents {
  industryStrain: number;
  enterpriseRoiFailure: number;
  valuationDecoupling: number;
  fundingQuality: number;
  computeEconomics: number;
}

export interface BubbleScore {
  score: number;
  level: BubbleLevel;
  components: ScoreComponents;
}

/** Clamp a value between 0 and max */
function clamp(value: number, max: number = 20): number {
  return Math.min(Math.max(0, value), max);
}

/**
 * Normalize a value on a rising danger scale (higher = worse).
 * Maps: safe → 0, elevated → 8, critical → 14, burst → 20
 */
function scoreAbove(
  value: number,
  safe: number,
  elevated: number,
  critical: number,
  burst: number
): number {
  if (value <= safe) return 0;
  if (value <= elevated) return clamp(((value - safe) / (elevated - safe)) * 8);
  if (value <= critical)
    return clamp(8 + ((value - elevated) / (critical - elevated)) * 6);
  if (value <= burst)
    return clamp(14 + ((value - critical) / (burst - critical)) * 6);
  return 20;
}

/**
 * Normalize a value on a falling danger scale (lower = worse).
 * Maps: safe → 0, elevated → 8, critical → 14, burst → 20
 */
function scoreBelow(
  value: number,
  safe: number,
  elevated: number,
  critical: number,
  burst: number
): number {
  if (value >= safe) return 0;
  if (value >= elevated) return clamp(((safe - value) / (safe - elevated)) * 8);
  if (value >= critical)
    return clamp(8 + ((elevated - value) / (elevated - critical)) * 6);
  if (value >= burst)
    return clamp(14 + ((critical - value) / (critical - burst)) * 6);
  return 20;
}

export function computeBubbleScore(metrics: Record<string, number>): BubbleScore {
  const capexSalesRatio = metrics["hyperscaler_capex_sales_ratio"] ?? 10;
  const roiHitRate = metrics["enterprise_roi_hit_rate"] ?? 50;
  const ndxPe = metrics["ndx_pe_ratio"] ?? 25;
  const vcFunding = metrics["ai_vc_funding_quarterly"] ?? 20;
  const computeRevRatio = metrics["ai_compute_revenue_ratio"] ?? 0.3;

  const components: ScoreComponents = {
    // 1. Industry Strain: CapEx/Sales > 10% historical → danger
    industryStrain: scoreAbove(capexSalesRatio, 10, 15, 20, 30),

    // 2. Enterprise ROI Failure: roi_hit_rate falling below 50% → danger
    enterpriseRoiFailure: scoreBelow(roiHitRate, 50, 40, 25, 15),

    // 3. Valuation Decoupling: NDX P/E > 30 long-run avg → danger
    valuationDecoupling: scoreAbove(ndxPe, 25, 35, 45, 60),

    // 4. Funding Quality: VC funding contracting < $20B/quarter → danger
    fundingQuality: scoreBelow(vcFunding, 20, 15, 8, 3),

    // 5. Compute Economics: compute/revenue > 0.5 → danger
    computeEconomics: scoreAbove(computeRevRatio, 0.3, 0.5, 0.8, 1.0),
  };

  const score = parseFloat(
    (
      components.industryStrain +
      components.enterpriseRoiFailure +
      components.valuationDecoupling +
      components.fundingQuality +
      components.computeEconomics
    ).toFixed(1)
  );

  let level: BubbleLevel;
  if (score <= 30) level = "stable";
  else if (score <= 55) level = "elevated";
  else if (score <= 79) level = "critical";
  else level = "burst";

  return { score, level, components };
}

export const LEVEL_CONFIG: Record<
  BubbleLevel,
  { label: string; color: string; bg: string; description: string }
> = {
  stable: {
    label: "Stable",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    description: "Fundamentals are holding. Nothing to see here. Yet.",
  },
  elevated: {
    label: "Elevated",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    description: "Strain is building. The foundation is cracking.",
  },
  critical: {
    label: "Critical",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    description: "Multiple indicators are flashing red. Brace for impact.",
  },
  burst: {
    label: "BURST",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    description: "The bubble has burst. We told you so.",
  },
};
