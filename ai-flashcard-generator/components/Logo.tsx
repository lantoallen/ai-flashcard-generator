import { useId } from 'react';

/** Two stacked flashcards with a spark, on a gradient tile. */
export function LogoMark({ size = 36 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="2" y1="2" x2="30" y2="30">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <rect
        x="8.5"
        y="6.5"
        width="15"
        height="19"
        rx="3"
        fill="#fff"
        fillOpacity="0.5"
        transform="rotate(-12 16 16)"
      />
      <rect
        x="8.5"
        y="6.5"
        width="15"
        height="19"
        rx="3"
        fill="#fff"
        transform="rotate(5 16 16)"
      />
      <path
        d="M16 11.2l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z"
        fill={`url(#${gradientId})`}
        transform="rotate(5 16 16)"
      />
    </svg>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-xl font-bold tracking-tight">
        Flash<span className="brand-text">ly</span>
      </span>
    </span>
  );
}
