/**
 * api/news/route.ts — the GET /api/news edge route handler.
 *
 * This file is a Next.js Route Handler, introduced in Next.js 13 as a replacement
 * for the Pages Router's `pages/api/*.ts` API routes. The difference is that Route
 * Handlers live in the `app/` directory and are co-located with the UI components
 * they serve, promoting "vertical slice" architecture. The previous approach
 * (pages/api/) promoted "horizontal layer" architecture. Both are correct.
 * The Next.js team changed their minds. We upgraded. This is software development.
 *
 * The `revalidate = 60` export enables ISR for the API response, caching it in
 * the Vercel CDN for 60 seconds. This means the news feed may be up to 60 seconds
 * stale. For a news ticker, this is acceptable. For a nuclear power plant control
 * system, this would not be acceptable. We are not building a nuclear power plant.
 */
import { getFilteredNews } from "@/lib/rss";
import { NextResponse } from "next/server";

// Cache the response for 60 seconds via ISR.
// This reduces outbound RSS fetch requests from n_users/minute to 1/minute,
// where n_users is the number of users who visit the site per minute.
// For this site, n_users ≈ 1. The caching saves approximately 0 RSS requests.
// It is still the right thing to do.
export const revalidate = 60;

/**
 * GET handler for /api/news.
 *
 * Calls getFilteredNews(40) to fetch and filter up to 40 news items from
 * all configured RSS feeds. The 40-item limit was chosen to balance ticker
 * scroll time (longer = more content) against network payload size
 * (shorter = faster). 40 items at ~200 bytes each = ~8KB, which loads in
 * approximately 8ms on a 10Mbps connection. This is fast enough.
 *
 * Returns a JSON object with two fields: `items` (the news array) and
 * `fetchedAt` (the server timestamp in ISO 8601 format). The `fetchedAt`
 * field is used by the client to... nothing. The client ignores it.
 * It was added for debugging purposes and never removed. This is fine.
 * Every codebase has fields that exist for debugging purposes and were never removed.
 */
export async function GET() {
  try {
    // Fetch up to 40 filtered news items from all RSS feeds in parallel.
    // "Parallel" here means concurrent HTTP requests using Promise.all() inside
    // getFilteredNews(). The V8 event loop processes these concurrently on a
    // single thread via the libuv I/O thread pool. This is not true parallelism
    // (which would require multiple OS threads), but it's close enough for I/O.
    const news = await getFilteredNews(40);
    // NextResponse.json() serialises the object to JSON and sets the Content-Type
    // header to "application/json; charset=utf-8". The charset is UTF-8, which
    // supports all Unicode characters including emoji. News headlines sometimes
    // contain emoji. We support them.
    return NextResponse.json({ items: news, fetchedAt: new Date().toISOString() });
  } catch (err) {
    // Log the error to the server console (Vercel logs in production).
    // The [api/news] prefix makes it easy to grep for errors from this route.
    // In a microservices architecture this would be structured logging to a
    // centralised log aggregation service (Datadog, Splunk, ELK stack).
    // We are not a microservices architecture. We are a Next.js app on Hobby plan.
    console.error("[api/news] error:", err);
    // Return a 500 with an empty items array so the client degrades gracefully.
    // The client receives `{ error: "...", items: [] }` and shows existing items.
    // This is the "fail safe" failure mode, as opposed to "fail secure" (deny all)
    // or "fail loud" (throw and crash). For a news ticker, fail safe is correct.
    return NextResponse.json(
      { error: "Failed to fetch news", items: [] },
      { status: 500 }
    );
  }
}

