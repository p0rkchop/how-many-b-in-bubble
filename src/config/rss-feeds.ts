export interface RssFeed {
  name: string;
  url: string;
  category: string;
}

export const RSS_FEEDS: RssFeed[] = [
  {
    name: "Reuters Technology",
    url: "https://feeds.reuters.com/reuters/technologyNews",
    category: "tech",
  },
  {
    name: "CNBC Technology",
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
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    category: "tech",
  },
  {
    name: "Hacker News Front Page",
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
    url: "https://www.technologyreview.com/feed/",
    category: "ai",
  },
];

/** Keywords used to filter news items as relevant to the AI bubble narrative */
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
  "overvalued",
];
