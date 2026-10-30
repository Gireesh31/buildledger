import type { CSSProperties, ReactNode } from "react";

// Ground floor plan in drawing units (1 unit ≈ 20 mm). Structural grid A–E across, 1–4 down.
const COLS = [560, 750, 940, 1130, 1320];
const ROWS = [170, 350, 520, 690];
const WALL = 12; // 230 mm outer wall
const PART = 8; // 115 mm partition

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** A line that draws itself in once, starting after `at` ms. */
function Ln({ d, at, className = "" }: { d: string; at: number; className?: string }) {
  return <path d={d} pathLength={1} className={`bp-draw ${className}`} style={delay(at)} />;
}

/** Partition wall as two faces, horizontal or vertical. */
function Partition({ x1, y1, x2, y2, at }: { x1: number; y1: number; x2: number; y2: number; at: number }) {
  const h = PART / 2;
  const d = y1 === y2 ? `M${x1},${y1 - h} H${x2} M${x1},${y1 + h} H${x2}` : `M${x1 - h},${y1} V${y2} M${x1 + h},${y1} V${y2}`;
  return <Ln d={d} at={at} />;
}

/** Window in a wall: knocks the wall out and draws the three-line glazing symbol. */
function Win({ x, y, w, h, at }: { x: number; y: number; w: number; h: number; at: number }) {
  const d =
    w > h
      ? `M${x},${y} H${x + w} M${x},${y + h / 2} H${x + w} M${x},${y + h} H${x + w} M${x},${y} V${y + h} M${x + w},${y} V${y + h}`
      : `M${x},${y} V${y + h} M${x + w / 2},${y} V${y + h} M${x + w},${y} V${y + h} M${x},${y} H${x + w} M${x},${y + h} H${x + w}`;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="bp-knockout" />
      <Ln d={d} at={at} />
    </g>
  );
}

/**
 * Door opening: knocks out the wall and draws the leaf and its swing.
 * Hinge at (hx, hy); the leaf opens along (lx, ly), the opening runs along (ox, oy).
 */
function Door({ hx, hy, w, lx, ly, ox, oy, gap, at }: { hx: number; hy: number; w: number; lx: number; ly: number; ox: number; oy: number; gap: number; at: number }) {
  const tip = [hx + lx * w, hy + ly * w];
  const end = [hx + ox * w, hy + oy * w];
  const sweep = lx * oy - ly * ox > 0 ? 1 : 0;
  // The wall sits behind the hinge face, on the side the leaf doesn't open into.
  const vertical = ox === 0;
  const kx = vertical ? (lx > 0 ? hx - gap : hx) : hx;
  const ky = vertical ? hy : ly > 0 ? hy - gap : hy;
  return (
    <g>
      <rect x={kx} y={ky} width={vertical ? gap : w} height={vertical ? w : gap} className="bp-knockout" />
      <Ln d={`M${hx},${hy} L${tip[0]},${tip[1]}`} at={at} />
      <Ln d={`M${tip[0]},${tip[1]} A${w},${w} 0 0 ${sweep} ${end[0]},${end[1]}`} at={at + 150} className="bp-thin" />
    </g>
  );
}

function Label({ x, y, children, sub, at }: { x: number; y: number; children: ReactNode; sub?: string; at: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" className="bp-text bp-fade" style={delay(at)}>
      {children}
      {sub && (
        <tspan x={x} dy={15} className="bp-text-sub">
          {sub}
        </tspan>
      )}
    </text>
  );
}

/** Dimension string with architectural tick marks and figures in millimetres. */
function Dimension({ stops, at, axis, offset }: { stops: number[]; at: number; axis: "x" | "y"; offset: number }) {
  const first = stops[0];
  const last = stops[stops.length - 1];
  const line = axis === "x" ? `M${first - 14},${offset} H${last + 14}` : `M${offset},${first - 14} V${last + 14}`;
  const ticks = stops.map((s) => (axis === "x" ? `M${s - 5},${offset + 5} L${s + 5},${offset - 5} M${s},${offset - 10} V${offset + 10}` : `M${offset - 5},${s + 5} L${offset + 5},${s - 5} M${offset - 10},${s} H${offset + 10}`)).join(" ");
  return (
    <g>
      <Ln d={line} at={at} className="bp-thin" />
      <Ln d={ticks} at={at + 200} />
      {stops.slice(1).map((s, i) => {
        const mid = (stops[i] + s) / 2;
        const mm = Math.round(((s - stops[i]) * 20) / 10) * 10;
        return axis === "x" ? (
          <text key={s} x={mid} y={offset - 7} textAnchor="middle" className="bp-text bp-fade" style={delay(at + 400)}>
            {mm}
          </text>
        ) : (
          <text key={s} x={offset - 7} y={mid} textAnchor="middle" transform={`rotate(-90 ${offset - 7} ${mid})`} className="bp-text bp-fade" style={delay(at + 400)}>
            {mm}
          </text>
        );
      })}
    </g>
  );
}

function Stair({ at }: { at: number }) {
  const x0 = 750 + PART / 2 + 10;
  const x1 = 940 - PART / 2 - 10;
  const mid = 605;
  const treads = Array.from({ length: 10 }, (_, i) => x0 + 14 + i * 16);
  const d = treads.map((x) => `M${x},${520 + PART / 2} V${mid - 3} M${x},${mid + 3} V${690 - WALL}`).join(" ");
  return (
    <g>
      <Ln d={d} at={at} className="bp-thin" />
      <Ln d={`M${x0},${mid - 3} H${x1} M${x0},${mid + 3} H${x1}`} at={at + 100} />
      {/* Walking line: up along one flight, back along the other. */}
      <Ln d={`M${x0 + 6},${mid + 44} H${x1 - 8} V${mid - 44} H${x0 + 14} m8,-5 l-8,5 l8,5`} at={at + 300} className="bp-thin" />
      <text x={x0 + 4} y={mid + 62} className="bp-text-sub bp-fade" style={delay(at + 500)}>
        UP
      </text>
    </g>
  );
}

/**
 * Background behind every page: drafting paper with a ground floor plan that drafts itself in
 * on first load, then a plotter pen slowly traces the outer wall. Decorative, fixed behind the
 * content, and still for people who prefer reduced motion.
 */
export function BackgroundFX() {
  const outer = `M${COLS[0]},${ROWS[0]} H${COLS[4]} V${ROWS[3]} H${COLS[0]} Z`;
  const inner = `M${COLS[0] + WALL},${ROWS[0] + WALL} H${COLS[4] - WALL} V${ROWS[3] - WALL} H${COLS[0] + WALL} Z`;
  const gridLines = [...COLS.map((x) => `M${x},${ROWS[0] - 62} V${ROWS[3] + 40}`), ...ROWS.map((y) => `M${COLS[0] - 62},${y} H${COLS[4] + 40}`)].join(" ");
  const columns = COLS.flatMap((x) => ROWS.map((y) => [x, y])).filter(([x, y]) => !(x === 750 && y === 350));

  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bp-paper absolute inset-0" />
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMin slice" className="bp-plan absolute inset-0 h-full w-full" fill="none">
        {/* Structural grid with bubbles */}
        <path d={gridLines} className="bp-center bp-fade" style={delay(0)} />
        {COLS.map((x, i) => (
          <g key={x} className="bp-fade" style={delay(300 + i * 60)}>
            <circle cx={x} cy={ROWS[0] - 78} r={14} className="bp-line" />
            <text x={x} y={ROWS[0] - 74} textAnchor="middle" className="bp-text">
              {"ABCDE"[i]}
            </text>
          </g>
        ))}
        {ROWS.map((y, i) => (
          <g key={y} className="bp-fade" style={delay(500 + i * 60)}>
            <circle cx={COLS[0] - 78} cy={y} r={14} className="bp-line" />
            <text x={COLS[0] - 78} y={y + 4} textAnchor="middle" className="bp-text">
              {i + 1}
            </text>
          </g>
        ))}

        {/* Outer walls, partitions, RCC columns */}
        <g className="bp-line bp-wall">
          <path d={outer} pathLength={1} className="bp-draw" style={delay(700)} />
          <path d={inner} pathLength={1} className="bp-draw" style={delay(900)} />
        </g>
        <g className="bp-line">
          <Partition x1={940} y1={ROWS[0] + WALL} x2={940} y2={ROWS[3] - WALL} at={1300} />
          <Partition x1={940 + PART / 2} y1={350} x2={COLS[4] - WALL} y2={350} at={1450} />
          <Partition x1={COLS[0] + WALL} y1={520} x2={COLS[4] - WALL} y2={520} at={1550} />
          <Partition x1={750} y1={520 + PART / 2} x2={750} y2={ROWS[3] - WALL} at={1650} />
        </g>
        {columns.map(([x, y], i) => (
          <rect key={`${x}-${y}`} x={x - 7} y={y - 7} width={14} height={14} className="bp-column bp-fade" style={delay(1700 + i * 35)} />
        ))}

        {/* Openings */}
        <g className="bp-line">
          <Win x={640} y={ROWS[0]} w={90} h={WALL} at={2100} />
          <Win x={1040} y={ROWS[0]} w={110} h={WALL} at={2150} />
          <Win x={COLS[4] - WALL} y={410} w={WALL} h={70} at={2200} />
          <Win x={1060} y={ROWS[3] - WALL} w={100} h={WALL} at={2250} />
          <Win x={620} y={ROWS[3] - WALL} w={50} h={WALL} at={2300} />
          <Win x={COLS[0]} y={220} w={WALL} h={70} at={2350} />
          <Door hx={COLS[0] + WALL} hy={400} w={50} lx={1} ly={0} ox={0} oy={1} gap={WALL} at={2400} />
          <Door hx={940 + PART / 2} hy={270} w={42} lx={1} ly={0} ox={0} oy={1} gap={PART} at={2500} />
          <Door hx={940 + PART / 2} hy={420} w={42} lx={1} ly={0} ox={0} oy={1} gap={PART} at={2600} />
          <Door hx={990} hy={520 + PART / 2} w={42} lx={0} ly={1} ox={1} oy={0} gap={PART} at={2700} />
          <Door hx={600} hy={520 + PART / 2} w={36} lx={0} ly={1} ox={1} oy={0} gap={PART} at={2800} />
        </g>
        <g className="bp-line">
          <Stair at={2900} />
        </g>

        {/* Dimensions and room names */}
        <g className="bp-line">
          <Dimension stops={COLS} axis="x" offset={ROWS[0] - 36} at={3100} />
          <Dimension stops={ROWS} axis="y" offset={COLS[0] - 36} at={3250} />
        </g>
        <Label x={750} y={340} sub="7280 × 6680" at={3500}>
          LIVING / DINING
        </Label>
        <Label x={1130} y={258} sub="7280 × 3280" at={3550}>
          BEDROOM 1
        </Label>
        <Label x={1130} y={432} sub="7280 × 3240" at={3600}>
          BEDROOM 2
        </Label>
        <Label x={1130} y={600} sub="7280 × 3080" at={3650}>
          KITCHEN
        </Label>
        <Label x={655} y={620} sub="3480 × 3080" at={3700}>
          TOILET
        </Label>

        {/* Title and north point */}
        <g className="bp-fade" style={delay(3800)}>
          <text x={COLS[0]} y={ROWS[3] + 74} className="bp-title">
            GROUND FLOOR PLAN
          </text>
          <text x={COLS[0]} y={ROWS[3] + 92} className="bp-text-sub">
            SCALE 1:100 · ALL DIMENSIONS IN MM
          </text>
          <path d={`M${COLS[0]},${ROWS[3] + 80} H${COLS[0] + 168}`} className="bp-line" />
          <g transform={`translate(${COLS[4] - 10} ${ROWS[3] + 72})`}>
            <circle r={16} className="bp-line" />
            <path d="M0,-22 L6,8 L0,3 L-6,8 Z" className="bp-column" />
            <text y={-28} textAnchor="middle" className="bp-text">
              N
            </text>
          </g>
        </g>

        {/* Plotter pen tracing the outer wall, once the drawing is in */}
        <path d={outer} pathLength={1} className="bp-pen" />
      </svg>
    </div>
  );
}
