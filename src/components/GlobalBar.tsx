// GlobalBar — the persistent top band (03 §3a): Cotejo wordmark + mode tabs.
// Glass + squircle. Mode tabs are the mode switch; built modes are live, planned
// modes route to an honest scaffold. Right slot reserved for global controls.
// Responsive: desktop = wordmark + toggle + right-slot on one fluid line. Narrow =
// the toggle alone, centered + horizontally scrollable (no ugly wrap); the right
// slot (e.g. Compare's base/vs) drops to its own row BELOW the pill.
import React from "react";
import { LiquidGlass } from "./LiquidGlass";
import { useMode, MODES } from "../state/ModeContext";
import { useNarrow } from "../lib/useNarrow";
import { tactileSelect } from "../lib/feedback";
import { SessionSwitcher } from "./SessionSwitcher";
import { TourButton } from "./Walkthrough";

// The viewport lens moved OUT of the top chrome → it's a preview/render control, so it lives
// in the dock (Compare) + Set Up's controls as a `viewport ▾` dropdown (see ViewportPicker).

export function GlobalBar({ right }: { right?: React.ReactNode }) {
  const { mode, setMode } = useMode();
  const narrow = useNarrow(720);
  return (
    // sticky lives on a PLAIN wrapper — @lisse's clip-path on the glass element
    // breaks position:sticky, so the glass sits inside a sticky div.
    <div data-no-refract style={{ position: "sticky", top: 16, zIndex: 30, marginBottom: 28 }}>
      <LiquidGlass
        pill
        contentStyle={{
          display: "flex", alignItems: "center", flexWrap: "nowrap",
          justifyContent: narrow ? "center" : "flex-start",
          gap: narrow ? 0 : "clamp(16px, 2.4vw, 38px)",
          padding: narrow ? "10px 12px" : "clamp(10px,1.3vw,13px) clamp(14px,2vw,22px) clamp(10px,1.3vw,13px) clamp(18px,2.4vw,30px)",
        }}
      >
        {/* wordmark — desktop only (mobile gives the room to the toggle) */}
        {!narrow && (
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--t-ink)" }}>Cotejo</span>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: "var(--t-match)", transform: "translateY(-1px)" }} />
          </span>
        )}

        {/* mode switch — one segmented track; scrolls horizontally if it can't fit */}
        <nav
          className={narrow ? "t-noscroll" : undefined}
          role="tablist" aria-label="Mode"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999,
            background: "var(--t-surface-2)", padding: 4,
            // recessed well so the mode-tab track reads against the near-white glass
            boxShadow: "inset 0 1px 2px rgba(27,24,21,0.07), 0 1px 1px rgba(27,24,21,0.03)",
            ...(narrow ? { maxWidth: "100%", overflowX: "auto" } : {}),
          }}
        >
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                className="t-tab"
                role="tab" aria-selected={active}
                data-active={active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { if (m.id !== mode) tactileSelect(); setMode(m.id); }}
                title={m.built ? undefined : `${m.label} — planned`}
                style={{
                  minHeight: "var(--t-h-track)", padding: "0 clamp(12px,1.8vw,18px)", borderRadius: 999, border: "none",
                  whiteSpace: "nowrap", flexShrink: 0,
                  // the bar whispers: active = a QUIET seat (not a heavy dark fill), distinguished by
                  // weight + a soft ground, so the chrome never out-shouts the type (design-language §1).
                  background: active ? "var(--t-bg-lift)" : "transparent",
                  color: active ? "var(--t-ink)" : "var(--t-ink-2)",
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  boxShadow: active ? "0 1px 2px -1px rgba(27,24,21,0.10)" : "none",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  transition: "background var(--t-dur) var(--t-ease), color var(--t-dur) var(--t-ease)",
                }}
              >
                {m.label}
                {!m.built && (
                  <span style={{ width: 4, height: 4, borderRadius: 99, background: active ? "var(--t-bg)" : "var(--t-ink-3)", opacity: 0.7 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* right side — desktop: the mode's right slot (if any) + the always-present Sessions switcher */}
        {!narrow && (
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 12 }}>
            {right}
            <TourButton />
            <SessionSwitcher />
          </div>
        )}
      </LiquidGlass>

      {/* narrow: the mode's right slot + Sessions drop to their own row below the pill */}
      {narrow && (
        <div style={{ marginTop: 10, paddingInline: "clamp(6px,1.6vw,22px)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          {right}
          <TourButton />
          <SessionSwitcher />
        </div>
      )}
    </div>
  );
}
