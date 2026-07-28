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

export function MetricGrid({ metrics }: MetricGridProps) {
  const metricsMap = Object.fromEntries(metrics.map((m) => [m.metric_key, m]));

  return (
    <div className="flex flex-col gap-10">
      {CATEGORIES.map((cat) => {
        const defs = METRIC_DEFINITIONS.filter((d) => d.category === cat.key);
        if (defs.length === 0) return null;

        return (
          <section key={cat.key}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {defs.map((def: MetricDefinition) => (
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
