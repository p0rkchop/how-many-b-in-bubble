import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricGrid } from "@/components/MetricGrid";
import { CATEGORIES, METRIC_DEFINITIONS } from "@/config/metric-definitions";
import type { ManualMetricEntry } from "@/lib/metrics/manual";

const mockMetrics: ManualMetricEntry[] = METRIC_DEFINITIONS.slice(0, 3).map((def) => ({
  metric_key: def.key,
  value: 42,
  label: def.label,
  unit: def.unit,
  updated_at: "2026-Q2",
}));

describe("MetricGrid", () => {
  it("renders without crashing with empty metrics", () => {
    render(<MetricGrid metrics={[]} />);
  });

  it("renders category headings from CATEGORIES", () => {
    render(<MetricGrid metrics={mockMetrics} />);
    // At least one category that has a matching METRIC_DEFINITION should render
    const renderedCategories = CATEGORIES.filter((cat) =>
      METRIC_DEFINITIONS.some((d) => d.category === cat.key)
    );
    expect(renderedCategories.length).toBeGreaterThan(0);
    // Each rendered category label should appear in the document
    for (const cat of renderedCategories) {
      expect(screen.getByText(cat.label)).toBeInTheDocument();
    }
  });

  it("renders a MetricCard for each provided metric", () => {
    render(<MetricGrid metrics={mockMetrics} />);
    for (const m of mockMetrics) {
      const def = METRIC_DEFINITIONS.find((d) => d.key === m.metric_key)!;
      expect(screen.getByText(def.shortLabel)).toBeInTheDocument();
    }
  });

  it("renders category emojis", () => {
    render(<MetricGrid metrics={mockMetrics} />);
    const renderedCategories = CATEGORIES.filter((cat) =>
      METRIC_DEFINITIONS.some((d) => d.category === cat.key)
    );
    for (const cat of renderedCategories) {
      expect(screen.getByText(cat.emoji)).toBeInTheDocument();
    }
  });
});
