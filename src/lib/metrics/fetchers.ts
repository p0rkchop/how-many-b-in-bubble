/**
 * Metric fetchers: auto-fetch what we can from public sources.
 * Currently all metrics are manually sourced (see manual-metrics.json).
 * This module provides extension points for future auto-fetching.
 */

export interface FetchedMetric {
  metric_key: string;
  value: number;
  unit: string;
  source: string;
}

/**
 * Attempt to fetch the Nasdaq 100 P/E ratio via a public data source.
 * Falls back gracefully — returns null if unavailable.
 */
export async function fetchNdxPeRatio(): Promise<FetchedMetric | null> {
  try {
    // multpl.com provides a simple JSON endpoint for Nasdaq P/E
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/QQQ?interval=1d&range=1d",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    const eps = data?.chart?.result?.[0]?.meta?.epsTrailingTwelveMonths;
    if (!price || !eps || eps <= 0) return null;
    return {
      metric_key: "ndx_pe_ratio",
      value: parseFloat((price / eps).toFixed(2)),
      unit: "ratio",
      source: "yahoo_finance",
    };
  } catch {
    return null;
  }
}

/** Run all auto-fetchers and return whatever succeeds */
export async function fetchAutoMetrics(): Promise<FetchedMetric[]> {
  const results = await Promise.allSettled([fetchNdxPeRatio()]);
  return results
    .filter(
      (r): r is PromiseFulfilledResult<FetchedMetric | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value as FetchedMetric);
}
