// FontPicker — the ONE searchable font picker (cmdk-style), replacing pills + plain
// dropdowns everywhere a font is chosen (Compare add-candidate · base · Tune vs · Set Up
// role font). Built to scale to hundreds: typeahead filter, keyboard nav, already-added
// disabled, in-use/direction tags. Two shapes: a value SELECTOR (shows current) or an
// ADD button. Portaled popover with up-flip (per docs/type-tool/09 §6).
import React from "react";
import ReactDOM from "react-dom";
import { FACES, useSession, type Face } from "../state/SessionContext";
import { gfFallback, loadGoogleCss, type GFCategory } from "../data/googleFonts";
import { tactileSelect } from "../lib/feedback";
import { GoogleFontsBrowser } from "./GoogleFontsBrowser";
import { RingDot, Check, Upload, Plus, ChevronDown } from "./icons";
import { popMotion } from "../lib/popover";

const MONO = "var(--t-sans)";

export function FontPicker({
  value, onPick, disabledIds = [], tagFor, tagForAny, recommended, roleLabel, label, addMode = false, placeholder, compact = false, bare = false, color,
}: {
  value?: string;
  onPick: (id: string) => void;
  disabledIds?: string[];
  tagFor?: (id: string) => string | undefined;     // TIER 1 — directions' font FOR THIS role
  tagForAny?: (id: string) => string | undefined;  // TIER 2 — directions' fonts for OTHER roles
  // TIER 0 — engine picks for this role (◎ + reason). `gf` marks a CURATED GOOGLE font not yet loaded:
  // shown with its real specimen (loaded on open) and added to the catalog when picked.
  recommended?: { id: string; reason: string; gf?: { family: string; category: GFCategory } }[];
  roleLabel?: string;   // the role this picker is for ("Display") — names the tier-1 header so
                        // it's clear those are each direction's font FOR THIS role
  label?: string;
  addMode?: boolean;
  placeholder?: string;
  compact?: boolean;
  bare?: boolean;       // quiet TEXT trigger (no pill) — for the stack readout
  color?: string;       // value-text color (bare): cobalt if picked, ink-2 if from base
}) {
  const { addUserFont, addGoogleFont } = useSession();
  const [open, setOpen] = React.useState(false);
  const [browse, setBrowse] = React.useState(false); // add fonts FROM the dropdown (any picker)
  const [q, setQ] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pos, setPos] = React.useState<{ top?: number; bottom?: number; left: number; width: number; maxH: number } | null>(null);

  // filter by search, then group in tiers so the picker reads clearly:
  //  0) recFaces — engine recommendations for this role (cobalt ◎ + a plain reason)
  //  1) roleHits — the font each direction uses FOR THIS role (header names the role)
  //  2) anyHits  — the rest of those directions' fonts (other roles)
  //  3) rest     — every other font
  const ql = q.trim().toLowerCase();
  const filtered = FACES.filter((f) => f.label.toLowerCase().includes(ql));
  // recommendations include CURATED GOOGLE fonts not yet loaded — keep them (matched by family on
  // search) even though they aren't in FACES; render them via a lightweight ghost face + load on pick.
  const recList = (recommended ?? []).filter((r) => (r.gf ? r.gf.family.toLowerCase().includes(ql) : filtered.some((f) => f.id === r.id)));
  const recIds = new Set(recList.map((r) => r.id));
  const recReason = new Map(recList.map((r) => [r.id, r.reason] as const));
  const ghostFace = (r: { id: string; gf: { family: string; category: GFCategory } }): Face =>
    ({ id: r.id, name: r.gf.family, label: r.gf.family, family: `'${r.gf.family}', ${gfFallback(r.gf.category)}`, cat: r.gf.category, measureFamily: r.gf.family });
  const recFaces = recList.map((r) => FACES.find((f) => f.id === r.id) ?? ghostFace(r as { id: string; gf: { family: string; category: GFCategory } }));
  const roleHits = tagFor ? filtered.filter((f) => !recIds.has(f.id) && tagFor(f.id)) : [];
  const roleSet = new Set(roleHits.map((f) => f.id));
  const anyHits = tagForAny ? filtered.filter((f) => !recIds.has(f.id) && !roleSet.has(f.id) && tagForAny(f.id)) : [];
  const anySet = new Set(anyHits.map((f) => f.id));
  const rest = filtered.filter((f) => !recIds.has(f.id) && !roleSet.has(f.id) && !anySet.has(f.id));
  const results = [...recFaces, ...roleHits, ...anyHits, ...rest]; // keyboard nav order
  const pinned = [...recFaces, ...roleHits, ...anyHits]; // recommended + anything tagged from a direction
  const current = FACES.find((f) => f.id === value);
  const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", padding: "8px 10px 4px" };

  const place = React.useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const M = 14; // breathing room from the viewport edge so it never gets clipped
    const below = window.innerHeight - r.bottom - M;
    const above = r.top - M;
    const up = below < 360 && above > below; // flip up when down is tight AND up has more room
    const width = Math.max(230, Math.round(r.width));
    const maxH = Math.max(180, Math.round((up ? above : below) - 6)); // the panel caps to this + scrolls
    // clamp into the viewport so a right-edge trigger never pushes the panel off-screen (the menu is
    // wider than its trigger, so left:r.left alone clipped the right side)
    const left = Math.max(M, Math.min(r.left, window.innerWidth - width - M));
    setPos(up ? { bottom: window.innerHeight - r.top + 6, left, width, maxH } : { top: r.bottom + 6, left, width, maxH });
  }, []);
  React.useLayoutEffect(() => {
    if (!open) return;
    place(); setQ(""); setHi(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, place]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { const t = e.target as Node; if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return; setOpen(false); };
    const onKeyDoc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKeyDoc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKeyDoc); };
  }, [open]);
  // load the curated GOOGLE recommendations on open so their specimen renders in the REAL face
  // (loadGoogleCss only injects the <link>; the font swaps in once fetched) instead of a fallback.
  React.useEffect(() => {
    if (!open) return;
    for (const r of recommended ?? []) if (r.gf && !FACES.some((f) => f.id === r.id)) loadGoogleCss(r.gf.family);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (id: string) => {
    if (disabledIds.includes(id)) return;
    tactileSelect();
    // a curated Google recommendation not yet in the catalog → add it (loads + persists), then select
    const gfRec = (recommended ?? []).find((r) => r.id === id && r.gf && !FACES.some((f) => f.id === id));
    if (gfRec?.gf) addGoogleFont(gfRec.gf.family, gfRec.gf.category);
    onPick(id);
    setOpen(false);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(results.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const f = results[hi]; if (f) pick(f.id); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  return (
    <>
      <button
        ref={triggerRef} className={bare ? "t-bare" : "t-pill"} aria-haspopup="listbox" aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((o) => !o)}
        // workhorse control — must respond to press like every other pill (reduced-motion respected
        // via the global transition-duration override). Bare text trigger has no pill to scale.
        onPointerDown={(e) => { if (!bare) e.currentTarget.style.scale = "var(--t-press-scale)"; }}
        onPointerUp={(e) => { if (!bare) e.currentTarget.style.scale = "1"; }}
        onPointerLeave={(e) => { if (!bare) e.currentTarget.style.scale = "1"; }}
        style={bare
          ? { display: "inline-flex", alignItems: "baseline", gap: 4, border: "none", background: "none", padding: 0, color: color ?? "var(--t-ink-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer" }
          : { display: "inline-flex", alignItems: "center", gap: 8, minHeight: compact || addMode ? "var(--t-h-pill-sm)" : "var(--t-h-pill)", padding: "0 15px", borderRadius: 999, border: "none", color: addMode ? "var(--t-ink-2)" : "var(--t-ink)", fontSize: addMode ? 13 : 14, fontWeight: 500 }}
      >
        {addMode ? (
          <><span style={{ color: "var(--t-ink-3)", display: "inline-flex" }}><Plus size={13} /></span> {placeholder ?? "Add font"}</>
        ) : (
          <>
            {/* label + value baseline-aligned (mono caps on the sans baseline) */}
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
              {label && <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1 }}>{label}</span>}
              <span style={{ lineHeight: 1 }}>{current?.label ?? placeholder ?? "Pick a font"}</span>
            </span>
            <ChevronDown size={bare ? 9 : 11} style={{ opacity: bare ? 0.35 : 0.5 }} />
          </>
        )}
      </button>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} className="t-pop" style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, zIndex: 200, filter: "drop-shadow(0 14px 30px rgba(var(--t-scrim),0.16))", ...popMotion(pos) }}>
          {/* FLEX COLUMN capped to the available space + overflow:hidden → the panel NEVER spills past
              the viewport; the search box + footer stay fixed and the LIST scrolls in what's left. */}
          <div style={{ display: "flex", flexDirection: "column", maxHeight: Math.min(pos.maxH, 460), overflow: "hidden", background: "rgba(255,255,255,0.98)", borderRadius: "var(--t-r-menu)", padding: 6, boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05)" }}>
            <input
              ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setHi(0); }} onKeyDown={onKey}
              placeholder="Search fonts…" aria-label="Search fonts" spellCheck={false}
              style={{ width: "100%", flexShrink: 0, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 14, padding: "8px 10px 10px", color: "var(--t-ink)", boxSizing: "border-box" }}
            />
            <div role="listbox" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
              {results.length === 0 && <div style={{ padding: "8px 10px", fontSize: 13, color: "var(--t-ink-3)" }}>No fonts match</div>}
              {results.map((f, i) => {
                const disabled = disabledIds.includes(f.id);
                const rec = recReason.get(f.id);
                // tier-aware tag: this role's direction font vs an other-role direction font
                const tag = recIds.has(f.id) ? undefined : roleSet.has(f.id) ? tagFor?.(f.id) : anySet.has(f.id) ? tagForAny?.(f.id) : undefined;
                const headRec = i === 0 && recFaces.length > 0;                                            // tier-0 header (engine)
                const headRole = i === recFaces.length && roleHits.length > 0;                             // tier-1 header (names the role)
                const headAny = i === recFaces.length + roleHits.length && anyHits.length > 0;             // tier-2 header
                const headAll = i === pinned.length && pinned.length > 0 && rest.length > 0;               // tier-3 header
                return (
                  <React.Fragment key={f.id}>
                  {headRec && <div style={eyebrow}>recommended{roleLabel ? ` for ${roleLabel.toLowerCase()}` : ""}</div>}
                  {headRole && <div style={eyebrow}>{roleLabel ? `${roleLabel} · in your directions` : "in your directions"}</div>}
                  {headAny && <div style={{ ...eyebrow, marginTop: 2 }}>also in your directions</div>}
                  {headAll && <div style={{ ...eyebrow, marginTop: 2, borderTop: "1px solid color-mix(in oklab, var(--t-ink) 8%, transparent)" }}>all fonts</div>}
                  <button
                    className="t-opt" role="option" aria-selected={f.id === value} data-active={i === hi} disabled={disabled}
                    onMouseEnter={() => setHi(i)} onClick={() => pick(f.id)}
                    style={{ opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer", ...(rec ? { flexDirection: "column", alignItems: "stretch", gap: 3, minHeight: "var(--t-h-pill-lg)", paddingTop: 8, paddingBottom: 8 } : {}) }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%" }}>
                      <span style={{ fontFamily: f.family, fontSize: 15, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontFamily: MONO, fontSize: 10, color: "var(--t-ink-3)" }}>
                        {/* cobalt ring/check inherit via currentColor — kept in their --t-match context */}
                        {rec && <span style={{ color: "var(--t-match)", display: "inline-flex" }}><RingDot size={12} /></span>}
                        {tag && <span>{tag}</span>}
                        {disabled && <span>added</span>}
                        {f.id === value && <span style={{ color: "var(--t-match)", display: "inline-flex" }}><Check size={12} /></span>}
                      </span>
                    </span>
                    {rec && <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.01em", color: "var(--t-ink-3)", textAlign: "left", whiteSpace: "normal", lineHeight: 1.3 }}>{rec}</span>}
                  </button>
                  </React.Fragment>
                );
              })}
            </div>
            {/* ADD FONTS from any dropdown — STACKED (the narrow dropdown can't fit them side by
                side; row overflowed), pinned so they never scroll off / clip */}
            <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid color-mix(in oklab, var(--t-ink) 8%, transparent)", marginTop: 4, paddingTop: 4, flexShrink: 0 }}>
              <button className="t-opt" onMouseDown={(e) => e.preventDefault()} onClick={() => { setOpen(false); setBrowse(true); }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Plus size={13} /> Browse Google Fonts</span></button>
              <button className="t-opt" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Upload size={13} /> Upload a font</span></button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {/* closing the Google browser returns you to THIS dropdown (with the new font now in it) */}
      {browse && <GoogleFontsBrowser onClose={() => { setBrowse(false); setOpen(true); }} />}
      <input
        ref={fileRef} type="file" accept=".woff2,.woff,.otf,.ttf,font/woff2,font/otf,font/ttf" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addUserFont(f); e.target.value = ""; setOpen(false); }}
      />
    </>
  );
}
