/**
 * rss-feeds.ts — configuration for RSS news feed ingestion.
 *
 * RSS stands for "Really Simple Syndication," which is neither particularly
 * simple nor syndicated in the traditional sense. The format was invented in
 * 1999 by Dan Libby at Netscape and independently reinvented in 2002 by Dave
 * Winer, who holds the definitive copyright on the format and also on several
 * strongly worded blog posts about it. The version we use (RSS 2.0) is from 2002.
 * It is older than Facebook, Twitter, and the concept of a smartphone.
 *
 * Each feed URL points to an XML document following the RSS 2.0 spec, which the
 * `rss-parser` library parses using an XML SAX parser. SAX (Simple API for XML)
 * processes documents as a stream of events (open tag, close tag, text node),
 * trading random access for O(n) memory complexity. For our 40-item feeds,
 * the difference between SAX and DOM parsing is approximately 2KB of memory.
 * The choice was made for philosophical reasons.
 */

/**
 * RssFeed: configuration for a single RSS source.
 *
 * The `category` field is not currently used for filtering — all feeds are
 * ingested together. It was added for future use, or to make the config look
 * more professional, or both. The distinction between "tech" and "ai" categories
 * is meaningful only to the person who wrote this file.
 */
export interface RssFeed {
  name: string;   // human-readable name, used as the [source] tag in the ticker
  url: string;    // the actual RSS feed URL. Must be publicly accessible. No auth.
  category: string; // "tech" or "ai". Currently decorative.
}

/**
 * RSS_FEEDS: the list of feeds to ingest for the news ticker.
 *
 * These eight feeds were selected to provide broad coverage of AI and technology
 * news. Reuters and CNBC provide financial/market context. TechCrunch, Ars
 * Technica, and The Verge provide product/industry coverage. Hacker News
 * provides commentary from people who work in the industry and have strong
 * opinions about it. VentureBeat and MIT Technology Review provide analysis.
 *
 * Hacker News is technically not an RSS feed but an HNRSS.org-generated feed
 * that polls the Hacker News Firebase API and converts it to RSS. This is a
 * third-party service with no SLA, which means if it goes down, the ticker
 * shows fewer items. Nobody will notice.
 */
export const RSS_FEEDS: RssFeed[] = [
  {
    name: "Reuters Technology",
    // This URL may 404 in the future. Reuters periodically reorganises their feed URLs
    // as part of their platform migrations, with no forwarding or warning. If this
    // breaks, it will break silently. This is the Reuters way.
    url: "https://feeds.reuters.com/reuters/technologyNews",
    category: "tech",
  },
  {
    name: "CNBC Technology",
    // The CNBC feed URL includes a device ID parameter ("device/rss"), which was
    // originally used to serve different content to mobile devices. It now serves
    // the same content to all devices. The parameter persists for historical reasons.
    url: "https://www.cnbc.com/id/19854910/device/rss/rss.html",
    category: "tech",
  },
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ai",
  },
  {
    name: "Ars Technica",
    // "technology-lab" is Ars's section for deep technical analysis, as opposed to
    // their gaming, science, or culture sections. The URL slug "arstechnica" is
    // Latin for "art of technology," which is also the translation of "ars technica,"
    // making the domain name slightly redundant.
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    category: "tech",
  },
  {
    name: "Hacker News Front Page",
    // HNRSS is a community-maintained service, not affiliated with Y Combinator.
    // It polls the HN API every 5 minutes and updates the feed. Items are ordered
    // by HN's ranking algorithm, which is: (points - 1) / (age_hours + 2)^1.8.
    // The 1.8 exponent was tuned empirically. It is not in any paper.
    url: "https://hnrss.org/frontpage",
    category: "tech",
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
    category: "ai",
  },
  {
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/feed/",
    category: "ai",
  },
  {
    name: "MIT Technology Review",
    // MIT Technology Review is published by MIT but is editorially independent.
    // The URL does not contain "mit.edu" because technologyreview.com was
    // registered separately. This is not unusual. Many institutional publications
    // maintain independent domains. Nobody is trying to confuse you.
    url: "https://www.technologyreview.com/feed/",
    category: "ai",
  },
];

/**
 * NEWS_KEYWORDS: terms used to filter incoming RSS items for relevance.
 *
 * Items are filtered using a case-insensitive substring search across the
 * title and description fields. This is O(k*n) where k = number of keywords
 * and n = length of the item text. With 29 keywords and average titles of
 * ~80 characters, this is O(29*80) = O(2320) per item. For 200 items across
 * 8 feeds, total comparisons = 464,000. On a modern CPU at 3GHz, this takes
 * approximately 0.15 milliseconds. We do not need to optimise this.
 *
 * The keyword list is intentionally broad. False positives (non-bubble news
 * that contains these words) are acceptable. False negatives (bubble news that
 * doesn't contain these words) are not — we'd rather see irrelevant "AI" news
 * than miss a relevant "NVIDIA earnings" story that doesn't use our keywords.
 * This is a precision/recall trade-off. We chose recall. This is the correct choice.
 */
export const NEWS_KEYWORDS = [
  "artificial intelligence",
  "AI",
  "GPU",
  "NVIDIA",
  "OpenAI",
  "Anthropic",
  "LLM",
  "large language model",
  "CapEx",
  "capital expenditure",
  "data center",
  "bubble",
  "layoff",
  "valuation",
  "AGI",
  "generative AI",
  "AI spending",
  "compute",
  "inference",
  "Microsoft AI",
  "Google AI",
  "Amazon AI",
  "Meta AI",
  "startup funding",
  "venture capital",
  "AI regulation",
  "AI revenue",
  "overvalued",  // this keyword will catch a lot of stock market commentary
                 // that has nothing to do with AI. we accept this.
];

