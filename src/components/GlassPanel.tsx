// GlassPanel — squircle shape (@lisse, the Figma/iOS continuous curve) + real
// backdrop glass. Inset specular + hairline are clip-safe under @lisse's
// clip-path. One drop-in surface for the whole tool.
import React from "react";
import { SmoothCorners } from "@lisse/react";

type GlassPanelProps = {
  radius?: number;
  smoothing?: number;
  strong?: boolean; // stronger glass tint (active / raised)
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function GlassPanel({
  radius = 22,
  smoothing = 0.6,
  strong = false,
  as,
  className = "",
  style,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <SmoothCorners
      as={as}
      corners={{ radius, smoothing }}
      className={`t-glass ${className}`}
      // real surface tokens (the old --t-glass/--t-glass-strong were never defined → resolved to
      // nothing); callers can still override `background` via `style`.
      style={{ background: strong ? "var(--t-surface-2)" : "var(--t-surface)", ...style }}
      {...rest}
    >
      {children}
    </SmoothCorners>
  );
}
