export default function AgriCureLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Green background */}
      <rect width="100" height="100" rx="20" fill="#2e7d32" />
      
      {/* White A Letter - Left stroke */}
      <path
        d="M 25 75 L 50 20"
        stroke="white"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* White A Letter - Right stroke */}
      <path
        d="M 50 20 L 75 75"
        stroke="white"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* White A Letter - Crossbar */}
      <line
        x1="32"
        y1="55"
        x2="68"
        y2="55"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
      />
      
      {/* Left white leaf */}
      <ellipse
        cx="40"
        cy="40"
        rx="11"
        ry="18"
        fill="white"
        transform="rotate(-35 40 40)"
      />
      
      {/* Right white leaf */}
      <ellipse
        cx="65"
        cy="60"
        rx="12"
        ry="19"
        fill="white"
        transform="rotate(40 65 60)"
      />
    </svg>
  );
}
