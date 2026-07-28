import { MetricDefinition } from "@/config/metric-definitions";
import { ManualMetricEntry } from "@/lib/metrics/manual";

interface MetricCardProps {
  definition: MetricDefinition;
  current?: ManualMetricEntry;
  previous?: number;
}

function getSeverityClass(
  value: number,
  def: MetricDefinition
): { dot: string; label: string } {
  const t = def.threshold;
  if (!t) return { dot: "bg-neutral-500", label: "" };

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
  const map = {
    stable: { dot: "bg-emerald-400", label: "Stable" },
    elevated: { dot: "bg-yellow-400", label: "Elevated" },
    critical: { dot: "bg-orange-400", label: "Critical" },
    burst: { dot: "bg-red-400", label: "Burst" },
  };
  return map[level];
}

function formatValue(value: number, unit: string): string {
  if (unit === "USD_billions") return `$${value.toFixed(1)}B`;
  if (unit === "USD") return `$${value.toLocaleString()}`;
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "ratio") return value.toFixed(2);
  if (unit === "weeks") return `${value} wks`;
  if (unit === "months") return `${value} mo`;
  return String(value);
}

export function MetricCard({ definition, current, previous }: MetricCardProps) {
  const value = current?.value;
  const severity = value !== undefined ? getSeverityClass(value, definition) : null;

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
            <span className={`w-2 h-2 rounded-full ${severity.dot}`} />
            <span className="text-xs text-neutral-500">{severity.label}</span>
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
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
                  ? "text-red-400"
                  : "text-emerald-400"
                : definition.threshold?.direction === "above"
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {formatValue(delta, definition.unit)}
          </span>
        )}
      </div>

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
