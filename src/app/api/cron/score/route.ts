/**
 * api/cron/score/route.ts — the GET /api/cron/score cron job handler.
 *
 * This handler computes the Bubble Burst Score from the current metric values
 * stored in the database and persists a point-in-time snapshot. It is invoked
 * by Vercel's cron system after the metrics cron job completes — ideally.
 * In practice, Vercel runs cron jobs at their scheduled times regardless of
 * whether dependent jobs have completed. If the metrics job is slow and the
 * score job runs first, the score is computed from stale data. This is called
 * a "race condition" in distributed systems and a "scheduling problem" in
 * operations research, which solved it in 1956 using the Critical Path Method.
 * We have not implemented the Critical Path Method. We have a cron schedule.
 *
 * Authentication uses the same shared-secret scheme as the metrics route.
 * See that file for the security analysis. The conclusion was: it's fine.
 */
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
