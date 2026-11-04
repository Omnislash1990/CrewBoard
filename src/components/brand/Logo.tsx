type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmark?: boolean;
  inverted?: boolean;
};

export function Logo({
  className = "",
  markClassName = "h-8 w-8",
  wordmark = true,
  inverted = false,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-orange-700 text-white shadow-sm ${markClassName}`}
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="h-[58%] w-[58%]" fill="none">
          <rect
            x="6"
            y="7"
            width="20"
            height="18"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <path
            d="M11 7.5V6.2A1.2 1.2 0 0 1 12.2 5h7.6A1.2 1.2 0 0 1 21 6.2V7.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M11 14h10M11 18.5h7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {wordmark ? (
        <span
          className={`font-[family-name:var(--font-barlow)] text-lg font-semibold tracking-tight ${
            inverted ? "text-white" : "text-stone-900"
          }`}
        >
          CrewBoard
        </span>
      ) : null}
    </div>
  );
}
