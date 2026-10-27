import Candles from "./Candles";
import { flameCount } from "./Candles";
import type { CandleConfig } from "@/lib/config";

/**
 * The cake illustration (plate, two tiers, icing) with candles on top.
 * Used by the hero section and by the /candles designer page.
 */
export default function Cake({
  candles,
  className = "",
  label,
}: {
  candles: CandleConfig;
  className?: string;
  /** Text for screen readers. Defaults to an English description. */
  label?: string;
}) {
  const n = Math.max(1, Math.floor(candles.age));
  const flames = flameCount(n, candles.style);

  return (
    <svg
      viewBox="0 0 320 300"
      className={`float-slow w-full overflow-visible drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)] ${className}`}
      role="img"
      aria-label={label ?? `A birthday cake with ${flames === n ? `${n} candles` : `a number ${n} candle`}`}
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tierBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8fa9" />
          <stop offset="100%" stopColor="#ff5f86" />
        </linearGradient>
        <linearGradient id="tierTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4e8" />
          <stop offset="100%" stopColor="#ffd9e2" />
        </linearGradient>
      </defs>

      {/* Warm glow behind the candles */}
      <ellipse className="cake-glow" cx="160" cy="95" rx="150" ry="90" fill="url(#glow)" opacity="0" />

      {/* Plate */}
      <ellipse cx="160" cy="276" rx="150" ry="16" fill="#0b3a66" />
      <ellipse cx="160" cy="272" rx="150" ry="16" fill="#12508a" />

      {/* Bottom tier */}
      <rect x="30" y="190" width="260" height="82" rx="16" fill="url(#tierBottom)" />
      <path
        d="M30 206 Q30 190 46 190 H274 Q290 190 290 206 V212
           Q290 228 274 228 Q262 228 262 214 Q262 204 250 204 Q238 204 238 218 Q238 232 224 232
           Q210 232 210 216 Q210 206 198 206 Q186 206 186 220 Q186 234 172 234 Q158 234 158 218
           Q158 208 146 208 Q134 208 134 222 Q134 234 120 234 Q106 234 106 220 Q106 206 94 206
           Q82 206 82 218 Q82 230 68 230 Q54 230 54 216 Q54 210 46 210 Q30 210 30 206Z"
        fill="#fff4e8"
      />
      {[62, 110, 160, 210, 258].map((cx) => (
        <circle key={cx} cx={cx} cy="252" r="5" fill="#ffd27a" />
      ))}

      {/* Top tier */}
      <rect x="76" y="130" width="168" height="66" rx="14" fill="url(#tierTop)" />
      <path
        d="M76 144 Q76 130 90 130 H230 Q244 130 244 144 V150
           Q244 164 232 164 Q220 164 220 152 Q220 144 208 144 Q196 144 196 156 Q196 168 184 168
           Q172 168 172 156 Q172 148 160 148 Q148 148 148 160 Q148 170 136 170 Q124 170 124 158
           Q124 148 112 148 Q100 148 100 158 Q100 166 90 166 Q76 166 76 154Z"
        fill="#ff7b9c"
      />

      {/* Top face of the upper tier: the candles stand on this */}
      <ellipse cx="160" cy="130" rx="84" ry="16" fill="#ffc2d1" stroke="#ff7b9c" strokeWidth="1.5" />

      {/* Candles: any number, any colours */}
      <Candles count={n} style={candles.style} look={candles.look} colors={candles.colors} />
    </svg>
  );
}
