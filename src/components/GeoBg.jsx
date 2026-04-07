/**
 * Reusable geometric background elements — same visual language as the landing page.
 * Wrap parent in `relative overflow-hidden` and place <GeoBg /> as the first child.
 */
export default function GeoBg({ rings = 3, ringSize = 400, dotOpacity = 0.07, dotSize = 26 }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: dotOpacity,
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: `${dotSize}px ${dotSize}px`,
        }}
      />
      {/* Concentric rings — top right */}
      {Array.from({ length: rings }, (_, i) => {
        const size = ringSize - i * 90
        return (
          <div
            key={i}
            className="absolute rounded-full border border-slate-600"
            style={{
              width: size,
              height: size,
              top: -size / 2.8,
              right: -size / 3.2,
              opacity: 0.14 - i * 0.03,
            }}
          />
        )
      })}
    </div>
  )
}
