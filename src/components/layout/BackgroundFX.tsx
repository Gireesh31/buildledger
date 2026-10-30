/**
 * Background behind every page: clean site-office paper with a fine dot grid (like a setting-out
 * sheet) and a soft warm wash at the top. Deliberately quiet; the construction motion lives in
 * the hero skyline, the How it works build and the footer site.
 */
export function BackgroundFX() {
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="site-wash absolute inset-0" />
      <div className="site-dots absolute inset-0" />
    </div>
  );
}
