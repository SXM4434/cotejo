// InspectPanel (AIRTIGHT-PASS F6) — a FONT-FIRST view: inspect any one face with no role setup. Pick a
// font, see it at a range of sizes, its MEASURED metrics (cap-height + x-height ratios), its real
// OpenType support flags (detected, not assumed), and its license. The answer to "is this font any
// good / does it do small caps / can I ship it" without building a type system first.
import React from "react";
import ReactDOM from "react-dom";
import { useSession, FACES } from "../state/SessionContext";
import { FontPicker } from "./FontPicker";
import { measureFont, type RawMetrics } from "../lib/autofinetune";
import { supportedFeatures } from "../lib/otSupport";
import { licenseOf } from "../lib/license";
import { modalMotion } from "../lib/popover";
import { Close } from "./icons";

const MONO = "var(--t-sans)";
const SIZES = [64, 40, 28, 18, 13];

function useMetrics(measureFamily: string) {
  const [m, setM] = React.useState<RawMetrics | null>(null);
  React.useEffect(() => { let live = true; setM(null); measureFont(measureFamily, { weight: 400 }).then((r) => live && setM(r)); return () => { live = false; }; }, [measureFamily]);
  return m;
}

export function InspectPanel({ initialId, onClose }: { initialId?: string; onClose: () => void }) {
  const { fontsVersion } = useSession();
  void fontsVersion;
  const [fontId, setFontId] = React.useState(initialId ?? FACES[0].id);
  const face = FACES.find((f) => f.id === fontId) ?? FACES[0];
  const m = useMetrics(face.measureFamily);
  // OT support recomputes once metrics land (= the face is loaded, so detection is reliable).
  const feats = React.useMemo(() => supportedFeatures(face.measureFamily), [face.measureFamily, m]);
  const lic = licenseOf(face);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ratio = (n: number) => (m && m.cap > 0 ? n.toFixed(3) : "—");
  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(var(--t-scrim),0.30)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div className="t-pop" style={{ width: "min(680px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "var(--t-bg-lift)", borderRadius: "var(--t-r-panel)", padding: "20px 24px 24px", boxShadow: "0 24px 64px -22px rgba(var(--t-scrim),0.42)", ...modalMotion }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>Inspect a font</span>
          <span style={{ marginLeft: 4 }}><FontPicker value={fontId} onPick={setFontId} roleLabel="inspect" /></span>
          <button className="t-iconbtn" onClick={onClose} aria-label="Done" style={{ marginLeft: "auto" }}>
            <Close size={15} />
          </button>
        </div>

        {/* the face at a range of sizes — the first read */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {SIZES.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--t-ink-3)", width: 30, flexShrink: 0, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s}</span>
              <span style={{ fontFamily: face.family, fontSize: s, color: "var(--t-ink)", lineHeight: 1.1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {s >= 28 ? "Hamburgefonstiv" : "Set at 13px, this face still holds the line — counters open, figures even: 0123456789."}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px,100%),1fr))", gap: 20 }}>
          {/* measured metrics */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", marginBottom: 8 }}>Measured</div>
            <Row k="x-height ÷ cap" v={ratio(m ? m.xHeight / m.cap : 0)} />
            <Row k="cap-height (per em)" v={m ? m.cap.toFixed(3) : "—"} />
            <Row k="x-height (per em)" v={m ? m.xHeight.toFixed(3) : "—"} />
            <Row k="license" v={lic.short} warn={!lic.ship} />
          </div>
          {/* real OT support */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", marginBottom: 8 }}>OpenType support</div>
            {feats.map((f) => (
              <div key={f.tag} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
                <span style={{ fontSize: 13, color: f.supported ? "var(--t-ink-2)" : "var(--t-ink-3)" }}>{f.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: f.supported ? "var(--t-ink-2)" : "var(--t-ink-3)" }}>{f.supported ? "yes" : "—"}</span>
              </div>
            ))}
            {!m && <div style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--t-ink-3)", marginTop: 6 }}>measuring…</div>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
      <span style={{ fontSize: 13, color: "var(--t-ink-2)" }}>{k}</span>
      <span style={{ fontFamily: MONO, fontSize: 11, color: warn ? "var(--t-anchor)" : "var(--t-ink-2)", fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}
