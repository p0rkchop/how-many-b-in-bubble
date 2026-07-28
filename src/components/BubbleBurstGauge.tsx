"use client";

import { BubbleLevel, LEVEL_CONFIG } from "@/lib/score";

interface BubbleBurstGaugeProps {
  score: number;
  level: BubbleLevel;
  computedAt?: string;
}

export function BubbleBurstGauge({
  score,
  level,
  computedAt,
}: BubbleBurstGaugeProps) {
  const config = LEVEL_CONFIG[level];
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - score / 100);

  const strokeColor: Record<BubbleLevel, string> = {
    stable: "#34d399",
    elevated: "#fbbf24",
    critical: "#f97316",
    burst: "#f87171",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Gauge */}
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-800 dark:text-neutral-700"
          />
          {/* Score arc */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={strokeColor[level]}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-4xl font-black tabular-nums ${config.color}`}
            style={{ lineHeight: 1 }}
          >
            {score.toFixed(0)}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            / 100
          </span>
        </div>
      </div>

      {/* Level badge */}
      <div
        className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-widest ${config.color} ${config.bg} ${level === "burst" ? "animate-pulse" : ""}`}
      >
        {config.label}
      </div>

      {/* Description */}
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 max-w-xs leading-relaxed">
        {config.description}
      </p>

      {/* Scale reference */}
      <div className="flex items-center gap-1 text-xs text-neutral-500">
        <span className="text-emerald-400">●</span> Stable
        <span className="mx-1 text-neutral-700">·</span>
        <span className="text-yellow-400">●</span> Elevated
        <span className="mx-1 text-neutral-700">·</span>
        <span className="text-orange-400">●</span> Critical
        <span className="mx-1 text-neutral-700">·</span>
        <span className="text-red-400">●</span> Burst
      </div>

      {computedAt && (
        <p className="text-xs text-neutral-500 dark:text-neutral-600">
          Last computed:{" "}
          {new Date(computedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
