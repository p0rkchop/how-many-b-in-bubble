import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFilteredNews } from "@/lib/rss";

// Use vi.hoisted so the shared mock ref is available inside the hoisted vi.mock factory
const mockParseURL = vi.hoisted(() => vi.fn().mockResolvedValue({ items: [] }));

vi.mock("rss-parser", () => ({
  default: class MockParser {
    parseURL = mockParseURL;
  },
}));

beforeEach(() => {
  mockParseURL.mockReset();
  mockParseURL.mockResolvedValue({ items: [] });
});

const aiItem = (overrides = {}) => ({
  title: "OpenAI raises $10 billion in new funding round",
  link: "https://example.com/openai",
  pubDate: "Mon, 01 Jan 2026 12:00:00 GMT",
  isoDate: "2026-01-01T12:00:00.000Z",
  ...overrides,
});

const irrelevantItem = (overrides = {}) => ({
  title: "Local bakery wins best croissant award",
  link: "https://example.com/bakery",
  pubDate: "Mon, 01 Jan 2026 10:00:00 GMT",
  isoDate: "2026-01-01T10:00:00.000Z",
  ...overrides,
});

describe("getFilteredNews", () => {
  it("returns only items matching AI keywords", async () => {
    mockParseURL.mockResolvedValue({ items: [aiItem(), irrelevantItem()] });

    const news = await getFilteredNews();
    expect(news.length).toBeGreaterThan(0);
    expect(news.every((n) => n.title !== irrelevantItem().title)).toBe(true);
  });

  it("deduplicates items with the same title", async () => {
    const duplicate = aiItem();
    mockParseURL.mockResolvedValue({ items: [duplicate, duplicate] });

    const news = await getFilteredNews();
    const titles = news.map((n) => n.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("sorts results by date descending", async () => {
    mockParseURL.mockResolvedValue({
      items: [
        aiItem({ title: "Old AI news", isoDate: "2025-06-01T00:00:00.000Z" }),
        aiItem({ title: "New AI news NVIDIA", isoDate: "2026-01-15T00:00:00.000Z" }),
        aiItem({ title: "Middle AI news LLM", isoDate: "2025-12-01T00:00:00.000Z" }),
      ],
    });

    const news = await getFilteredNews();
    for (let i = 1; i < news.length; i++) {
      expect(new Date(news[i - 1].isoDate).getTime()).toBeGreaterThanOrEqual(
        new Date(news[i].isoDate).getTime()
      );
    }
  });

  it("respects the maxItems limit", async () => {
    mockParseURL.mockResolvedValue({
      items: Array.from({ length: 20 }, (_, i) =>
        aiItem({
          title: `AI bubble story ${i}`,
          link: `https://example.com/${i}`,
          isoDate: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
        })
      ),
    });

    const news = await getFilteredNews(5);
    expect(news.length).toBeLessThanOrEqual(5);
  });

  it("returns empty array when all feeds fail", async () => {
    mockParseURL.mockRejectedValue(new Error("network error"));

    const news = await getFilteredNews();
    expect(news).toEqual([]);
  });

  it("maps fields correctly onto NewsItem shape", async () => {
    const item = aiItem();
    mockParseURL.mockResolvedValue({ items: [item] });

    const news = await getFilteredNews();
    expect(news[0]).toMatchObject({
      title: item.title,
      link: item.link,
      isoDate: item.isoDate,
    });
    expect(typeof news[0].source).toBe("string");
  });

  it("handles items with missing title gracefully", async () => {
    mockParseURL.mockResolvedValue({
      items: [{ title: undefined, link: "https://example.com" }],
    });
    await expect(getFilteredNews()).resolves.toBeDefined();
  });
});
