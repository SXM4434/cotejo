// Directions mode — the LIBRARY of saved type systems (the shelf, not the bench).
// Each card is a whole stack (a font per role). Clicking one APPLIES its stack to your
// roles (display font → big roles, text font → the rest). "+ New direction" drops a real,
// EDITABLE card into the grid (no separate composer): edit its name + fonts in place,
// changes apply live. To JUDGE a direction on a surface or against another, you open it
// in Compare (the bench) — surfaces don't live here (doc §3). The library is held in the
// SESSION, so Compare reads the same cards. Cards = filled surfaces (no border); selected
// = ink inversion.
import React from "react";
import ReactDOM from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { useSession, FACES, KIND_ORDER, KIND_STEP, dirFontForRole, type Dir, type DirFonts, type RoleKind } from "../../state/SessionContext";
import { useMode } from "../../state/ModeContext";
import { FontPicker } from "../../components/FontPicker";
import { Btn } from "../../components/Btn";
import { PillSelect } from "../../components/PillSelect";
import { topRecs } from "../../lib/recommend";
import { Close, SwapH, Plus, ArrowRight, Pencil, Warn } from "../../components/icons";
import { modalMotion } from "../../lib/popover";

// a direction whose stack includes an uploaded font carries license risk (F4) — flag it on the card.
const dirHasByo = (fonts: Partial<Record<RoleKind, string>>) => Object.values(fonts).some((id) => typeof id === "string" && id.startsWith("user-"));

const KIND_LABEL: Record<RoleKind, string> = {
  display: "Display", heading: "Heading", subheading: "Subheading", body: "Body",
  caption: "Caption", label: "Label", quote: "Quote", mono: "Mono",
};

const MONO = "var(--t-sans)";
const EASE = [0.2, 0, 0, 1] as const;
const famOf = (id: string) => (FACES.find((f) => f.id === id) ?? FACES[0]).family;

// a mini SPECIMEN — every role rendered in its ACTUAL font, so each card SHOWS the type system
// in use (not a list of names). `fonts` = kind→fontId (a direction's map, or the base built
// from the user's roles). `copy` lets each card carry its OWN specimen lines (drawn from the
// direction's name/vibe) so cards don't read as photocopies of one another; it falls back to a
// neutral default. Colors adapt for the dark active card.
type SpecimenCopy = { display: string; heading: string; body: string; quote: string };
const DEFAULT_SPECIMEN: SpecimenCopy = {
  display: "Cotejo",
  heading: "Headlines hold the line",
  body: "Body copy sets an even rhythm — quiet, readable, line after line.",
  quote: "A confident, quiet voice.",
};
function DirSpecimen({ fonts, ink, body, sub, copy }: { fonts: Partial<Record<RoleKind, string>>; ink: string; body: string; sub: string; copy?: SpecimenCopy }) {
  const fam = (k: RoleKind, fb: RoleKind) => famOf(fonts[k] ?? fonts[fb] ?? "mona");
  const c = copy ?? DEFAULT_SPECIMEN;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ fontFamily: fam("display", "display"), fontSize: 34, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em", color: ink }}>{c.display}</div>
      <div style={{ fontFamily: fam("heading", "display"), fontSize: 18, fontWeight: 600, lineHeight: 1.12, color: ink }}>{c.heading}</div>
      <div style={{ fontFamily: fam("body", "body"), fontSize: 13.5, lineHeight: 1.5, color: body }}>{c.body}</div>
      <div style={{ fontFamily: fam("quote", "body"), fontStyle: "italic", fontSize: 15, lineHeight: 1.3, color: ink }}>“{c.quote}”</div>
    </div>
  );
}

// build a short, varied specimen from a direction's own name + vibe, so each card reads as itself.
// Keeps copy short; the display line shows the direction name, the rest play off its vibe's lead
// descriptor (vibes are "·"-separated phrases like "geometric · kinetic" — take the first word).
function specimenFor(name: string, vibe?: string): SpecimenCopy {
  const display = name.trim() || DEFAULT_SPECIMEN.display;
  const lead = (vibe ?? "").split("·")[0].trim().toLowerCase();
  if (!lead) return { ...DEFAULT_SPECIMEN, display };
  const Lead = lead.charAt(0).toUpperCase() + lead.slice(1);
  return {
    display,
    heading: `${Lead} headlines, set with intent`,
    body: `${display} sets an even rhythm — a ${lead} read, line after line.`,
    quote: `A ${lead} voice, all the way down.`,
  };
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

// THE DIRECTION EDITOR — a popup that defines a whole type system: a name + a font for EVERY
// register (not just display/body), with a live specimen. Always re-openable to edit. On open
// it fills in any unset register from the nearest anchor, so every row shows a real, editable
// font. Edits write straight to the saved direction (and re-apply if it's the active one).
function DirectionEditor({ dirId, onClose }: { dirId: string; onClose: () => void }) {
  const { directions, updateDirection, applyDirection } = useSession();
  const dir = directions.find((d) => d.id === dirId);
  // seed every register once on open so the editor is explicit (no silent fallbacks to fill in)
  React.useEffect(() => {
    if (!dir) return;
    const full = { ...dir.fonts } as DirFonts;
    let changed = false;
    KIND_ORDER.forEach((k) => { if (!full[k]) { full[k] = dirFontForRole(dir, { kind: k, step: KIND_STEP[k] }); changed = true; } });
    if (changed) updateDirection(dir.id, { fonts: full });
    // run once per opened direction — refs are stable, the seed is idempotent (eslint: dirId only)
  }, [dirId]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!dir) return null;
  const setFont = (k: RoleKind, v: string) => {
    const fonts = { ...dir.fonts, [k]: v } as DirFonts;
    updateDirection(dir.id, { fonts });
    applyDirection({ ...dir, fonts }); // keep the live stack in sync when this is the active system
  };
  // recommendations within THIS direction — each register paired against its own display/body
  const kindRoles = KIND_ORDER.map((k) => ({ id: k, name: KIND_LABEL[k], kind: k, step: KIND_STEP[k], fontId: dir.fonts[k] ?? dirFontForRole(dir, { kind: k, step: KIND_STEP[k] }) }));
  const dirPicks = Object.fromEntries(kindRoles.map((r) => [r.id, r.fontId]));
  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(var(--t-scrim),0.30)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div className="t-pop" style={{ width: "min(560px, 100%)", maxHeight: "86vh", overflowY: "auto", background: "var(--t-bg-lift)", borderRadius: "var(--t-r-panel)", padding: "22px 24px 24px", boxShadow: "0 24px 64px -22px rgba(var(--t-scrim),0.42)", ...modalMotion }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>{dir.custom ? "Edit direction" : "Direction"}</span>
          <button className="t-iconbtn" onClick={onClose} aria-label="Done" style={{ marginLeft: "auto" }}><Close size={15} /></button>
        </div>
        <input
          value={dir.name} onChange={(e) => updateDirection(dir.id, { name: e.target.value })} aria-label="Direction name"
          style={{ width: "100%", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--t-ink)", background: "transparent", border: "none", outline: "none", padding: 0, marginBottom: 16 }}
        />
        {/* live specimen — every register in its actual font */}
        <div style={{ background: "var(--t-surface-2)", borderRadius: "var(--t-r-menu)", padding: "18px 20px", marginBottom: 18 }}>
          <DirSpecimen fonts={dir.fonts} ink="var(--t-ink)" body="var(--t-ink-2)" sub="var(--t-ink-3)" />
        </div>
        {/* one font per register */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {KIND_ORDER.map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "7px 0", borderTop: "1px solid color-mix(in oklab, var(--t-ink) 7%, transparent)" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-2)" }}>{KIND_LABEL[k]}</span>
              <FontPicker compact value={dir.fonts[k] ?? dirFontForRole(dir, { kind: k, step: KIND_STEP[k] })} onPick={(v) => setFont(k, v)} roleLabel={KIND_LABEL[k]}
                recommended={topRecs(kindRoles.find((r) => r.kind === k)!, kindRoles, dirPicks).map((x) => ({ id: x.fontId, reason: x.reason, gf: x.gf }))} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="primary" size="lg" onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// COMPARE TWO (AIRTIGHT-PASS F8) — a direct head-to-head of any two saved systems (or your base),
// side by side at matched specimen sizes. Side-by-side mode tiles EVERYTHING; this picks exactly two.
function CompareTwo({ dirs, baseFonts }: { dirs: Dir[]; baseFonts: Partial<Record<RoleKind, string>> }) {
  const opts = [{ value: "__base", label: "Your base" }, ...dirs.map((d) => ({ value: d.id, label: d.name }))];
  const [a, setA] = React.useState(dirs[0]?.id ?? "__base");
  const [b, setB] = React.useState(dirs[1]?.id ?? dirs[0]?.id ?? "__base");
  const fontsOf = (id: string) => (id === "__base" ? baseFonts : dirs.find((d) => d.id === id)?.fonts ?? baseFonts);
  const nameOf = (id: string) => opts.find((o) => o.value === id)?.label ?? "";
  const capS: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", display: "block", marginBottom: 12 };
  return (
    <div className="cmp-mode-in" style={{ background: "var(--t-surface-2)", borderRadius: "var(--t-r-menu)", padding: "18px 20px", marginBottom: "var(--t-gap-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <PillSelect compact label="A" value={a} options={opts} onChange={setA} />
        <span style={{ color: "var(--t-ink-3)", display: "inline-flex" }}><SwapH size={14} /></span>
        <PillSelect compact label="B" value={b} options={opts} onChange={setB} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%),1fr))", gap: 24 }}>
        <div><span style={capS}>{nameOf(a)}</span><DirSpecimen fonts={fontsOf(a)} ink="var(--t-ink)" body="var(--t-ink-2)" sub="var(--t-ink-3)" /></div>
        <div><span style={capS}>{nameOf(b)}</span><DirSpecimen fonts={fontsOf(b)} ink="var(--t-ink)" body="var(--t-ink-2)" sub="var(--t-ink-3)" /></div>
      </div>
    </div>
  );
}

export function DirectionsMode() {
  const { applyDirection, roles, directions, addDirection, updateDirection, removeDirection } = useSession();
  const { setMode } = useMode();
  // reduced-motion: gate the card TRANSFORMS (mount-y, hover-lift, tap-scale); the CSS guard
  // can't reach Motion's inline transforms, so honor the preference here. Opacity fade stays.
  const reduce = useReducedMotion();
  const [selectedId, setSelectedId] = React.useState("Builder");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [compareTwo, setCompareTwo] = React.useState(false);
  const dirs = directions;
  const baseFonts = Object.fromEntries(roles.map((r) => [r.kind, r.fontId])) as Partial<Record<RoleKind, string>>;
  const customCount = dirs.filter((d) => d.custom).length;
  const selectedName = dirs.find((d) => d.id === selectedId)?.name ?? "Builder";

  const apply = (d: Dir) => { setSelectedId(d.id); applyDirection(d); };
  const addNew = () => {
    const n = customCount + 1;
    const fonts = { display: "unbounded", body: "newsreader" };
    const name = n > 1 ? `New direction ${n}` : "New direction";
    const id = addDirection({ name, vibe: "custom", fonts: { ...fonts }, custom: true });
    setSelectedId(id); applyDirection({ id, name, vibe: "custom", fonts: { ...fonts } });
    setEditingId(id); // open the editor so you define the whole system right away
  };
  const patchUser = (d: Dir, patch: Partial<Dir>) => {
    updateDirection(d.id, patch);
    if (selectedId === d.id && patch.fonts) applyDirection({ ...d, ...patch });
  };
  const removeUser = (id: string) => {
    removeDirection(id);
    if (selectedId === id) { setSelectedId("Builder"); applyDirection({ id: "Builder", name: "Builder", vibe: "", fonts: { display: "unbounded", body: "mona" } }); }
  };

  return (
    <div style={{ paddingLeft: "clamp(6px,1.6vw,22px)", paddingRight: "clamp(6px,1.6vw,22px)" }}>
      <p style={{ fontSize: "var(--t-helper)", color: "var(--t-ink-2)", margin: "0 0 var(--t-gap-sm)", maxWidth: 820, lineHeight: 1.5 }}>
        Your saved type systems — the library. Each card is a whole stack, a font per role.
        Pick one to apply it to your roles, or build your own. To judge one on a surface or
        against another, open it in Compare.
      </p>

      {/* direct head-to-head of any two systems (F8) */}
      <div style={{ marginBottom: compareTwo ? "var(--t-gap-md)" : "var(--t-gap-lg)" }}>
        <Btn variant={compareTwo ? "primary" : "secondary"} size="sm" mono aria-pressed={compareTwo} onClick={() => setCompareTwo((v) => !v)}>
          <SwapH size={13} /> Compare two
        </Btn>
      </div>
      {compareTwo && <CompareTwo dirs={dirs} baseFonts={baseFonts} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 20 }}>
        {/* YOUR BASE — the Set Up system, pinned as the reference everything is judged against */}
        <div className="t-dir" style={{ padding: "22px 24px", boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--t-ink) 12%, transparent), 0 1px 2px rgba(27,24,21,0.05), 0 9px 24px -12px rgba(27,24,21,0.11)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t-ink)" }}>Your base</span>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 600 }}>from Set Up · the reference</span>
          </div>
          <DirSpecimen fonts={Object.fromEntries(roles.map((r) => [r.kind, r.fontId])) as Partial<Record<RoleKind, string>>} ink="var(--t-ink)" body="var(--t-ink-2)" sub="var(--t-ink-3)" />
        </div>
        {dirs.map((d, i) => {
          const active = d.id === selectedId;
          // selection is a quiet cobalt inset ring + lift (NOT a dark fill) — text stays normal ink
          const ink = "var(--t-ink)";
          const sub = "var(--t-ink-3)";
          const body = "var(--t-ink-2)";
          return (
            <motion.div
              key={d.id}
              className="t-dir"
              data-active={active}
              role="button" tabIndex={0}
              onClick={() => apply(d)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); apply(d); } }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.03, duration: 0.23, ease: EASE }}
              whileHover={reduce ? undefined : { y: -3 }}
              whileTap={reduce ? undefined : { scale: 0.985 }}
              style={{
                position: "relative", textAlign: "left", cursor: "pointer", padding: "22px 24px",
                // selected = cobalt inset ring (the picked-state mark) + a subtle lift; keeps the normal card bg
                ...(active ? { boxShadow: "inset 0 0 0 1.5px var(--t-match), 0 12px 30px -14px rgba(27,24,21,0.2)" } : {}),
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
                {d.custom ? (
                  <input
                    value={d.name} onChange={(e) => patchUser(d, { name: e.target.value })}
                    onClick={stop}
                    onKeyDown={(e) => { stop(e); if (e.key === "Enter") e.currentTarget.blur(); }}
                    aria-label="Direction name"
                    style={{ fontSize: 15, fontWeight: 600, color: ink, background: "transparent", border: "none", outline: "none", width: 170, padding: 0 }}
                  />
                ) : (
                  <span style={{ fontSize: 15, fontWeight: 600, color: ink }}>{d.name}</span>
                )}
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: sub }}>{d.vibe}</span>
                {dirHasByo(d.fonts) && (
                  <span title="Uses an uploaded font — verify its license before shipping" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--t-ink-3)", marginLeft: "auto" }}><Warn size={11} /> verify license</span>
                )}
              </div>

              <DirSpecimen fonts={d.fonts} ink={ink} body={body} sub={sub} copy={specimenFor(d.name, d.vibe)} />

              {/* custom cards open the full editor (a font per register), always re-editable */}
              {d.custom && (
                <Btn variant="secondary" size="sm" mono onClick={(e) => { e.stopPropagation(); setEditingId(d.id); }} style={{ marginTop: 16 }}>
                  <Pencil size={13} />
                  edit fonts
                </Btn>
              )}

              {d.custom && (
                <button
                  className="t-iconbtn"
                  onClick={(e) => { e.stopPropagation(); removeUser(d.id); }}
                  onMouseDown={stop}
                  aria-label={`Remove ${d.name}`}
                  // position only inline; quiet ink so it sits back until hover (the .t-iconbtn class
                  // brings the 40px hit area, focus ring, press-scale, hover)
                  style={{ position: "absolute", top: 14, right: 14, color: sub }}
                ><Close size={13} /></button>
              )}
            </motion.div>
          );
        })}

        {/* + New direction — drops a real editable card into the grid */}
        <motion.button
          className="t-dir"
          onMouseDown={(e) => e.preventDefault()} onClick={() => addNew()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : dirs.length * 0.03, duration: 0.23, ease: EASE }}
          whileHover={reduce ? undefined : { y: -3 }} whileTap={reduce ? undefined : { scale: 0.985 }}
          style={{ minHeight: 150, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t-ink-3)", fontSize: 14, fontWeight: 500 }}
        >
          <Plus size={18} /> New direction
        </motion.button>
      </div>

      {/* applied → carry into Compare */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 30 }}>
        <Btn variant="primary" size="lg" onClick={() => setMode("compare")}>
          Open in Compare
          <ArrowRight size={15} />
        </Btn>
        <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}>{selectedName} applied to your roles</span>
      </div>

      {editingId && <DirectionEditor dirId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  );
}
