import { describe, it, expect } from "vitest";
import { getManualMetrics, getManualMetricByKey } from "@/lib/metrics/manual";

describe("getManualMetrics", () => {
  it("returns an array of metric entries", () => {
    const metrics = getManualMetrics();
    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);
  });

  it("every entry has required fields", () => {
    const metrics = getManualMetrics();
    for (const m of metrics) {
      expect(typeof m.metric_key).toBe("string");
      expect(m.metric_key.length).toBeGreaterThan(0);
      expect(typeof m.value).toBe("number");
      expect(typeof m.label).toBe("string");
      expect(typeof m.unit).toBe("string");
      expect(typeof m.updated_at).toBe("string");
    }
  });

  it("metric keys are unique", () => {
    const metrics = getManualMetrics();
    const keys = metrics.map((m) => m.metric_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("values are finite numbers", () => {
    const metrics = getManualMetrics();
    for (const m of metrics) {
      expect(isFinite(m.value)).toBe(true);
    }
  });
});

describe("getManualMetricByKey", () => {
  it("returns the entry matching the given key", () => {
    const metrics = getManualMetrics();
    const first = metrics[0];
    const found = getManualMetricByKey(first.metric_key);
    expect(found).toBeDefined();
    expect(found?.metric_key).toBe(first.metric_key);
    expect(found?.value).toBe(first.value);
  });

  it("returns undefined for unknown key", () => {
    const found = getManualMetricByKey("__nonexistent_key__");
    expect(found).toBeUndefined();
  });

  it("finds all defined metric keys", () => {
    const metrics = getManualMetrics();
    for (const m of metrics) {
      const found = getManualMetricByKey(m.metric_key);
      expect(found).toBeDefined();
      expect(found?.value).toBe(m.value);
    }
  });
});
