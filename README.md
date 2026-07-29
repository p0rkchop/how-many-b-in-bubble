# how-many-b-in-bubble

> A public dashboard tracking the structural health of the AI industry. One day it'll say it burst.

**Live at**: [the-ai-bubble-index.vercel.app](https://the-ai-bubble-index.vercel.app)

---

## What It Is

`how-many-b-in-bubble` monitors key indicators of the AI industry's speculative cycle:

- **Bubble Burst Score** — a 0–100 composite index (stable → elevated → critical → burst)
- **Key Metrics** — 23 tracked metrics across hyperscalers, hardware, infrastructure, enterprise, and valuation
- **Live News Ticker** — RSS-powered, keyword-filtered headlines from Reuters, TechCrunch, CNBC, and others

## Quick Start

```bash
cp .env.local.example .env.local
# fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, CRON_SECRET

npm run dev
```

## Database Setup (Turso)

1. [Create a Turso database](https://turso.tech)
2. Copy credentials to `.env.local`
3. Generate and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

## Updating Metrics

Edit `src/config/manual-metrics.json` to update manually maintained metric values.
The next cron run will persist changes to Turso. Include source citations in your commit message.

## Deployment (Vercel)

1. Push to GitHub, create a release — CI deploys automatically on `release: published`
2. Set environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CRON_SECRET`
3. Cron jobs (`vercel.json`) will run every 6 hours automatically

## Tech Stack

Next.js 16 · React 19 · Tailwind CSS v4 · Turso · Drizzle ORM · Vercel Crons · Recharts · Vitest

---

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the full technical specification.
