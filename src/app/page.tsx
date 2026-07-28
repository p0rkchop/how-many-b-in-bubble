import { BubbleBurstGauge } from "@/components/BubbleBurstGauge";
import { MetricGrid } from "@/components/MetricGrid";
import { NewsTicker } from "@/components/NewsTicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getManualMetrics } from "@/lib/metrics/manual";
import { computeBubbleScore } from "@/lib/score";

export const revalidate = 900; // ISR: 15 minutes

export default function DashboardPage() {
  const metrics = getManualMetrics();

  const metricsMap: Record<string, number> = Object.fromEntries(
    metrics.map((m) => [m.metric_key, m.value])
  );

  const bubbleResult = computeBubbleScore(metricsMap);

  const lastUpdated = metrics.reduce((latest, m) => {
    return m.updated_at > latest ? m.updated_at : latest;
  }, "");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              how-many-b-in-bubble
            </span>
            <span className="hidden sm:block text-xs text-neutral-400 dark:text-neutral-600 font-mono">
              AI Bubble Watch
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs text-neutral-500 dark:text-neutral-500">
              Data refreshes every 6 hours
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* News Ticker */}
      <NewsTicker />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
          {/* Bubble Burst Score */}
          <div className="flex flex-col items-center gap-2 lg:w-72 shrink-0">
            <h1 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Bubble Burst Score
            </h1>
            <BubbleBurstGauge
              score={bubbleResult.score}
              level={bubbleResult.level}
            />
          </div>

          {/* Score Component Breakdown */}
          <div className="flex-1 w-full">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
              Score Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(
                [
                  ["Industry Strain", bubbleResult.components.industryStrain, "CapEx/Sales ratio deviation from 10% baseline"],
                  ["Enterprise ROI Failure", bubbleResult.components.enterpriseRoiFailure, "AI initiatives missing expected ROI"],
                  ["Valuation Decoupling", bubbleResult.components.valuationDecoupling, "Nasdaq 100 P/E vs historical average"],
                  ["Funding Quality", bubbleResult.components.fundingQuality, "VC funding contraction signal"],
                  ["Compute Economics", bubbleResult.components.computeEconomics, "Pure-play AI compute-to-revenue ratio"],
                ] as [string, number, string][]
              ).map(([label, sub, desc]) => {
                const pct = (sub / 20) * 100;
                const color =
                  pct >= 70
                    ? "bg-red-400"
                    : pct >= 40
                    ? "bg-orange-400"
                    : pct >= 20
                    ? "bg-yellow-400"
                    : "bg-emerald-400";
                return (
                  <div
                    key={label}
                    className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        {label}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {sub.toFixed(1)}
                        <span className="text-xs text-neutral-400 font-normal">
                          /20
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500 leading-snug">{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-neutral-200 dark:border-neutral-800" />

        {/* Metrics Grid */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Key Indicators
            </h2>
            {lastUpdated && (
              <span className="text-xs text-neutral-400 dark:text-neutral-600">
                Source data: {lastUpdated}
              </span>
            )}
          </div>
          <MetricGrid metrics={metrics} />
        </section>

        {/* Methodology note */}
        <footer className="border-t border-neutral-200 dark:border-neutral-800 pt-6 pb-10">
          <div className="max-w-2xl">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">
              Methodology
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 leading-relaxed">
              The Bubble Burst Score is a composite 0–100 index computed from five
              equally-weighted sub-components: Industry Strain (CapEx/Sales ratio),
              Enterprise ROI Failure Rate, Valuation Decoupling (Nasdaq 100 P/E),
              Funding Quality Deterioration, and Compute Economics for pure-play AI.
              Metrics are sourced from public financial disclosures, industry surveys,
              and manually curated data. This is not financial advice.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
