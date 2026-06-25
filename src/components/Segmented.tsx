// Segmented — one accessible single-select pill group (viewport lens · surface switcher
// · Tune overlay). Proper radiogroup semantics + ROVING tabindex (one tab stop, arrow /
// Home / End move + activate) per web-interface-guidelines, plus the tool's pill chrome:
// --t-surface-2 well + a QUIET raised light-pill active seat (the SAME treatment as the
// mode tabs — the chrome whispers, no heavy dark fill), 0.96 press, box-shadow focus.
// Keeps `.t-tab` so existing hover/focus styles + tooling selectors apply.
import React from "react";
import { tactileSelect } from "../lib/feedback";

export function Segmented<T extends string>({
  options, value, onChange, ariaLabel, compact = false,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  compact?: boolean;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const pick = (id: T) => { if (id !== value) tactileSelect(); onChange(id); };
  const move = (n: number) => {
    const m = (n + options.length) % options.length;
    pick(options[m].id);
    refs.current[m]?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": e.preventDefault(); move(idx + 1); break;
      case "ArrowLeft": case "ArrowUp": e.preventDefault(); move(idx - 1); break;
      case "Home": e.preventDefault(); move(0); break;
      case "End": e.preventDefault(); move(options.length - 1); break;
    }
  };
  return (
    <div
      role="radiogroup" aria-label={ariaLabel} onKeyDown={onKeyDown}
      // recessed "well" so the track reads against near-white glass (shadow, not a line)
      // and the active ink pill reads as raised inside it.
      style={{ display: "inline-flex", gap: 4, borderRadius: 999, background: "var(--t-surface-2)", padding: 4, boxShadow: "inset 0 1px 2px rgba(var(--t-scrim), 0.07), 0 1px 1px rgba(var(--t-scrim), 0.03)" }}
    >
      {options.map((o, i) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            ref={(el) => { refs.current[i] = el; }}
            role="radio" aria-checked={active} tabIndex={active ? 0 : -1}
            className="t-tab" data-active={active}
            onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o.id)}
            onPointerDown={(e) => { e.currentTarget.style.scale = "var(--t-press-scale)"; }}
            onPointerUp={(e) => { e.currentTarget.style.scale = "1"; }}
            onPointerLeave={(e) => { e.currentTarget.style.scale = "1"; }}
            style={{
              minHeight: compact ? "var(--t-h-pill-sm)" : "var(--t-h-track)", padding: compact ? "0 12px" : "0 14px", borderRadius: 999, border: "none", whiteSpace: "nowrap",
              // active = a quiet raised light pill seated in the well (matches the mode tabs), NOT a heavy
              // dark fill; weight + a soft lift carry the active read so the dock stays whisper-quiet.
              background: active ? "var(--t-bg-lift)" : "transparent", color: active ? "var(--t-ink)" : "var(--t-ink-2)",
              boxShadow: active ? "0 1px 2px -1px rgba(27, 24, 21, 0.10)" : "none",
              fontSize: 13, fontWeight: active ? 600 : 500,
              transition: "background var(--t-dur) var(--t-ease), color var(--t-dur) var(--t-ease), box-shadow var(--t-dur) var(--t-ease), scale var(--t-press) var(--t-ease)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
