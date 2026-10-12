import type { Mood } from '@/lib/pet';

/**
 * The study buddy: a little living flashcard. Pure SVG so it works in server
 * and client components. Accessories unlock as `level` grows.
 */
export default function PetFigure({
  mood = 'happy',
  level = 1,
  size = 96,
  animate = true,
  className = '',
}: {
  mood?: Mood;
  level?: number;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const ink = '#1b1033';
  const eyes =
    mood === 'excited' ? (
      <>
        <path d="M34 45 Q39 37 44 45" stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none" />
        <path d="M56 45 Q61 37 66 45" stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      </>
    ) : mood === 'sleepy' ? (
      <>
        <path d="M34 45 H44" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M56 45 H66" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      </>
    ) : (
      <g className={animate ? 'pet-blink' : ''} style={{ transformOrigin: '50px 44px' }}>
        <circle cx={mood === 'thinking' ? 41 : 39} cy={mood === 'sad' ? 46 : mood === 'thinking' ? 41 : 44} r="5.2" fill={ink} />
        <circle cx={mood === 'thinking' ? 63 : 61} cy={mood === 'sad' ? 46 : mood === 'thinking' ? 41 : 44} r="5.2" fill={ink} />
        <circle cx={mood === 'thinking' ? 42.6 : 40.6} cy={mood === 'sad' ? 44.4 : mood === 'thinking' ? 39.4 : 42.4} r="1.6" fill="#fff" />
        <circle cx={mood === 'thinking' ? 64.6 : 62.6} cy={mood === 'sad' ? 44.4 : mood === 'thinking' ? 39.4 : 42.4} r="1.6" fill="#fff" />
      </g>
    );

  const mouth =
    mood === 'excited' ? (
      <path d="M41 53 Q50 69 59 53 Z" fill="#c42b3f" stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
    ) : mood === 'sad' ? (
      <path d="M42 61 Q50 53 58 61" stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    ) : mood === 'sleepy' ? (
      <path d="M46 58 H54" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
    ) : mood === 'thinking' ? (
      <circle cx="50" cy="58" r="3.2" fill="none" stroke={ink} strokeWidth="3" />
    ) : (
      <path d="M41 54 Q50 64 59 54" stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label={`Study buddy, feeling ${mood}`}
      className={`${animate ? (mood === 'excited' ? 'pet-hop' : 'pet-bob') : ''} ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* shadow */}
      <ellipse cx="50" cy="95" rx="26" ry="4" fill="#1b1033" opacity="0.18" />
      {/* feet */}
      <ellipse cx="37" cy="90" rx="9" ry="6" fill={ink} />
      <ellipse cx="63" cy="90" rx="9" ry="6" fill={ink} />

      {/* cape / scarf for level 5+ */}
      {level >= 5 && (
        <path d="M18 66 Q50 78 82 66 L82 74 Q50 86 18 74 Z" fill="#ff5d73" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      )}

      {/* arms */}
      <path d="M15 56 Q4 58 6 68" stroke={ink} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M85 56 Q96 58 94 68" stroke={ink} strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* body */}
      <rect x="13" y="11" width="74" height="78" rx="22" fill="var(--primary)" stroke={ink} strokeWidth="3.5" />
      {/* face screen */}
      <rect x="21" y="22" width="58" height="48" rx="15" fill="#fff" stroke={ink} strokeWidth="2.5" />
      {/* cheeks */}
      <circle cx="30" cy="55" r="4.2" fill="#ff5d73" opacity="0.55" />
      <circle cx="70" cy="55" r="4.2" fill="#ff5d73" opacity="0.55" />
      {eyes}
      {mouth}
      {/* belly spark */}
      <path
        d="M50 74 l2.3 5 5.2 2.3 -5.2 2.3 -2.3 5 -2.3 -5 -5.2 -2.3 5.2 -2.3z"
        fill="#ffc83d"
        stroke={ink}
        strokeWidth="1.8"
        strokeLinejoin="round"
        transform="translate(0 -8) scale(1)"
      />

      {/* glasses (level 3+) */}
      {level >= 3 && (
        <g stroke={ink} strokeWidth="2.4" fill="none">
          <circle cx="39" cy="44" r="9" />
          <circle cx="61" cy="44" r="9" />
          <path d="M48 44 H52" />
        </g>
      )}

      {/* sprout (level 2) */}
      {level === 2 && (
        <g>
          <path d="M50 11 Q50 3 50 0" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M50 3 Q38 -4 36 6 Q47 10 50 3Z" fill="#2ed3a4" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M50 3 Q62 -4 64 6 Q53 10 50 3Z" fill="#2ed3a4" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        </g>
      )}

      {/* graduation cap (level 4–5) */}
      {(level === 4 || level === 5) && (
        <g stroke={ink} strokeWidth="2.4" strokeLinejoin="round">
          <path d="M50 -2 L84 10 L50 22 L16 10 Z" fill="#1b1033" />
          <path d="M34 17 V27 Q50 33 66 27 V17" fill="#3a2d66" />
          <path d="M84 10 V24" strokeLinecap="round" />
          <circle cx="84" cy="26" r="3" fill="#ffc83d" />
        </g>
      )}

      {/* crown (level 6) */}
      {level >= 6 && (
        <path
          d="M26 14 L32 -4 L42 8 L50 -8 L58 8 L68 -4 L74 14 Z"
          fill="#ffc83d"
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      )}

      {/* extras */}
      {mood === 'sleepy' && (
        <g fill={ink} fontFamily="sans-serif" fontWeight="800">
          <text x="76" y="14" fontSize="13">z</text>
          <text x="86" y="4" fontSize="10">z</text>
        </g>
      )}
      {mood === 'thinking' && (
        <g fill="#fff" stroke={ink} strokeWidth="1.6">
          <circle cx="82" cy="14" r="3" />
          <circle cx="90" cy="5" r="4.2" />
        </g>
      )}
    </svg>
  );
}
