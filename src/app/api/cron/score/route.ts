import { db } from "@/lib/db";
import { bubbleScoreSnapshots, manualMetrics } from "@/lib/schema";
import { computeBubbleScore } from "@/lib/score";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Load all current manual metric values
    const rows = await db.select().from(manualMetrics);
    const metricsMap: Record<string, number> = {};
    for (const row of rows) {
      metricsMap[row.metricKey] = row.value;
    }

    const result = computeBubbleScore(metricsMap);

    await db.insert(bubbleScoreSnapshots).values({
      score: result.score,
      level: result.level,
      componentScores: JSON.stringify(result.components),
      computedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      score: result.score,
      level: result.level,
      components: result.components,
    });
  } catch (err) {
    console.error("[cron/score] error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
