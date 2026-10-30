const DUR = "4s";
const EASE = "0.45 0 0.55 1";

function Swing({ values, pivot }: { values: number[]; pivot: [number, number] }) {
  return (
    <animateTransform
      attributeName="transform"
      type="rotate"
      values={values.map((a) => `${a} ${pivot[0]} ${pivot[1]}`).join(";")}
      keyTimes="0;0.35;0.6;0.8;1"
      calcMode="spline"
      keySplines={Array(4).fill(EASE).join(";")}
      dur={DUR}
      repeatCount="indefinite"
    />
  );
}

/** Small excavator scooping at the ground, for empty states ("nothing dug up here yet"). */
export function DiggerIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 80" className={className} aria-hidden fill="none">
      <path d="M4,72 H156" stroke="#d9cfc2" strokeWidth="2" />
      <path d="M100,72 Q114,60 128,72 Z" fill="#c9a77d" />
      {/* Tracks and house */}
      <rect x="22" y="60" width="58" height="12" rx="6" fill="#3a3530" />
      <circle cx="29" cy="66" r="3" fill="#6b6259" />
      <circle cx="73" cy="66" r="3" fill="#6b6259" />
      <path d="M20,58 H76 V42 H34 Q20,42 20,50 Z" fill="#f2b707" />
      <path d="M50,42 V24 H66 L72,34 V42 Z" fill="#f2b707" />
      <path d="M53,27 H64 L68,35 H53 Z" fill="#7fa3b8" />
      <rect x="30" y="34" width="3" height="8" fill="#3a3530" />
      {/* Boom, stick, bucket */}
      <g>
        <path d="M70,46 L96,22 L100,26 L76,50 Z" fill="#e3a806" />
        <g>
          <path d="M95,21 L101,23 L112,54 L106,56 Z" fill="#d49b05" />
          <g>
            <path d="M104,54 L114,52 Q118,62 110,66 L102,64 Z" fill="#4a443d" />
            <Swing values={[-20, 10, 60, -10, -20]} pivot={[109, 55]} />
          </g>
          <Swing values={[-25, 0, 20, 30, -25]} pivot={[98, 23]} />
        </g>
        <Swing values={[-6, 8, 6, -12, -6]} pivot={[72, 48]} />
      </g>
      <circle cx="31" cy="30" r="3" fill="#b9b3ab" opacity="0">
        <animate attributeName="opacity" values="0;0.6;0" dur="2s" repeatCount="indefinite" />
        <animate attributeName="cy" values="30;16" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values="2;5" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
