export default function AgriCureLogo({ className = "w-10 h-10" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="leafGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#4CAF50", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#2E7D32", stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="leafGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#66BB6A", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#43A047", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="shine">
          <stop offset="0%" style={{ stopColor: "white", stopOpacity: 0.4 }} />
          <stop offset="70%" style={{ stopColor: "white", stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: "white", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* Glow effect background */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="#4CAF50" strokeWidth="3" opacity="0.2" filter="url(#glow)" />

      {/* A Letter with Leaf */}
      {/* Left stroke of A */}
      <path
        d="M 50 150 L 100 30 L 100 30"
        stroke="#1b5e20"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Right stroke of A */}
      <path
        d="M 100 30 L 150 150"
        stroke="#1b5e20"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Crossbar of A */}
      <line
        x1="65"
        y1="110"
        x2="135"
        y2="110"
        stroke="#1b5e20"
        strokeWidth="16"
        strokeLinecap="round"
        filter="url(#glow)"
      />

      {/* Top leaf (left) */}
      <ellipse
        cx="85"
        cy="75"
        rx="24"
        ry="35"
        fill="url(#leafGradient1)"
        transform="rotate(-40 85 75)"
        filter="url(#glow)"
      />

      {/* Bottom leaf (right) */}
      <ellipse
        cx="130"
        cy="120"
        rx="28"
        ry="38"
        fill="url(#leafGradient2)"
        transform="rotate(35 130 120)"
        filter="url(#glow)"
      />

      {/* Shine/glitter effect on top leaf */}
      <ellipse
        cx="75"
        cy="55"
        rx="12"
        ry="16"
        fill="url(#shine)"
        transform="rotate(-40 75 55)"
      />

      {/* Shine/glitter effect on bottom leaf */}
      <ellipse
        cx="125"
        cy="105"
        rx="14"
        ry="18"
        fill="url(#shine)"
        transform="rotate(35 125 105)"
      />
    </svg>
  );
}
