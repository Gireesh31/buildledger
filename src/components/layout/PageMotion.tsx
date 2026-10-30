"use client";

import { useEffect } from "react";

/**
 * Page-wide motion, mounted once in the root layout:
 * - how far down the page you are is exposed as --scroll-p (0 to 1), which the measuring tape
 *   under the header follows;
 * - elements marked data-reveal fade and rise in as they scroll into view.
 * New content (client navigation, streamed sections) is picked up by watching the DOM rather
 * than the route, so this needs no request-time data and never blocks prerendering.
 * Content is only hidden once this has run, so nothing stays invisible without JavaScript,
 * and reveals are skipped for people who prefer reduced motion.
 */
export function PageMotion() {
  useEffect(() => {
    const root = document.documentElement;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const range = root.scrollHeight - window.innerHeight;
        root.style.setProperty("--scroll-p", range > 0 ? (window.scrollY / range).toFixed(4) : "0");
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    let reveal: IntersectionObserver | undefined;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("reveal-ready");
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // Also reveal anything already scrolled past (a jump to the bottom skips over it).
            if (!entry.isIntersecting && entry.boundingClientRect.top > 0) continue;
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      reveal = io;
    }
    const watchNew = () => {
      const io = reveal;
      if (io) document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => io.observe(el));
      onScroll();
    };
    watchNew();
    const mutations = new MutationObserver(watchNew);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      reveal?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
