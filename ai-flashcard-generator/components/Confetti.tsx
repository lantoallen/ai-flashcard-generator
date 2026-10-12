import type { CSSProperties } from 'react';

const COLORS = ['var(--primary)', 'var(--coral)', 'var(--sun)', 'var(--mint)', 'var(--sky)'];

// Deterministic "random" so the component stays pure.
function r(i: number, seed: number) {
  const x = Math.sin((i + 1) * seed) * 10000;
  return x - Math.floor(x);
}

/** A one-shot burst of confetti. Mount it when something worth celebrating happens. */
export default function Confetti({ count = 44 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="confetti"
          style={
            {
              left: `${r(i, 12.9898) * 100}%`,
              background: COLORS[i % COLORS.length],
              animationDelay: `${r(i, 78.233) * 0.5}s`,
              animationDuration: `${2.2 + r(i, 37.719) * 1.6}s`,
              '--drift': `${(r(i, 4.137) - 0.5) * 220}px`,
              '--spin': `${360 + r(i, 9.731) * 720}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
