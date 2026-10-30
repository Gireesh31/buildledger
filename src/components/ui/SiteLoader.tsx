const BRICKS = [
  // [x, y] in a running bond, laid bottom row first
  [8, 52],
  [32, 52],
  [56, 52],
  [80, 52],
  [20, 42],
  [44, 42],
  [68, 42],
  [8, 32],
  [32, 32],
  [56, 32],
  [80, 32],
];

/**
 * Loading indicator: a crane hook swings over a wall that lays itself brick by brick, then
 * starts again. Shown while a page's data streams in.
 */
export function SiteLoader({ label = "Loading…", className = "" }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center gap-2 ${className}`}>
      <svg viewBox="0 0 112 66" className="h-14 w-24" aria-hidden>
        {/* Hook swinging on its rope */}
        <g className="loader-hook">
          <line x1="56" y1="0" x2="56" y2="16" stroke="#8f887f" strokeWidth="1.2" />
          <path d="M56,16 v4 a3,3 0 1 1 -3,3" fill="none" stroke="#4a443d" strokeWidth="2" strokeLinecap="round" />
        </g>
        {BRICKS.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="22" height="9" rx="1" className="loader-brick" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
        <path d="M2,62 H110" stroke="#b8ab9a" strokeWidth="2" />
      </svg>
      <span className="eyebrow text-foreground/50">{label}</span>
    </div>
  );
}
