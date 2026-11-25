/**
 * Background behind every page: plain concrete grey (the page colour). The wash and dot grid are
 * switched off in globals.css; the construction drawings live in the hero, How it works and the footer.
 */
export function BackgroundFX() {
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="site-wash absolute inset-0" />
      <div className="site-dots absolute inset-0" />
    </div>
  );
}
