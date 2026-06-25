// LiquidGlass — Aave-correct liquid glass via BACKDROP-FILTER (the real technique,
// per aave.com/design/building-glass-for-the-web). It refracts the actual backdrop
// IN PLACE — no clone, so nothing is ever doubled/ghosted. Chromium gets the full
// optical refraction (`backdrop-filter: url(#map)`); Safari/FF — where SVG filters
// in backdrop-filter aren't supported — gracefully fall back to a clean frosted
// blur (the `.t-glass` class, whose plain blur() value stays valid there).
//
// The optical map (lib/glassMap) bends light at the curved RIM (Snell-style),
// neutral in the flat center, sized to the element + regenerated on resize.
// R/G/B displaced at slightly different scales = the chromatic fringe of real glass.
import React from "react";
import { SmoothCorners } from "@lisse/react";
import { generateDisplacementMap } from "../lib/glassMap";

export const STAGE_ID = "cotejo-stage"; // App's content wrapper (no longer cloned)
let _gid = 0;

type Filt = { id: string; map: string; w: number; h: number };

export function LiquidGlass({
  radius = 22, scale = 15, pill = false, className = "", style, contentStyle, children,
}: {
  radius?: number;
  scale?: number;
  pill?: boolean;
  className?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const glassRef = React.useRef<HTMLDivElement>(null);
  const [filt, setFilt] = React.useState<Filt | null>(null);

  // optical displacement map sized to the glass; regen on resize
  React.useLayoutEffect(() => {
    const glass = glassRef.current;
    if (!glass) return;
    const make = () => {
      const r = glass.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const rad = pill ? Math.min(r.width, r.height) / 2 : radius;
      const map = generateDisplacementMap(r.width, r.height, rad);
      if (map) setFilt({ id: `cg${++_gid}`, map, w: Math.round(r.width), h: Math.round(r.height) });
    };
    make();
    const ro = new ResizeObserver(make);
    ro.observe(glass);
    return () => ro.disconnect();
  }, [radius, pill]);

  const sR = scale * 0.97, sG = scale, sB = scale * 1.03; // faint chromatic fringe (±3%)
  const ISO_R = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
  const ISO_G = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0";
  const ISO_B = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0";

  // Chromium: LENSING dominates (Apple/Aave) — the displacement map bends the real
  // backdrop; blur is only a light soften, brightness keeps it airy, sat keeps
  // content vivid through the glass. Safari/FF: url() is invalid → inline declaration
  // dropped → `.t-glass`'s plain frosted blur() applies (no refraction, graceful).
  const bf = filt ? `url(#${filt.id}) blur(2px) saturate(1.4) brightness(1.04)` : "blur(12px) saturate(1.3)";

  return (
    <SmoothCorners
      ref={glassRef}
      corners={{ radius: pill ? 9999 : radius, smoothing: 0.6 }}
      className={`t-glass ${className}`}
      style={{
        position: "relative", overflow: "hidden", isolation: "isolate",
        // CLEAR glass, not white frost — the backdrop refracts through. A whisper of
        // warm-white tint keeps chrome legible when text scrolls under; the read comes
        // from lensing + the rim, not opacity (the "off" look was a 0.30 white pill).
        background: "rgba(255,255,255,0.14)",
        backdropFilter: bf, WebkitBackdropFilter: bf,
        // Glass tell = a crisp bright RIM + a top specular catch (Apple lensing edge),
        // NOT broad milky inner glow. A faint inner top-shadow reads as glass thickness.
        boxShadow: [
          "inset 0 1px 0.5px 0 rgba(255,255,255,0.92)",   // top specular catch (light edge)
          "inset 0 0 0 1px rgba(255,255,255,0.28)",        // bright glass rim all around
          "inset 0 -7px 14px -12px rgba(255,255,255,0.18)", // soft bottom inner glow
          "inset 0 8px 18px -16px rgba(27,24,21,0.10)",     // thin top inner depth (thickness)
        ].join(", "),
        ...style,
      }}
    >
      {filt && (
        <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
          <filter id={filt.id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feImage href={filt.map} x="0" y="0" width={filt.w} height={filt.h} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={sR} xChannelSelector="R" yChannelSelector="G" result="dR" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={sG} xChannelSelector="R" yChannelSelector="G" result="dG" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={sB} xChannelSelector="R" yChannelSelector="G" result="dB" />
            <feColorMatrix in="dR" type="matrix" values={ISO_R} result="cR" />
            <feColorMatrix in="dG" type="matrix" values={ISO_G} result="cG" />
            <feColorMatrix in="dB" type="matrix" values={ISO_B} result="cB" />
            <feBlend in="cR" in2="cG" mode="screen" result="cRG" />
            <feBlend in="cRG" in2="cB" mode="screen" />
          </filter>
        </svg>
      )}

      <div style={{ position: "relative", zIndex: 1, ...contentStyle }}>{children}</div>
    </SmoothCorners>
  );
}
