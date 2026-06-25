// SessionSwitcher — the Workspace control in the GlobalBar. Shows the active session + a menu to
// switch · rename (inline on the active one) · new · duplicate · delete. Portaled dropdown, same
// glass/squircle language as the other menus.
import React from "react";
import ReactDOM from "react-dom";
import { useWorkspace } from "../state/WorkspaceContext";
import { useMode } from "../state/ModeContext";
import { exportComparisonPng } from "../lib/exportImage";
import { ExportPanel } from "./ExportPanel";
import { tactileSelect, tactileSuccess } from "../lib/feedback";
import { Check, Plus, ChevronDown, Close } from "./icons";
import { popMotion } from "../lib/popover";

const MONO = "var(--t-sans)";
const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", padding: "8px 12px 4px" };

export function SessionSwitcher() {
  const { sessions, activeId, active, switchSession, newSession, duplicateSession, renameSession, deleteSession, exportActive, importFile, shareActive } = useWorkspace();
  const { mode } = useMode();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [png, setPng] = React.useState<"idle" | "saving" | "done" | "err">("idle");
  const [exporting, setExporting] = React.useState(false); // type-token export, reachable from any mode (100-run #8)
  const savePng = async () => {
    setPng("saving"); tactileSelect();
    const r = await exportComparisonPng(`cotejo-${active.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "comparison"}.png`);
    if (r.ok) { tactileSuccess(); setPng("done"); } else { setPng("err"); }
    window.setTimeout(() => setPng("idle"), 1800);
  };
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);

  const place = React.useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  }, []);
  React.useLayoutEffect(() => { if (open) place(); }, [open, place]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { const t = e.target as Node; if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return; setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef} className="t-pill" aria-haspopup="menu" aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((v) => !v)}
        onPointerDown={(e) => { e.currentTarget.style.scale = "var(--t-press-scale)"; }}
        onPointerUp={(e) => { e.currentTarget.style.scale = "1"; }}
        onPointerLeave={(e) => { e.currentTarget.style.scale = "1"; }}
        title="Sessions — your saved setups"
        style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: "var(--t-h-pill)", padding: "0 13px", borderRadius: 999, border: "none", color: "var(--t-ink)", fontSize: 13, fontWeight: 500, maxWidth: 210 }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M2.5 6.5h11" stroke="currentColor" strokeWidth="1.4" /></svg>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.name}</span>
        <ChevronDown size={9} style={{ opacity: 0.4, flexShrink: 0 }} />
      </button>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} className="t-pop" style={{ position: "fixed", top: pos.top, right: pos.right, width: 252, zIndex: 200, filter: "drop-shadow(0 14px 30px rgba(var(--t-scrim),0.16))", ...popMotion(pos) }}>
          <div style={{ background: "rgba(255,255,255,0.98)", borderRadius: "var(--t-r-menu)", padding: 6, boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05)" }}>
            <div style={eyebrow}>Sessions</div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {sessions.map((s) => {
                const isActive = s.id === activeId;
                return (
                  // the active session is marked by a small cobalt dot (the picker canon — accent on a
                  // mark, never a wash) + ink text; the row, not the button, owns the full-width hover.
                  <div key={s.id} className="t-listrow">
                    <span aria-hidden style={{ width: 14, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {isActive && <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--t-match)" }} />}
                    </span>
                    {isActive ? (
                      <input
                        className="t-renameinput"
                        value={s.name} onChange={(e) => renameSession(s.id, e.target.value)} aria-label="Session name" title="Rename this session"
                        style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: "var(--t-ink)", padding: "9px 4px" }}
                      />
                    ) : (
                      <button className="t-opt" style={{ flex: 1, justifyContent: "flex-start", paddingLeft: 4 }} onClick={() => { tactileSelect(); switchSession(s.id); setOpen(false); }}>
                        <span style={{ fontSize: 14 }}>{s.name}</span>
                      </button>
                    )}
                    {sessions.length > 1 && (
                      <button className="t-iconbtn t-rowx" aria-label={`Delete ${s.name}`} onClick={() => deleteSession(s.id)} style={{ flexShrink: 0 }}>
                        <Close size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: "1px solid color-mix(in oklab, var(--t-ink) 8%, transparent)", marginTop: 4, paddingTop: 4 }}>
              <button className="t-opt" onClick={() => { tactileSelect(); newSession(); setOpen(false); }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Plus size={13} /> New session</span></button>
              <button className="t-opt" onClick={() => { tactileSelect(); duplicateSession(activeId); setOpen(false); }}><span>Duplicate this one</span></button>
            </div>
            <div style={{ borderTop: "1px solid color-mix(in oklab, var(--t-ink) 8%, transparent)", marginTop: 4, paddingTop: 4 }}>
              {/* the deliverable — reachable from every mode, not just Set Up (100-run #8) */}
              <button className="t-opt" onClick={() => { tactileSelect(); setExporting(true); setOpen(false); }}><span>Export CSS / tokens…</span></button>
              {mode === "compare" && (
                <button className="t-opt" onClick={savePng} disabled={png === "saving"}>
                  <span>Save comparison as PNG</span>
                  {png !== "idle" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 10, color: png === "err" ? "var(--t-ink-2)" : "var(--t-match)" }}>{png === "saving" ? "…" : png === "done" ? <><Check size={11} /> saved</> : "couldn’t"}</span>}
                </button>
              )}
              <button className="t-opt" onClick={() => { tactileSelect(); exportActive(); setOpen(false); }}><span>Export to file</span></button>
              <button className="t-opt" onClick={() => { tactileSelect(); fileRef.current?.click(); }}><span>Import a file…</span></button>
              <button className="t-opt" onClick={() => { tactileSelect(); shareActive(); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }}>
                <span>Share link</span>
                {copied && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 10, color: "var(--t-match)" }}><Check size={11} /> copied</span>}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      <input
        ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; setOpen(false); }}
      />
      {exporting && <ExportPanel onClose={() => setExporting(false)} />}
    </>
  );
}
