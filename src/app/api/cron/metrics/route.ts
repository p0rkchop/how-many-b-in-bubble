import { db } from "@/lib/db";
import { manualMetrics, metricSnapshots } from "@/lib/schema";
import { getManualMetrics } from "@/lib/metrics/manual";
import { fetchAutoMetrics } from "@/lib/metrics/fetchers";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow in dev if not set
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const stored: string[] = [];

  try {
    // 1. Ingest manual metrics
    const manuals = getManualMetrics();
    for (const m of manuals) {
      await db
        .insert(manualMetrics)
        .values({
          metricKey: m.metric_key,
          value: m.value,
          label: m.label,
          unit: m.unit,
          updatedAt: m.updated_at,
        })
        .onConflictDoUpdate({
          target: manualMetrics.metricKey,
          set: {
            value: m.value,
            label: m.label,
            unit: m.unit,
            updatedAt: m.updated_at,
          },
        });

      await db.insert(metricSnapshots).values({
        metricKey: m.metric_key,
        value: m.value,
        unit: m.unit,
        source: "manual",
        capturedAt: now,
      });

      stored.push(m.metric_key);
    }

    // 2. Ingest auto-fetched metrics (overrides manual if available)
    const autoMetrics = await fetchAutoMetrics();
    for (const m of autoMetrics) {
      await db
        .insert(manualMetrics)
        .values({
          metricKey: m.metric_key,
          value: m.value,
          label: m.metric_key,
          unit: m.unit,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: manualMetrics.metricKey,
          set: { value: m.value, updatedAt: now },
        });

      await db.insert(metricSnapshots).values({
        metricKey: m.metric_key,
        value: m.value,
        unit: m.unit,
        source: m.source,
        capturedAt: now,
      });

      stored.push(`${m.metric_key} (auto)`);
    }

    return NextResponse.json({ ok: true, stored, timestamp: now });
  } catch (err) {
    console.error("[cron/metrics] error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
