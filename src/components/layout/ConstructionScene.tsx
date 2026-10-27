"use client";

import { useEffect, useRef } from "react";

/** Endless SVG rotation around (cx, cy) in the element's own coordinates. */
function Spin({ cx, cy, dur }: { cx: number; cy: number; dur: string }) {
  return <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur={dur} repeatCount="indefinite" />;
}

/** Swing between angles around a pivot, eased, in a loop. */
function Swing({ values, pivot, dur }: { values: number[]; pivot: [number, number]; dur: string }) {
  const v = values.map((a) => `${a} ${pivot[0]} ${pivot[1]}`).join(";");
  const splines = Array(values.length - 1).fill("0.45 0 0.55 1").join(";");
  return <animateTransform attributeName="transform" type="rotate" values={v} dur={dur} repeatCount="indefinite" calcMode="spline" keySplines={splines} />;
}

function Wheel({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#1c1917" />
      <g>
        <circle cx={x} cy={y} r={r * 0.5} fill="#a8a29e" />
        <rect x={x - r * 0.12} y={y - r * 0.5} width={r * 0.24} height={r} fill="#57534e" />
        <rect x={x - r * 0.5} y={y - r * 0.12} width={r} height={r * 0.24} fill="#57534e" />
        <Spin cx={x} cy={y} dur="0.9s" />
      </g>
    </g>
  );
}

function Puff({ x, y, delay, dur = "3s", r = 6 }: { x: number; y: number; delay: string; dur?: string; r?: number }) {
  return (
    <circle cx={x} cy={y} r={r} className="scene-dust" opacity="0">
      <animate attributeName="opacity" values="0;0.55;0" dur={dur} begin={delay} repeatCount="indefinite" />
      <animate attributeName="r" values={`${r * 0.4};${r * 1.6}`} dur={dur} begin={delay} repeatCount="indefinite" />
      <animate attributeName="cy" values={`${y};${y - 26}`} dur={dur} begin={delay} repeatCount="indefinite" />
    </circle>
  );
}

function Excavator() {
  return (
    <g>
      {/* Tracks */}
      <rect x="-72" y="-26" width="144" height="26" rx="13" fill="#292524" />
      {[-50, -25, 0, 25, 50].map((x) => (
        <circle key={x} cx={x} cy="-13" r="7" fill="#57534e" />
      ))}
      {/* Body, counterweight, exhaust */}
      <rect x="-70" y="-56" width="22" height="28" rx="4" fill="#d97706" />
      <rect x="-60" y="-60" width="100" height="34" rx="5" fill="#f59e0b" />
      <rect x="-48" y="-78" width="6" height="18" fill="#44403c" />
      <Puff x={-45} y={-84} delay="0s" />
      <Puff x={-45} y={-84} delay="1.5s" />
      {/* Cab */}
      <rect x="-12" y="-100" width="44" height="42" rx="5" fill="#fbbf24" />
      <rect x="-4" y="-94" width="30" height="24" rx="2" fill="#7dd3fc" opacity="0.9" />
      {/* Boom → stick → bucket, each swinging around its own joint */}
      <g>
        <path d="M30,-62 L122,-134 L138,-120 L44,-46 Z" fill="#f59e0b" />
        <path d="M52,-62 L118,-112" stroke="#a8a29e" strokeWidth="5" strokeLinecap="round" />
        <g>
          <path d="M120,-132 L138,-122 L172,-44 L156,-38 Z" fill="#d97706" />
          <g>
            <path d="M154,-48 L182,-42 L180,-18 Q168,-6 150,-16 Z" fill="#57534e" />
            <path d="M152,-16 l-4,8 M160,-12 l-3,9 M168,-10 l-2,9" stroke="#57534e" strokeWidth="3" strokeLinecap="round" />
            <Swing values={[0, 30, 30, -20, 0]} pivot={[164, -42]} dur="7s" />
          </g>
          <Swing values={[0, 22, 22, -8, 0]} pivot={[129, -127]} dur="7s" />
        </g>
        <Swing values={[0, 6, -16, -16, 0]} pivot={[37, -54]} dur="7s" />
      </g>
    </g>
  );
}

function DumpTruck() {
  return (
    <g>
      <rect x="-96" y="-34" width="190" height="16" rx="3" fill="#44403c" />
      {/* Bed with a load of dirt */}
      <path d="M-82,-70 Q-60,-92 -20,-88 Q20,-94 40,-72 Z" fill="#92400e" />
      <path d="M-96,-74 L46,-74 L40,-34 L-90,-34 Z" fill="#f97316" />
      <path d="M-86,-64 L36,-64 M-84,-52 L34,-52" stroke="#ea580c" strokeWidth="3" />
      {/* Cab */}
      <path d="M52,-34 L52,-80 L80,-80 L96,-56 L96,-34 Z" fill="#ea580c" />
      <path d="M60,-74 L78,-74 L88,-58 L60,-58 Z" fill="#7dd3fc" opacity="0.9" />
      <rect x="92" y="-44" width="6" height="6" rx="1" fill="#fde68a" />
      <Wheel x={-62} y={-14} r={15} />
      <Wheel x={-28} y={-14} r={15} />
      <Wheel x={70} y={-14} r={15} />
    </g>
  );
}

function Bulldozer() {
  return (
    <g>
      <rect x="-62" y="-24" width="116" height="24" rx="12" fill="#292524" />
      {[-42, -18, 6, 30].map((x) => (
        <circle key={x} cx={x} cy="-12" r="6" fill="#57534e" />
      ))}
      <rect x="-50" y="-58" width="86" height="34" rx="5" fill="#f59e0b" />
      <rect x="-44" y="-92" width="38" height="34" rx="4" fill="#fbbf24" />
      <rect x="-37" y="-86" width="24" height="20" rx="2" fill="#7dd3fc" opacity="0.9" />
      <rect x="14" y="-76" width="6" height="18" fill="#44403c" />
      <path d="M30,-40 L60,-30" stroke="#57534e" strokeWidth="7" strokeLinecap="round" />
      {/* Blade and the dirt it pushes */}
      <path d="M58,-52 Q72,-26 60,0 L70,0 Q82,-26 68,-54 Z" fill="#57534e" />
      <path d="M72,0 Q92,-34 128,0 Z" fill="#a16207" />
      <Puff x={110} y={-6} delay="0.4s" dur="2.4s" r={7} />
      <Puff x={128} y={-4} delay="1.6s" dur="2.4s" r={6} />
    </g>
  );
}

function TowerCrane() {
  const mast = Array.from({ length: 9 }, (_, i) => 200 - i * 20);
  return (
    <g className="scene-far">
      {/* Building going up next to it */}
      <rect x="880" y="96" width="150" height="104" className="scene-mid" />
      {[116, 140, 164].map((y) => (
        <rect key={y} x="892" y={y} width="126" height="10" className="scene-window" />
      ))}
      <path d="M880,96 L880,60 M930,96 L930,60 M980,96 L980,60 M1030,96 L1030,60 M880,72 L1030,72" className="scene-line" />
      {/* Mast */}
      <path d="M816,200 L816,26 M836,200 L836,26" className="scene-line" strokeWidth="3" />
      {mast.map((y) => (
        <path key={y} d={`M816,${y} L836,${y - 20} M836,${y} L816,${y - 20}`} className="scene-line" />
      ))}
      {/* Jib, counter-jib, cab */}
      <path d="M720,30 L1060,30 M760,30 L826,8 L1000,30" className="scene-line" strokeWidth="3" />
      <rect x="722" y="30" width="30" height="16" className="scene-mid" />
      <rect x="812" y="30" width="28" height="18" rx="3" fill="#f59e0b" />
      {/* Trolley, cable and a beam going up and down */}
      <g>
        <rect x="-8" y="30" width="16" height="6" fill="#f59e0b" />
        <line x1="0" y1="36" x2="0" y2="120" className="scene-line">
          <animate attributeName="y2" values="120;70;70;120;120" dur="12s" repeatCount="indefinite" />
        </line>
        <g>
          <rect x="-26" y="120" width="52" height="8" rx="1" fill="#ea580c" />
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -50;0 -50;0 0;0 0" dur="12s" repeatCount="indefinite" />
        </g>
        <animateTransform attributeName="transform" type="translate" values="900 0;900 0;1000 0;1000 0;900 0" dur="12s" repeatCount="indefinite" />
      </g>
    </g>
  );
}

/**
 * Decorative construction site for the footer: an excavator digging, a dump truck driving
 * through, a bulldozer pushing dirt and a tower crane lifting a beam. Pauses when off-screen
 * and stays still for people who prefer reduced motion.
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
    <svg ref={svg} aria-hidden viewBox="0 0 1440 260" preserveAspectRatio="xMinYMax slice" className="pointer-events-none absolute inset-x-0 bottom-0 h-[190px] w-full sm:h-[260px]">
      {/* Sun and drifting clouds */}
      <circle cx="1170" cy="64" r="34" className="scene-sun" />
      <g className="scene-cloud">
        <path d="M0,0 q10,-18 30,-10 q12,-16 30,-4 q18,-2 18,14 h-84 z" transform="translate(180 70)" />
        <path d="M0,0 q10,-14 26,-8 q12,-12 26,-2 q14,0 14,10 h-70 z" transform="translate(620 50)" />
        <path d="M0,0 q10,-18 30,-10 q12,-16 30,-4 q18,-2 18,14 h-84 z" transform="translate(1020 116)" />
        <animateTransform attributeName="transform" type="translate" values="-60 0;60 0;-60 0" dur="60s" repeatCount="indefinite" />
      </g>
      {/* Distant hills */}
      <path d="M0,200 Q140,130 300,170 T620,160 T960,175 T1240,150 T1440,170 V200 H0 Z" className="scene-hill" />

      <g transform="translate(-50 0)">
        <TowerCrane />
      </g>

      {/* Ground */}
      <rect x="0" y="198" width="1440" height="62" className="scene-ground" />
      <rect x="0" y="198" width="1440" height="4" className="scene-ground-edge" />
      <path d="M0,214 H1440" className="scene-tracks" strokeDasharray="14 10" />

      {/* Dirt pile and cones by the excavator */}
      <path d="M470,200 Q540,138 610,200 Z" fill="#a16207" />
      <path d="M500,200 Q545,160 590,200 Z" fill="#92400e" />
      {[660, 700].map((x) => (
        <path key={x} d={`M${x - 9},200 L${x},176 L${x + 9},200 Z`} fill="#f97316" />
      ))}

      <g transform="translate(330 200)">
        <Excavator />
      </g>
      <Puff x={500} y={192} delay="2.6s" dur="2.5s" r={8} />

      <g transform="translate(1090 200)">
        <g>
          <Bulldozer />
          <animateTransform attributeName="transform" type="translate" values="-60 0;40 0;40 0;-60 0;-60 0" dur="9s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1;0 0 1 1" />
        </g>
      </g>

      <g transform="translate(0 202)">
        <g>
          <DumpTruck />
          <animateTransform attributeName="transform" type="translate" values="-220 0;1660 0" dur="20s" repeatCount="indefinite" />
        </g>
      </g>
    </svg>
  );
}
