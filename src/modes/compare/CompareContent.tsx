// Compare mode — the COMPARISON SPACE (doc §3 + locked chrome decision, docs/type-tool/09).
// THREE zones, no stacked rows:
//   · Top bar (GlobalBar)  — identity: mode tabs + base (CompareBar). "What am I comparing."
//   · Canvas (here)        — PURE: the comparison only. Letterforms shows the role headline +
//                            grid; a surface shows just the type. Nothing else stacked on it.
//   · Dock (BottomDock)    — the INSTRUMENT PANEL (like Tune): surface dropdown · compare mode ·
//                            contextual onion settings · cap-match · (on Letterforms) role.
// The dock's contents adapt to the chosen surface + mode (progressive disclosure).
import React from "react";
import ReactDOM from "react-dom";
import { useCompare, useFaceMetrics, DISPLAY_ROLE, WEIGHT, type Face } from "./CompareContext";
import { useSession, FACES, dirTagFor, dirAnyTagFor, dirFontForRole, anchorForKind } from "../../state/SessionContext";
import { deriveTune, type RawMetrics, type DeriveResult } from "../../lib/autofinetune";
import { Segmented } from "../../components/Segmented";
import { PillSelect } from "../../components/PillSelect";
import { FontPicker } from "../../components/FontPicker";
import { StretchySlider } from "../../components/StretchySlider";
import { BottomDock } from "../../components/BottomDock";
import { GlassPanel } from "../../components/GlassPanel";
import { Btn } from "../../components/Btn";
import { ViewportPicker } from "../../components/ViewportPicker";
import { SurfaceCanvas, useSources, type CmpMode } from "./SurfacesView";
import { SURFACE_COMPONENTS, surfaceById } from "../../surfaces/registry";
import { leadingForMeasure } from "../../surfaces/resolve";
import { useMode } from "../../state/ModeContext";
import { readParam, writeParams } from "../../lib/urlState";
import { useNarrow } from "../../lib/useNarrow";
import { CompareBar } from "./CompareBar";
import { topRecs, type Rec } from "../../lib/recommend";
import { SAMPLES, OT_FEATURES, featureOn, featureOff, type OtFeature } from "../../data/proofStrings";
import { featureSupported } from "../../lib/otSupport";
import { missingGlyphs, useGlyphReady } from "../../lib/glyphCoverage";
import { popMotion } from "../../lib/popover";
import { Check, RingDot, ArrowRight, EyeOff, Contrast, Close, ChevronDown } from "../../components/icons";
import { IconToggle } from "../../components/IconToggle";
import { tactileSelect, tactileSuccess } from "../../lib/feedback";

const recProp = (recs: Rec[]) => recs.map((x) => ({ id: x.fontId, reason: x.reason, gf: x.gf }));
// pick a font vs edit the text — a real segmented toggle (same component as View/Side/Onion),
// living in the dock. Shared shape for Letterforms + every surface so the gesture model is one.
const PICK_EDIT: { id: "font" | "text"; label: string }[] = [{ id: "font", label: "Aa pick" }, { id: "text", label: "edit" }];
// "a, b, c +2" — one quiet line no matter how many roles a surface needs that you haven't set up.
const fmtList = (xs: string[], max = 3) => (xs.length <= max ? xs.join(", ") : `${xs.slice(0, max).join(", ")} +${xs.length - max}`);
// DARK GROUND — a universal viewing condition (Letterforms AND every surface). Re-scopes BOTH the
// ink and bg token families so the whole composition inverts (text → light, ink-fill pills → light
// with dark text), not just the text. Judge any face/system on dark without leaving the canvas.
const DARK_GROUND: React.CSSProperties = {
  background: "#1b1815", borderRadius: "var(--t-r-menu)", padding: "18px 20px",
  "--t-ink": "#f3f1ec", "--t-ink-2": "rgba(243,241,236,0.74)", "--t-ink-3": "rgba(243,241,236,0.46)",
  "--t-bg": "#1b1815", "--t-bg-lift": "#241f1b", "--t-surface-2": "#2a241f", "--t-white-edge": "rgba(255,255,255,0.06)",
  // pill material re-scoped for dark (interface-style-details): a faint light edge, and hover brightens
  // the dark pill instead of flashing solid white — fixes the "weird white thing" on the dark ground.
  "--t-pill-edge": "rgba(255,255,255,0.10)", "--t-pill-hover": "#2c2620",
} as React.CSSProperties;

const MONO = "var(--t-sans)";

const num: React.CSSProperties = { fontFamily: MONO, fontSize: 12, color: "var(--t-ink-3)", fontVariantNumeric: "tabular-nums" };
const cap: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)" };

// OtPicker — the multi-select OpenType set, COLLAPSED behind one dock pill (a stackable set never
// belongs as a loose pill row — that's the chrome-crowding rule). Opens a checklist; stays open as
// you toggle (multi-select). Dock sits low, so it always opens UP.
function OtPicker({ selected, onToggle }: { selected: Set<string>; onToggle: (tag: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ bottom: number; left: number; maxH: number } | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const place = React.useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ bottom: window.innerHeight - r.top + 8, left: r.left, maxH: Math.max(160, Math.round(r.top - 18)) });
  }, []);
  React.useLayoutEffect(() => { if (open) place(); }, [open, place]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { const t = e.target as Node; if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return; setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, place]);
  return (
    <>
      <button ref={triggerRef} className="t-pill" aria-haspopup="listbox" aria-expanded={open} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((v) => !v)}
        style={{ display: "inline-flex", alignItems: "center", gap: 9, minHeight: "var(--t-h-pill)", padding: "0 15px", borderRadius: 999, border: "none", color: "var(--t-ink)" }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", lineHeight: 1 }}>OpenType</span>
        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1 }}>{selected.size} shown</span>
        <ChevronDown size={11} style={{ color: "var(--t-ink-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform var(--t-dur) var(--t-ease)" }} />
      </button>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} className="t-pop" style={{ position: "fixed", bottom: pos.bottom, left: pos.left, zIndex: 60, filter: "drop-shadow(0 14px 30px rgba(var(--t-scrim),0.16))", ...popMotion(pos) }}>
          <GlassPanel radius={16} style={{ minWidth: 210, padding: 6, maxHeight: Math.min(pos.maxH, 360), overflowY: "auto", background: "rgba(255,255,255,0.97)", boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05)" }}>
            {OT_FEATURES.map((f) => {
              const on = selected.has(f.tag);
              return (
                <button key={f.tag} className="t-opt" onClick={() => { tactileSelect(); onToggle(f.tag); }} aria-pressed={on}>
                  <span style={{ color: on ? "var(--t-ink)" : "var(--t-ink-3)" }}>{f.label}</span>
                  <span style={{ width: 16, display: "inline-flex", justifyContent: "center", color: "var(--t-match)" }}>{on ? <Check size={13} /> : null}</span>
                </button>
              );
            })}
          </GlassPanel>
        </div>,
        document.body,
      )}
    </>
  );
}

// SPECIMEN ROW — type-forward (the letterforms are the hero). Each font is a row in one
// continuous, scannable column (the Locale model): a quiet meta line (name · cap-match ·
// Pick) above a big cap-normalized specimen you read straight down. Base pinned first.
const SCAN_PX = 60; // the specimen owns the stage — reverent size, still lets a few candidates stack (type-reverence, §1)
function FontRow({ face, baseM, isBase, text, roleName, autoTune, canRemove, onRemove, isPicked, onPick, recReason, onSwitch, onEditText, mode, tagFor, tagForAny, switchDisabled, para, blindLabel, otFeatures }: {
  face: Face; baseM: RawMetrics | null; isBase: boolean; text: string; roleName: string; autoTune: boolean; canRemove: boolean; onRemove: () => void;
  isPicked: boolean; onPick: () => void; recReason?: string; onEditText: (v: string) => void; mode: "font" | "text";
  onSwitch: (newId: string) => void; tagFor?: (id: string) => string | undefined; tagForAny?: (id: string) => string | undefined; switchDisabled: string[];
  para?: boolean; blindLabel?: string | null; otFeatures?: OtFeature[]; // proof: paragraph wrap · blind name-mask · OpenType proof
}) {
  const candM = useFaceMetrics(face.measureFamily);
  // Blind A/B reveal — the masked label is a real button now (it used to be a dead span whose tooltip
  // LIED about "click to reveal"): click or hover shows the name. Re-hides whenever the shuffle re-deals
  // (blindLabel changes), so toggling blind off→on re-masks.
  const [revealed, setRevealed] = React.useState(false);
  React.useEffect(() => { setRevealed(false); }, [blindLabel]);
  const [capHover, setCapHover] = React.useState(false); // instant styled tooltip for the measured caps
  const tune = React.useMemo<DeriveResult | null>(
    () => (!isBase && baseM && candM ? deriveTune(DISPLAY_ROLE, baseM, candM) : null),
    [isBase, baseM, candM],
  );
  // cap-match OFF → render at the SAME size as the base (the raw, unfair read).
  const size = isBase || !autoTune ? SCAN_PX : SCAN_PX * (tune?.size ?? 1);
  // the specimen is the click target — SAME model as a surface: pick mode → click uses this font;
  // edit mode → click and type the sample word (shared across rows, seeded via ref so the caret is
  // never yanked while you type — matches the Set Up ramp + surface fields).
  const specRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (specRef.current) specRef.current.textContent = text; }, []); // seed once  // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { const el = specRef.current; if (el && document.activeElement !== el && el.textContent !== text) el.textContent = text; }, [text]);
  const textMode = mode === "text";
  // TOFU — chars in the current sample this face genuinely can't render. Re-checks when the font
  // loads (useGlyphReady). Skipped in the OpenType proof (no single text). Never false-flags.
  const glyphTick = useGlyphReady(face.family);
  const missing = React.useMemo(() => (otFeatures ? [] : missingGlyphs(face.family, text)), [face.family, text, otFeatures, glyphTick]);
  return (
    // the specimen TEXT shares the headline's left edge (one edge per layout-and-alignment); the
    // hover background bleeds 18px left into the gutter rather than indenting the type.
    <div className="t-row" style={{ padding: "22px 18px", marginLeft: -18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 9 }}>
        {/* the font NAME is a switcher — click it to swap this row's font. Blind A/B hides it (judge
            the type, not the brand): a neutral "Font A" you can hover to reveal. */}
        {blindLabel && !revealed ? (
          <button type="button" className="t-bare" onClick={() => { tactileSelect(); setRevealed(true); }} onMouseEnter={() => setRevealed(true)}
            aria-label="Reveal font name" title="Blind — click to reveal"
            style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: isPicked ? "var(--t-match)" : "var(--t-ink)", cursor: "pointer", border: "none", background: "none", padding: 0 }}>Font {blindLabel}</button>
        ) : (
          <FontPicker bare value={face.id} onPick={onSwitch} tagFor={tagFor} tagForAny={tagForAny} roleLabel={roleName} disabledIds={switchDisabled} color={isPicked ? "var(--t-match)" : "var(--t-ink)"} />
        )}
        {/* metadata is QUIET grey (Locale is monochrome); cobalt is reserved for the picked state +
            the one recommendation signal, so it actually means something when you see it. */}
        {isBase ? (
          <span style={{ ...num, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>base</span>
        ) : !autoTune ? (
          <span style={{ ...num, fontSize: 10.5 }}>raw size</span>
        ) : tune ? (
          // hover reveals the image-test result: the caps measured off the RENDERED glyphs + the scale.
          // Opt-in detail (judge letterforms, not numbers) — the ×N is the headline; the metrics hide here.
          <span style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setCapHover(true)} onMouseLeave={() => setCapHover(false)}>
            <span style={{ ...num, fontSize: 10.5, cursor: "default", textDecoration: "underline dotted", textDecorationColor: "var(--t-ink-3)", textUnderlineOffset: 3 }}>cap-matched ×{tune.size.toFixed(3)}</span>
            {capHover && (
              <span role="tooltip" style={{
                position: "absolute", top: "calc(100% + 7px)", left: 0, zIndex: 80, width: 244,
                background: "rgba(255,255,255,0.98)", color: "var(--t-ink-2)", padding: "9px 12px", borderRadius: "var(--t-r-block)",
                fontFamily: "var(--t-ui-sans, system-ui, sans-serif)", fontSize: 11.5, lineHeight: 1.45, fontVariantNumeric: "normal", textTransform: "none", letterSpacing: 0, whiteSpace: "normal",
                boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05), 0 10px 26px -14px rgba(var(--t-scrim),0.22)",
              }}>
                Measured live from the rendered glyphs — your base caps <strong style={{ fontWeight: 600, color: "var(--t-ink)" }}>{baseM!.cap.toFixed(2)}</strong> vs this face <strong style={{ fontWeight: 600, color: "var(--t-ink)" }}>{candM!.cap.toFixed(2)}</strong> (height per em). Scaled {tune.size >= 1 ? "+" : ""}{((tune.size - 1) * 100).toFixed(0)}% so the capitals match.
              </span>
            )}
          </span>
        ) : (
          <span style={{ ...num, fontSize: 10.5 }}>measuring…</span>
        )}
        {recReason && (
          <span style={{ ...num, fontSize: 10.5, color: "var(--t-match)", display: "inline-flex", alignItems: "center", gap: 4 }}><RingDot size={11} />{recReason}</span>
        )}
        {missing.length > 0 && (
          <span style={{ ...num, fontSize: 10.5, color: "var(--t-ink-2)" }} title={`${face.label} can’t render: ${missing.join("  ")}`}>{missing.length} missing</span>
        )}
        {/* license at AUDITION (100-run #10) — flag an uploaded candidate you'd need to clear before shipping */}
        {face.id.startsWith("user-") && (
          <span style={{ ...num, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--t-ink-3)" }} title="Your upload — verify its license before shipping">verify license</span>
        )}
        {/* the pick is the SPECIMEN click now (same as a surface) — picked shows via the cobalt
            name. Only the × stays here (take this font out of the comparison). */}
        {canRemove && (
          // HUGS the metadata — a compact button where the glyph IS the button (no 24px t-iconbtn box
          // centering the glyph, which left ~12px of empty box and read as "floating"). Hit area via
          // the inset overlay. Negative margin pulls it tight against "cap-matched ×N".
          <button
            data-export-skip onClick={onRemove} aria-label={`Remove ${face.label}`}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
            style={{ position: "relative", display: "inline-flex", alignSelf: "center", marginLeft: -2, padding: 0, border: "none", background: "none", color: "var(--t-ink-3)", opacity: 0.4, cursor: "pointer" }}
          >
            <Close size={14} />
            <span aria-hidden style={{ position: "absolute", inset: -9 }} />
          </button>
        )}
      </div>
      {otFeatures ? (
        // OPENTYPE PROOF — each selected feature demonstrated in THIS face: the demo string OFF
        // (muted) → ON (full ink). Support is now DETECTED (pixel-diff off vs on): an unsupported
        // feature gets an explicit "not in this font" badge + a dimmed row, instead of a silent
        // identical pair that reads as broken (the B3 false-negative).
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 2 }}>
          {otFeatures.map((f) => {
            const supp = featureSupported(face.measureFamily, f.tag); // true | false | undefined(loading)
            const ligaOff = f.tag === "liga" ? ({ fontVariantLigatures: "none" } as const) : null;
            const ligaOn = f.tag === "liga" ? ({ fontVariantLigatures: "normal" } as const) : null;
            return (
            <div key={f.tag} style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", opacity: supp === false ? 0.5 : 1 }}>
              <span style={{ ...cap, width: 112, flexShrink: 0 }}>{f.label}</span>
              <span style={{ fontFamily: face.family, fontFeatureSettings: featureOff(f.tag), ...ligaOff, fontSize: 28, lineHeight: 1, color: "var(--t-ink-3)" }}>{f.demo}</span>
              <span style={{ ...num, opacity: 0.5, display: "inline-flex", alignItems: "center" }}><ArrowRight size={13} /></span>
              <span style={{ fontFamily: face.family, fontFeatureSettings: featureOn(f.tag), ...ligaOn, fontSize: 28, lineHeight: 1, color: "var(--t-ink)" }}>{f.demo}</span>
              {supp === false && (
                <span style={{ ...num, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t-ink-3)" }}>not in this font</span>
              )}
            </div>
          );})}
        </div>
      ) : (
        <div
          ref={specRef} className="t-spec"
          contentEditable={textMode} suppressContentEditableWarning spellCheck={false}
          role={textMode ? "textbox" : "button"} tabIndex={0}
          aria-label={textMode ? "Sample word" : `Use ${face.label} for ${roleName}`}
          title={textMode ? undefined : `Use ${face.label} for ${roleName}`}
          onClick={textMode ? undefined : () => { tactileSelect(); onPick(); }}
          onInput={textMode ? (e) => onEditText(e.currentTarget.textContent || "") : undefined}
          onKeyDown={(e) => { if (textMode) { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tactileSelect(); onPick(); } }}
          style={{ fontFamily: face.family, fontSize: para ? Math.min(size, 20) : size, fontWeight: WEIGHT, lineHeight: para ? 1.5 : 1.04, letterSpacing: para ? "0" : "-0.02em", color: "var(--t-ink)", whiteSpace: para ? "normal" : "nowrap", overflow: "visible", maxWidth: para ? "62ch" : undefined, outline: "none", cursor: textMode ? "text" : "pointer", borderRadius: "var(--t-r-chip)" }}
        />
      )}
    </div>
  );
}

function LetterformsGrid({ lmMode, sampleId, blind, otFeatures }: { lmMode: "font" | "text"; sampleId: string; blind: boolean; otFeatures: OtFeature[] }) {
  const { base, baseM, text, setText, roleName, autoTune, candidateIds, addCandidate, removeCandidate, replaceCandidate, setBaseId, focusRoleId, winners } = useCompare();
  const { roles, directions, pickWinner, addGoogleFont } = useSession();
  // the proof controls (pick/edit · sample · blind · OpenType) live in the DOCK (chrome) now — the
  // canvas stays PURE. DARK GROUND is applied by the parent (it wraps surfaces too — it's universal).
  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0];
  const isOt = sampleId === "opentype"; // OpenType proof view — features demonstrated off → on
  const para = sample.kind === "para";
  const displayText = sampleId === "word" ? text : sample.text; // "word" stays editable; presets are read-only
  const effMode = sampleId === "word" ? lmMode : "font";
  const pickedId = winners[focusRoleId];
  const focusRole = roles.find((r) => r.id === focusRoleId) ?? roles[0];
  // role-aware: tier 1 = directions' font FOR THIS role; tier 2 = their other-role fonts.
  const tagFor = dirTagFor(directions, focusRole);
  const tagForAny = dirAnyTagFor(directions);
  // engine recommendations for the focus role, given the current stack
  const recs = topRecs(focusRole, roles, winners);
  const recMap = new Map(recs.map((r) => [r.fontId, r.reason] as const));
  const tiles = [{ face: base, isBase: true }, ...candidateIds.map((id) => ({ face: FACES.find((f) => f.id === id) ?? FACES[0], isBase: false }))];
  const poolIds = [base.id, ...candidateIds];
  // Blind A/B order — a SHUFFLED tile→letter permutation so "Font A" no longer always means the base
  // (row 0). Re-deals each time blind turns on and whenever the pool size changes, so the test is
  // actually blind and can't be gamed by position.
  const [blindOrder, setBlindOrder] = React.useState<number[]>([]);
  React.useEffect(() => {
    if (!blind) return;
    const idx = tiles.map((_, k) => k);
    for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; }
    setBlindOrder(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blind, tiles.length]);
  const blindLetter = (i: number) => String.fromCharCode(65 + (blindOrder[i] ?? i));
  return (
    <>
      {/* the canvas is PURE — controls live in the dock. Just the specimen column. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {tiles.map(({ face, isBase }, i) => (
          <FontRow
            key={face.id} face={face} baseM={baseM} isBase={isBase} text={displayText} roleName={roleName} autoTune={autoTune}
            canRemove={!isBase} onRemove={() => removeCandidate(face.id)}
            onSwitch={(newId) => (isBase ? setBaseId(newId) : replaceCandidate(face.id, newId))}
            tagFor={tagFor} tagForAny={tagForAny} switchDisabled={poolIds.filter((id) => id !== face.id)}
            isPicked={pickedId === face.id} onPick={() => pickWinner(focusRoleId, face.id)} recReason={recMap.get(face.id)}
            mode={effMode} onEditText={setText} para={para} blindLabel={blind ? blindLetter(i) : null}
            otFeatures={isOt ? otFeatures : undefined}
          />
        ))}
        {/* "+ add a font" — the natural last row of the list (a control, so skip it in PNG export).
            shares the specimen left edge (bleed left, like the rows above). */}
        <div data-export-skip style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", marginLeft: -18 }}>
          <span style={{ ...num, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>add</span>
          <FontPicker addMode placeholder="Search fonts…" disabledIds={[base.id, ...candidateIds]} onPick={addCandidate} tagFor={tagFor} tagForAny={tagForAny} roleLabel={focusRole.name} recommended={recProp(recs)} />
          {/* one-click seed the comparison with the engine's top picks (100-run: Compare lands empty) */}
          {(() => {
            // keep the FULL Rec so we can LOAD the Google recommendations before adding them — otherwise a
            // not-yet-loaded gf- id resolves to FACES[0] (Unbounded) and you get the same face N times.
            const shortRecs = topRecs(focusRole, roles, winners, 8).filter((r) => r.fontId !== base.id && !candidateIds.includes(r.fontId));
            return shortRecs.length > 0 ? (
              <button className="t-bare" onClick={() => { tactileSelect(); shortRecs.forEach((r) => { if (r.gf && !FACES.some((f) => f.id === r.fontId)) addGoogleFont(r.gf.family, r.gf.category); addCandidate(r.fontId); }); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--t-match)", padding: "0 4px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <RingDot size={12} /> add {shortRecs.length} recommended
              </button>
            ) : null;
          })()}
        </div>
      </div>
    </>
  );
}

// Letterforms headline — names the role (the switch lives in the dock). Doc §3: "role is
// the headline", and this framing is Letterforms-only (you're picking a font for ONE role).
// Plain-language cap-match explainer — the #1 first-encounter friction (100-user run): the normalized
// sizes read as a bug until someone explains why. Shows once on the canvas; dismissed for good.
function CapMatchNote({ anchor }: { anchor: "cap" | "cap-x" }) {
  const [show, setShow] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("cotejo.capmatch.seen") !== "1"; } catch { return true; }
  });
  if (!show) return null;
  const dismiss = () => { try { window.localStorage.setItem("cotejo.capmatch.seen", "1"); } catch { /* private mode */ } setShow(false); };
  // role-aware (100-run #3, a factual contradiction otherwise): display/heading match on CAP height;
  // body/reading roles match on X-HEIGHT — the fair read for running text.
  const label = anchor === "cap" ? "Cap-matched" : "X-height matched";
  const how = anchor === "cap"
    ? "resized so its capitals are the same height as your base"
    : "resized so its x-height (the lowercase height) matches your base — the fair measure for reading text";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, maxWidth: "66ch", margin: "0 0 20px", padding: "9px 10px 9px 14px", borderRadius: "var(--t-r-block)", background: "var(--t-surface-2)", fontSize: 12.5, lineHeight: 1.45, color: "var(--t-ink-2)" }}>
      <span><strong style={{ fontWeight: 600, color: "var(--t-ink)" }}>{label}.</strong> Every candidate is {how}, measured live from the rendered glyphs — so you’re comparing letter shapes, not sizes.</span>
      <button className="t-iconbtn" onClick={dismiss} aria-label="Got it" style={{ flexShrink: 0 }}><Close size={14} /></button>
    </div>
  );
}

// SURFACE DISCOVERY coachmark — wraps the surface switcher in the dock. New users land on "Letterforms"
// (abstract specimens) and never realize this pill swaps to REAL layouts (hero, article, pricing…). A
// one-time, dismissible pointer fixes that. Chained AFTER the cap-match note (so it's not two prompts at
// once) and auto-dismisses the moment they switch to a real surface (= they found it). (feedback 2026-06)
function SurfaceHint({ show, children }: { show: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [pos, setPos] = React.useState<{ left: number; bottom: number } | null>(null);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!show) { window.localStorage.setItem("cotejo.surfacehint.seen", "1"); setOpen(false); return; } // on a real surface already → they know
      const seen = window.localStorage.getItem("cotejo.surfacehint.seen") === "1";
      const capSeen = window.localStorage.getItem("cotejo.capmatch.seen") === "1"; // wait until the cap-match note is gone
      setOpen(!seen && capSeen);
    } catch { /* private mode */ }
  }, [show]);
  // PORTAL the coachmark to <body> (the dock clips its overflow) + position above the pill from its rect.
  React.useLayoutEffect(() => {
    if (!open) return;
    const place = () => { const r = ref.current?.getBoundingClientRect(); if (r) setPos({ left: Math.max(132, r.left + r.width / 2), bottom: window.innerHeight - r.top + 12 }); };
    place();
    window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);
  const dismiss = () => { try { window.localStorage.setItem("cotejo.surfacehint.seen", "1"); } catch { /* private */ } setOpen(false); };
  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      {children}
      {open && pos && ReactDOM.createPortal(
        <span role="status" style={{
          position: "fixed", left: pos.left, bottom: pos.bottom, transform: "translateX(-50%)", zIndex: 80, width: 250,
          background: "rgba(255,255,255,0.98)", color: "var(--t-ink-2)", padding: "10px 12px 11px", borderRadius: "var(--t-r-block)",
          fontFamily: "var(--t-ui-sans, system-ui, sans-serif)", fontSize: 12, lineHeight: 1.42, textAlign: "left",
          boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05), 0 14px 32px -14px rgba(var(--t-scrim),0.3)",
        }}>
          <span style={{ display: "block", marginBottom: 7 }}><strong style={{ fontWeight: 600, color: "var(--t-ink)" }}>See it in a real layout.</strong> Switch this to a hero, article, or pricing page to judge your fonts in context — not just specimens.</span>
          <button onClick={dismiss} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "var(--t-sans)", fontSize: 11, fontWeight: 600, color: "var(--t-match)" }}>got it</button>
          <span aria-hidden style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "7px solid rgba(255,255,255,0.98)" }} />
        </span>,
        document.body,
      )}
    </span>
  );
}

function RoleHeadline({ surfaceLabel }: { surfaceLabel?: string }) {
  const { roleName, baseSize, autoTune } = useCompare();
  const onLetterforms = !surfaceLabel || surfaceLabel === "Letterforms";
  // ON A SURFACE: no big header at all (it just stacked chrome + read as clutter). The dock
  // names the surface + what's showing; the surface IS the content. One quiet line lives in
  // ViewSource (caption + the text/font toggle). So render nothing here.
  if (!onLetterforms) return null;
  // LETTERFORMS = the per-role grinder; here the role IS the headline (doc §3). The sample word is
  // edited inline on the specimens now (✎ edit text), so no separate input — same model as surfaces.
  const fair = autoTune ? "cap-matched" : "raw · not matched";
  return (
    <div style={{ marginBottom: 18 }}>
      <span style={{ ...num, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>compare</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", margin: "7px 0 0" }}>
        <h1 style={{ fontSize: "var(--t-title)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--t-ink)", margin: 0 }}>Pick the {roleName} font</h1>
        <span style={num}>{`${Math.round(baseSize)}px base · ${fair}`}</span>
      </div>
    </div>
  );
}

// YOUR STACK — the type system you're building: exactly ONE font per role. You build it by
// PICKING any role's font from anywhere — search any font, or pull a role straight from a
// saved direction (the picker pins those, tagged → one-click mix-and-match). Pick REPLACES
// that role; a surface showing the stack updates live. Fork loads a whole direction in to
// start from; Save snapshots the stack as a new Direction (one font per role → unambiguous).
function StackTray() {
  const { roles, winners, pickWinner, clearWinner, directions, assembleDirection, loadStack } = useSession();
  const [saved, setSaved] = React.useState<string | null>(null);
  const picks = roles.filter((r) => winners[r.id]).length;
  const customCount = directions.filter((d) => d.custom).length;
  const save = () => { const name = `My direction ${customCount + 1}`; assembleDirection(name); setSaved(name); };
  const fork = (dirId: string) => {
    const d = directions.find((x) => x.id === dirId);
    if (!d) return;
    tactileSelect();
    loadStack(Object.fromEntries(roles.map((r) => [r.id, dirFontForRole(d, r)])));
  };
  const forkOpts = [{ value: "", label: "fork a direction…" }, ...directions.map((d) => ({ value: d.id, label: d.name }))];
  // tucked away by default — a slim bar you OPEN when you want to build/save the stack, so the canvas
  // isn't dominated by a half-empty band. Opens itself once you've started picking.
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { if (picks > 0) setOpen(true); }, [picks]);
  return (
    <div style={{ marginTop: 32, padding: open ? "14px 18px" : "0", borderRadius: "var(--t-r-menu)", background: open ? "var(--t-surface-2)" : "transparent", transition: "background var(--t-dur) var(--t-ease)" }}>
      {/* the slim handle — always visible; click to open/close the builder */}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        style={{ display: "inline-flex", alignItems: "baseline", gap: 10, background: "none", border: "none", padding: open ? "0 0 12px" : "6px 2px", cursor: "pointer", color: "var(--t-ink)" }}>
        <span style={cap}>your stack</span>
        <span style={num}>{picks ? `${picks} of ${roles.length} set` : "empty · pick a font for any role"}</span>
        <ChevronDown size={11} style={{ opacity: 0.4, transform: open ? "rotate(180deg)" : "none", transition: "transform var(--t-dur) var(--t-ease)" }} />
      </button>
      {open && (<>
      {/* ONE balanced row: the stack (label + slots) on the left, actions centered on the right —
          so the tray hugs its content (no tall-buttons-over-short-slots void at the bottom). */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", rowGap: 14 }}>
        <div style={{ flex: "1 1 340px", minWidth: 0 }}>
          {/* the stack as a QUIET READOUT — role + font name as plain clickable text (bare picker),
              NOT a wall of dropdown pills. Picked = cobalt; from base = quiet ink. Click a name to
              change it; the × clears it. (Primary editing is on the surface now.) */}
          <div style={{ display: "flex", flexWrap: "wrap", columnGap: 26, rowGap: 10, alignItems: "baseline" }}>
            {roles.map((r) => {
              const picked = !!winners[r.id];
              return (
                <span key={r.id} className="t-slot" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ ...cap, lineHeight: 1 }}>{r.name}</span>
                  {/* picked = your chosen font (cobalt) + a × that REMOVES it (role goes back to
                      "+ pick", unset). unset = a quiet "+ pick" you click to set. So you can × every
                      font down to an empty stack; empty roles just fall back to your base on a surface. */}
                  <FontPicker bare value={picked ? winners[r.id] : undefined} placeholder="+ pick"
                    color={picked ? "var(--t-match)" : "var(--t-ink-3)"} onPick={(id) => pickWinner(r.id, id)}
                    tagFor={dirTagFor(directions, r)} tagForAny={dirAnyTagFor(directions)} roleLabel={r.name}
                    recommended={recProp(topRecs(r, roles, winners))} />
                  {picked && (
                    <button className="t-iconbtn" onClick={() => { tactileSelect(); clearWinner(r.id); }} aria-label={`Remove ${r.name} from your stack`} style={{ opacity: 0.65 }}>
                      <Close size={14} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <PillSelect value="" options={forkOpts} onChange={fork} />
          <Btn variant="primary" disabled={picks === 0} onClick={() => { tactileSuccess(); save(); }}>
            Save as direction
            <ArrowRight size={14} />
          </Btn>
        </span>
      </div>
      {saved && <div style={{ ...num, color: "var(--t-match)", marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5 }}>saved “{saved}” to Directions <Check size={11} /></div>}
      </>)}
    </div>
  );
}

// dock group separation = SPACING, not a line (Cotejo locked rule). A transparent spacer widens
// the gap between control groups so they read as grouped without a hairline divider.
const dgap = <span aria-hidden="true" style={{ width: 6, flexShrink: 0 }} />;

// MOBILE dock row — a calm labeled line (quiet label left, control right) so the phone Controls sheet
// reads as a real settings panel, not the desktop pill-row wrapped into a pile. (module-level → stable)
function DockRow({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", minHeight: 36 }}>
      {label != null
        ? <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t-ink-3)", flexShrink: 0 }}>{label}</span>
        : <span />}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{children}</div>
    </div>
  );
}

// the surfaces you compare ON (flat picker, in the dock). Letterforms = the bare grid; the
// rest come from the surface REGISTRY. On a surface you compare whole SYSTEMS: View one
// (your stack — the editable one), tile several side by side, or onion two.
const SURFACES: { id: string; label: string }[] = [
  { id: "letterforms", label: "Letterforms" },
  ...SURFACE_COMPONENTS.map((s) => ({ id: s.id, label: s.label })),
];
const SURF_MODES: { id: CmpMode; label: string }[] = [
  { id: "view", label: "View" },
  { id: "tile", label: "Side by side" },
  { id: "onion", label: "Onion" },
];

// MEASURE zone — Bringhurst (Elements of Typographic Style §2.1.2): "anything from 45 to 75
// characters is widely regarded as a satisfactory length… 66 characters is widely regarded as
// ideal." Names the band so the number teaches, not just sets. The single biggest body-reading lever.
function measureZone(m: number): { word: string; tone: string } {
  // in-band (comfortable/ideal) reads a touch stronger; out-of-band muted. NO cobalt — the accent is
  // reserved for interaction/picked state, never a readout label (DESIGN-LANGUAGE-V2 §3).
  if (m < 45) return { word: "tight", tone: "var(--t-ink-3)" };
  if (m > 75) return { word: "wide", tone: "var(--t-ink-3)" };
  if (m >= 63 && m <= 69) return { word: "ideal", tone: "var(--t-ink-2)" };
  return { word: "comfortable", tone: "var(--t-ink-2)" };
}
// the running-body column width (chars/line) for the reading surfaces — lives in the dock with
// every other "adjust while you watch the type" control. Shown only for measurable surfaces. The
// suggested LEADING rides alongside (it scales with the measure) so the full running-text rhythm —
// line length AND line-space — is read + tuned in one place; the surfaces render at this leading.
function MeasureControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const z = measureZone(value);
  const lead = leadingForMeasure(value);
  // a tidy COLUMN — the slider (label + "66 cpl" + track), then one clean right-aligned line for the
  // zone + suggested leading. Was a horizontal row, which wrapped raggedly in the narrow dock.
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 5, width: 168 }}>
      <StretchySlider value={value} min={40} max={90} onChange={onChange} label="measure" format={(v) => `${v} cpl`} width={168} />
      <span style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 9, fontFamily: MONO, fontSize: 10.5 }}>
        <span style={{ color: z.tone }}>{z.word}</span>
        <span style={{ color: "var(--t-ink-3)" }} title={`Suggested line-height for this measure — a longer line wants more line-space. The Article + Editorial body render at ${lead}.`}>lh {lead}</span>
      </span>
    </span>
  );
}

export function CompareContent() {
  const { roleOpts, focusRoleId, setFocusRoleId, autoTune } = useCompare();
  // the comparison VIEW is URL-synced (below) so a refresh holds it AND a Share link reproduces the
  // exact view, not just the setup. Initial values come from the URL (a shared/deep link), else default.
  const [surfaceId, setSurfaceId] = React.useState(() => readParam("surface") || "letterforms");
  const [mode, setMode] = React.useState<CmpMode>(() => {
    const m = readParam("cmp"); return m === "tile" || m === "onion" ? m : "view";
  });
  const [showKey, setShowKey] = React.useState(() => readParam("show") || "stack");
  const [vsKey, setVsKey] = React.useState(() => readParam("vs") || "");
  const [fade, setFade] = React.useState(() => {
    const f = Number(readParam("fade")); return Number.isFinite(f) ? Math.max(0, Math.min(100, f)) : 100;
  });
  // reserve exactly the bottom band the floating dock occupies (measured live), so the stack
  // tray + last surface rows never hide under it — the dock wraps taller when narrow.
  const [dockH, setDockH] = React.useState(140);
  // proof + interaction controls live in the DOCK (chrome), never stacked on the canvas:
  // Letterforms pick/edit + sample/ground/blind, and every surface's pick/edit.
  const [lmMode, setLmMode] = React.useState<"font" | "text">("font");
  const [sampleId, setSampleId] = React.useState("word");
  const [ground, setGround] = React.useState<"paper" | "dark">(() => (readParam("ground") === "dark" ? "dark" : "paper"));
  const [blind, setBlind] = React.useState(false);
  // OpenType proof: which features each font demonstrates (off → on). Default ALL → you see the
  // whole OpenType layer at once; the OtPicker narrows it. Lives in the dock only in OpenType mode.
  const [otf, setOtf] = React.useState<Set<string>>(() => new Set(OT_FEATURES.map((f) => f.tag)));
  const toggleOt = (tag: string) => setOtf((s) => { const n = new Set(s); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });
  const otFeatures = OT_FEATURES.filter((f) => otf.has(f.tag));
  const [surfEdit, setSurfEdit] = React.useState<"font" | "text">("font");
  const { roles, winners, surfaceContent, resetSurfaceContent, measure, setMeasure } = useSession();
  const { setMode: goToMode } = useMode();
  const cur = SURFACES.find((s) => s.id === surfaceId) ?? SURFACES[0];
  const onLetterforms = cur.id === "letterforms";
  const isOt = onLetterforms && sampleId === "opentype"; // OpenType proof view (Letterforms only)
  const curSurf = onLetterforms ? null : surfaceById(cur.id);
  const surfEdited = curSurf ? Object.keys(surfaceContent[curSurf.id] ?? {}).length > 0 : false;
  // roles this surface uses that you haven't created yet (they fall back to nearest size) — a quiet
  // dock advisory replaces the on-canvas note. usingBase is dropped: the stack tray already shows it.
  const notSetUp = React.useMemo(() => {
    if (!curSurf) return [];
    const have = new Set(roles.map((r) => r.kind));
    return Array.from(new Set(curSurf.fields.map((f) => f.role))).filter((k) => !have.has(k));
  }, [curSurf, roles]);
  // which whole SYSTEM renders (and, in onion, what it's overlaid against): your stack, base,
  // or any saved direction. Default = your stack, so a surface opens in the editable state.
  const { all } = useSources();
  const sourceOpts = all.map((s) => ({ value: s.key, label: s.label }));
  const effShow = all.some((s) => s.key === showKey) ? showKey : "stack";
  const vsCandidates = all.filter((s) => s.key !== effShow);
  const effVs = vsCandidates.some((s) => s.key === vsKey) ? vsKey : (vsCandidates[0]?.key ?? "");
  const roleSel = roleOpts.map((r) => ({ value: r.id, label: r.name }));
  // mobile → the dock controls become a calm labeled panel (not the desktop pill-row), and the base +
  // cap-match globals move in here (they leave the top bar). Same breakpoint the dock collapses at.
  const narrow = useNarrow(820);

  // SYNC the view → URL (defaults omitted so a plain session stays a clean URL). This is what makes
  // the Share link reproduce the exact comparison: shareActive() copies location.search verbatim.
  React.useEffect(() => {
    writeParams({
      surface: surfaceId === "letterforms" ? null : surfaceId,
      cmp: mode === "view" ? null : mode,
      show: effShow === "stack" ? null : effShow,
      vs: mode === "onion" && effVs ? effVs : null,
      fade: mode === "onion" && fade !== 100 ? String(fade) : null,
      ground: ground === "dark" ? "dark" : null,
    });
  }, [surfaceId, mode, effShow, effVs, fade, ground]);

  return (
    <div style={{ paddingLeft: "clamp(6px,1.6vw,22px)", paddingBottom: dockH + 28 }}>
      <RoleHeadline surfaceLabel={cur.label} />
      {/* the #1 first-encounter friction (100-user run): cap-match reads as a bug until explained.
          A one-line plain-language note on the canvas, dismissed for good once you've got it. */}
      {onLetterforms && autoTune && <CapMatchNote anchor={anchorForKind((roles.find((r) => r.id === focusRoleId) ?? roles[0]).kind)} />}
      {/* DARK GROUND wraps the whole canvas — Letterforms OR a surface (it's universal now). The id
          is the PNG-export capture target (#14). */}
      <div id="cotejo-canvas" style={ground === "dark" ? DARK_GROUND : undefined}>
        {onLetterforms
          ? <LetterformsGrid lmMode={lmMode} sampleId={sampleId} blind={blind} otFeatures={otFeatures} />
          : curSurf && <SurfaceCanvas surface={curSurf} mode={mode} showKey={effShow} vsKey={effVs} fade={fade} edit={surfEdit} />}
      </div>
      <StackTray />

      {/* the INSTRUMENT PANEL — all the controls you adjust while watching the type. MOBILE gets a
          calm labeled panel; DESKTOP keeps the floating pill-row. */}
      <BottomDock onHeight={setDockH}>
        {narrow ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 13, width: "100%" }}>
            <DockRow label="preview in">
              <PillSelect compact value={surfaceId} options={SURFACES.map((s) => ({ value: s.id, label: s.label }))} onChange={setSurfaceId} />
            </DockRow>
            {onLetterforms ? (
              <>
                {roleSel.length > 1 && <DockRow label="role"><PillSelect compact value={focusRoleId} options={roleSel} onChange={setFocusRoleId} /></DockRow>}
                <DockRow label="sample"><PillSelect compact value={sampleId} options={SAMPLES.map((s) => ({ value: s.id, label: s.label }))} onChange={setSampleId} /></DockRow>
                {sampleId === "word" && <DockRow label="pick / edit"><Segmented options={PICK_EDIT} value={lmMode} onChange={setLmMode} ariaLabel="Pick a font or edit the sample word" /></DockRow>}
                {isOt && <DockRow label="features"><OtPicker selected={otf} onToggle={toggleOt} /></DockRow>}
              </>
            ) : (
              <>
                <DockRow label="showing"><PillSelect compact value={effShow} options={sourceOpts} onChange={setShowKey} /></DockRow>
                <DockRow label="compare"><Segmented options={SURF_MODES} value={mode} onChange={setMode} ariaLabel="How to compare on this surface" /></DockRow>
                {mode === "onion" && vsCandidates.length > 0 && (
                  <>
                    <DockRow label="against"><PillSelect compact value={effVs} options={vsCandidates.map((s) => ({ value: s.key, label: s.label }))} onChange={setVsKey} /></DockRow>
                    <DockRow label="fade"><StretchySlider value={fade} min={0} max={100} onChange={setFade} label="" format={(v) => `${v}%`} width={150} /></DockRow>
                  </>
                )}
                {mode === "view" && (
                  <DockRow label="pick / edit">
                    <Segmented options={PICK_EDIT} value={surfEdit} onChange={setSurfEdit} ariaLabel="Pick a font or edit the text" />
                    {surfEdited && <Btn variant="ghost" size="sm" mono onClick={() => curSurf && resetSurfaceContent(curSurf.id)}>reset</Btn>}
                  </DockRow>
                )}
                {curSurf?.measurable && <DockRow label="measure"><MeasureControl value={measure} onChange={setMeasure} /></DockRow>}
                {mode === "view" && notSetUp.length > 0 && (
                  <DockRow label="roles">
                    <button onClick={() => goToMode("setup")} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", fontFamily: MONO, fontSize: 11, color: "var(--t-match)", whiteSpace: "nowrap" }}>
                      set up {fmtList(notSetUp, 6)} <ArrowRight size={11} />
                    </button>
                  </DockRow>
                )}
              </>
            )}
            {/* the "what am I comparing" globals (self-labeling) — moved off the top bar onto the phone */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, width: "100%", marginTop: 2 }}>
              <CompareBar />
              {onLetterforms && !isOt && <IconToggle on={blind} onClick={() => setBlind((v) => !v)} label="blind A/B" ariaLabel="Blind A/B — hide font names" title="Hide the font names so you judge the type, not the brand"><EyeOff size={15} /></IconToggle>}
              <IconToggle on={ground === "dark"} onClick={() => setGround((g) => (g === "dark" ? "paper" : "dark"))} label={ground === "dark" ? "dark" : "ground"} ariaLabel={ground === "dark" ? "Dark ground" : "Paper ground"} title="Preview on a dark ground"><Contrast size={15} /></IconToggle>
              <ViewportPicker />
            </div>
          </div>
        ) : (
        <>
        <SurfaceHint show={surfaceId === "letterforms"}>
          <PillSelect label="preview in" value={surfaceId} options={SURFACES.map((s) => ({ value: s.id, label: s.label }))} onChange={setSurfaceId} />
        </SurfaceHint>
        {dgap}
        {onLetterforms ? (
          <>
            {roleSel.length > 1 && <><PillSelect value={focusRoleId} options={roleSel} onChange={setFocusRoleId} />{dgap}</>}
            {/* pick a font vs edit the sample word — only on the editable "Word" sample (not in proofs) */}
            {sampleId === "word" && <Segmented options={PICK_EDIT} value={lmMode} onChange={setLmMode} ariaLabel="Pick a font or edit the sample word" />}
            <PillSelect value={sampleId} options={SAMPLES.map((s) => ({ value: s.id, label: s.label }))} onChange={setSampleId} />
            {/* OpenType mode → the feature multi-select; else blind A/B. pick/edit + blind don't apply
                to a feature proof, so they drop. (ground is shared — it lives in the dock tail below.) */}
            {isOt
              ? <OtPicker selected={otf} onToggle={toggleOt} />
              : <IconToggle on={blind} onClick={() => setBlind((v) => !v)} label="blind A/B" ariaLabel="Blind A/B — hide font names" title="Hide the font names so you judge the type, not the brand"><EyeOff size={15} /></IconToggle>}
          </>
        ) : (
          <>
            <PillSelect value={effShow} options={sourceOpts} onChange={setShowKey} />
            <Segmented options={SURF_MODES} value={mode} onChange={setMode} ariaLabel="How to compare on this surface" />
            {/* VIEW = the one editable mode → pick/edit + reset + the "needs a role" advisory live here */}
            {mode === "view" && (
              <>
                {dgap}
                <Segmented options={PICK_EDIT} value={surfEdit} onChange={setSurfEdit} ariaLabel="Pick a font or edit the text" />
                {notSetUp.length > 0 && (
                  <button
                    onClick={() => goToMode("setup")}
                    title={`This surface uses ${fmtList(notSetUp, 8)} — role${notSetUp.length > 1 ? "s" : ""} you haven’t set up. They fall back to the nearest size until you add them.`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)", whiteSpace: "nowrap" }}
                  >
                    needs {fmtList(notSetUp)} <span style={{ color: "var(--t-match)", display: "inline-flex", alignItems: "center", gap: 3 }}>· set up <ArrowRight size={11} /></span>
                  </button>
                )}
                {surfEdited && <Btn variant="ghost" size="sm" mono onClick={() => curSurf && resetSurfaceContent(curSurf.id)}>reset text</Btn>}
              </>
            )}
            {mode === "onion" && vsCandidates.length > 0 && (
              <>
                <span style={{ ...num, opacity: 0.55 }}>vs</span>
                <PillSelect value={effVs} options={vsCandidates.map((s) => ({ value: s.key, label: s.label }))} onChange={setVsKey} />
                <StretchySlider value={fade} min={0} max={100} onChange={setFade} label="fade" format={(v) => `${v}%`} width={150} />
              </>
            )}
            {/* MEASURE — chars/line for the running body (reading surfaces only). Applies in every
                mode (it's a property of the column, not the comparison). The biggest body lever. */}
            {curSurf?.measurable && (<>{dgap}<MeasureControl value={measure} onChange={setMeasure} /></>)}
          </>
        )}
        {dgap}
        {/* dark ground — UNIVERSAL (Letterforms + every surface), so it lives in the shared dock tail */}
        <IconToggle on={ground === "dark"} onClick={() => setGround((g) => (g === "dark" ? "paper" : "dark"))} label={ground === "dark" ? "dark" : "ground"} ariaLabel={ground === "dark" ? "Dark ground" : "Paper ground"} title="Preview on a dark ground"><Contrast size={15} /></IconToggle>
        <ViewportPicker />
        </>
        )}
      </BottomDock>
    </div>
  );
}
