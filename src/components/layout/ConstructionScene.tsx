"use client";

import { useEffect, useRef } from "react";

// Cycle lengths: excavator dig-and-cast, dozer push-and-return (seconds).
const DIG = "9s";
const PUSH = "16s";
const EASE = "0.45 0 0.55 1";

/** Rotation about a pivot through the given angles, eased between keyframes, looping. */
function Rotate({ values, keyTimes, pivot, dur }: { values: number[]; keyTimes: number[]; pivot: [number, number]; dur: string }) {
  return (
    <animateTransform
      attributeName="transform"
      type="rotate"
      values={values.map((a) => `${a} ${pivot[0]} ${pivot[1]}`).join(";")}
      keyTimes={keyTimes.join(";")}
      calcMode="spline"
      keySplines={Array(values.length - 1).fill(EASE).join(";")}
      dur={dur}
      repeatCount="indefinite"
    />
  );
}

function Spin({ cx, cy, dur }: { cx: number; cy: number; dur: string }) {
  return <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur={dur} repeatCount="indefinite" />;
}

/** Diesel smoke or dust: a puff that rises, spreads and fades. */
function Puff({ x, y, begin, dur = "2.6s", r = 5, rise = 22, drift = -8, className = "day-smoke" }: { x: number; y: number; begin: string; dur?: string; r?: number; rise?: number; drift?: number; className?: string }) {
  return (
    <circle cx={x} cy={y} r={r} className={className} opacity="0" filter="url(#soft)">
      <animate attributeName="opacity" values="0;0.55;0" dur={dur} begin={begin} repeatCount="indefinite" />
      <animate attributeName="r" values={`${r * 0.4};${r * 1.8}`} dur={dur} begin={begin} repeatCount="indefinite" />
      <animate attributeName="cy" values={`${y};${y - rise}`} dur={dur} begin={begin} repeatCount="indefinite" />
      <animate attributeName="cx" values={`${x};${x + drift}`} dur={dur} begin={begin} repeatCount="indefinite" />
    </circle>
  );
}

/** Crawler track: belt with grousers, idler, sprocket and bottom rollers. */
function Track({ x1, x2, h, run }: { x1: number; x2: number; h: number; run?: { values: string; keyTimes: string; dur: string } }) {
  const r = h / 2;
  const belt = `M${x1 + r},${-h} H${x2 - r} A${r},${r} 0 0 1 ${x2 - r},0 H${x1 + r} A${r},${r} 0 0 1 ${x1 + r},${-h} Z`;
  const rollers = Array.from({ length: 4 }, (_, i) => x1 + r + 8 + (i * (x2 - x1 - 2 * r - 16)) / 3);
  return (
    <g>
      <path d={belt} fill="#26231f" />
      <path d={belt} fill="none" stroke="#4a443c" strokeWidth="3" strokeDasharray="3 3">
        {run && <animate attributeName="stroke-dashoffset" values={run.values} keyTimes={run.keyTimes} dur={run.dur} repeatCount="indefinite" />}
      </path>
      <rect x={x1 + r - 2} y={-h + 5} width={x2 - x1 - 2 * r + 4} height={h - 10} rx="3" fill="#3a3530" />
      {[x1 + r, x2 - r].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={-r} r={r - 4} fill="#4a443d" />
          <circle cx={cx} cy={-r} r={r / 3} fill="#2a2622" />
        </g>
      ))}
      {rollers.map((cx) => (
        <circle key={cx} cx={cx} cy={-5} r="4" fill="#4a443d" />
      ))}
    </g>
  );
}

function Excavator() {
  // Joint angles: [reach, dig, curl, lift, dump, hold, reach]
  const kt = [0, 0.22, 0.4, 0.6, 0.72, 0.86, 1];
  const boom = [-4, 13, 11, -16, -16, -16, -4];
  const stick = [-26, -6, 14, 38, 38, 38, -26];
  const bucket = [-24, 0, 72, 72, -18, -18, -24];
  return (
    <g>
      <ellipse cx="0" cy="1" rx="96" ry="6" fill="#3a2614" opacity="0.35" filter="url(#soft)" />
      <Track x1={-80} x2={80} h={26} />
      <rect x="-30" y="-33" width="60" height="8" fill="#2c2925" />
      {/* Upper house, counterweight, engine cover */}
      <path d="M-82,-34 H38 V-74 H-46 Q-82,-74 -82,-56 Z" fill="url(#yellowBody)" />
      <path d="M-94,-36 Q-100,-36 -100,-46 V-60 Q-100,-68 -90,-68 H-76 V-36 Z" fill="url(#yellowShade)" />
      <path d="M-70,-68 H-24 M-70,-63 H-24 M-70,-58 H-24" stroke="#a87404" strokeWidth="1.4" />
      <path d="M-82,-38 H38" stroke="#1f1d1a" strokeWidth="2.5" opacity="0.5" />
      <rect x="-52" y="-90" width="6" height="16" rx="1" fill="#2b2926" />
      <Puff x={-49} y={-94} begin="0s" />
      <Puff x={-49} y={-94} begin="1.3s" />
      {/* Cab */}
      <path d="M-6,-74 V-114 Q-6,-120 0,-120 H26 L38,-104 V-74 Z" fill="url(#yellowBody)" />
      <path d="M0,-114 H24 L33,-102 V-80 H0 Z" fill="url(#glass)" />
      <path d="M6,-114 L14,-114 L2,-90 L0,-90 Z" fill="#fff" opacity="0.28" />
      <path d="M12,-114 V-80" stroke="#2b2926" strokeWidth="1.5" />

      {/* Boom → stick → bucket, each turning about its own pin */}
      <g>
        <path d="M30,-50 L66,-92" stroke="#2b2926" strokeWidth="6" strokeLinecap="round" />
        <path d="M34,-55 L58,-83" stroke="#c9ccd0" strokeWidth="3" strokeLinecap="round" />
        <path d="M34,-54 L44,-70 Q88,-140 148,-148 L158,-134 Q100,-124 52,-50 Z" fill="url(#yellowBody)" />
        <path d="M46,-66 Q92,-132 150,-142" stroke="#a87404" strokeWidth="1.4" fill="none" />
        <g>
          <path d="M143,-154 L163,-147 L205,-48 L187,-39 Z" fill="url(#yellowShade)" />
          <path d="M156,-148 L174,-158 L184,-150" stroke="#2b2926" strokeWidth="4" fill="none" strokeLinecap="round" />
          <g>
            <path d="M190,-50 L206,-46 Q222,-26 208,-8 L182,-6 Q174,-18 184,-30 Z" fill="#3a3632" />
            <path d="M184,-8 l-5,7 M192,-7 l-4,8 M200,-7 l-3,8" stroke="#3a3632" strokeWidth="3" strokeLinecap="round" />
            {/* Load of soil, there between digging and dumping */}
            <path d="M184,-30 Q196,-46 208,-36 Q216,-24 206,-14 Z" fill="#8a5a33" opacity="0">
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.3;0.38;0.7;0.74;1" dur={DIG} repeatCount="indefinite" />
            </path>
            <Rotate values={bucket} keyTimes={kt} pivot={[197, -45]} dur={DIG} />
          </g>
          <Rotate values={stick} keyTimes={kt} pivot={[153, -146]} dur={DIG} />
        </g>
        <Rotate values={boom} keyTimes={kt} pivot={[42, -58]} dur={DIG} />
      </g>
    </g>
  );
}

function Bulldozer() {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="82" ry="6" fill="#3a2614" opacity="0.35" filter="url(#soft)" />
      {/* Ripper at the back */}
      <path d="M-62,-30 L-76,-30 L-80,2 L-74,2 L-68,-22 Z" fill="#3a3632" />
      <Track x1={-66} x2={56} h={24} run={{ values: "0;-150;-150;0;0", keyTimes: "0;0.55;0.62;0.9;1", dur: PUSH }} />
      {/* Engine hood and radiator */}
      <path d="M-14,-24 H56 V-50 Q56,-56 50,-56 H-10 Z" fill="url(#yellowBody)" />
      <rect x="48" y="-52" width="8" height="26" fill="#2b2926" />
      <path d="M0,-50 H40 M0,-45 H40" stroke="#a87404" strokeWidth="1.3" />
      <rect x="20" y="-72" width="5" height="16" rx="1" fill="#2b2926" />
      <Puff x={22} y={-76} begin="0.4s" />
      <Puff x={22} y={-76} begin="1.7s" />
      {/* Cab with roll-over frame */}
      <path d="M-58,-24 V-88 H-8 V-24 Z" fill="url(#yellowBody)" />
      <rect x="-62" y="-96" width="58" height="8" rx="2" fill="#d99b06" />
      <path d="M-52,-82 H-14 V-50 H-52 Z" fill="url(#glass)" />
      <path d="M-46,-82 L-38,-82 L-50,-58 L-52,-58 Z" fill="#fff" opacity="0.28" />
      {/* Push arm, tilt cylinder and blade */}
      <path d="M-30,-12 H72" stroke="#2b2926" strokeWidth="6" strokeLinecap="round" />
      <path d="M8,-48 L70,-40" stroke="#2b2926" strokeWidth="5" strokeLinecap="round" />
      <path d="M14,-47 L56,-42" stroke="#c9ccd0" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M70,-64 Q88,-32 72,0 H84 Q100,-32 82,-66 Z" fill="url(#yellowShade)" />
      <path d="M72,0 H86" stroke="#2b2926" strokeWidth="3" />
    </g>
  );
}

function TipperTruck() {
  const wheels = [-74, -42, 66];
  return (
    <g>
      <ellipse cx="-10" cy="1" rx="108" ry="5" fill="#3a2614" opacity="0.3" filter="url(#soft)" />
      <rect x="-112" y="-32" width="186" height="10" fill="#2b2926" />
      {/* Tipper body with its load */}
      <path d="M-104,-72 Q-50,-102 26,-72 Z" fill="url(#soil)" />
      <path d="M-116,-30 V-74 H30 L36,-30 Z" fill="url(#tipper)" />
      <path d="M-86,-74 V-32 M-56,-74 V-32 M-26,-74 V-32 M4,-74 V-32" stroke="#a8461a" strokeWidth="2" />
      <path d="M-116,-60 H32" stroke="#a8461a" strokeWidth="1.5" />
      {/* Cab */}
      <path d="M40,-30 V-84 Q40,-92 48,-92 H72 Q80,-92 84,-82 L94,-58 V-30 Z" fill="url(#cab)" />
      <path d="M66,-86 H74 L86,-60 H66 Z" fill="url(#glass)" />
      <path d="M46,-86 H60 V-62 H46 Z" fill="url(#glass)" />
      <rect x="88" y="-46" width="8" height="5" rx="1" fill="#fff7d6" />
      <rect x="40" y="-30" width="58" height="6" fill="#2b2926" />
      {wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="-15" r="15" fill="#1d1b19" />
          <circle cx={cx} cy="-15" r="15" fill="none" stroke="#2e2a26" strokeWidth="3" strokeDasharray="2 3" />
          <g>
            <circle cx={cx} cy="-15" r="7" fill="#9b968e" />
            <path d={`M${cx - 6},-15 H${cx + 6} M${cx},-21 V-9`} stroke="#5b5650" strokeWidth="2" />
            <Spin cx={cx} cy={-15} dur="0.7s" />
          </g>
        </g>
      ))}
      <Puff x={-118} y={-6} begin="0s" dur="2.2s" r={7} rise={14} drift={-30} className="day-dust" />
      <Puff x={-118} y={-6} begin="1.1s" dur="2.2s" r={6} rise={12} drift={-26} className="day-dust" />
    </g>
  );
}

/** A bird gliding, wings beating every so often. */
function Bird({ x, y, scale = 1, begin }: { x: number; y: number; scale?: number; begin: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-7,0 Q-3,-4 0,0 Q3,-4 7,0" fill="none" stroke="#4b5560" strokeWidth="1.4" strokeLinecap="round">
        <animate attributeName="d" values="M-7,0 Q-3,-4 0,0 Q3,-4 7,0;M-7,2 Q-3,3 0,0 Q3,3 7,2;M-7,0 Q-3,-4 0,0 Q3,-4 7,0" dur="0.7s" begin={begin} repeatCount="indefinite" />
      </path>
    </g>
  );
}

/** Banksman in hi-vis guiding the excavator, signalling arm going up and down. */
function Banksman() {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="12" ry="3" fill="#3a2614" opacity="0.3" filter="url(#soft)" />
      <path d="M-4,0 L-3,-24 M4,0 L3,-24" stroke="#2d3138" strokeWidth="5" strokeLinecap="round" />
      <path d="M-7,-24 L-6,-46 Q0,-50 6,-46 L7,-24 Z" fill="#f26b1d" />
      <path d="M-7,-32 H7 M-6.5,-40 H6.5" stroke="#e9eef2" strokeWidth="2" />
      <path d="M-6,-44 L-10,-28" stroke="#f26b1d" strokeWidth="4" strokeLinecap="round" />
      <g>
        <path d="M6,-44 L16,-48" stroke="#f26b1d" strokeWidth="4" strokeLinecap="round" />
        <circle cx="17" cy="-48.5" r="2" fill="#d9a77c" />
        <animateTransform attributeName="transform" type="rotate" values="20 6 -44;-40 6 -44;20 6 -44" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
      </g>
      <circle cx="0" cy="-52" r="5" fill="#d9a77c" />
      <path d="M-7,-54 Q0,-63 7,-54 H8 V-52 H-8 V-54 Z" fill="#fbfbf7" />
    </g>
  );
}

/** Transit mixer: the drum keeps turning, its painted bands sliding round. */
function MixerTruck() {
  const wheels = [-70, -40, 60];
  return (
    <g>
      <ellipse cx="-10" cy="1" rx="104" ry="5" fill="#3a2614" opacity="0.3" filter="url(#soft)" />
      <rect x="-104" y="-32" width="176" height="10" fill="#2b2926" />
      <g transform="rotate(-12 -30 -58)">
        <clipPath id="drumClip">
          <ellipse cx="-30" cy="-58" rx="66" ry="27" />
        </clipPath>
        <ellipse cx="-30" cy="-58" rx="66" ry="27" fill="url(#drum)" />
        <g clipPath="url(#drumClip)">
          <g>
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i} d={`M${-110 + i * 26},-90 l18,0 l-30,64 l-18,0 Z`} fill="#e8590c" opacity="0.85" />
            ))}
            <animateTransform attributeName="transform" type="translate" values="0 0;26 0" dur="1.2s" repeatCount="indefinite" />
          </g>
        </g>
        <ellipse cx="-30" cy="-58" rx="66" ry="27" fill="none" stroke="#8d8a85" strokeWidth="1.5" />
      </g>
      <path d="M-100,-40 L-112,-58 L-100,-60 Z" fill="#6b6660" />
      <path d="M40,-30 V-84 Q40,-92 48,-92 H70 Q78,-92 82,-82 L92,-58 V-30 Z" fill="url(#cab)" />
      <path d="M64,-86 H72 L84,-60 H64 Z" fill="url(#glass)" />
      <path d="M46,-86 H58 V-62 H46 Z" fill="url(#glass)" />
      <rect x="86" y="-46" width="8" height="5" rx="1" fill="#fff7d6" />
      {wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="-15" r="15" fill="#1d1b19" />
          <g>
            <circle cx={cx} cy="-15" r="7" fill="#9b968e" />
            <path d={`M${cx - 6},-15 H${cx + 6} M${cx},-21 V-9`} stroke="#5b5650" strokeWidth="2" />
            <Spin cx={cx} cy={-15} dur="0.7s" />
          </g>
        </g>
      ))}
    </g>
  );
}

/** Tower crane on the next plot, trolleying a bundle of steel back and forth. */
function DistantCrane() {
  const mx = 1150;
  const top = 46;
  let mastPath = `M${mx},170 V${top} M${mx + 10},170 V${top}`;
  for (let y = 170, i = 0; y > top; y -= 10, i++) mastPath += i % 2 ? ` M${mx},${y} L${mx + 10},${y - 10}` : ` M${mx + 10},${y} L${mx},${y - 10}`;
  let jib = `M${mx - 90},${top} H${mx + 230} M${mx + 10},${top - 7} L${mx + 230},${top - 1}`;
  for (let x = mx + 10, i = 0; x < mx + 230; x += 12, i++) jib += i % 2 ? ` M${x},${top - 7 + (x - mx) * 0.027} L${x + 12},${top}` : ` M${x},${top} L${x + 12},${top - 7 + (x + 12 - mx) * 0.027}`;
  return (
    <g stroke="#8e9ba3" fill="none" opacity="0.9">
      <path d={mastPath} strokeWidth="1.2" />
      <path d={jib} strokeWidth="1.2" />
      <path d={`M${mx + 5},${top} V${top - 26} L${mx + 180},${top - 3} M${mx + 5},${top - 26} L${mx - 80},${top - 2}`} strokeWidth="0.9" />
      <rect x={mx - 88} y={top} width="26" height="12" fill="#a3aeb4" stroke="none" />
      <rect x={mx + 10} y={top} width="12" height="9" fill="#e8a33a" stroke="none" />
      <g>
        <rect x="-6" y={top} width="12" height="4" fill="#8e9ba3" stroke="none" />
        <line x1="0" y1={top + 4} x2="0" y2="140" strokeWidth="0.9">
          <animate attributeName="y2" values="140;90;90;140;140" keyTimes="0;0.3;0.6;0.85;1" dur="20s" repeatCount="indefinite" />
        </line>
        <g>
          <path d="M-14,142 H14 M-14,145 H14" stroke="#7d8a92" strokeWidth="2.5" />
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -50;0 -50;0 0;0 0" keyTimes="0;0.3;0.6;0.85;1" dur="20s" repeatCount="indefinite" />
        </g>
        <animateTransform attributeName="transform" type="translate" values={`${mx + 200} 0;${mx + 200} 0;${mx + 60} 0;${mx + 60} 0;${mx + 200} 0`} keyTimes="0;0.3;0.6;0.85;1" dur="20s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1" />
      </g>
      <circle cx={mx + 5} cy={top - 27} r="2" fill="#e8590c" stroke="none">
        <animate attributeName="opacity" values="1;0.15;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function HumePipes() {
  return (
    <g>
      {[
        [0, -14],
        [28, -14],
        [14, -38],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="14" fill="url(#concrete)" />
          <circle cx={x} cy={y} r="9" fill="#5d5853" />
          <circle cx={x + 1} cy={y + 1} r="8" fill="#4a4540" />
        </g>
      ))}
    </g>
  );
}

function Cone({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 8},0 L${x - 3},-20 H${x + 3} L${x + 8},0 Z`} fill="#f26b1d" />
      <path d={`M${x - 5},-9 H${x + 5}`} stroke="#fff" strokeWidth="3" />
      <rect x={x - 10} y="-2" width="20" height="3" fill="#2b2926" />
    </g>
  );
}

/**
 * Footer backdrop: earthworks on a clear day. An excavator digs a trench and casts the soil
 * onto a spoil heap, a dozer pushes material up to the stockpile, and a loaded tipper runs
 * along the haul road behind. Pauses off-screen and stays still for reduced motion.
 */
export function ConstructionScene() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => (visible && !reduce.matches ? el.unpauseAnimations() : el.pauseAnimations());
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    el.pauseAnimations();
    observer.observe(el);
    reduce.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", sync);
    };
  }, []);

  return (
    <svg ref={svg} aria-hidden viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" className="day-scene pointer-events-none absolute inset-x-0 bottom-0 h-[180px] w-full sm:h-[240px]">
      <defs>
        <linearGradient id="daySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe2f0" stopOpacity="0" />
          <stop offset="0.3" stopColor="#cfe2f0" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f1ede2" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset="0.25" stopColor="#fff3c4" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d2ab7a" />
          <stop offset="0.45" stopColor="#b8875a" />
          <stop offset="1" stopColor="#7d5434" />
        </linearGradient>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8743f" />
          <stop offset="1" stopColor="#6f4626" />
        </linearGradient>
        <linearGradient id="trench" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3a20" />
          <stop offset="1" stopColor="#3b2514" />
        </linearGradient>
        <linearGradient id="yellowBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="0.55" stopColor="#f2b707" />
          <stop offset="1" stopColor="#c98f04" />
        </linearGradient>
        <linearGradient id="yellowShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9a90a" />
          <stop offset="1" stopColor="#b47e03" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a9c9da" />
          <stop offset="0.6" stopColor="#4d7186" />
          <stop offset="1" stopColor="#2c4757" />
        </linearGradient>
        <linearGradient id="tipper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f07a3a" />
          <stop offset="1" stopColor="#c4511c" />
        </linearGradient>
        <linearGradient id="cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfaf5" />
          <stop offset="1" stopColor="#d4d0c4" />
        </linearGradient>
        <linearGradient id="concrete" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9c4bb" />
          <stop offset="1" stopColor="#97918a" />
        </linearGradient>
        <linearGradient id="drum" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f6f2" />
          <stop offset="0.6" stopColor="#d6d3cc" />
          <stop offset="1" stopColor="#a8a49c" />
        </linearGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f0e6" stopOpacity="0" />
          <stop offset="1" stopColor="#f3f0e6" stopOpacity="0.55" />
        </linearGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="cloudBlur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Sky, sun, slow clouds */}
      <rect width="1440" height="180" fill="url(#daySky)" />
      <circle cx="1210" cy="62" r="70" fill="url(#sunGlow)" />
      <g filter="url(#cloudBlur)" fill="#fff" opacity="0.85">
        <g>
          <ellipse cx="240" cy="70" rx="70" ry="13" />
          <ellipse cx="272" cy="60" rx="38" ry="14" />
          <ellipse cx="760" cy="48" rx="90" ry="12" />
          <ellipse cx="800" cy="40" rx="42" ry="12" />
          <ellipse cx="1000" cy="92" rx="60" ry="9" />
          <animateTransform attributeName="transform" type="translate" values="-40 0;60 0;-40 0" dur="120s" repeatCount="indefinite" />
        </g>
      </g>

      <g filter="url(#cloudBlur)" fill="#fff" opacity="0.55">
        <g>
          <ellipse cx="520" cy="26" rx="110" ry="8" />
          <ellipse cx="1320" cy="34" rx="90" ry="7" />
          <ellipse cx="60" cy="30" rx="80" ry="7" />
          <animateTransform attributeName="transform" type="translate" values="0 0;-50 0;0 0" dur="200s" repeatCount="indefinite" />
        </g>
      </g>
      <g>
        <Bird x={0} y={58} begin="0s" />
        <Bird x={22} y={50} scale={0.8} begin="0.2s" />
        <Bird x={40} y={62} scale={0.7} begin="0.35s" />
        <animateTransform attributeName="transform" type="translate" values="-80 0;700 -18;1520 6" dur="46s" repeatCount="indefinite" />
      </g>

      {/* Distant hills, a tree line and another site with a crane */}
      <path d="M0,150 Q120,112 260,130 T560,124 T880,134 T1180,118 T1440,130 V170 H0 Z" fill="#bccbcc" />
      <path d="M150,146 V96 M160,146 V96 M150,96 H230 M126,96 H150 M155,96 V84" stroke="#9aa7aa" strokeWidth="2" fill="none" />
      <rect x="196" y="122" width="56" height="26" fill="#a9b6b7" />
      <path
        d={`M0,160 ${Array.from({ length: 49 }, (_, i) => `Q${i * 30 + 15},${146 - ((i * 7) % 5) * 2} ${(i + 1) * 30},158`).join(" ")} V172 H0 Z`}
        fill="#8fa287"
      />

      {/* Haze over the distance */}
      <rect y="110" width="1440" height="62" fill="url(#haze)" />

      <DistantCrane />

      {/* Ground, haul road, wheel ruts */}
      <rect y="166" width="1440" height="94" fill="url(#ground)" />
      <path d="M0,176 H1440 V186 H0 Z" fill="#dcbb8c" opacity="0.7" />
      <path
        d={Array.from({ length: 70 }, (_, i) => {
          const x = i * 21 + ((i * 13) % 9);
          return `M${x},168 l-3,-7 M${x + 2},168 l0,-9 M${x + 4},168 l3,-6`;
        }).join(" ")}
        stroke="#7f9466"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path d="M0,226 Q360,218 720,228 T1440,224" stroke="#9c6d45" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M0,236 Q380,228 760,238 T1440,232" stroke="#9c6d45" strokeWidth="2" fill="none" opacity="0.4" />

      {/* Transit mixer heading the other way, further back */}
      <g transform="translate(0 180) scale(-0.5 0.5)" opacity="0.9">
        <g>
          <g>
            <MixerTruck />
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.4;0 0.4;0 0" dur="1s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="translate" values="-3100 0;300 0" dur="38s" begin="-14s" repeatCount="indefinite" />
        </g>
      </g>

      {/* Loaded tipper on the haul road */}
      <g transform="translate(0 184) scale(0.54)" opacity="0.92">
        <g>
          <g>
            <TipperTruck />
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.5;0 0.5;0 0" dur="0.9s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="translate" values="-260 0;2260 0" dur="30s" repeatCount="indefinite" />
        </g>
      </g>

      {/* Stockpile the dozer feeds */}
      <path d="M1250,214 Q1330,150 1440,168 V214 Z" fill="url(#soil)" />

      <g transform="translate(560 214)">
        {/* Trench being dug and the spoil heap beside it */}
        <path d="M168,0 L178,22 H262 L272,0 Z" fill="url(#trench)" />
        <path d="M168,0 H272" stroke="#6d4528" strokeWidth="2" />
        <path d="M78,0 Q112,-40 150,0 Z" fill="url(#soil)" />
        <Excavator />
        <Puff x={210} y={-4} begin="1.6s" dur={DIG} r={9} rise={18} drift={14} className="day-dust" />
        {/* Clods dropping onto the heap when the bucket opens */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={108 + i * 9} cy="-70" r={3 - i * 0.5} fill="#7c4f2b" opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;0.72;${0.73 + i * 0.01};0.82;0.84;1`} dur={DIG} repeatCount="indefinite" />
            <animate attributeName="cy" values="-70;-70;-14;-14" keyTimes="0;0.72;0.83;1" dur={DIG} repeatCount="indefinite" />
          </circle>
        ))}
        <g transform="translate(-135 0)">
          <Banksman />
        </g>
        <Cone x={292} />
        <Cone x={322} />
      </g>

      <g transform="translate(350 214)">
        <HumePipes />
      </g>

      {/* Dozer pushing a growing heap to the stockpile, then backing off */}
      <g transform="translate(1040 216)">
        <g>
          <g transform="translate(84 0)">
          <path d="M0,0 Q24,-34 52,0 Z" fill="url(#soil)">
            <animateTransform attributeName="transform" type="scale" values="0.35 0.35;1 1;1 1;0.01 0.01;0.35 0.35" keyTimes="0;0.55;0.6;0.66;1" dur={PUSH} repeatCount="indefinite" />
          </path>
          </g>
          <Bulldozer />
          <Puff x={92} y={-6} begin="0.8s" dur="2.4s" r={8} rise={16} drift={20} className="day-dust" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-60 0;90 0;90 0;-60 0;-60 0"
            keyTimes="0;0.55;0.62;0.9;1"
            calcMode="spline"
            keySplines={`${EASE};0 0 1 1;${EASE};0 0 1 1`}
            dur={PUSH}
            repeatCount="indefinite"
          />
        </g>
      </g>

      {/* Survey peg with a flag */}
      <g transform="translate(296 214)">
        <path d="M0,0 V-46" stroke="#e8e2d4" strokeWidth="3" />
        <path d="M0,-46 V-36" stroke="#d6411e" strokeWidth="3" />
        <path d="M1,-46 L16,-41 L1,-36 Z" fill="#f26b1d" />
      </g>

      {/* Darker soil strip the copyright line sits on */}
      <rect y="232" width="1440" height="28" fill="#6b4528" opacity="0.85" />
    </svg>
  );
}
