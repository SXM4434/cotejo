// BottomDock — the floating dial dock (Locale-style), bottom-center. Holds the
// "how it renders" controls you tune while watching the type. This is THE home
// for the real Aave liquid glass (it floats over + refracts the specimens).
// Drop shadow rides a wrapper filter so it follows the squircle silhouette.
import React from "react";
import ReactDOM from "react-dom";
import { LiquidGlass } from "./LiquidGlass";
import { useNarrow } from "../lib/useNarrow";

// PORTALED to <body> — must live OUTSIDE #cotejo-stage. The dock's own glass clones
// the stage; if the dock (and its clone host) sat inside the observed stage, every
// reclone would mutate the stage → MutationObserver → reclone → infinite loop.
// Narrow: the row of dials can't fit, so the dock WRAPS to multiple rows and drops
// the full pill (a tall stadium looks wrong) for a generous squircle.
export function BottomDock({ children, onHeight }: { children: React.ReactNode; onHeight?: (h: number) => void }) {
  const narrow = useNarrow(820);
  const off = narrow ? 12 : 22; // the dock's offset from the viewport bottom edge (one source)
  const ref = React.useRef<HTMLDivElement>(null);
  // report the TOTAL bottom band the dock occupies (its height + its offset from the edge),
  // measured live — so the canvas can reserve exactly that much and never sit under the dock
  // (the dock wraps to multiple rows when narrow, so a static guess can't hold).
  React.useLayoutEffect(() => {
    if (!onHeight) return;
    const el = ref.current;
    if (!el) return;
    const report = () => onHeight(el.offsetHeight + off);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, off]);
  return ReactDOM.createPortal(
    <div
      ref={ref}
      data-no-refract
      style={{
        position: "fixed", left: "50%", bottom: off, transform: "translateX(-50%)",
        zIndex: 40, maxWidth: "calc(100vw - 20px)",
        // no heavy drop-shadow — matches the top bar's clean glass (both rely on the
        // LiquidGlass rim/specular only, so the two bars read as ONE material).
      }}
    >
      <LiquidGlass
        pill={!narrow}
        radius={narrow ? 28 : 26}
        contentStyle={{
          display: "flex", alignItems: "center", justifyContent: "center",
          flexWrap: narrow ? "wrap" : "nowrap",
          columnGap: narrow ? 12 : 20,
          rowGap: 14,
          padding: narrow ? "14px 16px" : "14px 20px",
        }}
      >
        {children}
      </LiquidGlass>
    </div>,
    document.body,
  );
}
