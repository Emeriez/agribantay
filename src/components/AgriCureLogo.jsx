export default function AgriCureLogo({ className = "w-10 h-10" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* A Letter with Leaf - Clean Monochromatic Design */}
      
      {/* Left stroke of A */}
      <path
        d="M 50 150 L 100 30"
        stroke="#1b5e20"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right stroke of A */}
      <path
        d="M 100 30 L 150 150"
        stroke="#1b5e20"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      />

      {/* Top leaf (left) */}
      <ellipse
        cx="85"
        cy="75"
        rx="24"
        ry="35"
        fill="#2e7d32"
        transform="rotate(-40 85 75)"
      />

      {/* Bottom leaf (right) */}
      <ellipse
        cx="130"
        cy="120"
        rx="28"
        ry="38"
        fill="#2e7d32"
        transform="rotate(35 130 120)"
      />
    </svg>
  );
}
