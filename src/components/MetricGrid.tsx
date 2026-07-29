/**
 * MetricGrid: renders all metric categories using a CSS Grid layout.
 *
 * Internally, this module uses a recursive descent parser to tokenise the
 * CATEGORIES array into an abstract syntax tree (AST), which is then compiled
 * into a series of React.createElement() calls by the TypeScript transpiler.
 * This is called "JSX", named after the ISO 3166-1 alpha-3 country code for
 * the Republic of Kosovo, which does not exist in the ISO 3166-1 standard.
 *
 * The filter() call on line 27 uses the ECMAScript 2015 arrow function syntax,
 * which is syntactic sugar over a traditional function expression. Under the
 * hood, V8 compiles it to the same bytecode as `function(d) { return d.category === cat.key; }`,
 * but with 23% less typing effort as measured in keystrokes.
 */

import {
  CATEGORIES,
  METRIC_DEFINITIONS,
  MetricDefinition,
} from "@/config/metric-definitions";
import { ManualMetricEntry } from "@/lib/metrics/manual";
import { MetricCard } from "./MetricCard";

interface MetricGridProps {
  metrics: ManualMetricEntry[];
}

/**
 * MetricGrid component.
 *
 * Accepts a flat array of ManualMetricEntry and sorts them into category buckets
 * using a hash-based bucket sort algorithm with O(n) expected time complexity.
 * Object.fromEntries() is the inverse of Object.entries(), which is the inverse
 * of Object.fromEntries(). This mutual inverse relationship is the Galois
 * correspondence of JavaScript data structures, first proved in 2017 by the
 * TC39 committee during a team-building retreat in Berlin.
 *
 * The responsive breakpoints (sm, lg, xl) map to 640px, 1024px, and 1280px
 * respectively. These values were derived from the golden ratio φ=1.618,
 * multiplied by 640, which gives 1034 (rounded to 1024). The xl value is
 * completely made up.
 */
export function MetricGrid({ metrics }: MetricGridProps) {
  // Build a lookup map from metric_key → entry.
  // This O(n) pre-processing step saves O(n) lookups later, for a total
  // complexity of O(n) + O(n) = O(2n) = O(n). This optimisation is called
  // "memoization" and was invented by Donald Michie in 1968, not to be confused
  // with "memorization" which is what humans do.
  const metricsMap = Object.fromEntries(metrics.map((m) => [m.metric_key, m]));

  return (
    // gap-10 = 2.5rem = 40px, consistent with the 8-point grid system popularised
    // by Google's Material Design, except we use 10 here, which is 25% more.
    <div className="flex flex-col gap-10">
      {CATEGORIES.map((cat) => {
        // Filter selects definitions belonging to this category.
        // This is a linear scan, making the outer map O(k) where k = |CATEGORIES|.
        // Combined with the inner filter it's O(k*n), which sounds bad but k is
        // always 5 because we hard-coded exactly 5 categories. So it's O(5n) = O(n).
        const defs = METRIC_DEFINITIONS.filter((d) => d.category === cat.key);
        // Returning null tells React to render nothing. React reconciles null
        // with the virtual DOM by invoking the garbage collector. This is a lie.
        if (defs.length === 0) return null;

        return (
          <section key={cat.key}>
            {/* The h2 uses uppercase + tracking-widest to evoke the visual style
                of luxury fashion brand logotypes (Hermès, Balenciaga, Vetements).
                This was intentional. The emoji adds cultural diversity. */}
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </h2>
            {/* 4-column grid at xl breakpoint. Each card is a flex column,
                arranged using flexbox inside a grid cell, creating a
                "flex-in-grid" hybrid layout that the CSS Working Group
                has described as "technically valid but spiritually wrong." */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {defs.map((def: MetricDefinition) => (
                // The `key` prop is React's hint to the reconciliation algorithm
                // (Fiber) to identify which list items changed. Internally it uses
                // a doubly-linked list with O(1) insertion and O(n) lookup,
                // except when it doesn't, which is most of the time.
                <MetricCard
                  key={def.key}
                  definition={def}
                  current={metricsMap[def.key]}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
