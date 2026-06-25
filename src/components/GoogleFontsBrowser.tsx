// GoogleFontsBrowser — search the FULL Google Fonts directory (~1,936, bundled), preview each in
// its own face, add on demand. The curated shelf is the default when the search is empty; typing
// searches the whole directory (real names + categories → no guessing, no wrong case, always exists).
import React from "react";
import ReactDOM from "react-dom";
import { useSession, FACES } from "../state/SessionContext";
import { GOOGLE_FONTS, gfId, gfFallback } from "../data/googleFonts";
import { GOOGLE_FONTS_ALL } from "../data/googleFontsAll";
import { tactileSelect } from "../lib/feedback";
import { Btn } from "./Btn";
import { Check, Close } from "./icons";
import { modalMotion } from "../lib/popover";

const MONO = "var(--t-sans)";
const CAP = 60; // preview/render at most this many results per search (keeps requests + DOM sane)

// (re)point one <link> at the families currently shown so each row previews in its own face — the
// browser only fetches a woff2 when a row actually renders.
function loadPreviews(families: string[]) {
  if (typeof document === "undefined" || !families.length) return;
  let link = document.getElementById("gf-preview") as HTMLLinkElement | null;
  if (!link) { link = document.createElement("link"); link.id = "gf-preview"; link.rel = "stylesheet"; document.head.appendChild(link); }
  link.href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`;
}

export function GoogleFontsBrowser({ onClose }: { onClose: () => void }) {
  const { addGoogleFont, fontsVersion } = useSession();
  void fontsVersion; // re-render so the ✓ updates as fonts get added
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const qt = q.trim().toLowerCase();
  const matches = qt ? GOOGLE_FONTS_ALL.filter((g) => g.family.toLowerCase().includes(qt)) : GOOGLE_FONTS;
  const shown = matches.slice(0, CAP);

  React.useEffect(() => {
    const t = setTimeout(() => loadPreviews(shown.map((g) => g.family)), 200); // debounce per settled query
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qt]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Only autofocus the search on a real pointer (mouse/trackpad) — on touch this would slam the
  // on-screen keyboard up and cover the modal (web-interface-guidelines · Touch).
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches) inputRef.current?.focus();
  }, []);

  const has = (family: string) => FACES.some((f) => f.id === gfId(family));
  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(var(--t-scrim),0.30)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div className="t-pop" style={{ width: "min(560px, 100%)", maxHeight: "86vh", display: "flex", flexDirection: "column", background: "var(--t-bg-lift)", borderRadius: "var(--t-r-panel)", padding: "20px 22px 22px", boxShadow: "0 24px 64px -22px rgba(var(--t-scrim),0.42)", ...modalMotion }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>Google Fonts · {GOOGLE_FONTS_ALL.length} families</span>
          <button className="t-iconbtn" onClick={onClose} aria-label="Done" style={{ marginLeft: "auto" }}>
            <Close size={15} />
          </button>
        </div>
        <input
          ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all Google Fonts…" aria-label="Search Google Fonts" spellCheck={false}
          style={{ width: "100%", border: "none", outline: "none", background: "var(--t-surface-2)", borderRadius: "var(--t-r-block)", fontSize: 15, padding: "11px 14px", color: "var(--t-ink)", marginBottom: 6, boxSizing: "border-box" }}
        />
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--t-ink-3)", padding: "2px 4px 10px" }}>
          {qt ? (matches.length ? `${matches.length} match${matches.length === 1 ? "" : "es"}${matches.length > CAP ? ` · showing first ${CAP}` : ""}` : `No Google font named “${q.trim()}”`) : "Featured — or search the full directory"}
        </div>
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
          {shown.map((g) => {
            const added = has(g.family);
            return (
              <div key={g.family} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: "var(--t-r-block)" }}>
                <span style={{ flex: 1, minWidth: 0, fontFamily: `'${g.family}', ${gfFallback(g.category)}`, fontSize: 22, color: "var(--t-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.family}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--t-ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{g.category}</span>
                {added
                  ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 5, fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)", flexShrink: 0, minWidth: 56 }}><Check size={12} /> added</span>
                  : <Btn variant="secondary" size="sm" mono onClick={() => { tactileSelect(); addGoogleFont(g.family, g.category); }}>add</Btn>}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
