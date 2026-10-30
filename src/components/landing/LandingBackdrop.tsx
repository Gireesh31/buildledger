import type { CSSProperties } from "react";

const EASE = "0.45 0 0.55 1";

function lattice(x1: number, x2: number, top: number, bottom: number, step: number) {
  let d = `M${x1},${top} H${x2} M${x1},${bottom} H${x2}`;
  for (let x = x1, i = 0; x < x2; x += step, i++) d += i % 2 ? ` M${x},${top} L${x + step},${bottom}` : ` M${x},${bottom} L${x + step},${top}`;
  return d;
}

function tower(x: number, w: number, top: number, bottom: number, step: number) {
  let d = `M${x},${bottom} V${top} M${x + w},${bottom} V${top}`;
  for (let y = bottom, i = 0; y > top; y -= step, i++) d += i % 2 ? ` M${x},${y} L${x + w},${y - step}` : ` M${x + w},${y} L${x},${y - step}`;
  return d;
}

/** Steel I-beam seen side on, with its flanges and web. */
function IBeam({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="12" className="bd-fill bd-line" />
      <path d={`M${x},${y + 3} H${x + w} M${x},${y + 9} H${x + w}`} className="bd-line bd-thin" />
    </g>
  );
}

/** Tower crane up the left margin, carrying a swinging I-beam along its jib. */
function MarginCrane() {
  return (
    <svg viewBox="0 0 260 560" className="h-[560px] w-[260px]" fill="none">
      <path d={tower(36, 18, 70, 556, 18)} className="bd-line bd-thin" />
      <path d={lattice(54, 250, 58, 70, 14)} className="bd-line bd-thin" />
      <path d={lattice(0, 36, 62, 70, 12)} className="bd-line bd-thin" />
      <path d="M45,70 V26 L220,60 M45,26 L4,62" className="bd-line bd-thin" />
      <rect x="2" y="70" width="22" height="18" className="bd-weight" />
      <rect x="54" y="70" width="16" height="12" className="bd-accent" />
      <circle cx="45" cy="24" r="3" className="bd-beacon" />
      <g>
        <rect x="-7" y="70" width="14" height="5" className="bd-weight" />
        <line x1="0" y1="75" x2="0" y2="250" className="bd-line bd-thin">
          <animate attributeName="y2" values="250;180;180;250;250" keyTimes="0;0.3;0.6;0.85;1" dur="16s" repeatCount="indefinite" />
        </line>
        <g>
          <g>
            <path d="M0,252 L-30,262 M0,252 L30,262" className="bd-line bd-thin" />
            <IBeam x={-40} y={262} w={80} />
            <animateTransform attributeName="transform" type="rotate" values="-4 0 252;4 0 252;-4 0 252" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines={`${EASE};${EASE}`} />
          </g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -70;0 -70;0 0;0 0" keyTimes="0;0.3;0.6;0.85;1" dur="16s" repeatCount="indefinite" />
        </g>
        <animateTransform attributeName="transform" type="translate" values="200 0;200 0;100 0;100 0;200 0" keyTimes="0;0.3;0.6;0.85;1" dur="16s" repeatCount="indefinite" calcMode="spline" keySplines={`0 0 1 1;${EASE};0 0 1 1;${EASE}`} />
      </g>
    </svg>
  );
}

/** Builder's hoist on the right margin: the cage runs up and down its mast. */
function Hoist() {
  return (
    <svg viewBox="0 0 150 600" className="h-[600px] w-[150px]" fill="none">
      <path d={tower(60, 16, 20, 596, 16)} className="bd-line bd-thin" />
      {/* Tie-ins back to the building */}
      {[120, 260, 400, 540].map((y) => (
        <path key={y} d={`M76,${y} H150 M76,${y - 10} L150,${y}`} className="bd-line bd-hair" />
      ))}
      <circle cx="68" cy="16" r="3" className="bd-beacon" />
      <g>
        <rect x="14" y="520" width="44" height="54" className="bd-fill bd-line" />
        <path d="M18,526 H54 V568 H18 Z M36,526 V568" className="bd-line bd-hair" />
        <rect x="14" y="520" width="44" height="6" className="bd-accent" />
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -440;0 -440;0 0;0 0" keyTimes="0;0.42;0.55;0.95;1" dur="20s" repeatCount="indefinite" calcMode="spline" keySplines={`${EASE};0 0 1 1;${EASE};0 0 1 1`} />
      </g>
      <g>
        <rect x="80" y="40" width="10" height="30" className="bd-weight" />
        <animateTransform attributeName="transform" type="translate" values="0 0;0 440;0 440;0 0;0 0" keyTimes="0;0.42;0.55;0.95;1" dur="20s" repeatCount="indefinite" calcMode="spline" keySplines={`${EASE};0 0 1 1;${EASE};0 0 1 1`} />
      </g>
    </svg>
  );
}

/** Transit mixer drum, its painted bands turning. */
function MixerDrum() {
  return (
    <svg viewBox="0 0 240 130" className="h-[130px] w-[240px]" fill="none">
      <defs>
        <clipPath id="bdDrum">
          <ellipse cx="110" cy="58" rx="80" ry="34" transform="rotate(-12 110 58)" />
        </clipPath>
      </defs>
      <ellipse cx="110" cy="58" rx="80" ry="34" transform="rotate(-12 110 58)" className="bd-fill bd-line" />
      <g clipPath="url(#bdDrum)">
        <g>
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M${i * 30},10 l14,0 l-34,110 l-14,0 Z`} className="bd-band" />
          ))}
          <animateTransform attributeName="transform" type="translate" values="-30 0;0 0" dur="1.4s" repeatCount="indefinite" />
        </g>
      </g>
      <path d="M20,98 H230 M186,98 V60 H214 L230,80 V98" className="bd-line" />
      {[52, 92, 206].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="108" r="12" className="bd-fill bd-line" />
          <g>
            <path d={`M${cx - 7},108 H${cx + 7} M${cx},101 V115`} className="bd-line bd-thin" />
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 108`} to={`360 ${cx} 108`} dur="2s" repeatCount="indefinite" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Excavator outline scooping on the right margin. */
function Digger() {
  const kt = "0;0.3;0.55;0.75;1";
  const spl = Array(4).fill(EASE).join(";");
  return (
    <svg viewBox="0 0 230 150" className="h-[150px] w-[230px]" fill="none">
      <path d="M0,140 H230" className="bd-line" />
      <path d="M150,140 Q172,118 196,140" className="bd-fill bd-line" />
      <rect x="20" y="118" width="100" height="20" rx="10" className="bd-fill bd-line" />
      <path d="M18,114 H110 V84 H44 Q18,84 18,98 Z" className="bd-fill bd-line" />
      <path d="M74,84 V56 H98 L108,72 V84 Z" className="bd-fill bd-line" />
      <path d="M79,61 H96 L102,72 H79 Z" className="bd-line bd-thin" />
      <g>
        <path d="M104,92 L150,46 L158,52 L112,98 Z" className="bd-fill bd-line" />
        <g>
          <path d="M150,44 L160,48 L178,104 L168,108 Z" className="bd-fill bd-line" />
          <g>
            <path d="M166,104 L182,100 Q190,116 176,124 L162,120 Z" className="bd-accent" />
            <animateTransform attributeName="transform" type="rotate" values={`-20 172 106;10 172 106;60 172 106;-10 172 106;-20 172 106`} keyTimes={kt} calcMode="spline" keySplines={spl} dur="6s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="rotate" values={`-20 154 48;0 154 48;18 154 48;26 154 48;-20 154 48`} keyTimes={kt} calcMode="spline" keySplines={spl} dur="6s" repeatCount="indefinite" />
        </g>
        <animateTransform attributeName="transform" type="rotate" values={`-6 108 96;8 108 96;6 108 96;-10 108 96;-6 108 96`} keyTimes={kt} calcMode="spline" keySplines={spl} dur="6s" repeatCount="indefinite" />
      </g>
    </svg>
  );
}

/** A loose length of steel or a rebar bundle bobbing gently, as if hanging from a sling. */
function Floater({ kind, style }: { kind: "beam" | "rebar"; style: CSSProperties }) {
  return (
    <div className="bd-float absolute" style={style}>
      <svg viewBox="0 0 120 40" className="h-10 w-[120px]" fill="none">
        <path d="M60,0 L30,16 M60,0 L90,16" className="bd-line bd-hair" />
        {kind === "beam" ? (
          <IBeam x={10} y={16} w={100} />
        ) : (
          <g>
            {[18, 22, 26, 30].map((y) => (
              <path key={y} d={`M10,${y} H110`} className="bd-line" />
            ))}
            <path d="M30,16 V32 M90,16 V32" className="bd-accent-line" />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * Construction going on quietly behind the landing page, down both margins: a tower crane
 * carrying a beam, a builder's hoist running up its mast, a transit mixer, an excavator, and
 * steel hanging from slings. Light line drawings so the content stays clean; desktop only,
 * where there's margin to put them in.
 */
export function LandingBackdrop() {
  return (
    <div aria-hidden className="landing-backdrop pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      <div className="absolute -left-2 top-[29%]">
        <MarginCrane />
      </div>
      <div className="absolute -right-8 top-[38%]">
        <Hoist />
      </div>
      <div className="absolute -left-10 top-[62%]">
        <MixerDrum />
      </div>
      <div className="absolute -right-14 top-[79%]">
        <Digger />
      </div>
      <Floater kind="beam" style={{ left: "1.5%", top: "48%", animationDelay: "-2s" }} />
      <Floater kind="rebar" style={{ right: "2%", top: "30%", animationDelay: "-5s" }} />
      <Floater kind="rebar" style={{ left: "2%", top: "74%", animationDelay: "-1s" }} />
      <Floater kind="beam" style={{ right: "1%", top: "66%", animationDelay: "-7s" }} />
    </div>
  );
}
