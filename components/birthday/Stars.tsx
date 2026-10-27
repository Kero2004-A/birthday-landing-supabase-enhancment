/** A fixed, decorative starfield. Positions come from a seeded generator so server and client markup match. */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(2024);
const STARS = Array.from({ length: 70 }, () => ({
  left: `${(rand() * 100).toFixed(2)}%`,
  top: `${(rand() * 100).toFixed(2)}%`,
  size: 1 + rand() * 2.2,
  delay: `${(rand() * 5).toFixed(2)}s`,
  dur: `${(3 + rand() * 4).toFixed(2)}s`,
  opacity: (0.2 + rand() * 0.4).toFixed(2),
}));

export default function Stars() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star absolute rounded-full bg-cream"
          style={
            {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              "--delay": s.delay,
              "--d": s.dur,
              "--o": s.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
