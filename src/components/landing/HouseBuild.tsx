const GROUND = 250;
const COLS = [96, 216, 336, 456];

/**
 * A G+1 house that builds itself when its section scrolls into view: foundation, then the RCC
 * frame and brickwork, then the roof slab, windows and paint. Stages are driven by CSS
 * transitions keyed off the parent's data-reveal state, so it shows finished without JavaScript
 * or with reduced motion.
 */
export function HouseBuild() {
  return (
    <figure className="hb relative">
      <svg viewBox="0 0 560 290" className="w-full" fill="none" role="img" aria-label="A two-storey house going from foundation to finished building">
        <defs>
          <pattern id="brick" width="24" height="10" patternUnits="userSpaceOnUse">
            <rect width="24" height="10" fill="#c46a3f" />
            <path d="M0,0 H24 M0,5 H24 M12,0 V5 M0,5 V10" stroke="#e7b89c" strokeWidth="1" />
          </pattern>
          <linearGradient id="hbGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#cfe2ee" />
            <stop offset="1" stopColor="#7fa3b8" />
          </linearGradient>
        </defs>

        {/* Ground and the setting-out pegs */}
        <path d={`M10,${GROUND} H550`} stroke="#b8ab9a" strokeWidth="2" />
        <path d={`M10,${GROUND + 8} H550`} stroke="#d9cfc2" strokeDasharray="6 6" />

        {/* 1. Foundation: excavation, footings, plinth beam */}
        <g className="hb-stage hb-s1">
          <path d={`M78,${GROUND} V${GROUND + 26} H482 V${GROUND}`} stroke="#b8ab9a" strokeDasharray="4 4" />
          {COLS.map((x) => (
            <rect key={x} x={x - 14} y={GROUND + 12} width="40" height="12" fill="#a9a29a" />
          ))}
          <rect x="84" y={GROUND - 14} width="392" height="14" fill="#b9b3ab" stroke="#8f887f" />
        </g>

        {/* 2. Frame: columns, first-floor slab, brick infill */}
        <g className="hb-stage hb-s2">
          {COLS.map((x) => (
            <rect key={x} x={x} y="120" width="12" height={GROUND - 14 - 120} fill="#c9c3ba" stroke="#8f887f" className="hb-col" />
          ))}
          <rect x="84" y="170" width="392" height="10" fill="#c9c3ba" stroke="#8f887f" className="hb-slab" />
          <g className="hb-walls">
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={COLS[i] + 12} y="180" width={COLS[i + 1] - COLS[i] - 12} height={GROUND - 14 - 180} fill="url(#brick)" />
                <rect x={COLS[i] + 12} y="122" width={COLS[i + 1] - COLS[i] - 12} height="48" fill="url(#brick)" />
              </g>
            ))}
          </g>
        </g>

        {/* 3. Finish: roof slab and parapet, plaster and paint, windows, door, sunshades */}
        <g className="hb-stage hb-s3">
          <g className="hb-paint">
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={COLS[i] + 12} y="180" width={COLS[i + 1] - COLS[i] - 12} height={GROUND - 14 - 180} fill="#f4ead9" />
                <rect x={COLS[i] + 12} y="122" width={COLS[i + 1] - COLS[i] - 12} height="48" fill="#f4ead9" />
              </g>
            ))}
            {COLS.map((x) => (
              <rect key={x} x={x} y="120" width="12" height={GROUND - 14 - 120} fill="#e9dcc6" />
            ))}
          </g>
          <g className="hb-roof">
            <rect x="78" y="108" width="404" height="12" fill="#c9c3ba" stroke="#8f887f" />
            <rect x="84" y="94" width="392" height="14" fill="#e9dcc6" stroke="#b8ab9a" />
          </g>
          <g className="hb-openings">
            {/* Windows with sunshades */}
            {[
              [132, 134],
              [372, 134],
              [252, 134],
              [132, 196],
              [372, 196],
            ].map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <rect x={x} y={y} width="56" height="28" fill="url(#hbGlass)" stroke="#6b6259" strokeWidth="2" />
                <path d={`M${x + 28},${y} V${y + 28}`} stroke="#6b6259" strokeWidth="1.5" />
                <path d={`M${x - 6},${y - 5} H${x + 62}`} stroke="#8f887f" strokeWidth="4" />
              </g>
            ))}
            {/* Main door */}
            <rect x="258" y="190" width="44" height={GROUND - 14 - 190} fill="#8a5a36" stroke="#5e3c22" strokeWidth="2" />
            <circle cx="294" cy="214" r="2" fill="#f2c94c" />
            <path d="M246,184 H314" stroke="#8f887f" strokeWidth="4" />
          </g>
          {/* Handover: a flag on the parapet */}
          <g className="hb-flag">
            <path d="M462,94 V58" stroke="#6b6259" strokeWidth="2" />
            <path d="M463,58 L488,64 L463,70 Z" fill="#e8590c">
              <animate attributeName="d" values="M463,58 L488,64 L463,70 Z;M463,58 Q476,58 488,66 Q474,66 463,70 Z;M463,58 L488,64 L463,70 Z" dur="1.6s" repeatCount="indefinite" />
            </path>
          </g>
          {/* A tree by the gate */}
          <g className="hb-tree">
            <path d={`M522,${GROUND} V212`} stroke="#7a5a3a" strokeWidth="4" />
            <circle cx="522" cy="200" r="20" fill="#8fb07a" />
            <circle cx="510" cy="208" r="12" fill="#7ea36a" />
          </g>
        </g>
      </svg>

      <figcaption className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px] uppercase tracking-wider">
        {["Foundation", "Frame & brickwork", "Finish & handover"].map((label, i) => (
          <span key={label} className={`hb-chip hb-chip-${i + 1} rounded-md border px-2 py-1.5`}>
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
