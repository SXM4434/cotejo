// In-face icon set — ONE stroke language (1.6px, round caps/joins, 16-unit viewBox), all drawn in
// `currentColor` so every icon inherits the surrounding text/state color (hover, focus, active,
// picked/cobalt, disabled) automatically. This replaces the Unicode glyphs (✓ ◎ ✎ → ↑ ↔ ▾) that
// Spline Sans Mono / Mona Sans don't carry — those fell through to the OS color-emoji font (the
// "stray color glyph" AI tell) and ignored CSS color. Use these instead of rendering those glyphs.
import React from "react";

type P = { size?: number } & Omit<React.SVGProps<SVGSVGElement>, "width" | "height">;
const Svg = ({ size = 14, children, ...rest }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"
    stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
);

export const Check = (p: P) => <Svg {...p}><path d="M3 8.5 6.5 12 13 4.5" /></Svg>;
export const Warn = (p: P) => <Svg {...p}><path d="M8 2.5 14.5 13.5h-13L8 2.5ZM8 6.5v3.2M8 11.8v.1" /></Svg>;
export const Plus = (p: P) => <Svg {...p}><path d="M8 3.2v9.6M3.2 8h9.6" /></Svg>;
export const Close = (p: P) => <Svg {...p}><path d="M4 4l8 8M12 4l-8 8" /></Svg>;
export const ChevronDown = (p: P) => <Svg {...p}><path d="M4 6.5 8 10.5 12 6.5" /></Svg>;
export const ArrowRight = (p: P) => <Svg {...p}><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></Svg>;
// upload — arrow rising out of a tray
export const Upload = (p: P) => <Svg {...p}><path d="M8 10.5V3M5 5.5 8 2.5l3 3M3.5 11.5v1A1.5 1.5 0 0 0 5 14h6a1.5 1.5 0 0 0 1.5-1.5v-1" /></Svg>;
// pencil — the edit gesture
export const Pencil = (p: P) => <Svg {...p}><path d="M11.3 2.9 13.1 4.7M3 13l.5-2.2 7-7 1.8 1.8-7 7L3 13Z" /></Svg>;
// horizontal swap — the onion A↔B
export const SwapH = (p: P) => <Svg {...p}><path d="M3.5 6.5h9M5.5 4.5 3.5 6.5l2 2M12.5 9.5h-9M10.5 7.5l2 2-2 2" /></Svg>;
// blind A/B — an eye with a slash (names hidden so you judge the type, not the brand)
export const EyeOff = (p: P) => <Svg {...p}><path d="M6.4 6.4a2.2 2.2 0 0 0 3.1 3.1M4.3 4.4C2.9 5.3 2 6.7 2 8c0 0 2.4 4 6 4 1 0 1.9-.3 2.7-.7M9 4.2A6 6 0 0 1 10 4c3.6 0 6 4 6 4a11 11 0 0 1-1.6 1.9M2.5 2.5l11 11" /></Svg>;
// ground — a half-filled circle (the paper ↔ dark toggle)
export const Contrast = ({ size = 14, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" {...rest}>
    <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth={1.4} />
    <path d="M8 2.4a5.6 5.6 0 0 1 0 11.2Z" fill="currentColor" />
  </svg>
);
// the recommend mark — a concentric ring + dot (the old ◎), drawn in-face
export const RingDot = ({ size = 13, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" {...rest}>
    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth={1.4} />
    <circle cx="8" cy="8" r="1.7" fill="currentColor" />
  </svg>
);
