export default function AgriCureLogo({ className = "w-10 h-10" }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Simple leaf mark */}
      <path
        d="M12 2c0 0-3 4-3 6c0 2 1.5 3 3 3c1.5 0 3-1 3-3c0-2-3-6-3-6z"
        fill="#2e7d32"
      />
      <path
        d="M12 6l-2 3l4 0Z"
        fill="#1b5e20"
      />
    </svg>
  );
}
