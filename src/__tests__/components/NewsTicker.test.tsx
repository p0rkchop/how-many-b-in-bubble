import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NewsTicker } from "@/components/NewsTicker";
import type { NewsItem } from "@/lib/rss";

const mockItems: NewsItem[] = [
  {
    title: "OpenAI raises $10 billion",
    link: "https://example.com/1",
    source: "TechCrunch",
    pubDate: "Mon, 01 Jan 2026 12:00:00 GMT",
    isoDate: "2026-01-01T12:00:00.000Z",
  },
  {
    title: "NVIDIA smashes revenue records",
    link: "https://example.com/2",
    source: "Reuters",
    pubDate: "Tue, 02 Jan 2026 12:00:00 GMT",
    isoDate: "2026-01-02T12:00:00.000Z",
  },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("NewsTicker", () => {
  it("shows 'Loading news...' when no initial items and fetch is pending", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves
    await act(async () => {
      render(<NewsTicker />);
    });
    expect(screen.getByText("Loading news...")).toBeInTheDocument();
  });

  it("renders initial items immediately without waiting for fetch", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    await act(async () => {
      render(<NewsTicker initialItems={mockItems} />);
    });
    // Items are duplicated in the ticker for seamless scroll loop
    expect(screen.getAllByText("OpenAI raises $10 billion").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NVIDIA smashes revenue records").length).toBeGreaterThan(0);
  });

  it("renders the 📡 Live label", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    await act(async () => {
      render(<NewsTicker initialItems={mockItems} />);
    });
    expect(screen.getByText("📡 Live")).toBeInTheDocument();
  });

  it("updates items after fetch resolves", async () => {
    const updated: NewsItem[] = [
      {
        title: "Breaking: AI bubble bursts",
        link: "https://example.com/3",
        source: "Reuters",
        pubDate: "Wed, 03 Jan 2026 12:00:00 GMT",
        isoDate: "2026-01-03T12:00:00.000Z",
      },
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: updated }),
    } as Response);

    await act(async () => {
      render(<NewsTicker />);
      await Promise.resolve(); // flush microtasks
    });

    expect(screen.getAllByText("Breaking: AI bubble bursts").length).toBeGreaterThan(0);
  });

  it("keeps existing items when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    await act(async () => {
      render(<NewsTicker initialItems={mockItems} />);
      await Promise.resolve();
    });
    expect(screen.getAllByText("OpenAI raises $10 billion").length).toBeGreaterThan(0);
  });

  it("renders news item links with correct href", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    await act(async () => {
      render(<NewsTicker initialItems={mockItems} />);
    });
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("https://example.com/1");
  });

  it("renders source labels", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    await act(async () => {
      render(<NewsTicker initialItems={mockItems} />);
    });
    // Sources appear in brackets, duplicated for seamless loop
    expect(screen.getAllByText("[TechCrunch]").length).toBeGreaterThan(0);
  });
});
