// InfoDot (AIRTIGHT-PASS F5) — a small ⓘ that explains a term in plain language. Keyboard-operable
// (real button, Enter/Space/Esc), opens on hover or click, dismisses on outside-click/Escape. Used at
// the cap-match toggle and anywhere a piece of jargon needs a gloss. Readable sans (not the chrome mono).
// The tooltip is PORTALED to <body> with fixed positioning — the top chrome clips its overflow (rounded
// glass pill), so an in-flow absolute tooltip got cropped on hover. Portaling escapes that clip.
import React from "react";
import ReactDOM from "react-dom";

export function InfoDot({ label, text, side = "bottom", align = "left" }: { label: string; text: string; side?: "top" | "bottom"; align?: "left" | "right" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);

  const place = React.useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const p: { top?: number; bottom?: number; left?: number; right?: number } = {};
    if (side === "bottom") p.top = r.bottom + 6; else p.bottom = window.innerHeight - r.top + 6;
    if (align === "left") p.left = r.left; else p.right = window.innerWidth - r.right;
    setPos(p);
  }, [side, align]);
  React.useLayoutEffect(() => { if (open) place(); }, [open, place]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex" }} onMouseLeave={() => setOpen(false)}>
      <button
        ref={btnRef}
        type="button" className="t-iconbtn" aria-label={`What is ${label}?`} aria-expanded={open}
        onClick={() => setOpen((v) => !v)} onMouseEnter={() => setOpen(true)}
        style={{ position: "relative", width: 18, height: 18, color: "var(--t-ink-3)" }}
      >
        {/* the visible ⓘ stays ~18px but the hit area is ≥40px (an invisible overlay at inset -11) */}
        <span aria-hidden style={{ position: "absolute", inset: -11 }} />
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" /><path d="M8 7.1v3.6M8 5.1h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      {open && pos && ReactDOM.createPortal(
        <span role="tooltip" style={{
          position: "fixed", zIndex: 80, width: 248,
          top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right,
          background: "rgba(255,255,255,0.97)", color: "var(--t-ink-2)", padding: "10px 13px", borderRadius: "var(--t-r-block)",
          fontFamily: "var(--t-ui-sans, system-ui, sans-serif)", fontSize: 12.5, lineHeight: 1.5,
          letterSpacing: 0, textTransform: "none", boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05), 0 8px 22px -14px rgba(var(--t-scrim),0.16)",
        }}>{text}</span>,
        document.body,
      )}
    </span>
  );
}
