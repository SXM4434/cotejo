// Walkthrough — a short, four-step guided tour of the core loop (cap-match → set up → real
// surfaces → save/tune). Shows once on first visit, re-openable from the bar's ? button. The
// schematic diagrams are font-agnostic line-work (they read the same for everyone), in Cotejo's
// quiet "instrument" register — no cobalt (reserved for picked state); the one primary action is
// the Start button. Motion is a single soft entrance — a rare, meaningful reveal, not a workhorse.
import React from "react";
import ReactDOM from "react-dom";
import { useTour } from "../state/TourContext";
import { useMode } from "../state/ModeContext";
import { Btn } from "./Btn";
import { Close, ArrowRight } from "./icons";

const MONO = "var(--t-mono)";
const HAIR = (pct: number) => `color-mix(in oklab, var(--t-ink) ${pct}%, transparent)`;

// ── schematic diagrams (one per step) ──
function DiagCapMatch() {
  // two faces (different widths) held to ONE cap height — top to the dashed cap-line, foot to baseline.
  return (
    <div style={{ position: "relative", width: 196, height: 60 }}>
      <span style={{ position: "absolute", left: 0, right: 0, top: 6, borderTop: `1px dashed ${HAIR(32)}` }} />
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 8, borderTop: `1px solid ${HAIR(20)}` }} />
      <span style={{ position: "absolute", left: 46, top: 6, bottom: 8, width: 28, background: "var(--t-ink)", borderRadius: 3 }} />
      <span style={{ position: "absolute", right: 46, top: 6, bottom: 8, width: 44, background: "var(--t-ink)", opacity: 0.5, borderRadius: 3 }} />
    </div>
  );
}
function DiagRoles() {
  // a type ramp — display → body → label.
  const rows = [130, 94, 58];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {rows.map((w, n) => <span key={n} style={{ width: w, height: 13 - n * 3, background: "var(--t-ink)", opacity: 1 - n * 0.28, borderRadius: 3 }} />)}
    </div>
  );
}
function DiagSurfaces() {
  // a mini layout frame with a headline + subline — type in a real surface (echoes the video frame).
  return (
    <div style={{ width: 132, aspectRatio: "16 / 9", borderRadius: 6, border: `1px solid ${HAIR(24)}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 7, padding: "0 16px" }}>
      <span style={{ width: "72%", height: 9, background: "var(--t-ink)", borderRadius: 2 }} />
      <span style={{ width: "46%", height: 6, background: "var(--t-ink)", opacity: 0.5, borderRadius: 2 }} />
    </div>
  );
}
function DiagTune() {
  // two offset frames — the tracing-paper overlay (the registration edge in Tune red).
  return (
    <div style={{ position: "relative", width: 118, height: 62 }}>
      <span style={{ position: "absolute", left: 0, top: 0, width: 94, height: 50, borderRadius: 6, border: `1px solid ${HAIR(26)}`, background: "var(--t-bg-lift)" }} />
      <span style={{ position: "absolute", left: 18, top: 12, width: 94, height: 50, borderRadius: 6, border: "1px solid var(--t-anchor)", background: "color-mix(in oklab, var(--t-bg-lift) 82%, transparent)" }} />
    </div>
  );
}

const STEPS = [
  { kicker: "THE IDEA", title: "Compare fonts the fair way", Visual: DiagCapMatch,
    body: "Cotejo resizes every candidate to share one cap height with your base — so what you’re judging is the shape of the letters, not which font happens to render bigger." },
  { kicker: "SET UP", title: "Pick the roles you use", Visual: DiagRoles,
    body: "Define the roles in your system — display, body, labels — and a base font to beat. A demo is already loaded, so you can dive straight in." },
  { kicker: "COMPARE", title: "See it in real layouts", Visual: DiagSurfaces,
    body: "Switch “preview in” from letterforms to a real surface — hero, article, pricing, or title cards, lower-thirds and captions for video. Your type, where it actually ships." },
  { kicker: "KEEP IT", title: "Save a direction, then fine-tune", Visual: DiagTune,
    body: "Save a pairing you like as a Direction, then open Tune to calibrate it against your base with a tracing-paper overlay." },
];

export function Walkthrough() {
  const { open, close } = useTour();
  const { setMode } = useMode();
  const [i, setI] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  // each open starts at step 0 and replays the entrance.
  React.useEffect(() => { if (open) { setI(0); setMounted(false); const r = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(r); } }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setI((n) => Math.min(STEPS.length - 1, n + 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);
  if (!open) return null;

  const last = i === STEPS.length - 1;
  const step = STEPS[i];
  const Visual = step.Visual;
  // last step drops you into Compare (where the loop actually happens) and closes for good.
  const next = () => { if (last) { setMode("compare"); close(); } else setI((n) => n + 1); };

  return ReactDOM.createPortal(
    <div
      role="dialog" aria-modal="true" aria-label="Cotejo walkthrough" onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center", padding: 20,
        background: "rgba(var(--t-scrim),0.34)", opacity: mounted ? 1 : 0, transition: "opacity 180ms var(--t-ease)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, 94vw)", background: "var(--t-bg-lift)", borderRadius: "var(--t-r-panel)", padding: 24, position: "relative",
          boxShadow: "inset 0 1px 0 0 var(--t-white-edge), 0 30px 70px -30px rgba(var(--t-scrim),0.5)",
          opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0) scale(1)" : "translateY(6px) scale(0.985)",
          transition: "opacity 200ms var(--t-ease), transform 200ms var(--t-ease)",
        }}
      >
        <button className="t-iconbtn" onClick={close} aria-label="Close walkthrough" style={{ position: "absolute", top: 14, right: 14 }}><Close size={15} /></button>

        {/* the diagram — keyed on step so it crossfades on change */}
        <div key={i} className="t-tour-fade" style={{ background: "var(--t-surface-2)", borderRadius: "var(--t-r-block)", height: 100, display: "grid", placeItems: "center", marginBottom: 18, overflow: "hidden" }}>
          <Visual />
        </div>

        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>{step.kicker}</div>
        <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--t-ink)", margin: "8px 0 0" }}>{step.title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.52, color: "var(--t-ink-2)", margin: "9px 0 0", minHeight: 64 }}>{step.body}</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
          {/* progress dots (also clickable) — ink, never cobalt (a readout, not a picked state) */}
          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            {STEPS.map((s, n) => (
              <button key={n} onClick={() => setI(n)} aria-label={`Step ${n + 1}: ${s.title}`}
                style={{ width: n === i ? 18 : 7, height: 7, padding: 0, border: "none", cursor: "pointer", borderRadius: 99, background: n === i ? "var(--t-ink)" : "var(--t-ink-3)", transition: "width var(--t-dur) var(--t-ease), background var(--t-dur) var(--t-ease)" }} />
            ))}
          </div>
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            {i > 0 && <Btn variant="ghost" size="sm" onClick={() => setI((n) => n - 1)}>Back</Btn>}
            <Btn variant="primary" size="sm" onClick={next}>{last ? "Start comparing" : "Next"}{last && <ArrowRight size={14} />}</Btn>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// the bar's re-open affordance — a quiet ? that reopens the tour any time.
export function TourButton() {
  const { openTour } = useTour();
  return (
    <button className="t-iconbtn" onClick={openTour} aria-label="Take the tour" title="Take the tour" style={{ color: "var(--t-ink-3)" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.3 6.3c0-1 .8-1.7 1.7-1.7s1.7.7 1.7 1.6c0 1.3-1.6 1.3-1.6 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11.3" r="0.85" fill="currentColor" />
      </svg>
    </button>
  );
}
