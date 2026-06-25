// IconToggle — the ONE toggle idiom across the tool (was a mix of primary/secondary-Btn swaps +
// segmented-in-a-well). A light pill that signals state by ELEVATION, not a heavy dark fill (the
// chrome whispers): OFF = a raised, quiet pill (muted icon); ON = seated / pressed-in (inset shadow)
// with full-ink icon — engaged, tactile, instrument-grade. Icon-led like Locale; an optional word
// only for the toggle that truly needs one. Shares the .t-btn focus ring + brightness hover.
import React from "react";
import { tactileSelect } from "../lib/feedback";

const PILL_LIFT = "var(--t-lift-pill)";
// ON = pressed/seated: a soft inset so the engaged toggle reads as pushed-in (vs the raised OFF pill).
const PRESSED = "inset 0 1px 2px rgba(27, 24, 21, 0.14)";

export function IconToggle({ on, onClick, title, ariaLabel, children, label }: {
  on: boolean; onClick: () => void; title?: string; ariaLabel: string; children: React.ReactNode; label?: string;
}) {
  return (
    <button
      type="button" className="t-btn" aria-pressed={on} aria-label={ariaLabel} title={title}
      onMouseDown={(e) => e.preventDefault()} onClick={() => { tactileSelect(); onClick(); }}
      onPointerDown={(e) => { e.currentTarget.style.scale = "var(--t-press-scale)"; }}
      onPointerUp={(e) => { e.currentTarget.style.scale = "1"; }}
      onPointerLeave={(e) => { e.currentTarget.style.scale = "1"; }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        minHeight: "var(--t-h-pill)", borderRadius: 999, border: "none",
        padding: label ? "0 15px 0 13px" : 0, width: label ? undefined : "var(--t-h-pill)",
        // state by elevation, not a dark fill: ON = seated/pressed + full ink, OFF = raised + muted.
        background: "var(--t-bg-lift)", color: on ? "var(--t-ink)" : "var(--t-ink-2)",
        boxShadow: on ? PRESSED : PILL_LIFT, fontSize: 13, fontWeight: on ? 600 : 500,
        transition: "scale var(--t-press) var(--t-ease), color var(--t-dur) var(--t-ease), box-shadow var(--t-dur) var(--t-ease)",
      }}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
}
