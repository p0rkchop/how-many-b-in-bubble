import { describe, it, expect } from "vitest";
import {
  computeBubbleScore,
  type BubbleLevel,
  type ScoreComponents,
} from "@/lib/score";

describe("computeBubbleScore", () => {
  describe("defaults (all safe baselines)", () => {
    it("scores 0 when all metrics are at their safe baselines", () => {
      const result = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 10,
        enterprise_roi_hit_rate: 50,
        ndx_pe_ratio: 25,
        ai_vc_funding_quarterly: 20,
        ai_compute_revenue_ratio: 0.3,
      });
      expect(result.score).toBe(0);
      expect(result.level).toBe("stable");
      expect(result.components.industryStrain).toBe(0);
      expect(result.components.enterpriseRoiFailure).toBe(0);
      expect(result.components.valuationDecoupling).toBe(0);
      expect(result.components.fundingQuality).toBe(0);
      expect(result.components.computeEconomics).toBe(0);
    });

    it("falls back to safe defaults when metrics are missing", () => {
      const result = computeBubbleScore({});
      expect(result.score).toBe(0);
      expect(result.level).toBe("stable");
    });
  });

  describe("level thresholds", () => {
    it("returns 'stable' for score <= 30", () => {
      // Use real metric values that produce a low score
      const result = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 12, // slight strain
        enterprise_roi_hit_rate: 48,
        ndx_pe_ratio: 26,
        ai_vc_funding_quarterly: 19,
        ai_compute_revenue_ratio: 0.32,
      });
      expect(result.level).toBe("stable");
      expect(result.score).toBeLessThanOrEqual(30);
    });

    it("returns 'elevated' for score in (30, 55]", () => {
      const result = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 16,
        enterprise_roi_hit_rate: 38,
        ndx_pe_ratio: 38,
        ai_vc_funding_quarterly: 14,
        ai_compute_revenue_ratio: 0.55,
      });
      expect(result.level).toBe("elevated");
      expect(result.score).toBeGreaterThan(30);
      expect(result.score).toBeLessThanOrEqual(55);
    });

    it("returns 'critical' for score in (55, 79]", () => {
      const result = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 22,
        enterprise_roi_hit_rate: 22,
        ndx_pe_ratio: 48,
        ai_vc_funding_quarterly: 6,
        ai_compute_revenue_ratio: 0.85,
      });
      expect(result.level).toBe("critical");
      expect(result.score).toBeGreaterThan(55);
      expect(result.score).toBeLessThanOrEqual(79);
    });

    it("returns 'burst' for score > 79", () => {
      const result = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 50,
        enterprise_roi_hit_rate: 5,
        ndx_pe_ratio: 70,
        ai_vc_funding_quarterly: 1,
        ai_compute_revenue_ratio: 2.0,
      });
      expect(result.level).toBe("burst");
      expect(result.score).toBe(100);
    });
  });

  describe("industryStrain (capex/sales, above=worse)", () => {
    it("is 0 at safe threshold (10%)", () => {
      const { components } = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 10,
      });
      expect(components.industryStrain).toBe(0);
    });

    it("is 8 at elevated threshold (15%)", () => {
      const { components } = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 15,
      });
      expect(components.industryStrain).toBeCloseTo(8, 5);
    });

    it("is 14 at critical threshold (20%)", () => {
      const { components } = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 20,
      });
      expect(components.industryStrain).toBeCloseTo(14, 5);
    });

    it("is 20 at burst threshold (30%)", () => {
      const { components } = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 30,
      });
      expect(components.industryStrain).toBeCloseTo(20, 5);
    });

    it("is 20 above burst threshold", () => {
      const { components } = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 100,
      });
      expect(components.industryStrain).toBe(20);
    });
  });

  describe("enterpriseRoiFailure (hit rate, below=worse)", () => {
    it("is 0 at safe threshold (50%)", () => {
      const { components } = computeBubbleScore({
        enterprise_roi_hit_rate: 50,
      });
      expect(components.enterpriseRoiFailure).toBe(0);
    });

    it("is 8 at elevated threshold (40%)", () => {
      const { components } = computeBubbleScore({
        enterprise_roi_hit_rate: 40,
      });
      expect(components.enterpriseRoiFailure).toBeCloseTo(8, 5);
    });

    it("is 14 at critical threshold (25%)", () => {
      const { components } = computeBubbleScore({
        enterprise_roi_hit_rate: 25,
      });
      expect(components.enterpriseRoiFailure).toBeCloseTo(14, 5);
    });

    it("is 20 at burst threshold (15%)", () => {
      const { components } = computeBubbleScore({
        enterprise_roi_hit_rate: 15,
      });
      expect(components.enterpriseRoiFailure).toBeCloseTo(20, 5);
    });

    it("is 20 below burst threshold", () => {
      const { components } = computeBubbleScore({
        enterprise_roi_hit_rate: 0,
      });
      expect(components.enterpriseRoiFailure).toBe(20);
    });

    it("is 0 above safe threshold", () => {
      const { components } = computeBubbleScore({
        enterprise_roi_hit_rate: 100,
      });
      expect(components.enterpriseRoiFailure).toBe(0);
    });
  });

  describe("valuationDecoupling (NDX P/E, above=worse)", () => {
    it("is 0 at safe threshold (25)", () => {
      const { components } = computeBubbleScore({ ndx_pe_ratio: 25 });
      expect(components.valuationDecoupling).toBe(0);
    });

    it("is 20 beyond burst threshold (60)", () => {
      const { components } = computeBubbleScore({ ndx_pe_ratio: 80 });
      expect(components.valuationDecoupling).toBe(20);
    });
  });

  describe("fundingQuality (VC funding, below=worse)", () => {
    it("is 0 at safe threshold ($20B)", () => {
      const { components } = computeBubbleScore({
        ai_vc_funding_quarterly: 20,
      });
      expect(components.fundingQuality).toBe(0);
    });

    it("is 20 below burst threshold ($3B)", () => {
      const { components } = computeBubbleScore({
        ai_vc_funding_quarterly: 0,
      });
      expect(components.fundingQuality).toBe(20);
    });
  });

  describe("computeEconomics (compute/revenue, above=worse)", () => {
    it("is 0 at safe threshold (0.3)", () => {
      const { components } = computeBubbleScore({
        ai_compute_revenue_ratio: 0.3,
      });
      expect(components.computeEconomics).toBe(0);
    });

    it("is 20 beyond burst threshold (1.0)", () => {
      const { components } = computeBubbleScore({
        ai_compute_revenue_ratio: 5.0,
      });
      expect(components.computeEconomics).toBe(20);
    });
  });

  describe("score composition", () => {
    it("score equals sum of all five components", () => {
      const result = computeBubbleScore({
        hyperscaler_capex_sales_ratio: 18,
        enterprise_roi_hit_rate: 35,
        ndx_pe_ratio: 40,
        ai_vc_funding_quarterly: 12,
        ai_compute_revenue_ratio: 0.6,
      });
      const { industryStrain, enterpriseRoiFailure, valuationDecoupling, fundingQuality, computeEconomics } =
        result.components;
      const expectedSum = parseFloat(
        (industryStrain + enterpriseRoiFailure + valuationDecoupling + fundingQuality + computeEconomics).toFixed(1)
      );
      expect(result.score).toBe(expectedSum);
    });

    it("score is always between 0 and 100", () => {
      const extremes = [
        { hyperscaler_capex_sales_ratio: 0, enterprise_roi_hit_rate: 100, ndx_pe_ratio: 0, ai_vc_funding_quarterly: 100, ai_compute_revenue_ratio: 0 },
        { hyperscaler_capex_sales_ratio: 999, enterprise_roi_hit_rate: 0, ndx_pe_ratio: 999, ai_vc_funding_quarterly: 0, ai_compute_revenue_ratio: 999 },
      ];
      for (const metrics of extremes) {
        const { score } = computeBubbleScore(metrics);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });
});
