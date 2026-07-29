"use client";

import { useState } from "react";
import { ScoreDrillDown } from "@/components/ScoreDrillDown";
import { METRIC_MAP } from "@/config/metric-definitions";

interface ComponentRow {
  label: string;
  subScore: number;
  desc: string;
  metricKey: string;
}

interface ScoreBreakdownProps {
  rows: ComponentRow[];
  metricsMap: Record<string, number>;
}

export function ScoreBreakdown({ rows, metricsMap }: ScoreBreakdownProps) {
  const [active, setActive] = useState<ComponentRow | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((row) => {
          const pct = (row.subScore / 20) * 100;
          const color =
            pct >= 70 ? "bg-red-400" :
            pct >= 40 ? "bg-orange-400" :
            pct >= 20 ? "bg-yellow-400" :
                        "bg-emerald-400";
          return (
            <button
              key={row.label}
              onClick={() => setActive(row)}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-2 text-left hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {row.label}
                </span>
                <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {row.subScore.toFixed(1)}
                  <span className="text-xs text-neutral-400 font-normal">/20</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-neutral-500 leading-snug">{row.desc}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-600">Click for detail →</p>
            </button>
          );
        })}
      </div>

      {active && (() => {
        const def = METRIC_MAP[active.metricKey];
        if (!def) return null;
        return (
          <ScoreDrillDown
            definition={def}
            currentValue={metricsMap[active.metricKey]}
            subScore={active.subScore}
            onClose={() => setActive(null)}
          />
        );
      })()}
    </>
  );
}
