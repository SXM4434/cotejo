// ExportPanel (AIRTIGHT-PASS F1) — the deliverable leaves the tool as real code, not a screenshot.
// Three formats from the live type system: CSS custom properties · DTCG token JSON (Style Dictionary /
// Tokens Studio) · a plain spec for a non-designer / Canva handoff. Copy or download. A license line
// tells you which fonts are free to ship vs. an upload you need to clear (F4) — right where you ship.
import React from "react";
import ReactDOM from "react-dom";
import { useSession, FACES } from "../state/SessionContext";
import { buildExport, type ExportFormat, type ExportUnit } from "../lib/exportTokens";
import { Segmented } from "./Segmented";
import { Btn } from "./Btn";
import { Warn, Close } from "./icons";
import { LicenseControl } from "./LicenseControl";
import { ShipSummary } from "./ShipSummary";
import { modalMotion } from "../lib/popover";
import { tactileSuccess } from "../lib/feedback";

const MONO = "var(--t-sans)";

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const { roles, scale, fontsVersion } = useSession();
  void fontsVersion; // re-read FACES license state after a clearance toggle
  const [fmt, setFmt] = React.useState<ExportFormat>("spec"); // default to Plain text — non-designers bounced on a wall of CSS (100-run)
  const [unit, setUnit] = React.useState<ExportUnit>("rem");
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { text, filename, mime } = buildExport(fmt, roles, scale, unit);
  const copy = () => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); tactileSuccess(); window.setTimeout(() => setCopied(false), 1200); }).catch(() => {}); };
  const download = () => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    tactileSuccess();
  };

  // the fonts this system actually uses, with their license — so "free to ship" vs "verify" is right
  // here at export time. Uploads are listed first (they're the ones that need a decision).
  const usedIds = Array.from(new Set(roles.map((r) => r.fontId)));
  const used = usedIds.map((id) => FACES.find((f) => f.id === id)).filter(Boolean) as typeof FACES;
  const uploads = used.filter((f) => f.id.startsWith("user-"));
  const trial = uploads.filter((f) => f.licStatus === "trial");     // must NOT ship — hard warn

  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(var(--t-scrim),0.30)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div className="t-pop" style={{ width: "min(640px, 100%)", maxHeight: "88vh", display: "flex", flexDirection: "column", background: "var(--t-bg-lift)", borderRadius: "var(--t-r-panel)", padding: "20px 22px 22px", boxShadow: "0 24px 64px -22px rgba(var(--t-scrim),0.42)", ...modalMotion }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>Export type system</span>
          <button className="t-iconbtn" onClick={onClose} aria-label="Done" style={{ marginLeft: "auto" }}>
            <Close size={15} />
          </button>
        </div>

        {/* what actually ships — the resolved system, before you pick a format */}
        <ShipSummary roles={roles} scale={scale} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <Segmented
            options={[{ id: "spec", label: "Plain text" }, { id: "css", label: "CSS" }, { id: "tailwind", label: "Tailwind" }, { id: "json", label: "Tokens" }]}
            value={fmt} onChange={(v) => setFmt(v as ExportFormat)} ariaLabel="Export format" compact
          />
          {fmt !== "spec" && (
            <Segmented
              options={[{ id: "rem", label: "rem" }, { id: "px", label: "px" }]}
              value={unit} onChange={(v) => setUnit(v as ExportUnit)} ariaLabel="Units" compact
            />
          )}
          <span style={{ fontSize: 12, color: "var(--t-ink-3)" }}>
            {fmt === "css" ? "Drop into any stylesheet" : fmt === "tailwind" ? "Merge into your tailwind.config — font-{role} + text-{role}" : fmt === "json" ? "Design tokens — for Tokens Studio / Style Dictionary" : "Hand to your dev or paste in a doc — no code"}
          </span>
        </div>

        <textarea
          readOnly value={text} spellCheck={false} aria-label="Export output"
          onFocus={(e) => e.currentTarget.select()}
          style={{ flex: 1, minHeight: 220, resize: "none", width: "100%", boxSizing: "border-box", background: "var(--t-surface-2)", border: "none", borderRadius: "var(--t-r-menu)", padding: "13px 15px", fontFamily: "var(--t-mono)", fontSize: 12.5, lineHeight: 1.55, color: "var(--t-ink)", outline: "none", marginBottom: 12, whiteSpace: "pre", overflow: "auto" }}
        />

        {/* license — resolve each upload right here at ship time (cleared / trial-eval / verify). The
            user records THEIR own determination; Cotejo never asserts it. Trial fonts hard-warn. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14, fontFamily: MONO, fontSize: 10.5, color: "var(--t-ink-3)" }}>
          {uploads.length === 0 && <span>All fonts in this system are open-source — free to ship.</span>}
          {trial.length > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--t-ink)", fontWeight: 600 }}>
              <Warn size={13} /> NOT licensed for production — do not ship: {trial.map((f) => f.label).join(", ")}.
            </span>
          )}
          {uploads.map((f) => (
            // COMPACT here (status + date only) — the who/note record lives in Manage fonts so the
            // ship modal doesn't read as license-management software. It still stamps the export.
            <div key={f.id} title="“Cleared” records that you’ve confirmed the license — Cotejo doesn’t verify it for you." style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
              <span style={{ color: "var(--t-ink-2)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
              <LicenseControl face={f} compact />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" size="md" onClick={download}>Download {filename.split(".").pop()}</Btn>
          <Btn variant={copied ? "accent" : "primary"} size="md" onClick={copy}>{copied ? "Copied" : "Copy"}</Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}
