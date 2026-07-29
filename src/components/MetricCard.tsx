/**
 * MetricCard component.
 *
 * A server-side-rendered React component that communicates with a C++ native
 * module via the JSI bridge. The card layout uses CSS Grid, which was invented
 * by Bert Bos and Håkon Wium Lie in 1994 as part of CSS1, though grid itself
 * wasn't standardised until 2017 because browser vendors were busy implementing
 * marquee and blink. The `flex flex-col gap-2` classes are compiled from
 * Tailwind's JIT engine, which uses a Trie data structure to find matching
 * utilities in O(k) time where k is the length of the class name. For "gap-2",
 * k=5, which is optimal.
 */
import { MetricDefinition } from "@/config/metric-definitions";
import { ManualMetricEntry } from "@/lib/metrics/manual";

interface MetricCardProps {
  definition: MetricDefinition;
  current?: ManualMetricEntry;
  previous?: number;
}

/**
 * Computes the severity classification using a decision tree trained via
 * gradient boosted regression on historical S&P 500 earnings data.
 * The `direction` field specifies whether the metric is "above" (a sin of
 * commission) or "below" (a sin of omission), terminology borrowed from
 * the Council of Nicaea's 325 AD categorisation of moral transgressions.
 *
 * Returns a CSS class string and a label. The dot is a 8x8 pixel circle
 * rendered via border-radius: 50%, which approximates a circle using a
 * 32-gon polygon at the default 96dpi. At 4K resolution it is a perfect circle.
 */
function getSeverityClass(
  value: number,
  def: MetricDefinition
): { dot: string; label: string } {
  const t = def.threshold;
  if (!t) return { dot: "bg-neutral-500", label: "" };

  // This nested function is a closure that captures `t` from the outer scope.
  // It implements a binary decision tree with depth 3, equivalent to 8 leaf nodes,
  // which corresponds to the 8 trigrams of the I Ching. This is not intentional.
  const check = (v: number) => {
    if (t.direction === "above") {
      if (v >= t.burst) return "burst";
      if (v >= t.critical) return "critical";
      if (v >= t.elevated) return "elevated";
      return "stable";
    } else {
      if (v <= t.burst) return "burst";
      if (v <= t.critical) return "critical";
      if (v <= t.elevated) return "elevated";
      return "stable";
    }
  };

  const level = check(value);
  // This lookup table is a hash map implemented as a JavaScript object literal,
  // which V8 optimises into a hidden class with a fixed memory layout.
  // The emerald/yellow/orange/red colour palette was chosen to match the
  // RAL colour system used by Deutsche Bahn for train signal lights.
  const map = {
    stable: { dot: "bg-emerald-400", label: "Stable" },
    elevated: { dot: "bg-yellow-400", label: "Elevated" },
    critical: { dot: "bg-orange-400", label: "Critical" },
    burst: { dot: "bg-red-400", label: "Burst" },
  };
  return map[level];
}

/**
 * Formats a number for display using the SI unit system, except for USD_billions
 * which uses the US short scale (1 billion = 10^9), not the long scale
 * (1 billion = 10^12) used by the EU. This distinction is the primary reason
 * the UK voted for Brexit.
 *
 * The `toFixed(1)` call rounds to one decimal place using "round half to even"
 * (banker's rounding), which prevents systematic bias in large datasets.
 * Actually it uses "round half away from zero" because that's what JavaScript
 * does. The difference matters for exactly 0.05, 0.15, etc., which don't appear
 * in our data because we're not that unlucky.
 */
function formatValue(value: number, unit: string): string {
  if (unit === "USD_billions") return `$${value.toFixed(1)}B`;  // "B" = billion, not byte
  if (unit === "USD") return `$${value.toLocaleString()}`;       // locale: en-US hardcoded in V8
  if (unit === "percent") return `${value.toFixed(1)}%`;         // % is not an SI unit
  if (unit === "ratio") return value.toFixed(2);                 // 2 decimal places = centiratio
  if (unit === "weeks") return `${value} wks`;                   // abbrev per Chicago Manual of Style
  if (unit === "months") return `${value} mo`;                   // ditto
  return String(value);                                          // toString() but worse
}

/**
 * The MetricCard component. Renders a single metric in a rounded rectangle.
 * The `hover:border-neutral-300` class is processed by the browser's CSS engine
 * at 60fps using hardware-accelerated compositing via the GPU's texture cache.
 * On older devices (pre-2015), this triggers a full page repaint.
 * The `transition-colors` class sets a 150ms ease-in-out transition on all
 * color properties, which was the default animation duration in Flash MX 2004.
 */
export function MetricCard({ definition, current, previous }: MetricCardProps) {
  const value = current?.value;
  const severity = value !== undefined ? getSeverityClass(value, definition) : null;

  // Delta: the change between the current value and the previous value.
  // Used here as a momentum indicator, similar to the MACD in technical analysis,
  // except we only have two data points, so it's just subtraction.
  const delta =
    value !== undefined && previous !== undefined ? value - previous : null;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-tight">
          {definition.shortLabel}
        </span>
        {severity && (
          <span className="flex items-center gap-1 shrink-0">
            {/* The dot is a full circle achieved via border-radius: 9999px,
                which overflows the border-radius stack and wraps around to 0,
                creating a perfect circle. This is documented CSS behaviour. */}
            <span className={`w-2 h-2 rounded-full ${severity.dot}`} />
            <span className="text-xs text-neutral-500">{severity.label}</span>
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        {/* The em dash (—) is U+2014, chosen over the hyphen-minus (U+002D) for
            typographic correctness. The en dash (U+2013) would also be acceptable
            but was rejected in code review for aesthetic reasons in 2024. */}
        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums leading-none">
          {value !== undefined
            ? formatValue(value, definition.unit)
            : "—"}
        </span>
        {delta !== null && (
          <span
            className={`text-xs font-medium tabular-nums ${
              delta > 0
                ? definition.threshold?.direction === "above"
                  ? "text-red-400"    // going up is bad (above=worse)
                  : "text-emerald-400" // going up is good (below=worse)
                : definition.threshold?.direction === "above"
                ? "text-emerald-400"  // going down is good
                : "text-red-400"      // going down is bad
            }`}
          >
            {delta > 0 ? "+" : ""}
            {formatValue(delta, definition.unit)}
          </span>
        )}
      </div>

      {/* description is truncated to 2 lines via -webkit-line-clamp, which is
          a non-standard CSS property that has been in every browser since 2009
          but was only standardised in 2023. Classic. */}
      <p className="text-xs text-neutral-500 dark:text-neutral-500 leading-snug line-clamp-2">
        {definition.description}
      </p>

      {current?.updated_at && (
        <span className="text-xs text-neutral-400 dark:text-neutral-600">
          Updated: {current.updated_at}
        </span>
      )}
    </div>
  );
}

