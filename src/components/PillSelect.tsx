// PillSelect — a real dropdown. Full-pill trigger (stadium 999). The popover
// is PORTALED to <body> so it escapes the toolbar's @lisse clip-path (clip-path
// clips overflowing children, which was hiding the menu). Lisse-squircle menu
// with a drop-shadow that follows the silhouette. Closes on outside-click / Esc.
import React from "react";
import ReactDOM from "react-dom";
import { GlassPanel } from "./GlassPanel";
import { ChevronDown, Check } from "./icons";
import { popMotion } from "../lib/popover";

type Opt = { value: string; label: string };

export function PillSelect({ label, value, options, onChange, compact = false }: {
  label?: string; value: string; options: Opt[]; onChange: (v: string) => void;
  compact?: boolean; // smaller pill, no label — for in-content control clusters
}) {
  const [open, setOpen] = React.useState(false);
  // top OR bottom anchored — flips UP when the trigger sits low (e.g. the bottom
  // Tune dock), so the menu never opens off the bottom of the viewport.
  const [pos, setPos] = React.useState<{ top?: number; bottom?: number; right: number; maxH: number } | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);

  const place = React.useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const M = 12;
    const right = window.innerWidth - r.right;
    const ph = popRef.current?.offsetHeight ?? 220; // estimate before first measure
    const below = window.innerHeight - r.bottom - M;
    const above = r.top - M;
    const openUp = below < ph + 8 && above > below; // not enough room below AND up has more → drop upward
    // cap to the available space so a long option list scrolls instead of running off the viewport
    const maxH = Math.max(150, Math.round((openUp ? above : below) - 6));
    setPos(openUp ? { right, bottom: window.innerHeight - r.top + 8, maxH } : { right, top: r.bottom + 8, maxH });
  }, []);

  // initial place runs AFTER the portal commits (useLayoutEffect) so popRef height
  // is measurable and the up/down decision is exact, not just estimated.
  React.useLayoutEffect(() => { if (open) place(); }, [open, place]);

  React.useEffect(() => {
    if (!open) return;
    place();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onScroll = () => place();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  const current = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        className="t-pill"
        aria-haspopup="listbox" aria-expanded={open} aria-label={label ?? current?.label}
        onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: compact ? 7 : 9,
          minHeight: compact ? "var(--t-h-pill-sm)" : "var(--t-h-pill)", padding: compact ? "0 13px" : "0 15px",
          borderRadius: 999, border: "none", color: "var(--t-ink)",
        }}
        onPointerDown={(e) => { e.currentTarget.style.scale = "var(--t-press-scale)"; }}
        onPointerUp={(e) => { e.currentTarget.style.scale = "1"; }}
        onPointerLeave={(e) => { e.currentTarget.style.scale = "1"; }}
      >
        {/* label + value baseline-aligned (mono caps sit on the sans baseline), the pill
            still vertically-centers this group + the chevron */}
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: compact ? 7 : 9 }}>
          {label && !compact && <span style={{ fontFamily: "var(--t-sans)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", lineHeight: 1 }}>{label}</span>}
          <span style={{ fontSize: compact ? 13 : 14, fontWeight: 500, lineHeight: 1 }}>{current?.label}</span>
        </span>
        <ChevronDown size={9} style={{ color: "var(--t-ink-3)", transition: "transform var(--t-dur) var(--t-ease)", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && pos && ReactDOM.createPortal(
        <div
          ref={popRef}
          className="t-pop"
          style={{
            position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right, zIndex: 60,
            filter: "drop-shadow(0 14px 30px rgba(var(--t-scrim),0.16))",
            ...popMotion(pos),
          }}
        >
          <GlassPanel
            radius={16}
            style={{
              minWidth: 200, padding: 6,
              // cap to the available space + scroll → a long list (fonts, directions) never runs off
              // the top/bottom of the viewport.
              maxHeight: Math.min(pos.maxH, 380), overflowY: "auto",
              background: "rgba(255,255,255,0.97)",
              boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05)",
            }}
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button key={o.value} className="t-opt" onClick={() => { onChange(o.value); setOpen(false); }}>
                  <span>{o.label}</span>
                  {active && <Check size={12} style={{ color: "var(--t-match)" }} />}
                </button>
              );
            })}
          </GlassPanel>
        </div>,
        document.body,
      )}
    </>
  );
}
