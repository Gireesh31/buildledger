const GROUND = 296;
const FLOOR = 26;
const BUILD = "18s"; // one full rise of the frame

/** Lattice between two horizontal chords. */
function lattice(x1: number, x2: number, top: number, bottom: number, step: number) {
  let d = `M${x1},${top} H${x2} M${x1},${bottom} H${x2}`;
  for (let x = x1, i = 0; x < x2; x += step, i++) d += i % 2 ? ` M${x},${top} L${x + step},${bottom}` : ` M${x},${bottom} L${x + step},${top}`;
  return d;
}

function mast(x: number, w: number, top: number, step: number) {
  let d = `M${x},${GROUND} V${top} M${x + w},${GROUND} V${top}`;
  for (let y = GROUND, i = 0; y > top; y -= step, i++) d += i % 2 ? ` M${x},${y} L${x + w},${y - step}` : ` M${x + w},${y} L${x},${y - step}`;
  return d;
}

/** One storey of an RCC frame: slab, columns, and brick infill once it's up. */
function Storey({ x, w, level, cols, appear }: { x: number; w: number; level: number; cols: number; appear: number }) {
  const y = GROUND - (level + 1) * FLOOR;
  const pitch = w / cols;
  // Each storey appears in turn, the whole frame holds, then the cycle starts over.
  const keyTimes = `0;${appear};${appear + 0.03};0.9;0.96;1`;
  return (
    <g opacity="0">
      <rect x={x} y={y} width={w} height={FLOOR} className="sky-fill" />
      <path d={`M${x - 4},${y} H${x + w + 4} ${Array.from({ length: cols + 1 }, (_, i) => `M${x + i * pitch},${y} V${y + FLOOR}`).join(" ")}`} className="sky-line" />
      {Array.from({ length: cols }, (_, i) => (i + level) % 3 !== 0 && <rect key={i} x={x + i * pitch + 5} y={y + 7} width={pitch - 10} height={FLOOR - 13} className="sky-window" />)}
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={keyTimes} dur={BUILD} repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" values="0 -10;0 -10;0 0;0 0;0 0;0 -10" keyTimes={keyTimes} dur={BUILD} repeatCount="indefinite" />
    </g>
  );
}

function Finished({ x, w, h, rows, cols }: { x: number; w: number; h: number; rows: number; cols: number }) {
  const top = GROUND - h;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} className="sky-fill sky-line" />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect key={`${r}-${c}`} x={x + 8 + c * ((w - 16) / cols)} y={top + 10 + r * ((h - 20) / rows)} width={(w - 16) / cols - 6} height={(h - 20) / rows - 8} className="sky-window" />
        )),
      )}
    </g>
  );
}

/**
 * Line-drawn construction skyline (landing hero, dashboard, project header): a frame going up storey by storey,
 * a tower crane lifting a precast panel up onto it, a second crane slewing over another site,
 * and finished blocks either side. Pure SVG animation, frozen for reduced motion via CSS.
 */
// On phones, a close-up framed on the rising building, its crane and the tall tower beside it,
// so the drawing stays legible instead of shrinking to a thin strip or cropping at random.
const PHONE_VIEW = "230 0 650 300";

export function HeroSkyline({
  className = "absolute inset-x-0 bottom-0 h-[280px] w-full",
  phoneClassName = "absolute inset-x-0 bottom-0 h-[190px] w-full",
  fit = "xMidYMax slice",
  phoneFit = "xMidYMax meet",
}: {
  /** Size and position from the sm breakpoint up; defaults to a band along the bottom of the parent. */
  className?: string;
  /** Size and position on phones, where the close-up framing is used. */
  phoneClassName?: string;
  /** SVG preserveAspectRatio: "slice" fills a wide band, "meet" shows the whole drawing in a small box. */
  fit?: string;
  /** preserveAspectRatio for the phone close-up; "meet" keeps the whole close-up in view. */
  phoneFit?: string;
} = {}) {
  return (
    <>
      <SkylineSvg view={PHONE_VIEW} fit={phoneFit} className={`sm:hidden ${phoneClassName}`} />
      <SkylineSvg view="0 0 1440 300" fit={fit} className={`hidden sm:block ${className}`} />
    </>
  );
}

function SkylineSvg({ view, fit, className }: { view: string; fit: string; className: string }) {
  const storeys = 8;
  return (
    <svg aria-hidden viewBox={view} preserveAspectRatio={fit} className={`hero-skyline pointer-events-none ${className}`} fill="none">
      {/* Sun and ground */}
      <circle cx="1120" cy="70" r="34" className="sky-sun" />
      <path d={`M0,${GROUND} H1440`} className="sky-line" strokeWidth="2" />
      <path d={`M0,${GROUND + 2} H1440`} className="sky-dash" />

      {/* Left: finished blocks */}
      <Finished x={30} w={120} h={150} rows={5} cols={3} />
      <Finished x={160} w={90} h={96} rows={3} cols={2} />

      {/* Building going up, storey by storey */}
      <g>
        <rect x="300" y={GROUND - 6} width="210" height="6" className="sky-fill sky-line" />
        {Array.from({ length: storeys }, (_, i) => (
          <Storey key={i} x={305} w={200} level={i} cols={5} appear={0.04 + i * 0.09} />
        ))}
        {/* Scaffold up the side */}
        <path d={`M515,${GROUND} V${GROUND - storeys * FLOOR - 10} M533,${GROUND} V${GROUND - storeys * FLOOR - 10} ${Array.from({ length: storeys }, (_, i) => `M515,${GROUND - i * FLOOR - 13} H533 M515,${GROUND - i * FLOOR} L533,${GROUND - (i + 1) * FLOOR}`).join(" ")}`} className="sky-line sky-thin" />
      </g>

      {/* Tower crane lifting a precast panel onto the frame */}
      <g>
        <path d={mast(545, 14, 46, 14)} className="sky-line sky-thin" />
        <path d={lattice(250, 545, 36, 46, 14)} className="sky-line sky-thin" />
        <path d={lattice(559, 652, 40, 46, 15)} className="sky-line sky-thin" />
        <path d="M552,46 V14 L300,38 M552,14 L640,40" className="sky-line sky-thin" />
        <rect x="620" y="46" width="30" height="16" className="sky-weight" />
        <rect x="529" y="46" width="16" height="12" className="sky-accent" />
        <circle cx="552" cy="12" r="2.5" className="sky-beacon" />
        <g>
          <rect x="-7" y="46" width="14" height="5" className="sky-weight" />
          <line x1="0" y1="51" x2="0" y2="270" className="sky-line sky-thin">
            <animate attributeName="y2" values="270;55;55;75;75;270" keyTimes="0;0.3;0.55;0.7;0.85;1" dur="14s" repeatCount="indefinite" />
          </line>
          <g>
            <rect x="-18" y="272" width="36" height="11" rx="1" className="sky-accent" />
            <path d="M0,270 L-15,272 M0,270 L15,272" className="sky-line sky-thin" />
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -215;0 -215;0 -195;0 -195;0 0" keyTimes="0;0.3;0.55;0.7;0.85;1" dur="14s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.72;0.76;0.98;1" dur="14s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="translate" values="275 0;275 0;405 0;405 0;275 0;275 0" keyTimes="0;0.3;0.55;0.7;0.85;1" dur="14s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1;0 0 1 1" />
        </g>
      </g>

      {/* Tall finished tower with curtain wall */}
      <g>
        <rect x="860" y="70" width="110" height={GROUND - 70} className="sky-fill sky-line" />
        <path d={Array.from({ length: 7 }, (_, i) => `M${872 + i * 14},80 V${GROUND - 8}`).join(" ")} className="sky-line sky-thin" />
        <path d={Array.from({ length: 20 }, (_, i) => `M866,${86 + i * 10.5} H964`).join(" ")} className="sky-line sky-hair" />
      </g>

      {/* RCC frame on the right with a slewing crane */}
      <g>
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} d={`M1010,${GROUND - (i + 1) * FLOOR} H1200 ${Array.from({ length: 6 }, (_, c) => `M${1012 + c * 37},${GROUND - i * FLOOR} V${GROUND - (i + 1) * FLOOR}`).join(" ")}`} className="sky-line" />
        ))}
        <path d={Array.from({ length: 6 }, (_, c) => `M${1010 + c * 37},${GROUND - 5 * FLOOR} v-12 M${1016 + c * 37},${GROUND - 5 * FLOOR} v-9`).join(" ")} className="sky-line sky-thin" />
        <path d={mast(1236, 12, 96, 12)} className="sky-line sky-thin" />
        <g transform="translate(1242 0)">
          <g>
            <path d={lattice(6, 190, 88, 96, 13)} className="sky-line sky-thin" />
            <path d={lattice(-80, -6, 90, 96, 13)} className="sky-line sky-thin" />
            <rect x="-80" y="96" width="24" height="12" className="sky-weight" />
            <line x1="140" y1="96" x2="140" y2="170" className="sky-line sky-thin" />
            <rect x="130" y="170" width="20" height="8" className="sky-accent" />
            <animateTransform attributeName="transform" type="scale" values="1 1;0.3 1;-0.6 1;0.3 1;1 1" dur="40s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1" />
          </g>
        </g>
        <circle cx="1242" cy="86" r="2.5" className="sky-beacon" />
      </g>

      {/* Low houses */}
      <path d={`M1280,${GROUND} V250 L1310,228 L1340,250 V${GROUND} M1350,${GROUND} V258 H1420 V${GROUND}`} className="sky-fill sky-line" />
      <rect x="1300" y="262" width="20" height="18" className="sky-window" />
      <rect x="1368" y="268" width="34" height="14" className="sky-window" />
    </svg>
  );
}
