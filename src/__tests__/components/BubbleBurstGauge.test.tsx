import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BubbleBurstGauge } from "@/components/BubbleBurstGauge";

describe("BubbleBurstGauge", () => {
  it("renders the numeric score", () => {
    render(<BubbleBurstGauge score={42} level="elevated" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders /100 label", () => {
    render(<BubbleBurstGauge score={42} level="elevated" />);
    expect(screen.getByText("/ 100")).toBeInTheDocument();
  });

  it("renders 'Stable' level badge", () => {
    render(<BubbleBurstGauge score={10} level="stable" />);
    expect(screen.getByText("Stable")).toBeInTheDocument();
  });

  it("renders 'Elevated' level badge", () => {
    render(<BubbleBurstGauge score={45} level="elevated" />);
    expect(screen.getByText("Elevated")).toBeInTheDocument();
  });

  it("renders 'Critical' level badge", () => {
    render(<BubbleBurstGauge score={65} level="critical" />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("renders 'BURST' level badge", () => {
    render(<BubbleBurstGauge score={90} level="burst" />);
    expect(screen.getByText("BURST")).toBeInTheDocument();
  });

  it("renders the level description text", () => {
    render(<BubbleBurstGauge score={10} level="stable" />);
    expect(screen.getByText(/Nothing to see here/)).toBeInTheDocument();
  });

  it("renders the legend labels", () => {
    render(<BubbleBurstGauge score={10} level="stable" />);
    // Legend items are text nodes adjacent to <span> elements, use regex to match
    expect(screen.getAllByText(/Stable/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Elevated/)).toBeInTheDocument();
    expect(screen.getByText(/Critical/)).toBeInTheDocument();
    expect(screen.getByText(/Burst/)).toBeInTheDocument();
  });

  it("renders optional computedAt when provided", () => {
    render(
      <BubbleBurstGauge
        score={10}
        level="stable"
        computedAt="2026-01-15T00:00:00.000Z"
      />
    );
    expect(screen.getByText(/Last computed/)).toBeInTheDocument();
  });

  it("does not render computedAt when omitted", () => {
    render(<BubbleBurstGauge score={10} level="stable" />);
    expect(screen.queryByText(/Last computed/)).not.toBeInTheDocument();
  });

  it("renders an SVG gauge", () => {
    const { container } = render(<BubbleBurstGauge score={50} level="critical" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
