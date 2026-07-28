import { getFilteredNews } from "@/lib/rss";
import { NextResponse } from "next/server";

export const revalidate = 60; // cache 60 seconds

export async function GET() {
  try {
    const news = await getFilteredNews(40);
    return NextResponse.json({ items: news, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[api/news] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch news", items: [] },
      { status: 500 }
    );
  }
}
