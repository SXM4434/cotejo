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
const SANS = "var(--t-sans)";
const SERIF = "Georgia, 'Times New Roman', serif";
const HAIR = (pct: number) => `color-mix(in oklab, var(--t-ink) ${pct}%, transparent)`;

// ── diagrams (one per step) — REAL type, not placeholder boxes. Two universally-available faces
// (Georgia serif vs the app sans) carry the contrast, so they render the same for everyone. ──
function DiagCapMatch() {
  // two faces held to ONE cap height — real caps grazing the dashed cap-line, sitting on a baseline.
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "baseline", gap: 32, padding: "14px 8px 16px" }}>
      <span aria-hidden style={{ position: "absolute", left: -4, right: -4, top: 12, borderTop: `1px dashed ${HAIR(34)}` }} />
      <span aria-hidden style={{ position: "absolute", left: -4, right: -4, bottom: 14, borderTop: `1px solid ${HAIR(18)}` }} />
      <span style={{ fontFamily: SERIF, fontSize: 42, lineHeight: 1, color: "var(--t-ink)" }}>Ha</span>
      <span style={{ fontFamily: SANS, fontSize: 42, fontWeight: 600, lineHeight: 1, color: "var(--t-ink)" }}>Ha</span>
    </div>
  );
}
function DiagRoles() {
  // a real type ramp — display → body → label, in actual words.
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
      <span style={{ fontFamily: SANS, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--t-ink)" }}>Display</span>
      <span style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1, color: "var(--t-ink)", opacity: 0.82 }}>Body text</span>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>Label</span>
    </div>
  );
}
function DiagRecs() {
  // a recommendation list — real font names, the picked one marked in cobalt (its reserved meaning).
  const rows: [string, boolean][] = [["Unbounded", true], ["Newsreader", false], ["Hanken Grotesk", false]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {rows.map(([name, rec]) => (
        <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: SANS, fontSize: 15, color: "var(--t-ink)" }}>
          <span style={{ width: 5, height: 5, borderRadius: 99, background: rec ? "var(--t-match)" : HAIR(26), flexShrink: 0 }} />
          {name}
        </span>
      ))}
    </div>
  );
}
function DiagCompare() {
  // onion — the same word in two faces, overlaid + offset (one ghosted): crossfade to compare.
  return (
    <div style={{ position: "relative", width: 168, height: 50, display: "grid", placeItems: "center" }}>
      <span style={{ position: "absolute", fontFamily: SANS, fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--t-ink)" }}>Form</span>
      <span style={{ position: "absolute", fontFamily: SERIF, fontSize: 34, color: "var(--t-ink)", opacity: 0.4, transform: "translate(7px, 3px)" }}>Form</span>
    </div>
  );
}
function DiagSurfaces() {
  // a mini 16:9 layout with real headline + subline — type in a real surface (echoes the video frame).
  return (
    <div style={{ width: 150, aspectRatio: "16 / 9", borderRadius: 6, border: `1px solid ${HAIR(24)}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, padding: "0 16px", overflow: "hidden" }}>
      <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--t-ink)" }}>After the Tide</span>
      <span style={{ fontFamily: SANS, fontSize: 9, lineHeight: 1.1, color: "var(--t-ink)", opacity: 0.55 }}>A film in three parts</span>
    </div>
  );
}
function DiagTune() {
  // tracing-paper overlay — the same word with a ghost copy + the Tune-red registration baseline.
  return (
    <div style={{ position: "relative", width: 132, height: 52, display: "grid", placeItems: "center" }}>
      <span style={{ position: "absolute", fontFamily: SANS, fontSize: 30, fontWeight: 600, color: "var(--t-ink)" }}>Aa</span>
      <span style={{ position: "absolute", fontFamily: SERIF, fontSize: 30, color: "var(--t-anchor)", opacity: 0.65, transform: "translate(7px, 2px)" }}>Aa</span>
      <span aria-hidden style={{ position: "absolute", left: 26, right: 26, bottom: 12, borderTop: "1px solid var(--t-anchor)", opacity: 0.5 }} />
    </div>
  );
}

const STEPS = [
  { kicker: "THE IDEA", title: "Compare fonts the fair way", Visual: DiagCapMatch,
    body: "Cotejo resizes every candidate to share one cap height with your base — so what you’re judging is the shape of the letters, not which font happens to render bigger." },
  { kicker: "SET UP", title: "Pick the roles you use", Visual: DiagRoles,
    body: "Define the roles in your system — display, body, labels — and a base font to beat. A demo is already loaded, so you can dive straight in." },
  { kicker: "FIND FONTS", title: "Audition real candidates", Visual: DiagRecs,
    body: "Search your own fonts or pull straight from Google Fonts — and Cotejo recommends candidates that pair well with your base, ranked, with a ● on the strongest." },
  { kicker: "COMPARE", title: "Three ways to weigh them", Visual: DiagCompare,
    body: "View one system, set candidates Side by side, or Onion two and crossfade — overlay the same words in two faces and watch exactly what changes." },
  { kicker: "REAL LAYOUTS", title: "See it where it ships", Visual: DiagSurfaces,
    body: "Switch “preview in” from letterforms to a real surface — hero, article, pricing, or title cards, lower-thirds and captions for video." },
  { kicker: "KEEP IT", title: "Save, fine-tune, export", Visual: DiagTune,
    body: "Save a pairing as a Direction, calibrate it against your base in Tune with a tracing-paper overlay, then export your system when it’s right." },
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
        {/* close gets its OWN row above the diagram — never overlapped/covered by it (pulled up into
            the top padding so it costs almost no height) */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 4 }}>
          <button className="t-iconbtn" onClick={close} aria-label="Close walkthrough" style={{ color: "var(--t-ink-3)" }}><Close size={15} /></button>
        </div>

        {/* the diagram — keyed on step so it crossfades on change */}
        <div key={i} className="t-tour-fade" style={{ background: "var(--t-surface-2)", borderRadius: "var(--t-r-block)", height: 100, display: "grid", placeItems: "center", marginBottom: 16, overflow: "hidden" }}>
          <Visual />
        </div>

        {/* kicker + title read as ONE unit — eyebrow sits tight to its heading (tighter than the gap
            above it to the diagram) */}
        <div style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>{step.kicker}</div>
        <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--t-ink)", margin: "5px 0 0" }}>{step.title}</h2>
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
    <button className="t-iconbtn" onClick={openTour} aria-label="Take the tour" title="Take the tour — replay the walkthrough" style={{ color: "var(--t-ink-2)" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.3 6.3c0-1 .8-1.7 1.7-1.7s1.7.7 1.7 1.6c0 1.3-1.6 1.3-1.6 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11.3" r="0.85" fill="currentColor" />
      </svg>
    </button>
  );
}
