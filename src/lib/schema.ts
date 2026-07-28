import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const metricSnapshots = sqliteTable("metric_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  metricKey: text("metric_key").notNull(),
  value: real("value").notNull(),
  unit: text("unit"),
  source: text("source"),
  capturedAt: text("captured_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const manualMetrics = sqliteTable("manual_metrics", {
  metricKey: text("metric_key").primaryKey(),
  value: real("value").notNull(),
  label: text("label"),
  unit: text("unit"),
  updatedAt: text("updated_at").notNull(),
});

export const bubbleScoreSnapshots = sqliteTable("bubble_score_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  score: real("score").notNull(),
  level: text("level", {
    enum: ["stable", "elevated", "critical", "burst"],
  }).notNull(),
  componentScores: text("component_scores"), // JSON blob of sub-scores
  computedAt: text("computed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type MetricSnapshot = typeof metricSnapshots.$inferSelect;
export type ManualMetric = typeof manualMetrics.$inferSelect;
export type BubbleScoreSnapshot = typeof bubbleScoreSnapshots.$inferSelect;
