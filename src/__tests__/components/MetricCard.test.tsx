import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "@/components/MetricCard";
import type { MetricDefinition } from "@/config/metric-definitions";
import type { ManualMetricEntry } from "@/lib/metrics/manual";

const baseDef: MetricDefinition = {
  key: "test_metric",
  label: "Test Metric",
  shortLabel: "Test",
  unit: "percent",
  description: "A test metric for unit testing.",
  category: "hyperscaler",
  source: "manual",
  threshold: {
    direction: "above",
    elevated: 40,
    critical: 60,
    burst: 80,
  },
};

const entry = (value: number, updated_at = "2026-Q2"): ManualMetricEntry => ({
  metric_key: "test_metric",
  value,
  label: "Test Metric",
  unit: "percent",
  updated_at,
});

describe("MetricCard", () => {
  it("renders the short label", () => {
    render(<MetricCard definition={baseDef} current={entry(30)} />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders the formatted value for percent unit", () => {
    render(<MetricCard definition={baseDef} current={entry(42.5)} />);
    expect(screen.getByText("42.5%")).toBeInTheDocument();
  });

  it("renders '—' when no current entry is provided", () => {
    render(<MetricCard definition={baseDef} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<MetricCard definition={baseDef} current={entry(30)} />);
    expect(screen.getByText(baseDef.description)).toBeInTheDocument();
  });

  it("renders updated_at when current is provided", () => {
    render(<MetricCard definition={baseDef} current={entry(30, "2026-Q2")} />);
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    expect(screen.getByText(/2026-Q2/)).toBeInTheDocument();
  });

  it("shows 'Stable' badge for value below elevated threshold", () => {
    render(<MetricCard definition={baseDef} current={entry(30)} />);
    expect(screen.getByText("Stable")).toBeInTheDocument();
  });

  it("shows 'Elevated' badge for value above elevated threshold", () => {
    render(<MetricCard definition={baseDef} current={entry(50)} />);
    expect(screen.getByText("Elevated")).toBeInTheDocument();
  });

  it("shows 'Critical' badge for value above critical threshold", () => {
    render(<MetricCard definition={baseDef} current={entry(70)} />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("shows 'Burst' badge for value above burst threshold", () => {
    render(<MetricCard definition={baseDef} current={entry(90)} />);
    expect(screen.getByText("Burst")).toBeInTheDocument();
  });

  it("shows no badge when threshold is not defined", () => {
    const noThreshold = { ...baseDef, threshold: undefined };
    render(<MetricCard definition={noThreshold} current={entry(90)} />);
    expect(screen.queryByText("Stable")).not.toBeInTheDocument();
    expect(screen.queryByText("Burst")).not.toBeInTheDocument();
  });

  it("renders delta when previous value is provided", () => {
    render(<MetricCard definition={baseDef} current={entry(45)} previous={40} />);
    expect(screen.getByText("+5.0%")).toBeInTheDocument();
  });

  it("renders negative delta correctly", () => {
    render(<MetricCard definition={baseDef} current={entry(35)} previous={40} />);
    expect(screen.getByText("-5.0%")).toBeInTheDocument();
  });

  describe("unit formatting", () => {
    it("formats USD_billions", () => {
      render(<MetricCard definition={{ ...baseDef, unit: "USD_billions" }} current={entry(12.3)} />);
      expect(screen.getByText("$12.3B")).toBeInTheDocument();
    });

    it("formats ratio", () => {
      render(<MetricCard definition={{ ...baseDef, unit: "ratio" }} current={entry(1.25)} />);
      expect(screen.getByText("1.25")).toBeInTheDocument();
    });
  });
});
