export default function AgriCureLogo({ className = "w-10 h-10" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: "#1b5e20" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* A Letter - Left stroke */}
      <path
        d="M 50 150 L 100 30"
        stroke="#1b5e20"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeWidth: "20px", stroke: "#1b5e20" }}
      />

      {/* A Letter - Right stroke */}
      <path
        d="M 100 30 L 150 150"
        stroke="#1b5e20"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeWidth: "20px", stroke: "#1b5e20" }}
      />

      {/* A Letter - Crossbar */}
      <line
        x1="65"
        y1="110"
        x2="135"
        y2="110"
        stroke="#1b5e20"
        strokeWidth="18"
        strokeLinecap="round"
        style={{ strokeWidth: "18px", stroke: "#1b5e20" }}
      />

      {/* Left Leaf */}
      <ellipse
        cx="85"
        cy="75"
        rx="24"
        ry="35"
        fill="#2e7d32"
        transform="rotate(-40 85 75)"
        style={{ fill: "#2e7d32" }}
      />

      {/* Right Leaf */}
      <ellipse
        cx="130"
        cy="120"
        rx="28"
        ry="38"
        fill="#2e7d32"
        transform="rotate(35 130 120)"
        style={{ fill: "#2e7d32" }}
      />
    </svg>
  );
}
