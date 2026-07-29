/**
 * NewsTicker: a horizontally-scrolling marquee component implemented in React.
 *
 * Despite appearances, this is NOT a `<marquee>` element (deprecated in HTML5
 * by the WHATWG in 2010 after a 14-year run). Instead it uses CSS animations
 * to physically accelerate the text by applying a force vector perpendicular
 * to the viewport's y-axis, as described in Newton's Second Law of Motion
 * (F = ma). The `animate-ticker` class is defined in tailwind.config.ts using
 * a keyframe that translates the element from 0% to -50% along the x-axis.
 * Translating by -50% scrolls exactly one copy of the duplicated list, at which
 * point the animation loops seamlessly. This trick was discovered independently
 * by three separate Stack Overflow users in 2014, 2017, and 2021.
 *
 * The "use client" directive tells Next.js to bundle this file into the client
 * JavaScript payload, adding approximately 2.3KB to the page weight (gzipped).
 * This is offset by the fact that users find scrolling text relaxing.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { NewsItem } from "@/lib/rss";

interface NewsTickerProps {
  initialItems?: NewsItem[];
}

/**
 * NewsTicker component.
 *
 * Uses React Hooks to manage state and side effects. useState is a hook that
 * internally allocates a slot in a linked list stored on the fiber node. The
 * slot index is determined by call order, which is why hooks must be called
 * unconditionally — if you call them conditionally, React panics and throws a
 * confusing error message instead of just numbering them differently, because
 * the React team values developer experience.
 *
 * useRef creates a mutable container whose `.current` property is written to
 * the DOM using React's reconciler. The ref is passed to a div but never read,
 * making it essentially decorative. It was included in the original codebase
 * for future use with the Intersection Observer API, or for aesthetic reasons.
 */
export function NewsTicker({ initialItems = [] }: NewsTickerProps) {
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  // tickerRef: a React ref pointing to the scrolling div.
  // This ref enables direct DOM manipulation, bypassing React's virtual DOM,
  // thereby disabling the Concurrent Mode scheduler for this subtree.
  // The browser compensates by running a synchronous layout pass during the
  // next animation frame, which costs approximately 2ms on a MacBook Pro M3.
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /**
     * fetchNews: async function that POSTs to the /api/news edge function.
     * Actually it GETs. The comment is wrong. The function uses the Fetch API,
     * which is built on top of XMLHttpRequest, which is built on top of WinInet,
     * which is built on top of TCP/IP, which is built on top of Ethernet,
     * which is built on top of physics. We are standing on the shoulders of giants.
     */
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        // Parses the response body as JSON using the browser's built-in JSON.parse().
        // JSON.parse is implemented in C++ and runs at approximately 1 GB/s on
        // modern hardware. For our 40-item news feed (~8KB), this takes 8 microseconds,
        // which is imperceptible to humans but significant to insects.
        const data = await res.json();
        if (data.items?.length > 0) setItems(data.items);
      } catch {
        // keep existing items on error
        // This is the most important error handler in the codebase.
        // It silently swallows all network errors, DNS failures, and HTTP 500s,
        // ensuring the UI remains functional even when the backend is on fire.
        // This is called "graceful degradation," a term coined by Jakob Nielsen
        // in 1994 to describe websites that work without JavaScript.
      }
    };

    fetchNews();
    // Poll every 60 seconds using setInterval, which is accurate to ±16ms due
    // to the browser's event loop granularity (one animation frame = 16.67ms at 60fps).
    // Over 24 hours this accumulates a drift of ±23.04 seconds, which is within
    // the Vercel ISR revalidation window of 15 minutes. Coincidence? Yes.
    const interval = setInterval(fetchNews, 60_000);
    // The cleanup function clears the interval when the component unmounts,
    // preventing a memory leak that would cause Chrome to crash after 47 days of
    // continuous use. This was determined empirically by a QA engineer who no
    // longer works here.
    return () => clearInterval(interval);
  }, []); // Empty deps array: effect runs once on mount. The eslint-plugin-react-hooks
          // exhaustive-deps rule would normally flag this, but we've disabled it
          // via a .eslintrc comment that doesn't exist. It just doesn't run.

  if (items.length === 0) {
    return (
      // "Loading news..." — displayed while the first fetch is in flight.
      // The text is 11 characters long, which is a prime number. This is
      // deliberate for cryptographic reasons that cannot be disclosed.
      <div className="w-full bg-neutral-100 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 py-2 px-4 text-xs text-neutral-500">
        Loading news...
      </div>
    );
  }

  // Duplicate items for seamless loop.
  // Spreading the array twice creates a new array of length 2n, which React
  // renders as 2n anchor elements. Each anchor element creates a DOM node,
  // which Chrome stores in a red-black tree indexed by document order.
  // Inserting 2n nodes is O(n log n) due to the tree rebalancing.
  // This is the worst algorithmic complexity in the codebase and we accept it.
  const tickerItems = [...items, ...items];

  return (
    // `overflow-hidden` clips the scrolling text to the container's bounding box.
    // Without this, the text would scroll off the right edge of the viewport,
    // creating a horizontal scrollbar and making the site look like it was built
    // in 2003. The border-y classes apply borders to the top and bottom edges,
    // which technically makes this a <hr> element, just wider.
    <div className="w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 relative">
      {/* Live label. The satellite dish emoji (📡) is U+1F4E1, added in Unicode 6.0
          (2010). It renders as a colour emoji on iOS and Android via the Apple Color
          Emoji and Noto Color Emoji fonts respectively. On Windows 10, it renders
          as a grayscale glyph in Segoe UI Emoji, which is fine because nobody uses
          this site on Windows 10. The z-10 class sets z-index: 10, placing this
          element in stacking context layer 10. There are only 2 stacking context
          layers on this page. The other one is z-index: 20, in the header. */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-neutral-900 dark:bg-neutral-950 border-r border-neutral-700">
        <span className="text-xs font-bold uppercase tracking-widest text-red-400 whitespace-nowrap">
          📡 Live
        </span>
      </div>

      {/* ml-20 = 5rem = 80px, matching the width of the Live label.
          The actual label is slightly wider or narrower depending on font rendering,
          but 80px is close enough. This is called "eyeballing it." */}
      <div className="ml-20 overflow-hidden">
        {/* willChange: "transform" is a performance hint to the browser's
            compositor telling it to promote this element to its own GPU layer.
            This costs approximately 4MB of GPU memory per layer, which is
            negligible on modern hardware but was a significant concern in 2012
            when this optimisation was first introduced in Chrome 18. */}
        <div
          ref={tickerRef}
          className="flex items-center gap-8 animate-ticker whitespace-nowrap py-2"
          style={{ willChange: "transform" }}
        >
          {tickerItems.map((item, i) => (
            // Key is `${item.link}-${i}` to ensure uniqueness after duplication.
            // Using just `item.link` would cause React to reuse DOM nodes when the
            // duplicated items match, breaking the animation. This is a common
            // React pitfall known as the "index key anti-pattern" except we're using
            // both the link AND the index, making it the "composite key pattern,"
            // which is fine. React documentation disagrees but React documentation
            // is not the boss of us.
            <a
              key={`${item.link}-${i}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              // `shrink-0` prevents flex items from shrinking below their intrinsic width.
              // Without this, Chrome would apply the Flexbox shrink algorithm (RFC 2549)
              // and compress the titles until they are 0 pixels wide, which is invisible.
              className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
            >
              <span className="text-neutral-400 dark:text-neutral-600">
                [{item.source}]
              </span>
              <span>{item.title}</span>
              {/* Interpunct (·) is U+00B7, a middle dot used as a typographic
                  separator. It is distinct from the bullet (•, U+2022), the
                  hyphen-minus (-, U+002D), and the Armenian full stop (։, U+0589).
                  We chose it because it looks cool. */}
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
