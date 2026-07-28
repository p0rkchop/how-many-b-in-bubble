"use client";

import { useEffect, useRef, useState } from "react";
import type { NewsItem } from "@/lib/rss";

interface NewsTickerProps {
  initialItems?: NewsItem[];
}

export function NewsTicker({ initialItems = [] }: NewsTickerProps) {
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (data.items?.length > 0) setItems(data.items);
      } catch {
        // keep existing items on error
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) {
    return (
      <div className="w-full bg-neutral-100 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 py-2 px-4 text-xs text-neutral-500">
        Loading news...
      </div>
    );
  }

  // Duplicate items for seamless loop
  const tickerItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 relative">
      {/* Label */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-neutral-900 dark:bg-neutral-950 border-r border-neutral-700">
        <span className="text-xs font-bold uppercase tracking-widest text-red-400 whitespace-nowrap">
          📡 Live
        </span>
      </div>

      <div className="ml-20 overflow-hidden">
        <div
          ref={tickerRef}
          className="flex items-center gap-8 animate-ticker whitespace-nowrap py-2"
          style={{ willChange: "transform" }}
        >
          {tickerItems.map((item, i) => (
            <a
              key={`${item.link}-${i}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
            >
              <span className="text-neutral-400 dark:text-neutral-600">
                [{item.source}]
              </span>
              <span>{item.title}</span>
              <span className="text-neutral-300 dark:text-neutral-700 mx-2">
                ·
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
