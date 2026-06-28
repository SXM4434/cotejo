// BottomDock — the floating dial dock (Locale-style), bottom-center. Holds the
// "how it renders" controls you tune while watching the type. This is THE home
// for the real Aave liquid glass (it floats over + refracts the specimens).
//
// DESKTOP: one floating pill of controls. MOBILE: the full row can't fit, and wrapping it stacks
// into a half-page wall of pills that eats the type. So on narrow we keep only a slim "Controls"
// HANDLE at the bottom (measured → the canvas reserves just that, the type keeps the screen) and
// raise the full controls in a sheet OVER the canvas only when tapped. Native, calm, type-first.
import React from "react";
import ReactDOM from "react-dom";
import { LiquidGlass } from "./LiquidGlass";
import { useNarrow } from "../lib/useNarrow";

const MONO = "var(--t-mono)";

export function BottomDock({ children, onHeight, peek }: { children: React.ReactNode; onHeight?: (h: number) => void; peek?: React.ReactNode }) {
  const narrow = useNarrow(820);
  const off = narrow ? 12 : 22; // the dock's offset from the viewport bottom edge (one source)
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  // a surface/mode change shouldn't leave the sheet hanging open over the new canvas.
  React.useEffect(() => { if (!narrow) setOpen(false); }, [narrow]);

  // report the bottom band the ALWAYS-PRESENT bar occupies (its height + offset) — so the canvas
  // reserves exactly that and never sits under it. On mobile that's the slim handle, not the (much
  // taller) open sheet: the sheet OVERLAYS the canvas, it doesn't push it, so layout never jumps.
  React.useLayoutEffect(() => {
    if (!onHeight) return;
    const el = ref.current;
    if (!el) return;
    const report = () => onHeight(el.offsetHeight + off);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, off, narrow]);

  // ── DESKTOP — the floating control bar. WRAPS (squircle, not a stadium pill) when the controls
  // can't fit one row, so a dense dock (e.g. Tune at a laptop width) never runs off the viewport
  // edges. At wide widths it's a single clean row. ──
  if (!narrow) {
    return ReactDOM.createPortal(
      <div
        ref={ref} data-no-refract
        style={{ position: "fixed", left: "50%", bottom: off, transform: "translateX(-50%)", zIndex: 40, maxWidth: "calc(100vw - 20px)" }}
      >
        <LiquidGlass
          radius={26}
          contentStyle={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", columnGap: 20, rowGap: 14, padding: "14px 20px" }}
        >
          {children}
        </LiquidGlass>
      </div>,
      document.body,
    );
  }

  // ── MOBILE — slim handle + pull-up controls sheet ──
  return ReactDOM.createPortal(
    <>
      {/* tap-away scrim — dims the canvas so the solid sheet reads as the focused layer */}
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 41, background: "rgba(var(--t-scrim),0.28)" }} />}

      {/* the controls sheet — only when open; sits above the handle, scrolls if tall. SOLID (not the
          refracting glass): a controls panel has to be opaque, or the comparison type bleeds through
          it on real Safari (where backdrop-filter is actually transparent). */}
      {open && (
        <div
          data-no-refract
          style={{
            position: "fixed", left: 10, right: 10, bottom: off + 52, zIndex: 42,
            background: "var(--t-bg-lift)", borderRadius: 24, padding: 16,
            boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.07), 0 24px 60px -22px rgba(var(--t-scrim),0.5)",
            maxHeight: "62vh", overflowY: "auto",
            display: "flex", alignItems: "stretch", justifyContent: "flex-start", flexWrap: "wrap", columnGap: 12, rowGap: 14,
          }}
        >
          {children}
        </div>
      )}

      {/* the always-present slim handle (measured for canvas reservation). SOLID (readable over type);
          carries the `peek` control — the one thing you change most, always one tap — plus Controls. */}
      <div ref={ref} data-no-refract style={{ position: "fixed", left: "50%", bottom: off, transform: "translateX(-50%)", zIndex: 43, maxWidth: "calc(100vw - 20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: 6, borderRadius: 999, background: "var(--t-bg-lift)", boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.07), 0 12px 30px -12px rgba(var(--t-scrim),0.42)" }}>
          {peek}
          <button
            onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Hide controls" : "Show controls"}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: open ? "var(--t-surface-2)" : "transparent", border: "none", cursor: "pointer", color: "var(--t-ink-2)", padding: "8px 14px", borderRadius: 999 }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--t-dur) var(--t-ease)" }}>
              <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{open ? "Done" : "Controls"}</span>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
