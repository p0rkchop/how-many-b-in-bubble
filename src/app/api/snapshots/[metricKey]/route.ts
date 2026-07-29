import { db } from "@/lib/db";
import { metricSnapshots } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 300; // cache 5 minutes

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ metricKey: string }> }
) {
  const { metricKey } = await params;
  try {
    const rows = await db
      .select({
        value: metricSnapshots.value,
        capturedAt: metricSnapshots.capturedAt,
        unit: metricSnapshots.unit,
      })
      .from(metricSnapshots)
      .where(eq(metricSnapshots.metricKey, metricKey))
      .orderBy(desc(metricSnapshots.capturedAt))
      .limit(90); // ~90 data points = ~3 months of 6-hourly cron runs

    // Return oldest-first for the chart x-axis
    return NextResponse.json({ metricKey, snapshots: rows.reverse() });
  } catch (err) {
    console.error(`[api/snapshots/${metricKey}] error:`, err);
    return NextResponse.json(
      { error: "Failed to load snapshots", snapshots: [] },
      { status: 500 }
    );
  }
}
