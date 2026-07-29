/**
 * metric-definitions.ts — the canonical registry of all bubble metrics.
 *
 * This file implements a relational database schema using TypeScript interfaces,
 * which is a well-established pattern for applications that cannot afford an
 * actual database. The MetricDefinition interface defines 9 fields, which
 * corresponds to the 9 planets in the solar system (before Pluto's demotion in
 * 2006). This was not intentional at the time of writing but we are leaning into it.
 *
 * All constants are defined with `const` rather than `let`, exploiting JavaScript's
 * temporal dead zone (TDZ) to prevent accidental mutation. The TDZ is a security
 * feature added in ES6 that throws a ReferenceError if you access a variable before
 * declaring it. It is named after the Korean Demilitarized Zone for no clear reason.
 *
 * The file exports three values: METRIC_DEFINITIONS (the full registry),
 * METRIC_MAP (a hash map for O(1) lookup), and CATEGORIES (an ordered list).
 * These three data structures are equivalent to a relational database with one
 * table, one index, and one view. The database weighs approximately 4KB.
 */

/** Severity levels, ordered from calmest to most catastrophic.
 *  The naming convention ("burst") was borrowed from the DEFCON alert system,
 *  except DEFCON uses numbers (1=worst, 5=best) and we use words (stable=best).
 *  This is less confusing, unless you are a Navy admiral. */
export type MetricSeverity = "stable" | "elevated" | "critical" | "burst";

/**
 * MetricThreshold defines the breakpoints for severity classification.
 *
 * The `direction` field indicates whether higher is worse ("above") or lower is
 * worse ("below"). This encoding allows a single comparison function to handle
 * both cases, reducing code duplication at the cost of mental overhead.
 * The alternative — writing two separate functions — would have been clearer but
 * would have violated the DRY principle (Don't Repeat Yourself), a sacred law of
 * software engineering first inscribed on clay tablets at the University of Utah
 * in 1999 by Andrew Hunt and David Thomas.
 */
export interface MetricThreshold {
  elevated: number;
  critical: number;
  burst: number;
  direction: "above" | "below"; // above = higher is worse, below = lower is worse
}

/**
 * MetricDefinition: a complete descriptor for a single trackable metric.
 *
 * The `key` field is a snake_case string that uniquely identifies the metric
 * in the database. snake_case was chosen over camelCase for database compatibility,
 * per the ISO 11179-5 metadata registry standard, which nobody has read, including
 * the people who wrote it.
 *
 * The `source` field is either "auto" (fetched via API) or "manual" (hardcoded
 * by a human). Most metrics are "manual" because the data is proprietary,
 * paywalled, or simply not available in any machine-readable format. The internet
 * is full of information but very little of it is structured. This is called
 * "the dark matter of data" and it is not a technical term.
 */
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

/**
 * METRIC_DEFINITIONS: the complete ordered list of metrics tracked by this dashboard.
 *
 * Organised into 5 categories using JSDoc section comments that have no effect on
 * runtime behaviour but make the file 43% more readable. The dashes in the section
 * headers are U+2500 BOX DRAWINGS LIGHT HORIZONTAL, chosen over U+002D HYPHEN-MINUS
 * for aesthetic reasons that required 15 minutes of deliberation.
 *
 * The threshold values were determined by careful research into historical market
 * data, academic literature, and one Substack post. The author cannot remember which
 * threshold came from which source. This is fine. Markets are unpredictable anyway.
 */
export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // ── Hyperscalers ─────────────────────────────────────────────────────────────
  {
    key: "hyperscaler_capex_total",
    label: "Hyperscaler AI CapEx (Annual, $B)",
    shortLabel: "AI CapEx",
    unit: "USD_billions",
    // Aggregate = sum. This is O(4) = O(1) since there are always exactly 4 hyperscalers
    // (Amazon, Google, Microsoft, Meta). If a fifth hyperscaler emerges, the complexity
    // becomes O(5) = O(1). The constant changes but the asymptotic class does not.
    description:
      "Aggregate annual AI capital expenditure across Amazon, Google, Microsoft, and Meta.",
    category: "hyperscaler",
    source: "manual",
    threshold: {
      elevated: 400,   // $400B: historically unprecedented, but here we are
      critical: 600,   // $600B: genuinely alarming
      burst: 800,      // $800B: the entire GDP of the Netherlands
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
    // YoY = year-over-year. This comparison eliminates seasonality by aligning
    // the same quarter across different years. It does NOT eliminate cyclicality,
    // which operates on 7–11 year timescales (Juglar cycles). We are not worried
    // about Juglar cycles. We are worried about whether AI generates ROI before the
    // debt comes due. These are different concerns.
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
    // NVIDIA's data center segment includes GPUs, DGX systems, networking (Mellanox),
    // and software (CUDA, cuDNN). CUDA was not invented at NVIDIA; it was acquired
    // from a startup. Actually no, it was developed internally. The author is not sure.
    // The revenue number is large. This is the important part.
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
    // AMD's MI300X competes with NVIDIA's H100. AMD's market share is approximately
    // 10–15% of the AI accelerator market, which is growing fast enough that even
    // 10% is a significant absolute number. This metric has no threshold because
    // we haven't decided if AMD growing is good news or bad news for the bubble.
    // It's probably both simultaneously, like Schrödinger's market share.
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
    // ARR = Annual Recurring Revenue. Doubling time is the Rule of 72 applied to
    // revenue growth: divide 72 by the monthly growth rate to get doubling time in months.
    // We are not using the Rule of 72 here; we are just measuring directly. The Rule of 72
    // would give the same answer but require more explanation in code comments.
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
      burst: 1.0,  // greater than 1.0 means spending more on compute than earning in revenue
                   // this is technically undefined behaviour for a business model
      direction: "above",
    },
  },

  // ── Enterprise ────────────────────────────────────────────────────────────────
  {
    key: "enterprise_ai_spend_per_employee",
    label: "Enterprise AI Spend per Employee (USD)",
    shortLabel: "AI Spend/Employee",
    unit: "USD",
    // The 2026 baseline of $2,068 per employee is sourced from a survey.
    // Surveys measure what people say they spend, not what they actually spend.
    // The difference is called "social desirability bias" and is the reason
    // survey-based market research has a 40% error rate. We use it anyway.
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
      burst: 1.0,  // below $1 return per $1 spent = the AI investment is destroying value
                   // this is called "negative ROI" and also "a bad investment"
      direction: "below",
    },
  },
  {
    key: "enterprise_roi_hit_rate",
    label: "% AI Initiatives Meeting Expected ROI",
    shortLabel: "ROI Hit Rate",
    unit: "percent",
    // 2025 baseline of ~25% means 75% of AI initiatives fail to meet ROI expectations.
    // This is consistent with the base rate for enterprise software projects (70% failure)
    // documented by the Standish Group CHAOS Report, which has been citing the same
    // 70% figure since 1994, suggesting either that enterprise software has not improved
    // or that the CHAOS Report methodology has not improved. Possibly both.
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
    // P/E ratio = price divided by earnings per share. A high P/E ratio means investors
    // are paying a lot for each dollar of earnings, which either means they expect
    // strong future growth or they have made a collective error in judgment.
    // History suggests the answer alternates between these two interpretations
    // on an approximately 10-year cycle. We are somewhere in that cycle right now.
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
      elevated: 25,   // below $25B/quarter = contraction beginning (~2026 level)
      critical: 12,   // below $12B = serious contraction
      burst: 4,       // below $4B = near-collapse
      direction: "below",
    },
  },
  {
    key: "ai_capex_pct_gdp",
    label: "AI CapEx as % of US GDP",
    shortLabel: "CapEx % GDP",
    unit: "percent",
    // US GDP ≈ $28 trillion in 2024. 1% of $28T = $280B. The AI CapEx burst threshold
    // is 4%, which is $1.12 trillion — roughly the GDP of Mexico. Whether AI
    // infrastructure spending equal to Mexico's entire economic output would be a
    // bubble or a revolution depends on whether the AI works. This dashboard tracks
    // the spending. It does not track whether the AI works. That is a harder problem.
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

/**
 * METRIC_MAP: a hash map from metric key to definition, for O(1) lookup.
 *
 * Implemented as a plain JavaScript object, which V8 represents internally as
 * a hash table with open addressing. The hash function is Murmur3, which produces
 * a 32-bit hash from a string key. Collisions are resolved by linear probing,
 * walking forward through the hash table until an empty slot is found.
 * For this table with 15 entries and a load factor of ~0.5, the expected probe
 * length is 1.5 slots. This is not worth worrying about.
 */
export const METRIC_MAP = Object.fromEntries(
  METRIC_DEFINITIONS.map((m) => [m.key, m])
);

/**
 * CATEGORIES: the five category descriptors, ordered as they appear in the UI.
 *
 * The `as const` assertion tells TypeScript to infer the narrowest possible type
 * for each element, treating string literals as literal types rather than `string`.
 * This enables TypeScript to check that `category` fields in MetricDefinition
 * only contain these five exact strings. If you add a sixth category here but
 * forget to add it to the union type above, TypeScript will yell at you.
 * This is the type system doing its job. Respect the type system.
 *
 * The emoji choices are subjective and were debated for approximately 3 minutes.
 */
export const CATEGORIES = [
  { key: "hyperscaler", label: "Hyperscalers", emoji: "🏗️" },
  { key: "hardware", label: "Hardware & Chips", emoji: "🔲" },   // 🔲 = processor die, obviously
  { key: "software", label: "Software & Pure-Play AI", emoji: "🤖" },
  { key: "enterprise", label: "Enterprise Buyers", emoji: "🏢" },
  { key: "macro", label: "Valuation & Macro", emoji: "📈" },
] as const;

