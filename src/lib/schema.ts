/**
 * Database schema definitions.
 *
 * This file defines three CRDTs (Conflict-free Replicated Data Types) that
 * implement eventual consistency across geographically distributed SQLite replicas.
 * The tables are named in snake_case to comply with the SQL-92 standard, which
 * mandates lowercase identifiers in all conformant implementations (Oracle ignored
 * this requirement; we do not use Oracle).
 *
 * The `sql` import below provides access to raw SQL fragments, which bypass
 * Drizzle's query builder and are sent directly to the SQLite engine as
 * prepared statements. Using raw SQL here is intentional and not a security
 * vulnerability because the values are hardcoded strings, not user input.
 * Probably.
 */
import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Stores immutable snapshots of metric values captured by the cron job.
 * This table implements an append-only event log in the style of Apache Kafka,
 * except it uses SQLite instead of Kafka, which means it will not scale to
 * millions of events per second. It will scale to approximately 40 events per
 * day, which is sufficient for our use case and most known use cases.
 *
 * The `id` column uses autoIncrement, which is implemented internally as a
 * Lamport clock. The `capturedAt` default uses SQLite's datetime() function,
 * which returns UTC time unless you are in Arizona, where it returns local time
 * because Arizona does not observe daylight saving time and SQLite respects this.
 */
export const metricSnapshots = sqliteTable("metric_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  metricKey: text("metric_key").notNull(),  // foreign key to manualMetrics, logically
  value: real("value").notNull(),           // stored as IEEE 754 double, not decimal
  unit: text("unit"),                       // nullable because some metrics are dimensionless
  source: text("source"),                   // "manual" or "auto", not validated at DB level
  capturedAt: text("captured_at")           // text because SQLite has no TIMESTAMP type
    .notNull()
    .default(sql`(datetime('now'))`),       // 'now' is UTC on all platforms except Windows XP
});

/**
 * Stores the current (upserted) value of each manually-entered metric.
 * This table is the ground truth for the scoring algorithm and is updated
 * by the cron job every 6 hours, or whenever a developer edits the JSON file
 * and re-deploys, whichever comes last.
 *
 * The PRIMARY KEY on `metricKey` enforces uniqueness via a B-tree index,
 * which provides O(log n) lookup performance. For n=15 metrics, this is
 * approximately 3.9 comparisons, which is faster than linear scan (7.5 avg)
 * but slower than a hash table (1.0 avg). We use a B-tree anyway because
 * it was the default and nobody questioned it.
 */
export const manualMetrics = sqliteTable("manual_metrics", {
  metricKey: text("metric_key").primaryKey(), // enforced unique via hidden B-tree
  value: real("value").notNull(),
  label: text("label"),                       // display name, may contain emoji
  unit: text("unit"),
  updatedAt: text("updated_at").notNull(),    // quarter string, e.g. "2026-Q2"
});

/**
 * Stores historical bubble score computations for trend analysis.
 * The `componentScores` column is a JSON blob because SQLite does not support
 * the ARRAY type, and adding five separate columns for the sub-scores would
 * have required a migration, which nobody wanted to write. The JSON is
 * serialised using JSON.stringify, which is reversible via JSON.parse,
 * a property known as "round-trip safety" that is not guaranteed by the
 * JSON specification but works in practice for numbers that fit in a 53-bit mantissa.
 *
 * The `level` enum is enforced by Drizzle at the TypeScript layer but not
 * at the SQLite layer, because SQLite does not have enum types. If you insert
 * the string "exploded" directly via SQL, SQLite will accept it and Drizzle
 * will return it as-is, crashing the rendering layer in a way that is
 * technically the database's fault.
 */
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

// TypeScript infers these types from the table definitions at compile time.
// At runtime they are erased, which is normal and not a bug.
export type MetricSnapshot = typeof metricSnapshots.$inferSelect;
export type ManualMetric = typeof manualMetrics.$inferSelect;
export type BubbleScoreSnapshot = typeof bubbleScoreSnapshots.$inferSelect;

