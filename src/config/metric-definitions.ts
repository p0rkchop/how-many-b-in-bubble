export type MetricSeverity = "stable" | "elevated" | "critical" | "burst";

export interface MetricThreshold {
  elevated: number;
  critical: number;
  burst: number;
  direction: "above" | "below"; // above = higher is worse, below = lower is worse
}

export interface MetricDefinition {
  key: string;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  category: "hyperscaler" | "hardware" | "software" | "enterprise" | "macro";
  source: "auto" | "manual";
  threshold?: MetricThreshold;
  /** If source is auto, which fetcher to use */
  fetcher?: string;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // ── Hyperscalers ─────────────────────────────────────────────────────────────
  {
    key: "hyperscaler_capex_total",
    label: "Hyperscaler AI CapEx (Annual, $B)",
    shortLabel: "AI CapEx",
    unit: "USD_billions",
    description:
      "Aggregate annual AI capital expenditure across Amazon, Google, Microsoft, and Meta.",
    category: "hyperscaler",
    source: "manual",
    threshold: {
      elevated: 400,
      critical: 600,
      burst: 800,
      direction: "above",
    },
  },
  {
    key: "hyperscaler_capex_sales_ratio",
    label: "Hyperscaler CapEx-to-Sales Ratio (%)",
    shortLabel: "CapEx/Sales",
    unit: "percent",
    description:
      "CapEx as % of revenue. Historical baseline ~10%. Above 20–25% signals unsustainable build-out.",
    category: "hyperscaler",
    source: "manual",
    threshold: {
      elevated: 15,
      critical: 20,
      burst: 30,
      direction: "above",
    },
  },
  {
    key: "cloud_ai_revenue_growth",
    label: "Cloud AI Revenue Growth (YoY %)",
    shortLabel: "Cloud AI Growth",
    unit: "percent",
    description:
      "Year-over-year growth of cloud revenue attributable to AI workloads.",
    category: "hyperscaler",
    source: "manual",
    threshold: {
      elevated: 30,
      critical: 15,
      burst: 5,
      direction: "below",
    },
  },

  // ── Hardware ─────────────────────────────────────────────────────────────────
  {
    key: "nvda_dc_revenue",
    label: "NVIDIA Data Center Revenue (Quarterly, $B)",
    shortLabel: "NVDA DC Rev",
    unit: "USD_billions",
    description: "NVIDIA quarterly data center segment revenue.",
    category: "hardware",
    source: "manual",
    threshold: {
      elevated: 30,
      critical: 15,
      burst: 8,
      direction: "below",
    },
  },
  {
    key: "nvda_gross_margin",
    label: "NVIDIA Gross Margin (%)",
    shortLabel: "NVDA Margin",
    unit: "percent",
    description:
      "NVIDIA gross margin. Contraction signals supply/demand normalization.",
    category: "hardware",
    source: "manual",
    threshold: {
      elevated: 65,
      critical: 55,
      burst: 45,
      direction: "below",
    },
  },
  {
    key: "amd_dc_revenue",
    label: "AMD Data Center Revenue (Quarterly, $B)",
    shortLabel: "AMD DC Rev",
    unit: "USD_billions",
    description: "AMD quarterly data center segment revenue.",
    category: "hardware",
    source: "manual",
  },
  {
    key: "gpu_lead_time_weeks",
    label: "GPU Supply Chain Lead Time (weeks)",
    shortLabel: "GPU Lead Time",
    unit: "weeks",
    description:
      "Average lead time from order to delivery for AI accelerators. Shortening implies demand cooling.",
    category: "hardware",
    source: "manual",
    threshold: {
      elevated: 16,
      critical: 8,
      burst: 4,
      direction: "below",
    },
  },

  // ── Software / Pure-Play AI ───────────────────────────────────────────────────
  {
    key: "ai_saas_arr_doubling_time",
    label: "AI SaaS ARR Doubling Time (months)",
    shortLabel: "ARR Doubling",
    unit: "months",
    description:
      "How many months for leading AI SaaS companies to double ARR. Longer = slowdown.",
    category: "software",
    source: "manual",
    threshold: {
      elevated: 12,
      critical: 18,
      burst: 24,
      direction: "above",
    },
  },
  {
    key: "ai_compute_revenue_ratio",
    label: "AI Compute-to-Revenue Ratio",
    shortLabel: "Compute/Rev",
    unit: "ratio",
    description:
      "Infrastructure spend relative to revenue for pure-play AI companies. >1 means burning compute.",
    category: "software",
    source: "manual",
    threshold: {
      elevated: 0.5,
      critical: 0.8,
      burst: 1.0,
      direction: "above",
    },
  },

  // ── Enterprise ────────────────────────────────────────────────────────────────
  {
    key: "enterprise_ai_spend_per_employee",
    label: "Enterprise AI Spend per Employee (USD)",
    shortLabel: "AI Spend/Employee",
    unit: "USD",
    description:
      "Average US enterprise AI spend per employee. 2026 baseline ~$2,068.",
    category: "enterprise",
    source: "manual",
  },
  {
    key: "enterprise_ai_roi",
    label: "Enterprise AI ROI ($ per $1 spent)",
    shortLabel: "AI ROI",
    unit: "ratio",
    description:
      "Average dollar return on generative AI investment. ~$3.70 overall, ~$1.20 for pilots.",
    category: "enterprise",
    source: "manual",
    threshold: {
      elevated: 2.0,
      critical: 1.5,
      burst: 1.0,
      direction: "below",
    },
  },
  {
    key: "enterprise_roi_hit_rate",
    label: "% AI Initiatives Meeting Expected ROI",
    shortLabel: "ROI Hit Rate",
    unit: "percent",
    description:
      "Share of enterprise AI projects meeting or exceeding expected ROI. 2025: ~25%.",
    category: "enterprise",
    source: "manual",
    threshold: {
      elevated: 40,
      critical: 25,
      burst: 15,
      direction: "below",
    },
  },

  // ── Macro / Valuation ─────────────────────────────────────────────────────────
  {
    key: "ndx_pe_ratio",
    label: "Nasdaq 100 P/E Ratio",
    shortLabel: "NDX P/E",
    unit: "ratio",
    description:
      "Nasdaq 100 price-to-earnings ratio. Detachment from earnings growth signals valuation bubble.",
    category: "macro",
    source: "manual",
    threshold: {
      elevated: 35,
      critical: 45,
      burst: 60,
      direction: "above",
    },
  },
  {
    key: "ai_vc_funding_quarterly",
    label: "AI VC Funding (Quarterly, $B)",
    shortLabel: "AI VC Funding",
    unit: "USD_billions",
    description:
      "Quarterly venture capital deployed into AI companies. Contraction signals funding quality deterioration.",
    category: "macro",
    source: "manual",
    threshold: {
      elevated: 15,
      critical: 8,
      burst: 3,
      direction: "below",
    },
  },
  {
    key: "ai_capex_pct_gdp",
    label: "AI CapEx as % of US GDP",
    shortLabel: "CapEx % GDP",
    unit: "percent",
    description:
      "AI infrastructure CapEx relative to US GDP. Systemic exposure indicator.",
    category: "macro",
    source: "manual",
    threshold: {
      elevated: 1.5,
      critical: 2.5,
      burst: 4.0,
      direction: "above",
    },
  },
];

export const METRIC_MAP = Object.fromEntries(
  METRIC_DEFINITIONS.map((m) => [m.key, m])
);

export const CATEGORIES = [
  { key: "hyperscaler", label: "Hyperscalers", emoji: "🏗️" },
  { key: "hardware", label: "Hardware & Chips", emoji: "🔲" },
  { key: "software", label: "Software & Pure-Play AI", emoji: "🤖" },
  { key: "enterprise", label: "Enterprise Buyers", emoji: "🏢" },
  { key: "macro", label: "Valuation & Macro", emoji: "📈" },
] as const;
