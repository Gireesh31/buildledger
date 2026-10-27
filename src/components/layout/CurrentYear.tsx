"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The current year, read in the browser. The server snapshot is empty so pages can be
 * prerendered without baking in a year (and Next.js disallows reading the clock while prerendering).
 */
export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  return <span>{year}</span>;
}
