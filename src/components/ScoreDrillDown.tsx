"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { MetricDefinition } from "@/config/metric-definitions";

interface Snapshot {
  value: number;
  capturedAt: string;
  unit: string | null;
}

interface ScoreDrillDownProps {
  definition: MetricDefinition;
  currentValue: number | undefined;
  subScore: number;
  onClose: () => void;
}

function formatVal(value: number, unit: string): string {
  if (unit === "USD_billions") return `$${value.toFixed(1)}B`;
  if (unit === "USD") return `$${value.toLocaleString()}`;
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "ratio") return value.toFixed(2);
  if (unit === "weeks") return `${value} wks`;
  if (unit === "months") return `${value} mo`;
  return String(value);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ScoreDrillDown({
  definition,
  currentValue,
  subScore,
  onClose,
}: ScoreDrillDownProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/snapshots/${definition.key}`)
      .then((r) => r.json())
      .then((d) => setSnapshots(d.snapshots ?? []))
      .catch(() => setSnapshots([]))
      .finally(() => setLoading(false));
  }, [definition.key]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const t = definition.threshold;
  const unit = definition.unit;

  const scoreColor =
    subScore >= 14 ? "text-red-400" :
    subScore >= 8  ? "text-orange-400" :
    subScore >= 4  ? "text-yellow-400" :
                     "text-emerald-400";

  const chartData = snapshots.map((s) => ({
    date: formatDate(s.capturedAt),
    value: s.value,
  }));

  return (
    // Backdrop
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Sheet / modal */}
      <div className="w-full sm:max-w-lg bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Score Breakdown</p>
            <h2 className="text-lg font-bold text-neutral-100">{definition.label}</h2>
            <p className="text-xs text-neutral-500 mt-1 leading-snug">{definition.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-100 transition-colors shrink-0 mt-0.5"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current value + sub-score */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 mb-1">Current Value</p>
            <p className="text-2xl font-black tabular-nums text-neutral-100">
              {currentValue !== undefined ? formatVal(currentValue, unit) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 mb-1">Sub-score</p>
            <p className={`text-2xl font-black tabular-nums ${scoreColor}`}>
              {subScore.toFixed(1)}<span className="text-sm text-neutral-500 font-normal">/20</span>
            </p>
          </div>
        </div>

        {/* Threshold context */}
        {t && currentValue !== undefined && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-3">
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Thresholds</p>
            <div className="flex flex-col gap-1.5">
              {(t.direction === "above"
                ? [
                    { label: "Stable", range: `below ${formatVal(t.elevated, unit)}`, color: "text-emerald-400", active: currentValue < t.elevated },
                    { label: "Elevated", range: `${formatVal(t.elevated, unit)} – ${formatVal(t.critical, unit)}`, color: "text-yellow-400", active: currentValue >= t.elevated && currentValue < t.critical },
                    { label: "Critical", range: `${formatVal(t.critical, unit)} – ${formatVal(t.burst, unit)}`, color: "text-orange-400", active: currentValue >= t.critical && currentValue < t.burst },
                    { label: "Burst", range: `above ${formatVal(t.burst, unit)}`, color: "text-red-400", active: currentValue >= t.burst },
                  ]
                : [
                    { label: "Stable", range: `above ${formatVal(t.elevated, unit)}`, color: "text-emerald-400", active: currentValue > t.elevated },
                    { label: "Elevated", range: `${formatVal(t.critical, unit)} – ${formatVal(t.elevated, unit)}`, color: "text-yellow-400", active: currentValue <= t.elevated && currentValue > t.critical },
                    { label: "Critical", range: `${formatVal(t.burst, unit)} – ${formatVal(t.critical, unit)}`, color: "text-orange-400", active: currentValue <= t.critical && currentValue > t.burst },
                    { label: "Burst", range: `below ${formatVal(t.burst, unit)}`, color: "text-red-400", active: currentValue <= t.burst },
                  ]
              ).map(({ label, range, color, active }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors ${
                    active ? "bg-neutral-800 ring-1 ring-neutral-600" : ""
                  }`}
                >
                  <span className={`font-semibold ${color}`}>{label}</span>
                  <span className="text-neutral-400">{range}</span>
                  {active && <span className="text-neutral-300 font-bold">← you are here</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historical chart */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-3">
          <p className="text-xs text-neutral-500 uppercase tracking-widest">History</p>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-xs text-neutral-600">Loading…</div>
          ) : chartData.length < 2 ? (
            <div className="h-40 flex items-center justify-center text-xs text-neutral-600">
              Not enough data yet — snapshots accumulate as cron runs.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#525252" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#525252" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatVal(v, unit)}
                />
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#a3a3a3" }}
                  itemStyle={{ color: "#e5e5e5" }}
                  formatter={(v: unknown) => [formatVal(v as number, unit), definition.shortLabel]}
                />
                {/* Threshold reference lines */}
                {t && (
                  <>
                    <ReferenceLine y={t.elevated} stroke="#facc15" strokeDasharray="3 3" strokeWidth={1} />
                    <ReferenceLine y={t.critical} stroke="#fb923c" strokeDasharray="3 3" strokeWidth={1} />
                    <ReferenceLine y={t.burst}    stroke="#f87171" strokeDasharray="3 3" strokeWidth={1} />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#60a5fa" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {t && chartData.length >= 2 && (
            <div className="flex gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-yellow-400" /> Elevated</span>
              <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-orange-400" /> Critical</span>
              <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-red-400" /> Burst</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
