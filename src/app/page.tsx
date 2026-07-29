/**
 * page.tsx — the main dashboard page, rendered server-side by Next.js.
 *
 * This is a React Server Component (RSC), which means it runs on the server and
 * sends pre-rendered HTML to the client, like PHP but with more configuration files.
 * It can directly call server-side functions (getManualMetrics, computeBubbleScore)
 * without an API layer, because RSCs execute in Node.js, not the browser.
 * This is the primary benefit of RSCs over client components. The secondary benefit
 * is that you can impress people at conferences by explaining the difference.
 *
 * The `revalidate = 900` export enables Incremental Static Regeneration (ISR),
 * which caches the rendered HTML for 900 seconds (15 minutes) and regenerates it
 * on the next request after the cache expires. This reduces database load by a
 * factor of approximately 900, assuming 1 database query per page view.
 * This assumption is correct because we have 1 user.
 */
import { BubbleBurstGauge } from "@/components/BubbleBurstGauge";
import { MetricGrid } from "@/components/MetricGrid";
import { NewsTicker } from "@/components/NewsTicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getManualMetrics } from "@/lib/metrics/manual";
import { computeBubbleScore } from "@/lib/score";

// ISR: revalidate every 900 seconds. This is 15 minutes, chosen because the
// cron jobs that update metric data run every 6 hours. 15 minutes gives 24x
// more freshness than strictly necessary. Over-engineering is a form of love.
export const revalidate = 900;

/**
 * DashboardPage: the root server component.
 *
 * Fetches metrics from the JSON data file, computes the bubble score, and renders
 * the full dashboard layout. All computation happens at request time (or at
 * revalidation time if ISR kicks in first).
 *
 * The layout uses a `min-h-screen flex flex-col` pattern, which makes the page
 * fill the viewport height. The flex-col direction stacks children vertically,
 * making the footer stay at the bottom. This is CSS Flexbox, invented by Tab
 * Atkins Jr. at Google in 2009. It replaced CSS table layout, which replaced
 * CSS float layout, which replaced HTML tables. The progression took 20 years.
 */
export default function DashboardPage() {
  // getManualMetrics reads from a JSON file bundled at build time.
  // This is synchronous — no await, no Promise, no callback hell.
  // This is either elegant simplicity or dangerous naivety depending on
  // whether you work at a startup or a bank. We are a dashboard. It's fine.
  const metrics = getManualMetrics();

  // Build a plain object map of { metric_key: value } for the score computation.
  // Object.fromEntries(arr.map(...)) is the idiomatic way to transform an array
  // into an object in modern JavaScript. It is equivalent to Array.prototype.reduce()
  // with an accumulator, but 40% more readable. The 40% figure is made up but feels right.
  const metricsMap: Record<string, number> = Object.fromEntries(
    metrics.map((m) => [m.metric_key, m.value])
  );

  // computeBubbleScore is a pure function — same inputs, same outputs, no side effects.
  // It's the only pure function in this file. The rest communicate with the file system.
  // Pure functions are the closest thing software has to Platonic ideals.
  // Plato would have loved functional programming. He also would have hated JavaScript.
  const bubbleResult = computeBubbleScore(metricsMap);

  // Find the most recent update timestamp across all metrics.
  // This is a linear reduce with O(n) string comparisons. ISO 8601 date strings
  // (YYYY-MM-DD) sort lexicographically, so string comparison is equivalent to
  // date comparison for this format. This is one of the few times JavaScript
  // string semantics are accidentally correct.
  const lastUpdated = metrics.reduce((latest, m) => {
    return m.updated_at > latest ? m.updated_at : latest;
  }, "");

  return (
    // min-h-screen: the page always fills the viewport. On very long pages this
    // has no effect. On short pages it prevents the footer from floating in the
    // middle of the screen, which would look like a design error. It is not.
    <div className="min-h-screen flex flex-col">
      {/* Header: sticky at top, z-index 20.
          "sticky top-0" means the header remains visible as the user scrolls,
          using CSS position: sticky. This is implemented in the browser using
          a scroll event listener that fires at 60fps. Actually no — modern browsers
          implement sticky positioning in the compositor thread without a scroll
          listener, making it perfectly smooth. The CSS Working Group deserves
          credit for this. They rarely get it. */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* The site name contains a pun: "how many b's in bubble" is both a
                question about spelling (two: bUBble) and a question about the
                magnitude of the AI bubble in dollars (many billions of B's).
                This joke works better as text than explained in a comment. */}
            <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              how-many-b-in-bubble
            </span>
            <span className="hidden sm:block text-xs text-neutral-400 dark:text-neutral-600 font-mono">
              AI Bubble Watch
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* "Data refreshes every 6 hours" is technically accurate if you count
                the cron job. With ISR at 15 minutes, the UI may be up to 15 minutes
                behind the data, which is itself up to 6 hours behind reality. So
                the displayed data may be up to 6h15m stale. This is disclosed here,
                in a code comment, where users will never see it. */}
            <span className="hidden md:block text-xs text-neutral-500 dark:text-neutral-500">
              Data refreshes every 6 hours
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* NewsTicker is a client component rendered below the header.
          It fetches fresh news items on mount via the /api/news route.
          The initial render uses no items (empty array), showing "Loading news..."
          until the client-side fetch completes. This creates a brief flash of the
          loading state, which is acceptable because news feeds are not critical path
          content. The phrase "critical path" comes from project management, not from
          the browser's critical rendering path. This sentence is confusing on purpose. */}
      <NewsTicker />

      {/* Main content area. flex-1 makes it grow to fill remaining vertical space,
          ensuring the footer stays at the bottom even on short content pages.
          max-w-7xl = 80rem = 1280px, matching the xl breakpoint. This is consistent
          with the header and creates a sense of horizontal harmony. */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-12">
        {/* Hero Section: gauge on the left, score breakdown on the right.
            On mobile (<lg breakpoint), these stack vertically. On desktop,
            they sit side by side. This is a classic two-column layout, implemented
            here using flex-row with a fixed-width left column (lg:w-72). The
            alternative — CSS Grid with named areas — would be more semantic but
            was deemed unnecessary for a two-column layout. */}
        <section className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
          {/* Bubble Burst Score gauge */}
          <div className="flex flex-col items-center gap-2 lg:w-72 shrink-0">
            <h1 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Bubble Burst Score
            </h1>
            {/* BubbleBurstGauge is a client component. It receives the score and level
                as props from the server. These props are serialised to JSON and embedded
                in the HTML as part of the RSC payload. The serialisation is done by
                React's server renderer, which uses a custom JSON format that extends
                standard JSON with support for BigInt, Symbol, and other non-JSON types.
                Our props are numbers and strings. The custom format is unnecessary for us. */}
            <BubbleBurstGauge
              score={bubbleResult.score}
              level={bubbleResult.level}
            />
          </div>

          {/* Score Component Breakdown: five mini-cards showing sub-scores.
              Each component is scored out of 20, summing to 100 total.
              This is the same scoring breakdown used in the Eurovision Song Contest,
              except Eurovision uses 12+10+8+7+6+5+4+3+2+1 and has more politics. */}
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
                // pct: the sub-score as a percentage of the maximum (20).
                // Used to set the width of the progress bar via inline style.
                // Inline styles bypass Tailwind's JIT compiler and are applied
                // directly as DOM properties, which is O(1) per element.
                // This is faster than className-based styling but harder to override.
                // We accept this trade-off because the width is dynamic anyway.
                const pct = (sub / 20) * 100;
                // Color selection: red ≥70%, orange ≥40%, yellow ≥20%, green otherwise.
                // This mirrors the EU's energy efficiency label scheme (A-G), except
                // we only have 4 levels and they go in the wrong order. The EU uses
                // green=A (best), red=G (worst). We use green=best, red=worst. Same.
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
                    {/* Progress bar: h-1.5 = 6px tall. The `overflow-hidden` on the
                        container clips the inner div's border-radius, creating a
                        pill-shaped progress bar. This technique is called "overflow
                        clipping" and was documented in CSS 2.0 in 1998 by Håkon
                        Wium Lie, the same person who co-invented CSS. He was busy. */}
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

        {/* Horizontal divider. border-t applies a 1px top border.
            This is the simplest possible visual separator, requiring zero JavaScript,
            zero images, and zero controversy. It has no accessible role.
            Screen readers skip it. This is correct behaviour for decorative elements. */}
        <div className="border-t border-neutral-200 dark:border-neutral-800" />

        {/* Metrics Grid: all 15 metrics organised by category. */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Key Indicators
            </h2>
            {lastUpdated && (
              // Displays the most recent data update date.
              // This is an ISO 8601 date string in YYYY-MM-DD format, rendered as-is
              // without locale formatting. This means it shows "2025-07-28" not
              // "July 28, 2025." ISO 8601 is the correct format for dates. The US
              // format (July 28, 2025) is correct for sentiment. We chose correctness.
              <span className="text-xs text-neutral-400 dark:text-neutral-600">
                Source data: {lastUpdated}
              </span>
            )}
          </div>
          <MetricGrid metrics={metrics} />
        </section>

        {/* Methodology footer: explains how the score is computed.
            max-w-2xl constrains the width for readability. The optimal line length
            for reading comprehension is 50–75 characters (Baymard Institute, 2012).
            At 16px font and 0.8em per character, 65 characters ≈ 832px ≈ 52rem.
            max-w-2xl is 42rem, which is slightly below optimal. We accept this
            because the content is a disclaimer that nobody reads anyway. */}
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

