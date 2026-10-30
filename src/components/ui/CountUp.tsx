"use client";

import { useEffect, useRef, useState } from "react";

const inr = new Intl.NumberFormat("en-IN");

/** Rupee figure that counts up from zero when it first comes into view. */
export function CountUp({ value, duration = 1400, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let timer = 0;
    // Start from zero as soon as we're on the client, so the run-up is what people see.
    frame = requestAnimationFrame(() => setShown(0));
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      timer = window.setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }, delay);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      ₹{inr.format(shown)}
    </span>
  );
}
