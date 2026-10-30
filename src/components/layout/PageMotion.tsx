"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Page-wide motion, mounted once in the root layout:
 * - how far down the page you are is exposed as --scroll-p (0 to 1), which the measuring tape
 *   under the header follows;
 * - elements marked data-reveal fade and rise in as they scroll into view.
 * Content is only hidden once this has run, so nothing stays invisible without JavaScript,
 * and reveals are skipped for people who prefer reduced motion.
 */
export function PageMotion() {
  const pathname = usePathname();

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

    let observer: IntersectionObserver | undefined;
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
      document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => io.observe(el));
      observer = io;
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return null;
}
