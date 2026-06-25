// Btn — the ONE button. Every button in the tool routes through here, so the whole system's
// button treatment (shape, size, press feel) AND colour lives in ONE place: change a token or a
// VARIANT entry and it re-skins everywhere. No more ad-hoc inline button styles that drift.
//   · primary   — the dark ink pill (main action)
//   · accent    — cobalt (the one highlighted action)
//   · secondary — quiet but VISIBLE: lifted ground + a hairline so it never blends into a card
//   · ghost     — text-only, for tertiary actions
import React from "react";
import { tactileSelect } from "../lib/feedback";

const MONO = "var(--t-sans)";
export type BtnVariant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, { minHeight: string; padding: string; fontSize: number }> = {
  sm: { minHeight: "var(--t-h-pill-sm)", padding: "0 14px", fontSize: 13 },
  md: { minHeight: "var(--t-h-pill)", padding: "0 18px", fontSize: 14 },
  lg: { minHeight: "var(--t-h-pill-lg)", padding: "0 22px", fontSize: 15 },
};

// the soft lift shared by every pill control — ONE tokenized recipe (styles.css --t-lift), so a Btn
// never reads flat OR differently next to a select/toggle. Ghost is a text tier, so it stays unshadowed.
const LIFT = "var(--t-lift)";
// the white top-highlight that keeps a light pill from blending into near-white chrome (one treatment:
// lift, never a grey line) — what the dropdowns (.t-pill) use too.
const PILL_LIFT = "var(--t-lift-pill)";
// the ONLY place button colour + elevation is defined — every variant pulls from tokens.
const VARIANT: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background: "var(--t-ink)", color: "var(--t-bg)", boxShadow: LIFT },
  accent:    { background: "var(--t-match)", color: "var(--t-bg)", boxShadow: LIFT },
  secondary: { background: "var(--t-bg-lift)", color: "var(--t-ink)", boxShadow: PILL_LIFT },
  ghost:     { background: "transparent", color: "var(--t-ink-2)" },
};

export const Btn = React.forwardRef<HTMLButtonElement, {
  variant?: BtnVariant; size?: Size; mono?: boolean; disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void; children: React.ReactNode; style?: React.CSSProperties;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "style" | "children">>(function Btn({
  variant = "primary", size = "md", mono = false, disabled = false, onClick, children, style, className, ...rest
}, ref) {
  const s = SIZE[size];
  return (
    <button
      // `t-btn` carries the states the inline variant can't: a :focus-visible ring (keyboard a11y) +
      // a quiet hover (styles.css). The inline variant keeps colour + resting elevation + press.
      ref={ref} type="button" disabled={disabled} className={className ? `t-btn ${className}` : "t-btn"}
      onClick={(e) => { if (disabled) return; tactileSelect(); onClick?.(e); }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.scale = "var(--t-press-scale)"; }}
      onPointerUp={(e) => { e.currentTarget.style.scale = "1"; }}
      onPointerLeave={(e) => { e.currentTarget.style.scale = "1"; }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        minHeight: s.minHeight, padding: s.padding, borderRadius: 999, border: "none",
        fontSize: mono ? Math.min(s.fontSize, 12) : s.fontSize, fontWeight: 600, whiteSpace: "nowrap",
        fontFamily: mono ? MONO : undefined, letterSpacing: mono ? "0.04em" : undefined,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        transition: "scale var(--t-press) var(--t-ease), filter var(--t-dur) var(--t-ease)",
        ...VARIANT[variant], ...style,
      }}
      {...rest}
    >{children}</button>
  );
});
