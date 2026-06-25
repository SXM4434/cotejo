// FontsManager — see + remove every font you've ADDED (Google + uploads). Scrollable + filterable,
// so it scales to hundreds — which is why the Set Up section is a count + "manage", not a pill wall.
import React from "react";
import ReactDOM from "react-dom";
import { useSession, FACES } from "../state/SessionContext";
import { modalMotion } from "../lib/popover";
import { LicenseControl } from "./LicenseControl";
import { Close } from "./icons";

const MONO = "var(--t-sans)";

export function FontsManager({ onClose }: { onClose: () => void }) {
  const { removeUserFont, fontsVersion } = useSession();
  void fontsVersion; // re-render as fonts are removed / cleared
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const all = FACES.filter((f) => f.user);
  const list = all.filter((f) => f.label.toLowerCase().includes(q.trim().toLowerCase()));
  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(var(--t-scrim),0.30)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div className="t-pop" style={{ width: "min(520px, 100%)", maxHeight: "86vh", display: "flex", flexDirection: "column", background: "var(--t-bg-lift)", borderRadius: "var(--t-r-panel)", padding: "20px 22px 22px", boxShadow: "0 24px 64px -22px rgba(var(--t-scrim),0.42)", ...modalMotion }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>Your fonts · {all.length}</span>
          <button className="t-iconbtn" onClick={onClose} aria-label="Done" style={{ marginLeft: "auto" }}>
            <Close size={15} />
          </button>
        </div>
        {all.length > 8 && (
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter your fonts…" aria-label="Filter your fonts" spellCheck={false}
            style={{ width: "100%", border: "none", outline: "none", background: "var(--t-surface-2)", borderRadius: "var(--t-r-block)", fontSize: 14, padding: "10px 13px", color: "var(--t-ink)", marginBottom: 10, boxSizing: "border-box" }} />
        )}
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
          {list.length === 0 && <div style={{ padding: 12, color: "var(--t-ink-3)", fontSize: 14 }}>{all.length ? "No match." : "No fonts added yet — Browse Google Fonts or upload your own."}</div>}
          {list.map((f) => {
            const isUpload = f.id.startsWith("user-"); // Google fonts carry their own license — only uploads need a determination
            return (
            <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 10px", borderRadius: "var(--t-r-block)" }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: f.family, fontSize: 20, color: "var(--t-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingTop: 1 }}>{f.label}</span>
              {/* license — only uploads carry the user's determination (cleared / trial / verify); Google
                  + built-ins are open-source. The control records WHO + a note → a defensible handoff. */}
              {isUpload && <div style={{ minWidth: 0, flexShrink: 0, maxWidth: 320 }}><LicenseControl face={f} /></div>}
              <button className="t-iconbtn" aria-label={`Remove ${f.label}`} onClick={() => removeUserFont(f.id)} style={{ marginTop: 1 }}>
                <Close size={14} />
              </button>
            </div>
          );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
