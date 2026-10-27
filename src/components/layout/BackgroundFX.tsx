/**
 * Soft animated background behind every page: slowly drifting colour glows over a faint
 * blueprint grid. Purely decorative, fixed behind the content, and still for reduced motion.
 */
export function BackgroundFX() {
  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
    </div>
  );
}
