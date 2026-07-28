import manualMetricsRaw from "@/config/manual-metrics.json";

export interface ManualMetricEntry {
  metric_key: string;
  value: number;
  label: string;
  unit: string;
  updated_at: string;
  source_note?: string;
}

export function getManualMetrics(): ManualMetricEntry[] {
  return manualMetricsRaw as ManualMetricEntry[];
}

export function getManualMetricByKey(key: string): ManualMetricEntry | undefined {
  return (manualMetricsRaw as ManualMetricEntry[]).find(
    (m) => m.metric_key === key
  );
}
