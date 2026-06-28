// Set Up — define the comparison FRAME: the roles you need, a base font + size for
// each, on a modular scale. Built as a live type-scale RAMP (your test word rendered
// across every role, EDITABLE inline) that uses the full width and breathes. Quiet-
// instrument styling: spacing separates, mono labels, ghost controls, no boxes.
import React from "react";
import ReactDOM from "react-dom";
import { useSession, FACES, ROLE_PRESETS, KIND_ORDER, PRESETS, sizeAtViewport, roleRange, roleClampCss, dirTagFor, dirAnyTagFor, type Role, type RoleKind, type Scale, type Preset } from "../../state/SessionContext";
const rem2 = (px: number) => (px / 16).toFixed(2); // px → rem display (root 16), 2dp
import { useViewport } from "../../state/ViewportContext";
import { useMode } from "../../state/ModeContext";
import { useNarrow } from "../../lib/useNarrow";
import { tactileSelect, tactileSuccess } from "../../lib/feedback";
import { FontPicker } from "../../components/FontPicker";
import { Btn } from "../../components/Btn";
import { GoogleFontsBrowser } from "../../components/GoogleFontsBrowser";
import { FontsManager } from "../../components/FontsManager";
import { ExportPanel } from "../../components/ExportPanel";
import { InspectPanel } from "../../components/InspectPanel";
import { QuickPair } from "../../components/QuickPair";
import { topRecs } from "../../lib/recommend";
import { measureFont, cachedMetrics } from "../../lib/autofinetune";
import { ROLE_DESC } from "../../lib/glossary";
import { OT_FEATURES } from "../../data/proofStrings";
import { featureSupported } from "../../lib/otSupport";
import { ViewportPicker } from "../../components/ViewportPicker";
import { PillSelect } from "../../components/PillSelect";
import { GlassPanel } from "../../components/GlassPanel";
import { Check, ArrowRight, Plus, Close, ChevronDown } from "../../components/icons";
import { popMotion } from "../../lib/popover";

const MONO = "var(--t-sans)";
const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)" };
// seed the fluid mobile end one minor-third (1.2) below the desktop base — a derived
// default, not a magic factor (e.g. 16px desktop → 13px mobile).
const seedMobileBase = (base: number) => Math.max(6, Math.round(base / 1.2));

// inline icons — one stroke language across the tool (1.6px, round caps), matching the
// Copy/duplicate glyph — the one icon with no shared-set equivalent (Check / Close / ArrowRight /
// ChevronDown all come from the in-face icon set now, so there's ONE version of each).
const CopyGlyph = () => (
  <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M10.5 5.5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2h1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const RATIOS = [
  { value: "1.2", label: "1.200 · minor third" },
  { value: "1.25", label: "1.250 · major third" },
  { value: "1.333", label: "1.333 · perfect fourth" },
  { value: "1.414", label: "1.414 · aug. fourth" },
  { value: "1.5", label: "1.500 · perfect fifth" },
  { value: "1.618", label: "1.618 · golden" },
];

// "+ Add role" — a dropdown of the preset roles + Custom (replaces the chip row).
// Portaled menu, same squircle/glass language as PillSelect.
function AddRoleMenu() {
  const { addRole, roles } = useSession();
  // one role per register — only offer the kinds you haven't added yet (renaming covers
  // "custom"; the kind stays the contract that wires a role to surfaces + direction fonts).
  const used = new Set(roles.map((r) => r.kind));
  const available = ROLE_PRESETS.filter((p) => !used.has(p.kind));
  const full = available.length === 0;
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top?: number; bottom?: number; left: number; maxH: number } | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  // flip UP when the trigger sits low (many roles push it down the page), so the
  // menu never opens off the bottom of the viewport.
  const place = React.useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const M = 12;
    const ph = popRef.current?.offsetHeight ?? 320; // 8 presets + custom is tall
    const below = window.innerHeight - r.bottom - M, above = r.top - M;
    const openUp = below < ph + 8 && above > below;
    const maxH = Math.max(160, Math.round((openUp ? above : below) - 6));
    setPos(openUp ? { bottom: window.innerHeight - r.top + 8, left: r.left, maxH } : { top: r.bottom + 8, left: r.left, maxH });
  }, []);
  React.useLayoutEffect(() => { if (open) place(); }, [open, place]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { const t = e.target as Node; if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return; setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const pick = (p: (typeof ROLE_PRESETS)[number]) => { tactileSelect(); addRole(p); setOpen(false); };
  return (
    <>
      <Btn
        ref={triggerRef} variant="secondary" disabled={full}
        title={full ? "All 8 registers added — rename any role to customize it" : undefined}
        onClick={() => { if (!full) setOpen((v) => !v); }}
      >
        <span style={{ display: "inline-flex", color: "var(--t-ink-3)" }}><Plus size={14} /></span>
        {full ? "All roles added" : "Add role"}
      </Btn>
      {open && !full && pos && ReactDOM.createPortal(
        <div ref={popRef} className="t-pop" style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, zIndex: 60, filter: "drop-shadow(0 14px 30px rgba(var(--t-scrim),0.16))", ...popMotion(pos) }}>
          <GlassPanel radius={16} style={{ minWidth: 200, padding: 6, maxHeight: Math.min(pos.maxH, 360), overflowY: "auto", background: "rgba(255,255,255,0.97)", boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05)" }}>
            {available.map((p) => (
              <button key={p.name} className="t-opt" onClick={() => pick(p)} title={ROLE_DESC[p.kind]}>
                <span>{p.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}>step {p.step >= 0 ? `+${p.step}` : p.step}</span>
              </button>
            ))}
            {/* custom — drops a role you DEFINE inline (set its register + name + font in the row).
                single label: the UI font is mono (wide), so a right-hint would collide. */}
            <button className="t-opt" onClick={() => { tactileSelect(); addRole(); setOpen(false); }} style={{ borderTop: "1px solid color-mix(in oklab, var(--t-ink) 8%, transparent)", marginTop: 2, justifyContent: "flex-start" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ display: "inline-flex", color: "var(--t-ink-3)" }}><Plus size={13} /></span>Custom role</span>
            </button>
          </GlassPanel>
        </div>,
        document.body,
      )}
    </>
  );
}

// ONBOARDING — "start from a preset": one click seeds a whole setup (roles + fonts + scale) for a
// use-case. A deliberate REPLACE (you're starting from a template), confirmed with a quiet ✓.
const famOf = (id: string) => (FACES.find((f) => f.id === id) ?? FACES[0]).family;
const presetFont = (p: Preset, kind: RoleKind, fb: number) => (p.roles.find((r) => r.kind === kind) ?? p.roles[fb]).fontId;
function PresetStrip() {
  const { applyPreset } = useSession();
  const [applied, setApplied] = React.useState<string | null>(null);
  const apply = (p: Preset) => { tactileSuccess(); applyPreset(p); setApplied(p.id); window.setTimeout(() => setApplied((x) => (x === p.id ? null : x)), 1500); };
  return (
    <div style={{ marginBottom: "var(--t-gap-xl)" }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button
            key={p.id} className="t-dir" onClick={() => apply(p)}
            style={{ textAlign: "left", padding: "13px 16px", minWidth: 154, border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 7 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--t-ink)" }}>{p.name}</span>
              {applied === p.id && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 10, color: "var(--t-ink-2)" }}><span style={{ display: "inline-flex", color: "var(--t-match)" }}><Check size={12} /></span> applied</span>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontFamily: famOf(presetFont(p, "display", 0)), fontSize: 26, fontWeight: 600, color: "var(--t-ink)", lineHeight: 1 }}>Ag</span>
              <span style={{ fontFamily: famOf(presetFont(p, "body", p.roles.length - 1)), fontSize: 13, color: "var(--t-ink-2)" }}>body text</span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: "var(--t-ink-3)" }}>{p.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// BYO FONTS — upload your own woff2/otf/ttf; it registers + joins the catalog (usable in every
// role / direction / comparison) and persists on your device. Built fonts show with a remove ×.
function FontUpload() {
  const { addUserFont, fontsVersion } = useSession();
  void fontsVersion; // subscribe so the count re-renders when the catalog changes
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [browse, setBrowse] = React.useState(false);
  const [manage, setManage] = React.useState(false);
  // a real error if the file can't be read. The font's CLASS (serif/mono/…) is set per-font in the
  // Manage list where it reads clearly — not a cryptic dropdown next to the action buttons.
  const [err, setErr] = React.useState<string | null>(null);
  const [inspect, setInspect] = React.useState(false);
  const count = FACES.filter((f) => f.user).length;
  return (
    <div style={{ marginBottom: "var(--t-gap-xl)" }}>
      {/* add buttons + a COUNT (not a wall of pills — you can add hundreds); manage opens a list */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Btn variant="secondary" size="sm" mono onClick={() => setBrowse(true)}>
          <span style={{ display: "inline-flex", color: "var(--t-ink-3)" }}><Plus size={13} /></span> Browse Google Fonts
        </Btn>
        <Btn variant="secondary" size="sm" mono onClick={() => fileRef.current?.click()}>
          <span style={{ display: "inline-flex", color: "var(--t-ink-3)" }}><Plus size={13} /></span> Upload a font
        </Btn>
        <Btn variant="secondary" size="sm" mono onClick={() => setInspect(true)}>Inspect a font</Btn>
        {count > 0 && (
          <button className="t-bare" onClick={() => setManage(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)", padding: "0 4px" }}>
            {count} added · manage
          </button>
        )}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: err ? "var(--t-anchor)" : "var(--t-ink-3)", display: "block", marginTop: 8 }}>
        {err ?? "Google Fonts, free to ship — or upload your own (stays on your device)"}
      </span>
      <input
        ref={fileRef} type="file" accept=".woff2,.woff,.otf,.ttf,font/woff2,font/otf,font/ttf" style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (!f) return;
          setErr(null);
          const r = await addUserFont(f);
          if (!r.ok) setErr(r.reason ?? "Couldn’t add that font.");
        }}
      />
      {browse && <GoogleFontsBrowser onClose={() => setBrowse(false)} />}
      {manage && <FontsManager onClose={() => setManage(false)} />}
      {inspect && <InspectPanel onClose={() => setInspect(false)} />}
    </div>
  );
}

// RoleOtPicker — per-role OpenType (production). The features a role SHIPS (font-feature-settings);
// every surface that uses the role renders them. Quiet by default (recedes across many rows), shows
// a count when active. Multi-select collapsed behind one control — the same rule as everywhere else.
function RoleOtPicker({ role }: { role: Role }) {
  const { updateRole } = useSession();
  const face = FACES.find((f) => f.id === role.fontId) ?? FACES[0];
  const selected = role.features ?? [];
  const has = (t: string) => selected.includes(t);
  const toggle = (t: string) => { tactileSelect(); updateRole(role.id, { features: has(t) ? selected.filter((x) => x !== t) : [...selected, t] }); };
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top?: number; bottom?: number; left: number; maxH: number } | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const place = React.useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const M = 12;
    const ph = popRef.current?.offsetHeight ?? 280;
    const below = window.innerHeight - r.bottom - M, above = r.top - M;
    const openUp = below < ph + 8 && above > below;
    const maxH = Math.max(160, Math.round((openUp ? above : below) - 6));
    setPos(openUp ? { bottom: window.innerHeight - r.top + 8, left: r.left, maxH } : { top: r.bottom + 8, left: r.left, maxH });
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
        ref={triggerRef} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox" aria-expanded={open}
        title="OpenType features this role ships in production — renders on every surface that uses it"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 11, letterSpacing: "0.04em", color: selected.length ? "var(--t-match)" : "var(--t-ink-3)", background: "none", border: "none", padding: 0, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        OpenType{selected.length ? ` (${selected.length})` : ""}
        <ChevronDown size={9} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform var(--t-dur) var(--t-ease)" }} />
      </button>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} className="t-pop" style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, zIndex: 60, filter: "drop-shadow(0 14px 30px rgba(var(--t-scrim),0.16))", ...popMotion(pos) }}>
          <GlassPanel radius={16} style={{ minWidth: 206, padding: 6, maxHeight: Math.min(pos.maxH, 360), overflowY: "auto", background: "rgba(255,255,255,0.97)", boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05)" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", padding: "6px 10px 4px" }}>Ships on every surface</div>
            {OT_FEATURES.map((f) => {
              // flag features THIS role's font doesn't implement — so you don't ship a tag that no-ops
              const supp = featureSupported(face.measureFamily, f.tag);
              return (
              <button key={f.tag} className="t-opt" onClick={() => toggle(f.tag)} aria-pressed={has(f.tag)}>
                <span style={{ color: has(f.tag) ? "var(--t-ink)" : "var(--t-ink-3)" }}>{f.label}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {supp === false && <span style={{ fontFamily: MONO, fontSize: 9.5, color: "var(--t-ink-3)" }}>not in font</span>}
                  <span style={{ display: "inline-flex", width: 16, alignItems: "center", justifyContent: "center", color: "var(--t-match)" }}>{has(f.tag) ? <Check size={13} /> : null}</span>
                </span>
              </button>
            );})}
          </GlassPanel>
        </div>,
        document.body,
      )}
    </>
  );
}

// Each role's preview is an EDITABLE copy of the test word, kept in sync: when you
// type in one, the others update (but never the one you're typing in → no caret
// jump). So "click any word to edit" is literally true across the whole ramp.
function RolePreview({ role, scale, vw, text, setText }: { role: Role; scale: Scale; vw: number; text: string; setText: (v: string) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (ref.current) ref.current.textContent = text; }, []); // seed once  // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== text) el.textContent = text;
  }, [text]);
  const face = FACES.find((f) => f.id === role.fontId) ?? FACES[0];
  const size = sizeAtViewport(role, scale, vw); // renders at the previewed viewport
  return (
    <div
      ref={ref}
      className="t-edit"
      contentEditable suppressContentEditableWarning spellCheck={false}
      role="textbox" aria-label={`${role.name} preview — click to edit`}
      onInput={(e) => setText(e.currentTarget.textContent || "")}
      // single-line field: Enter would inject a newline into a nowrap specimen — commit + blur instead
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
      style={{ fontFamily: face.family, fontSize: size, fontWeight: 500, lineHeight: 1.22, letterSpacing: "-0.02em", color: "var(--t-ink)", whiteSpace: "nowrap", outline: "none", cursor: "text" }}
    />
  );
}

// READABILITY is driven by X-HEIGHT, not nominal px (a small-x face reads smaller at the same size —
// Legge/Bigelow reading studies + practitioner consensus). Cotejo MEASURES x-height, so the floor
// can be honest: measure the role font's em-normalized x-height (xHeight/em) and weight the floor by
// how it compares to a typical text face. Returns null until measured (→ fall back to the nominal floor).
const TYPICAL_X_EM = 0.50; // em-normalized x-height of a typical text face (Helvetica ~0.52, Georgia ~0.48)
function useXHeightEm(measureFamily: string): number | null {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    let live = true;
    measureFont(measureFamily, { weight: 500 }).then(() => { if (live) tick((t) => t + 1); });
    return () => { live = false; };
  }, [measureFamily]);
  const m = cachedMetrics(measureFamily, 500);
  return m && m.xHeight > 0 ? m.xHeight : null;
}

function RoleRow({ role, scale, vw, text, setText }: { role: Role; scale: Scale; vw: number; text: string; setText: (v: string) => void }) {
  const { roles, updateRole, removeRole, directions } = useSession();
  const narrow = useNarrow(720);
  const [hover, setHover] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const size = sizeAtViewport(role, scale, vw); // the TRUE px at the previewed viewport
  const range = roleRange(role, scale);         // non-null only when this role is fluid
  // READABILITY FLOOR (#16) — flag a reading role set too small to read comfortably at this viewport.
  // Kind-aware: body/subheading want ≥12; caption/label/mono can run smaller. (No WCAG-contrast badge
  // — the tool's palette is fixed and always passes, so it'd be noise; we don't fake a check.) The
  // fluid MIN end is checked. The floor is X-HEIGHT-WEIGHTED off the role font's MEASURED x-height:
  // a small-x face needs more px to read as well, so its floor rises (and a large-x face's eases).
  const nominalFloor: number | undefined = ({ body: 12, subheading: 12, caption: 10, label: 10, mono: 11 } as Partial<Record<RoleKind, number>>)[role.kind];
  const roleFace = FACES.find((f) => f.id === role.fontId) ?? FACES[0];
  const xEm = useXHeightEm(roleFace.measureFamily);
  const floor: number | undefined = nominalFloor != null
    ? (xEm ? Math.round(Math.max(nominalFloor * 0.85, Math.min(nominalFloor * 1.7, nominalFloor * (TYPICAL_X_EM / xEm)))) : nominalFloor)
    : undefined;
  const smallAt = range ? range.min : size; // for fluid, the mobile end is where it's smallest
  const tooSmall = floor != null && smallAt < floor;
  // role-aware: tier 1 = directions' font FOR THIS ROLE; tier 2 = their other-role fonts (doc §6)
  const fontTag = dirTagFor(directions, role);
  const fontAnyTag = dirAnyTagFor(directions);
  // a CUSTOM role's defining trait is its REGISTER (which of the 8 kinds it behaves as — the
  // contract that maps it to surfaces + direction fonts). Offer the registers not taken by other
  // roles, plus its own. Presets don't show this — their name already names the register.
  const kindLabel = (k: RoleKind) => ROLE_PRESETS.find((p) => p.kind === k)?.name ?? k;
  const usedByOthers = new Set(roles.filter((r) => r.id !== role.id).map((r) => r.kind));
  const kindOpts = KIND_ORDER.filter((k) => k === role.kind || !usedByOthers.has(k)).map((k) => ({ value: k, label: kindLabel(k) }));
  // engine recommendations — paired against the BASE fonts you're assigning (not Compare's stack)
  const baseFonts = Object.fromEntries(roles.map((r) => [r.id, r.fontId]));
  const recs = topRecs(role, roles, baseFonts).map((x) => ({ id: x.fontId, reason: x.reason, gf: x.gf }));

  // copy the clamp() — rem by default (accessible), px on ⌥/Alt-click (the code already
  // supports both; this exposes it without adding a control).
  const copyCss = (e?: React.MouseEvent) => {
    const css = roleClampCss(role, scale, e?.altKey ? "px" : "rem");
    navigator.clipboard?.writeText(css).then(() => { setCopied(true); tactileSuccess(); setTimeout(() => setCopied(false), 1100); }).catch(() => {});
  };

  return (
    // GRID, one spine: label+specimen on the left edge, controls on ONE shared right rail
    // (the `auto` column). Bottoms align (one method). Narrow → controls stack below the
    // specimen so a big word never collides with them.
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: "relative", display: "grid", gridTemplateColumns: narrow ? "1fr" : "minmax(0,1fr) auto", alignItems: "end", columnGap: 32, rowGap: 12, marginBottom: "calc(var(--t-gap-md) + 12px)" }}
    >
      {/* the role label hugs the word it titles (tight) — clips so a big specimen never
          runs under the controls */}
      <div style={{ minWidth: 0, overflow: "hidden" }}>
        <input
          value={role.name}
          onChange={(e) => updateRole(role.id, { name: e.target.value })}
          aria-label="Role name" title={ROLE_DESC[role.kind]}
          style={{ display: "block", fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)", background: "transparent", border: "none", outline: "none", width: 160, padding: 0, marginBottom: 5, cursor: "text" }}
        />
        <RolePreview role={role} scale={scale} vw={vw} text={text} setText={setText} />
      </div>
      {/* quiet control cluster — rides the specimen's lower edge (one optical offset).
          RIGHT-aligned so the copy icon lands on the same right rail as "Add role" (the
          cluster fills its grid cell; content is pushed to the end), with generous air. */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: narrow ? "flex-start" : "flex-end", gap: 26, width: "100%", paddingBottom: 4 }}>
        {/* remove role — hover-reveal at the cluster START. Negative right margin pulls it tight to
            the first control (the 26px cluster gap left it stranded far from anything → "floating"). */}
        <button
          className="t-iconbtn" onClick={() => removeRole(role.id)} aria-label={`Remove ${role.name}`} disabled={roles.length <= 1}
          style={{ alignSelf: "center", marginRight: -18, color: "var(--t-ink-3)", opacity: roles.length <= 1 ? 0 : hover ? 0.7 : 0.28, cursor: roles.length > 1 ? "pointer" : "not-allowed", transition: "opacity var(--t-dur) var(--t-ease), color var(--t-dur) var(--t-ease)" }}
        ><Close size={14} /></button>
        {role.custom && (
          <>
            <PillSelect compact label="register" value={role.kind} options={kindOpts} onChange={(v) => updateRole(role.id, { kind: v as RoleKind })} />
            {/* a custom role's STEP on the scale — we can't decide it (presets ship one), so you set
                it. changing it clears any pinned px so the scale position takes visible effect. */}
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>step</span>
              <input
                type="number" value={role.step}
                onChange={(e) => updateRole(role.id, { step: Math.max(-4, Math.min(9, Number(e.target.value) || 0)), sizeOverride: undefined })}
                aria-label="Scale step"
                style={{ fontFamily: MONO, fontSize: 12, color: "var(--t-ink-2)", background: "transparent", border: "none", outline: "none", width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums", cursor: "text" }}
              />
            </span>
          </>
        )}
        <FontPicker compact value={role.fontId} onPick={(v) => updateRole(role.id, { fontId: v })} tagFor={fontTag} tagForAny={fontAnyTag} roleLabel={role.name} recommended={recs} />
        <RoleOtPicker role={role} />
        {tooSmall && (() => {
          const weighted = xEm != null && floor !== nominalFloor;
          const tip = `At ${smallAt}px${range ? " (mobile end)" : ""}, ${role.name} is below the ~${floor}px comfortable-reading floor for ${role.kind} text`
            + (weighted ? ` — its x-height measures ${Math.round((xEm as number) * 100)}% of the em, so it reads smaller than a typical face and wants a touch more size` : "")
            + `. Aim for about ${floor}px${range ? " at the mobile end" : ""}.`;
          // recommend the TARGET, not just a complaint — name the px to hit (x-height-weighted).
          return (
            <span title={tip} style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-2)", whiteSpace: "nowrap" }}>
              small to read · aim ~{floor}px
            </span>
          );
        })()}
        {range ? (
          // FLUID role — scale-driven range. True px at this viewport · the mobile→desktop
          // range · copy the clamp() (the deliverable). Fixed-width slot so role rows align;
          // range + copy ENTER as a split when a role turns fluid (the one earned moment).
          <span style={{ display: "inline-flex", alignItems: "baseline", justifyContent: "flex-end", gap: 7, minWidth: 196, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
            {/* current size at this viewport, in BOTH units (px renders, rem ships) */}
            <span style={{ fontSize: 12, color: "var(--t-ink-2)" }}>{size}<span style={{ fontSize: 11, color: "var(--t-ink-3)" }}>px</span></span>
            <span style={{ fontSize: 11, color: "var(--t-ink-3)" }}>{rem2(size)}<span style={{ opacity: 0.7 }}>rem</span></span>
            {/* the fluid RANGE — a different KIND of value (envelope, not live), so a hairline
                rule separates it from the px/rem live pair. min @390 → max @1280 (the anchors). */}
            <span className="t-fluid-in" style={{ fontSize: 11, color: "var(--t-ink-3)", paddingLeft: 8, borderLeft: "1px solid color-mix(in oklab, var(--t-ink) 12%, transparent)" }} title="fluid range — mobile 390px → desktop 1280px">{range.min}–{range.max}<span style={{ opacity: 0.7 }}>px</span></span>
            <button
              className="t-iconbtn t-fluid-in"
              style={{ alignSelf: "center", animationDelay: "55ms", color: copied ? "var(--t-match)" : "var(--t-ink-3)" }}
              onClick={copyCss} aria-label={copied ? "Copied clamp() CSS" : "Copy clamp() CSS"} title="Copy clamp() — rem (⌥-click for px)"
            >
              {copied ? <Check size={14} /> : <CopyGlyph />}
            </button>
          </span>
        ) : (
          // FIXED role — hand-editable px (typing pins it fixed). Same right-edge slot,
          // with the rem equivalent alongside.
          <span style={{ display: "inline-flex", alignItems: "baseline", justifyContent: "flex-end", gap: 7, minWidth: 196, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
              <input
                type="number" value={size}
                onChange={(e) => updateRole(role.id, { sizeOverride: Math.max(6, Math.min(400, Number(e.target.value) || 0)) })}
                aria-label="Size"
                style={{ fontFamily: MONO, fontSize: 12, color: "var(--t-ink-2)", background: "transparent", border: "none", outline: "none", width: 34, textAlign: "right", fontVariantNumeric: "tabular-nums", cursor: "text" }}
              />
              <span style={{ fontSize: 11, color: "var(--t-ink-3)" }}>px</span>
            </span>
            <span style={{ fontSize: 11, color: "var(--t-ink-3)" }}>{rem2(size)}<span style={{ opacity: 0.7 }}>rem</span></span>
          </span>
        )}
      </div>
    </div>
  );
}

export function SetUpMode() {
  const { roles, scale, setScale, text, setText } = useSession();
  const { setMode } = useMode();
  const [exporting, setExporting] = React.useState(false);
  const [quickPair, setQuickPair] = React.useState(false);
  // the ramp renders at the GLOBAL viewing lens (default Auto = your real screen — your
  // actual viewport IS the base here). The Mobile/Tablet/Desktop control lives in the
  // chrome, not on this authoring surface.
  const { vw } = useViewport();

  const toggleFluid = () => {
    tactileSelect();
    if (scale.fluid) setScale({ ...scale, fluid: false });
    // enabling: seed the mobile end one minor-third below desktop (derived, not magic)
    else setScale({ ...scale, fluid: true, baseMobile: scale.baseMobile ?? seedMobileBase(scale.base) });
  };

  return (
    <div style={{ padding: "0 clamp(16px,3vw,48px) 40px clamp(6px,1.6vw,22px)" }}>
      <h1 style={{ fontSize: "var(--t-title)", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--t-ink)", margin: "0 0 10px", textWrap: "balance" }}>
        Set up your roles
      </h1>
      <p style={{ fontSize: "var(--t-helper)", lineHeight: 1.5, color: "var(--t-ink-2)", margin: "0 0 18px", maxWidth: "52ch", textWrap: "pretty" }}>
        Give each role a base font, then audition candidates in Compare.
      </p>

      {/* THE front door (100-run #1+#5) — most people arrive with a font; pair it now, skip the system.
          One clear fast path; the full build sits quietly below (no competing ✦/sales copy). */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: "var(--t-gap-xl)" }}>
        <Btn variant="primary" size="lg" onClick={() => setQuickPair(true)}>
          Already have a font? Pair it
          <ArrowRight size={15} />
        </Btn>
        <span style={{ fontSize: 13, color: "var(--t-ink-3)" }}>or build a full system below</span>
      </div>
      {quickPair && <QuickPair onClose={() => setQuickPair(false)} />}

      <PresetStrip />
      <FontUpload />

      {/* the roles ramp — "+ Add role" lives in the header so it stays reachable
          no matter how many roles push the ramp down */}
      <div style={{ marginBottom: "var(--t-gap-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <span style={eyebrow}>Roles</span>
          <AddRoleMenu />
        </div>
        {roles.map((r) => <RoleRow key={r.id} role={r} scale={scale} vw={vw} text={text} setText={setText} />)}
      </div>

      {/* scale */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: "var(--t-gap-lg)" }}>
        <span style={eyebrow}>Scale</span>
        {scale.fluid ? (
          // FLUID — base is a range: mobile end → desktop end. Every scale-driven role
          // interpolates between them; the clamp() is copyable per role.
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}>base</span>
            <input
              type="number" value={scale.baseMobile ?? seedMobileBase(scale.base)}
              onChange={(e) => setScale({ ...scale, baseMobile: Math.max(6, Math.min(80, Number(e.target.value) || 12)) })}
              aria-label="Base size at mobile"
              style={{ fontFamily: MONO, fontSize: 12, color: "var(--t-ink-2)", background: "transparent", border: "none", outline: "none", width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums", cursor: "text" }}
            />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}>mobile <ArrowRight size={11} /></span>
            <input
              type="number" value={scale.base}
              onChange={(e) => setScale({ ...scale, base: Math.max(6, Math.min(80, Number(e.target.value) || 16)) })}
              aria-label="Base size at desktop"
              style={{ fontFamily: MONO, fontSize: 12, color: "var(--t-ink-2)", background: "transparent", border: "none", outline: "none", width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums", cursor: "text" }}
            />
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}>desktop px</span>
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}>base</span>
            <input
              type="number" value={scale.base}
              onChange={(e) => setScale({ ...scale, base: Math.max(6, Math.min(80, Number(e.target.value) || 16)) })}
              aria-label="Scale base size"
              style={{ fontFamily: MONO, fontSize: 12, color: "var(--t-ink-2)", background: "transparent", border: "none", outline: "none", width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums", cursor: "text" }}
            />
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}>px</span>
          </span>
        )}
        <PillSelect label="ratio" value={String(scale.ratio)} options={RATIOS} onChange={(v) => setScale({ ...scale, ratio: Number(v) })} />
        {/* the fluid toggle — active = primary (dark), off = secondary (outlined) */}
        <Btn
          variant={scale.fluid ? "primary" : "secondary"} size="sm" mono aria-pressed={!!scale.fluid}
          title="Fluid: sizes scale between mobile (390px) and desktop (1280px) and each role gives you a copyable clamp(). Preview the widths with the viewport dropdown."
          onClick={toggleFluid}
        >fluid</Btn>
        <ViewportPicker />
      </div>

      {/* go */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Btn variant="primary" size="lg" onClick={() => setMode("compare")}>
          Open in Compare
          <ArrowRight size={15} />
        </Btn>
        <Btn variant="ghost" size="lg" onClick={() => setMode("tune")}>or fine-tune in Tune</Btn>
        {/* the deliverable: export the whole system as CSS / tokens / a plain spec */}
        <Btn variant="secondary" size="lg" mono onClick={() => setExporting(true)} style={{ marginLeft: "auto" }}>Export CSS / tokens</Btn>
      </div>
      {exporting && <ExportPanel onClose={() => setExporting(false)} />}
    </div>
  );
}
