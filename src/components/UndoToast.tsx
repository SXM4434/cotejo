// UndoToast — the recourse for the two destructive bulk applies (preset / direction). When a bulk
// replace happens, the session stashes a snapshot; this surfaces a quiet "Replaced with X · Undo" pill
// above the dock for 6s. One toast, lives at the app root so it shows in any mode.
import React from "react";
import { useSession } from "../state/SessionContext";

export function UndoToast() {
  const { undo, undoBulk, clearUndo } = useSession();
  React.useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(clearUndo, 6000);
    return () => window.clearTimeout(t);
  }, [undo, clearUndo]);
  if (!undo) return null;
  return (
    <div role="status" aria-live="polite" data-no-refract
      style={{
        position: "fixed", left: "50%", bottom: 96, transform: "translateX(-50%)", zIndex: 120,
        display: "inline-flex", alignItems: "center", gap: 14, padding: "9px 11px 9px 16px",
        borderRadius: 999, background: "var(--t-ink)", color: "var(--t-bg)",
        boxShadow: "0 8px 26px -10px rgba(var(--t-scrim), 0.55)", fontSize: 13, whiteSpace: "nowrap",
        animation: "t-toast-in 180ms var(--t-ease)",
      }}>
      <span>Replaced with <strong style={{ fontWeight: 600 }}>{undo.label}</strong></span>
      <button type="button" onClick={undoBulk} className="t-btn"
        style={{
          font: "inherit", fontWeight: 600, color: "var(--t-bg)", background: "rgba(255,255,255,0.16)",
          border: "none", borderRadius: 999, padding: "5px 14px", cursor: "pointer",
        }}>Undo</button>
    </div>
  );
}
