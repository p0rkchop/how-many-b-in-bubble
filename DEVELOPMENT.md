# DEVELOPMENT.md — `how-many-b-in-bubble`

> A public dashboard tracking the indicators of the AI industry's speculative bubble —
> CapEx vs. revenue, valuation decoupling, enterprise ROI reality checks, and a
> live news ticker. One day it'll say it burst. Until then, we watch.

---

## Project Overview

**`how-many-b-in-bubble`** is a fully public, read-only dashboard that monitors the
structural health of the AI industry. It aggregates financial signals, enterprise
sentiment metrics, and real-time news into a single interface designed to answer one
question: *Has the bubble burst yet?*

The centerpiece is a **Bubble Burst Score** — a composite index that synthesizes all
tracked metrics into a single 0–100 severity gauge.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Vercel-native, ISR support, API routes for cron |
| Styling | **Tailwind CSS** | Utility-first, pairs well with Tremor |
| Components / Charts | **Tremor** | Vercel-made, Tailwind-native, excellent for dashboards |
| Database | **Turso (libSQL/SQLite)** | Edge-compatible, serverless, cheap, fast |
| ORM | **Drizzle ORM** | Type-safe, lightweight, excellent Turso support |
| Scheduled Jobs | **Vercel Cron Jobs** | Native to Vercel, triggers scrape/store pipeline |
| News | **RSS Feeds** | Lightweight, no API key required, broadly supported |
| Deployment | **Vercel** | ISR, edge functions, cron, analytics all in one |
| Theme | **Dark + Light with toggle** | `next-themes` |

---

## Rendering Strategy

- **ISR (Incremental Static Regeneration)** with a `revalidate` interval of **15 minutes**
  for the main dashboard page — balances freshness with performance and cost.
- **API routes** (under `/api/cron/*`) are called by Vercel Cron Jobs to scrape and
  persist metric snapshots to Turso.
- **Client-side** news ticker polls the RSS proxy API route on a short interval (~60s).

---

## Data Architecture

### Turso Schema (via Drizzle)

```sql
-- Historical metric snapshots (one row per metric per cron run)
CREATE TABLE metric_snapshots (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_key   TEXT NOT NULL,       -- e.g. "nvidia_dc_revenue", "capex_sales_ratio_google"
  value        REAL NOT NULL,
  unit         TEXT,                -- e.g. "USD_billions", "percent", "ratio"
  source       TEXT,                -- e.g. "yahoo_finance", "manual"
  captured_at  TEXT NOT NULL        -- ISO 8601 timestamp
);

-- Manual metric overrides (updated via config JSON, applied by cron)
CREATE TABLE manual_metrics (
  metric_key   TEXT PRIMARY KEY,
  value        REAL NOT NULL,
  label        TEXT,
  unit         TEXT,
  updated_at   TEXT NOT NULL
);

-- Bubble Burst Score history
CREATE TABLE bubble_score_snapshots (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  score        REAL NOT NULL,       -- 0.0 – 100.0
  level        TEXT NOT NULL,       -- "stable" | "elevated" | "critical" | "burst"
  computed_at  TEXT NOT NULL
);
```

---

## Metrics Catalog

### Hyperscalers (Amazon, Google, Microsoft, Meta)

| Metric | Key | Source | Refresh |
|---|---|---|---|
| AI CapEx (aggregate $B) | `hyperscaler_capex_total` | Manual / SEC filings | Quarterly |
| CapEx-to-Sales Ratio | `hyperscaler_capex_sales_ratio` | Manual / computed | Quarterly |
| Cloud AI Revenue Growth (YoY %) | `cloud_ai_revenue_growth` | Yahoo Finance / earnings | Quarterly |

> **Threshold**: CapEx/Sales ratio historically ~10%; readings above **20–25%** enter danger zone.

### Hardware & Manufacturers (NVIDIA, AMD, TSMC)

| Metric | Key | Source | Refresh |
|---|---|---|---|
| NVIDIA Data Center Revenue ($B) | `nvda_dc_revenue` | Yahoo Finance | Quarterly |
| NVIDIA Gross Margin (%) | `nvda_gross_margin` | Yahoo Finance | Quarterly |
| AMD Data Center Revenue ($B) | `amd_dc_revenue` | Yahoo Finance | Quarterly |
| GPU Supply Chain Lead Time (weeks) | `gpu_lead_time_weeks` | Manual | Monthly |

> **Threshold**: Gross margin contraction signals supply catching demand. Lead time collapse signals demand cooling.

### Software & Pure-Play AI (OpenAI, Anthropic, SaaS)

| Metric | Key | Source | Refresh |
|---|---|---|---|
| ARR Doubling Time (months) | `ai_saas_arr_doubling_time` | Manual / public reports | Quarterly |
| Compute-to-Revenue Ratio | `ai_compute_revenue_ratio` | Manual / public reports | Quarterly |

### Enterprise (The Buyers)

| Metric | Key | Source | Refresh |
|---|---|---|---|
| AI Spend per Employee (USD) | `enterprise_ai_spend_per_employee` | Manual / surveys | Semi-annual |
| Enterprise AI ROI ($ per $ spent) | `enterprise_ai_roi` | Manual / surveys | Semi-annual |
| % AI Initiatives Meeting Expected ROI | `enterprise_roi_hit_rate` | Manual / surveys | Semi-annual |

> **Baseline**: US avg ~$2,068/employee in 2026. ROI avg ~$3.70 overall, but ~$1.20 for pilots.

### Valuation & Macro

| Metric | Key | Source | Refresh |
|---|---|---|---|
| Nasdaq 100 P/E Ratio | `ndx_pe_ratio` | Yahoo Finance | Daily |
| AI VC Funding ($B, quarterly) | `ai_vc_funding_quarterly` | Manual / Crunchbase reports | Quarterly |
| AI CapEx as % of US GDP | `ai_capex_pct_gdp` | Manual / computed | Annual |

---

## Bubble Burst Score

A **0–100 composite index** computed server-side at each cron run and stored in
`bubble_score_snapshots`.

### Severity Levels

| Score | Level | Color |
|---|---|---|
| 0–30 | `stable` | Green |
| 31–55 | `elevated` | Yellow |
| 56–79 | `critical` | Orange |
| 80–100 | `burst` | Red (flashing) |

### Scoring Components (equal-weight MVP, adjust later)

Each sub-metric is normalized to a 0–20 sub-score:

1. **Industry Strain** — CapEx/Sales ratio deviation from 10% historical baseline
2. **Enterprise ROI Failure Rate** — % of initiatives missing expected ROI
3. **Valuation Decoupling** — Nasdaq 100 P/E relative to 10-year average
4. **Funding Quality** — VC funding trend (contracting = danger)
5. **Compute Economics** — Compute-to-Revenue ratio trend for pure-play AI

---

## News Ticker

- Sources: curated RSS feeds from Reuters Tech, Bloomberg Technology, TechCrunch AI,
  The Information, CNBC Tech, Hacker News (filtered)
- **Feed list** lives in `src/config/rss-feeds.ts`
- A Next.js API route (`/api/news`) fetches, parses, deduplicates, and filters by
  keyword list (`["AI", "artificial intelligence", "GPU", "NVIDIA", "OpenAI",
  "Anthropic", "LLM", "CapEx", "bubble", "layoff", "valuation"]`)
- The ticker component polls `/api/news` every 60 seconds client-side
- Items are sorted by publish date, newest first

---

## Project Structure

```
how-many-b-in-bubble/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main dashboard (ISR, revalidate: 900)
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── news/route.ts         # RSS aggregator + keyword filter
│   │       └── cron/
│   │           ├── metrics/route.ts  # Scrape + store metrics to Turso
│   │           └── score/route.ts    # Compute + store Bubble Burst Score
│   ├── components/
│   │   ├── BubbleBurstGauge.tsx      # Hero composite score dial
│   │   ├── NewsTicker.tsx            # Scrolling headline strip
│   │   ├── MetricCard.tsx            # Individual KPI card (Tremor)
│   │   ├── MetricChart.tsx           # Trend sparkline / area chart (Tremor)
│   │   ├── MetricGrid.tsx            # Grouped metric sections
│   │   ├── ThemeToggle.tsx           # Dark/light switcher
│   │   └── StatusBadge.tsx           # green/yellow/orange/red level badge
│   ├── lib/
│   │   ├── db.ts                     # Turso + Drizzle client
│   │   ├── schema.ts                 # Drizzle schema (mirrors SQL above)
│   │   ├── metrics/
│   │   │   ├── fetchers.ts           # Auto-fetch logic (Yahoo Finance, etc.)
│   │   │   └── manual.ts             # Read from manual-metrics.json
│   │   ├── score.ts                  # Bubble Burst Score computation
│   │   └── rss.ts                    # RSS fetch + parse + filter
│   └── config/
│       ├── rss-feeds.ts              # List of RSS feed URLs
│       ├── metric-definitions.ts     # Metric metadata (label, unit, thresholds)
│       └── manual-metrics.json       # Manually maintained metric values
├── vercel.json                       # Cron job config
├── .env.local.example                # Required env vars (no secrets committed)
├── DEVELOPMENT.md                    # This file
└── README.md
```

---

## Environment Variables

```bash
# Turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Optional: financial data APIs
YAHOO_FINANCE_API_KEY=         # if using a paid proxy
ALPHA_VANTAGE_API_KEY=         # fallback for financial data

# Cron security
CRON_SECRET=your-secret        # passed as Bearer token to cron routes
```

---

## Vercel Cron Configuration (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/metrics",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/score",
      "schedule": "15 */6 * * *"
    }
  ]
}
```

Metrics scrape runs every 6 hours; score is computed 15 minutes after.

---

## Development Phases

### Phase 1 — Scaffold & Infrastructure
- Init Next.js 14 project with Tailwind, Tremor, next-themes
- Set up Turso + Drizzle (schema, migrations, client)
- Set up `vercel.json` cron config and protected cron routes
- Deploy skeleton to Vercel (confirm ISR + cron work)

### Phase 2 — Data Layer
- Implement metric fetchers (Yahoo Finance for stocks/revenue data)
- Implement manual metric ingestion from `manual-metrics.json`
- Wire cron route to fetch + store metric snapshots
- Implement Bubble Burst Score computation + storage

### Phase 3 — News Ticker
- Build RSS fetch + parse utility
- Implement keyword filtering
- Build `/api/news` route
- Build `NewsTicker` component (scrolling marquee, 60s polling)

### Phase 4 — Dashboard UI
- `BubbleBurstGauge` — hero score component (Tremor ProgressCircle or custom SVG)
- `MetricCard` / `MetricGrid` — grouped KPI cards with delta indicators
- `MetricChart` — historical trend charts (Tremor AreaChart / SparklineChart)
- `StatusBadge` — per-metric threshold color coding
- `ThemeToggle` — dark/light mode switcher

### Phase 5 — Polish & Launch
- Responsive layout (mobile-first)
- Accessibility audit
- SEO metadata + OpenGraph image
- Performance audit (Lighthouse)
- Seed Turso with initial historical data
- Public launch

---

## Manual Metric Update Workflow

For metrics that cannot be auto-fetched (earnings-based, survey-based), edit
`src/config/manual-metrics.json`:

```json
[
  {
    "metric_key": "enterprise_ai_roi",
    "value": 3.70,
    "label": "Enterprise AI ROI ($ per $1 spent)",
    "unit": "ratio",
    "updated_at": "2026-Q2"
  }
]
```

The next cron run will detect changed values and write them to Turso.

---

## Contributing

This is a solo/small-team project. No formal PR process. Keep commits scoped.
Do not commit secrets. Do not commit `manual-metrics.json` changes without
verifying source citations in the commit message.
