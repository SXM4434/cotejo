// LicenseControl — set an UPLOAD's license record (the user's OWN determination; Cotejo never asserts
// it). Three states: unverified (the default "verify" nag) · cleared-to-ship · trial/eval-only (must
// NOT ship → hard-flagged in every export). When cleared you can attach WHO cleared it + a note
// (foundry / license / order #), so the dated clearance is a defensible record at a client handoff.
// Shared by the Fonts manager and the Export panel. Palette-locked: cobalt = cleared (a positive,
// "picked" state); trial = strong ink + ⚠ (a negative state never gets the accent).
import React from "react";
import { useSession, type Face } from "../state/SessionContext";
import { Check, Warn } from "./icons";

const MONO = "var(--t-sans)";

export function LicenseControl({ face, compact = false }: { face: Face; compact?: boolean }) {
  const { setFontLicense } = useSession();
  const status = face.licStatus; // undefined | "cleared" | "trial"
  // who / note are committed on blur (local while typing → no per-keystroke persist churn).
  const [by, setBy] = React.useState(face.licBy ?? "");
  const [note, setNote] = React.useState(face.licNote ?? "");
  // reseed if the underlying record changes from elsewhere
  React.useEffect(() => { setBy(face.licBy ?? ""); setNote(face.licNote ?? ""); }, [face.id, face.licBy, face.licNote]);

  const pill = (active: boolean, tone: "match" | "warn" | "muted"): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "5px 11px", cursor: "pointer",
    fontFamily: MONO, fontSize: 10.5, lineHeight: 1.4, whiteSpace: "nowrap",
    boxShadow: active ? "none" : "inset 0 0 0 1px color-mix(in oklab, var(--t-ink) 16%, transparent)",
    background: active && tone === "match" ? "var(--t-match)" : active && tone === "warn" ? "var(--t-ink)" : "transparent",
    color: active ? "var(--t-bg-lift)" : tone === "muted" ? "var(--t-ink-3)" : "var(--t-ink-2)",
  });
  const set = (s: "cleared" | "trial") => setFontLicense(face.id, { status: status === s ? null : s });
  const fieldS: React.CSSProperties = { flex: 1, minWidth: 90, borderRadius: "var(--t-r-block)", background: "var(--t-surface-2)", padding: "4px 8px", fontFamily: MONO, fontSize: 11, color: "var(--t-ink)", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: compact ? "flex-end" : "stretch" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, flexWrap: "wrap", justifyContent: compact ? "flex-end" : "flex-start" }}>
        <button type="button" onClick={() => set("cleared")} style={pill(status === "cleared", "match")}
          title="Record that you’ve confirmed this font’s license permits shipping it">
          {status === "cleared" && <Check size={11} />} cleared to ship
        </button>
        <button type="button" onClick={() => set("trial")} style={pill(status === "trial", "warn")}
          title="Mark as a trial / eval font — flagged ‘do not ship’ in every export">
          {status === "trial" && <Warn size={11} />} trial / eval
        </button>
        {status === "cleared" && face.clearedAt && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--t-ink-3)" }}>{face.clearedAt.slice(0, 10)}</span>
        )}
      </div>
      {status === "trial" && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, color: "var(--t-ink-2)" }}>
          <Warn size={11} /> Not licensed for production — flagged in every export.
        </span>
      )}
      {status === "cleared" && !compact && (
        // the attributable record — who cleared it + a foundry / license / order-# note (both optional)
        <div style={{ display: "flex", gap: 6, width: "100%" }}>
          <input value={by} onChange={(e) => setBy(e.target.value)} onBlur={() => setFontLicense(face.id, { by })}
            placeholder="cleared by (you)" aria-label="Cleared by" spellCheck={false} style={{ ...fieldS, maxWidth: 130 }} />
          <input value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => setFontLicense(face.id, { note })}
            placeholder="note — foundry / license / order #" aria-label="License note" spellCheck={false} style={fieldS} />
        </div>
      )}
    </div>
  );
}
