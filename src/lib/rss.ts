import Parser from "rss-parser";
import { NEWS_KEYWORDS, RSS_FEEDS } from "@/config/rss-feeds";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  isoDate: string;
}

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "how-many-b-in-bubble/1.0 (RSS aggregator)",
  },
});

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return NEWS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

async function fetchFeed(feedUrl: string, feedName: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return (feed.items || [])
      .filter((item) => item.title && isRelevant(item.title))
      .map((item) => ({
        title: item.title?.trim() ?? "",
        link: item.link ?? feedUrl,
        source: feedName,
        pubDate: item.pubDate ?? "",
        isoDate: item.isoDate ?? new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

export async function getFilteredNews(maxItems = 40): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchFeed(f.url, f.name))
  );

  const allItems: NewsItem[] = results
    .filter(
      (r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled"
    )
    .flatMap((r) => r.value);

  // Deduplicate by title similarity (exact match on trimmed lowercase)
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    const key = item.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date descending
  unique.sort(
    (a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime()
  );

  return unique.slice(0, maxItems);
}
