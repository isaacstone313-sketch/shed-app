const CATEGORY_COLORS = {
  time:     { from: '#F59E0B', to: '#D97706' },
  streak:   { from: '#F97316', to: '#C2410C' },
  social:   { from: '#A78BFA', to: '#7C3AED' },
  sessions: { from: '#34D399', to: '#059669' },
}

/**
 * Shield-shaped badge icon.
 * @param {object}  badge    — badge row from DB (needs .slug, .category, .emoji)
 * @param {boolean} earned   — full colour vs greyed/locked
 * @param {number}  size     — pixel dimensions (square bounding box)
 */
export default function BadgeIcon({ badge, earned = true, size = 56 }) {
  const colors = CATEGORY_COLORS[badge.category] ?? CATEGORY_COLORS.sessions
  // Unique gradient ID per badge slug to avoid SVG ID conflicts when multiple
  // instances render on the same page
  const gid = `bdg-${badge.slug}`

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 44"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="20" y1="2" x2="20" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={earned ? colors.from : '#334155'} />
            <stop offset="100%" stopColor={earned ? colors.to   : '#1E293B'} />
          </linearGradient>
        </defs>
        {/* Shield body */}
        <path
          d="M4 2 L36 2 L36 24 C36 34 27 41 20 43 C13 41 4 34 4 24 Z"
          fill={`url(#${gid})`}
          opacity={earned ? 1 : 0.55}
        />
        {/* Subtle inner highlight when earned */}
        {earned && (
          <path
            d="M4 2 L36 2 L36 24 C36 34 27 41 20 43 C13 41 4 34 4 24 Z"
            fill="none"
            stroke={colors.from}
            strokeWidth="0.75"
            opacity="0.5"
          />
        )}
      </svg>

      {/* Emoji centred over shield */}
      <span
        className="absolute select-none"
        style={{
          fontSize:   size * 0.36,
          lineHeight: 1,
          marginTop:  size * -0.04, // nudge up slightly inside shield
          filter:     earned ? 'none' : 'grayscale(1) opacity(0.35)',
        }}
      >
        {badge.emoji}
      </span>

      {/* Lock overlay for unearned badges */}
      {!earned && (
        <div
          className="absolute flex items-center justify-center"
          style={{ bottom: 0, right: 0, width: size * 0.36, height: size * 0.36 }}
        >
          <svg
            viewBox="0 0 24 24"
            width={size * 0.32}
            height={size * 0.32}
            fill="none"
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}
    </div>
  )
}
