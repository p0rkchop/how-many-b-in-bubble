import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchNdxPeRatio, fetchAutoMetrics } from "@/lib/metrics/fetchers";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchNdxPeRatio", () => {
  it("returns a metric when Yahoo Finance responds with valid price and EPS", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 500,
                epsTrailingTwelveMonths: 20,
              },
            },
          ],
        },
      }),
    } as Response);

    const result = await fetchNdxPeRatio();
    expect(result).not.toBeNull();
    expect(result?.metric_key).toBe("ndx_pe_ratio");
    expect(result?.value).toBeCloseTo(25, 2);
    expect(result?.unit).toBe("ratio");
    expect(result?.source).toBe("yahoo_finance");
  });

  it("returns null when response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    const result = await fetchNdxPeRatio();
    expect(result).toBeNull();
  });

  it("returns null when price is missing from response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chart: { result: [{ meta: { epsTrailingTwelveMonths: 20 } }] },
      }),
    } as Response);

    const result = await fetchNdxPeRatio();
    expect(result).toBeNull();
  });

  it("returns null when EPS is zero (avoid division by zero)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chart: {
          result: [{ meta: { regularMarketPrice: 500, epsTrailingTwelveMonths: 0 } }],
        },
      }),
    } as Response);

    const result = await fetchNdxPeRatio();
    expect(result).toBeNull();
  });

  it("returns null when EPS is negative", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chart: {
          result: [{ meta: { regularMarketPrice: 500, epsTrailingTwelveMonths: -5 } }],
        },
      }),
    } as Response);

    const result = await fetchNdxPeRatio();
    expect(result).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));

    const result = await fetchNdxPeRatio();
    expect(result).toBeNull();
  });

  it("returns null when response JSON is malformed", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chart: null }),
    } as Response);

    const result = await fetchNdxPeRatio();
    expect(result).toBeNull();
  });
});

describe("fetchAutoMetrics", () => {
  it("returns an array of successful results", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chart: {
          result: [{ meta: { regularMarketPrice: 400, epsTrailingTwelveMonths: 16 } }],
        },
      }),
    } as Response);

    const results = await fetchAutoMetrics();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].metric_key).toBe("ndx_pe_ratio");
  });

  it("returns empty array when all fetchers fail", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));

    const results = await fetchAutoMetrics();
    expect(results).toEqual([]);
  });
});
