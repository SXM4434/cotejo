// Compare · the surface CANVAS — render a whole type SYSTEM on a real surface, and compare
// systems in context (doc §3/§4a · resolved 2026-06-23). A surface no longer auditions ONE
// role — it renders a SOURCE: your editable **Stack** (the live draft), your **Base**, or any
// saved **Direction**. View one (edit the Stack from the tray), tile several read-only, or
// onion two. "Pick the {role} font" was the Letterforms framing and has no place here.
import React from "react";
import ReactDOM from "react-dom";
import { useSession, FACES, dirFontForRole, dirTagFor, dirAnyTagFor, anchorForKind, type Dir, type Role } from "../../state/SessionContext";
import { Btn } from "../../components/Btn";
import { useViewport } from "../../state/ViewportContext";
import { resolveFieldsFonts, pickRoleFor } from "../../surfaces/resolve";
import { measureFont, cachedMetrics, deriveTune } from "../../lib/autofinetune";
import type { SurfaceReg } from "../../surfaces/registry";
import { VideoFrame } from "../../surfaces/videoChrome";
import { Check, ArrowRight, SwapH } from "../../components/icons";
import { popMotion } from "../../lib/popover";

// the surface being compared on flows down to every SourceSurface (which fields + which
// Component) without prop-drilling through every comparison mode.
const SurfaceCtx = React.createContext<SurfaceReg | null>(null);
const useSurface = (): SurfaceReg => {
  const s = React.useContext(SurfaceCtx);
  if (!s) throw new Error("SourceSurface used outside a SurfaceCanvas");
  return s;
};

const MONO = "var(--t-sans)";
const CAP_WEIGHT = 500; // same weight Compare measures at, so the surface reads the same cached metrics
const famOf = (fontId: string) => (FACES.find((f) => f.id === fontId) ?? FACES[0]).family;
const measureOf = (fontId: string) => (FACES.find((f) => f.id === fontId) ?? FACES[0]).measureFamily;
const labelOf = (fontId: string) => (FACES.find((f) => f.id === fontId) ?? FACES[0]).label;

// ensure metrics exist for a set of fonts (fills the synchronous cache the cap-match reads); a tick
// bumps as they resolve so the surface re-renders into its cap-matched sizes.
function useEnsureMetrics(measureFamilies: string[]) {
  const [, setTick] = React.useState(0);
  const sig = measureFamilies.join("|");
  React.useEffect(() => {
    let live = true;
    Promise.all(measureFamilies.map((mf) => measureFont(mf, { weight: CAP_WEIGHT }))).then(() => { if (live) setTick((t) => t + 1); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
}
const cap: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)" };
const num: React.CSSProperties = { fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)", fontVariantNumeric: "tabular-nums" };

// ── a SOURCE = a whole type system you can render the surface with ──
export type Source =
  | { key: "stack"; label: string }
  | { key: "base"; label: string }
  | { key: string; label: string; dir: Dir };

// every role's font, for a given source. Stack = your picks over base; base = the Set-Up
// system; a direction = its per-kind font map (nearest-anchor fallback for kinds it omits).
function fontForRoleOf(source: Source, winners: Record<string, string>): (r: Role) => string {
  if (source.key === "stack") return (r) => winners[r.id] ?? r.fontId;
  if (source.key === "base") return (r) => r.fontId;
  const dir = (source as { dir: Dir }).dir;
  return (r) => dirFontForRole(dir, r);
}

// the sources you can render/compare: your live Stack, your Base, and every saved Direction.
export function useSources() {
  const { directions } = useSession();
  const stack: Source = { key: "stack", label: "Your stack" };
  const base: Source = { key: "base", label: "Base" };
  const dirs: Source[] = directions.map((d) => ({ key: `dir:${d.id}`, label: d.name, dir: d }));
  const all = [stack, base, ...dirs];
  const byKey = (k: string) => all.find((s) => s.key === k) ?? stack;
  return { stack, base, dirs, all, byKey };
}

// downscale an uploaded image to a capped-width JPEG data URL — keeps localStorage sane and
// the render crisp (a 4000px photo behind a 600px surface is pure waste). Falls back to the
// raw object URL if the canvas path fails (works in-session, just won't persist as well).
function fileToDownscaledDataURL(file: File, maxW = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxW / img.naturalWidth);
      const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) { resolve(url); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { resolve(c.toDataURL("image/jpeg", 0.85)); } catch { resolve(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}

function SourceSurface({ source, editable = false, onFieldClick, opacity, absolute, frameless }: { source: Source; editable?: boolean; onFieldClick?: (fieldId: string, e: React.MouseEvent) => void; opacity?: number; absolute?: boolean; frameless?: boolean }) {
  const surface = useSurface();
  const { roles, scale, winners, surfaceContent, setSurfaceField, surfaceImages, setSurfaceImage, measure } = useSession();
  const { vw } = useViewport();
  const fontFor = fontForRoleOf(source, winners);
  // CAP-MATCH on the surface: every field's font is matched to its role's BASE font at the role's
  // anchor (display→cap, body→x-height), so the surface honors the tool's "one cap height" promise
  // instead of rendering raw role sizes. Measure both the reference + rendered fonts (fills the cache),
  // then cap-match reads it synchronously; until measured it's a clean 1× no-op.
  const needed = React.useMemo(() => {
    const set = new Set<string>();
    for (const f of surface.fields) { const role = pickRoleFor(roles, f.role); set.add(measureOf(role.fontId)); set.add(measureOf(fontFor(role))); }
    return [...set];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface.fields, roles, source.key, winners]);
  useEnsureMetrics(needed);
  const capMatch = (role: Role, fontId: string): number => {
    if (fontId === role.fontId) return 1;
    const ref = cachedMetrics(measureOf(role.fontId), CAP_WEIGHT);
    const cand = cachedMetrics(measureOf(fontId), CAP_WEIGHT);
    if (!ref || !cand) return 1;
    return deriveTune({ key: role.kind, anchor: anchorForKind(role.kind) }, ref, cand).size;
  };
  const fonts = resolveFieldsFonts(surface.fields, roles, scale, vw, famOf, undefined, fontFor, { capMatch, measureOf });
  // WORDS + images are the surface's own (shared across every source); FONTS come from the source.
  const content = surfaceContent[surface.id] ?? {};
  const images = surfaceImages[surface.id];
  const onImage = editable
    ? (slot: string, file: File) => { fileToDownscaledDataURL(file).then((d) => setSurfaceImage(surface.id, slot, d)).catch(() => {}); }
    : undefined;
  const wrap: React.CSSProperties = {};
  if (opacity != null) wrap.opacity = opacity;
  if (absolute) { wrap.position = "absolute"; wrap.inset = 0; }
  const Surface = surface.Component;
  return (
    <div style={wrap}>
      <Surface fonts={fonts} content={content} editable={editable}
        onEdit={editable ? (id, v) => setSurfaceField(surface.id, id, v) : undefined}
        onFieldClick={onFieldClick} images={images} onImage={onImage}
        frameless={frameless}
        measure={surface.measurable ? measure : undefined} />
    </div>
  );
}

// CLICK-TO-PICK-FONT — a transient popover at the click. Click any element on your Stack → pick a
// font for THAT element's role → it sets the role everywhere it appears (mix-and-match; your saved
// directions' fonts pin to the top, tagged). Pick a font from anywhere.
function InlineFontSwap({ surface, fieldId, x, y, onClose }: { surface: SurfaceReg; fieldId: string; x: number; y: number; onClose: () => void }) {
  const { roles, directions, pickWinner, winners } = useSession();
  const field = surface.fields.find((f) => f.id === fieldId);
  const role = field ? pickRoleFor(roles, field.role) : roles[0];
  const tag = dirTagFor(directions, role);        // tier 1 — this role's font from each direction
  const anyTag = dirAnyTagFor(directions);        // tier 2 — those directions' other-role fonts
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  const matches = FACES.filter((f) => f.label.toLowerCase().includes(q.trim().toLowerCase()));
  const roleHits = matches.filter((f) => tag(f.id));
  const roleSet = new Set(roleHits.map((f) => f.id));
  const anyHits = matches.filter((f) => !roleSet.has(f.id) && anyTag(f.id));
  const anySet = new Set(anyHits.map((f) => f.id));
  const rest = matches.filter((f) => !roleSet.has(f.id) && !anySet.has(f.id));
  const results = [...roleHits, ...anyHits, ...rest];
  const pinned = [...roleHits, ...anyHits];
  const current = winners[role.id];
  const left = Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 256);
  const top = Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 800) - 360);
  return ReactDOM.createPortal(
    <div ref={ref} className="t-pop" style={{ position: "fixed", top, left, width: 244, zIndex: 200, filter: "drop-shadow(0 14px 30px rgba(var(--t-scrim),0.18))", ...popMotion({ top, left }) }}>
      <div style={{ background: "rgba(255,255,255,0.98)", borderRadius: "var(--t-r-menu)", padding: 6, boxShadow: "inset 0 1px 0 0 var(--t-white-edge), inset 0 0 0 1px rgba(var(--t-scrim),0.05)" }}>
        <div style={{ ...cap, padding: "8px 10px 6px", color: "var(--t-ink-2)", display: "inline-flex", alignItems: "center", gap: 5 }}>{role.name} <span style={{ color: "var(--t-ink-3)", display: "inline-flex", alignItems: "center", gap: 4 }}><ArrowRight size={10} /> font for this role</span></div>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fonts…" aria-label="Search fonts" spellCheck={false}
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 14, padding: "2px 10px 8px", color: "var(--t-ink)", boxSizing: "border-box" }} />
        <div role="listbox" style={{ maxHeight: 260, overflowY: "auto" }}>
          {results.map((f, i) => {
            const t = roleSet.has(f.id) ? tag(f.id) : anySet.has(f.id) ? anyTag(f.id) : undefined;
            const headRole = i === 0 && roleHits.length > 0;
            const headAny = i === roleHits.length && anyHits.length > 0;
            const headAll = i === pinned.length && pinned.length > 0 && rest.length > 0;
            return (
              <React.Fragment key={f.id}>
                {headRole && <div style={{ ...cap, padding: "6px 10px 2px" }}>{role.name} · in your directions</div>}
                {headAny && <div style={{ ...cap, padding: "6px 10px 2px" }}>also in your directions</div>}
                {headAll && <div style={{ ...cap, padding: "6px 10px 2px", borderTop: "1px solid color-mix(in oklab, var(--t-ink) 8%, transparent)", marginTop: 2 }}>all fonts</div>}
                <button className="t-opt" role="option" aria-selected={f.id === current} onClick={() => { pickWinner(role.id, f.id); onClose(); }}>
                  <span style={{ fontFamily: f.family, fontSize: 15 }}>{f.label}</span>
                  <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontFamily: MONO, fontSize: 10, color: "var(--t-ink-3)" }}>
                    {t && <span>{t}</span>}{f.id === current && <span style={{ color: "var(--t-match)", display: "inline-flex" }}><Check size={11} /></span>}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SourceCaption({ source }: { source: Source }) {
  const { roles, winners } = useSession();
  if (source.key === "stack") {
    const picks = roles.filter((r) => winners[r.id]).length;
    return (
      <span style={{ display: "inline-flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
        <span style={cap}>your stack</span>
        <span style={num}>{picks ? `${picks} picked` : "all from base"}</span>
      </span>
    );
  }
  if (source.key === "base") return <span style={cap}>base · the reference</span>;
  const dir = (source as { dir: Dir }).dir;
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
      <span style={cap}>{dir.name}</span>
      <span style={num}>{labelOf(dir.fonts.display)} + {labelOf(dir.fonts.body)}</span>
    </span>
  );
}

// fit a full-size surface into a tile: render at a fixed natural width, scale to the tile —
// so several systems sit side by side with no overflow / no mid-word breaks.
const SURFACE_NATURAL_W = 600;
function ScaledSurface({ children }: { children: React.ReactNode }) {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [h, setH] = React.useState<number | undefined>(undefined);
  React.useLayoutEffect(() => {
    const measure = () => {
      const w = outerRef.current?.clientWidth ?? SURFACE_NATURAL_W;
      const s = Math.min(1, w / SURFACE_NATURAL_W);
      setScale(s);
      setH((innerRef.current?.offsetHeight ?? 0) * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
    // mount once — the ResizeObserver handles every subsequent size change (no per-render
    // re-subscribe). refs are stable; nothing else belongs in deps. (react-effects-discipline)
  }, []);
  return (
    <div ref={outerRef} style={{ height: h, overflow: "hidden" }}>
      <div ref={innerRef} style={{ width: SURFACE_NATURAL_W, transformOrigin: "top left", transform: scale !== 1 ? `scale(${scale})` : undefined }}>
        {children}
      </div>
    </div>
  );
}

// VIEW — render ONE source full-size. Two things you do on any surface, via one toggle:
//  · PICK FONT — click any element. On a saved Direction / Base you GRAB the font that element
//    is showing straight into your Stack (mix-and-match by clicking what you like in context).
//    On your own Stack you get the picker (choose any font for that role).
//  · EDIT TEXT — click any line, type. Words are the surface's own (shared across sources), so
//    this works in every source. One quiet line on top — no big header (doc §4c).
function ViewSource({ source, edit }: { source: Source; edit: "font" | "text" }) {
  const { contentNonce, roles, winners, pickWinner } = useSession();
  const surface = useSurface();
  const isStack = source.key === "stack";
  // the pick/edit toggle lives in the DOCK now (chrome) — this just reflects it. EDIT TEXT (click a
  // line/image on any source) and PICK FONT (click any element: on your Stack → pick a font for that
  // role; on a Direction/Base → GRAB the font it's showing into your stack) never fight.
  const textMode = edit === "text";
  const fontMode = edit === "font";
  const [swap, setSwap] = React.useState<{ fieldId: string; x: number; y: number } | null>(null);

  const onFieldClick = fontMode ? (fieldId: string, e: React.MouseEvent) => {
    const field = surface.fields.find((f) => f.id === fieldId);
    const role = field ? pickRoleFor(roles, field.role) : roles[0];
    if (isStack) { setSwap({ fieldId, x: e.clientX, y: e.clientY }); return; } // your stack → pick a font
    // a Direction/Base → GRAB the font this element shows into your stack (it appears in the tray)
    pickWinner(role.id, fontForRoleOf(source, winners)(role));
  } : undefined;

  // the canvas is PURE: just the surface. Caption / pick-edit / "needs a role" advisory / reset-text
  // all live in the dock (chrome) now. key on surface + reset-nonce so caret-safe fields reseed.
  return (
    <div>
      <SourceSurface key={`${surface.id}:${contentNonce}`} source={source} editable={textMode} onFieldClick={onFieldClick} />
      {swap && <InlineFontSwap surface={surface} fieldId={swap.fieldId} x={swap.x} y={swap.y} onClose={() => setSwap(null)} />}
    </div>
  );
}

// SIDE BY SIDE — tile every system (stack + base + saved directions), read-only, scaled to fit.
function TileSources({ sources }: { sources: Source[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px,100%),1fr))", gap: 32 }}>
      {sources.map((s) => (
        <section key={s.key} className="t-dir" style={{ minWidth: 0, overflow: "hidden", padding: "24px 28px" }}>
          <div style={{ marginBottom: 16 }}><SourceCaption source={s} /></div>
          <ScaledSurface><SourceSurface source={s} /></ScaledSurface>
        </section>
      ))}
    </div>
  );
}

// click-to-register helpers — ported from the lab's OverlayStage anchor-lock. Capture the
// DOM path to a clicked element so the SAME element can be found in the other overlay layer.
const pathTo = (root: Element, el: Element): number[] => {
  const path: number[] = [];
  let cur: Element = el;
  while (cur !== root && cur.parentElement) {
    const parent = cur.parentElement;
    path.unshift(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return path;
};
const resolvePath = (root: Element, path: number[]): Element | null => {
  let cur: Element | null = root;
  for (const i of path) { cur = cur?.children[i] ?? null; if (!cur) return null; }
  return cur;
};

// the shared video frame for a framed onion: ONE frame (border + REC/timecode) that both type-only
// layers crossfade over — so the chrome is drawn once and the two systems trade inside one frame.
function FrameGround({ children }: { children: React.ReactNode }) {
  return <VideoFrame>{children}</VideoFrame>;
}

// ONION — A pinned vs B, opacity crossfades (0 = all A · 100 = all B). Registration = the
// lab's anchor-lock: CLICK any element → resolve the same element in both layers → translate
// B so it registers (handles long-page reflow drift). Smooth snap + "aligned to …" readout.
function Onion({ a, b, fade }: { a: Source; b: Source | undefined; fade: number }) {
  const surface = useSurface();
  const aRef = React.useRef<HTMLDivElement>(null);
  const bRef = React.useRef<HTMLDivElement>(null);
  const [anchorPath, setAnchorPath] = React.useState<number[] | null>(null);
  const [shift, setShift] = React.useState(0);
  const [anchorText, setAnchorText] = React.useState("");
  // a `vs` change REMOUNTS this component (keyed on b.key in SurfaceCanvas), so all state
  // resets for free — no reset-on-prop Effect (react-effects-discipline H1).

  React.useLayoutEffect(() => {
    const aRoot = aRef.current, bRoot = bRef.current;
    if (!aRoot || !bRoot || !anchorPath) return;
    const aEl = resolvePath(aRoot, anchorPath) as HTMLElement | null;
    const bEl = resolvePath(bRoot, anchorPath) as HTMLElement | null;
    if (!aEl || !bEl) { setShift(0); setAnchorText(""); return; }
    // offsetTop is the UN-transformed layout position (ignores B's translateY) measured from
    // the shared relative wrapper — so registration never depends on the shift already applied
    // (no self-referential shiftRef). re-registers when the anchor or the A source changes.
    const delta = aEl.offsetTop - bEl.offsetTop;
    setShift(delta);
    setAnchorText((aEl.textContent || "").trim().slice(0, 28));
    aEl.style.outline = "1.5px solid var(--t-anchor)";
    aEl.style.outlineOffset = "4px";
    return () => { aEl.style.outline = ""; aEl.style.outlineOffset = ""; };
  }, [anchorPath, a.key]);

  if (!b) return <p style={num}>Pick a second system in the dock to overlay against “{a.label}”.</p>;

  const onClick = (e: React.MouseEvent) => {
    const aRoot = aRef.current;
    if (!aRoot) return;
    const target = e.target as Element;
    if (aRoot.contains(target)) setAnchorPath(pathTo(aRoot, target));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, minHeight: 22, flexWrap: "wrap" }}>
        <span style={{ ...num, display: "inline-flex", alignItems: "center", gap: 6 }}>{a.label} <span style={{ opacity: 0.5, display: "inline-flex" }}><SwapH size={12} /></span> {b.label}</span>
        {anchorPath ? (
          <>
            <span style={{ ...num, color: "var(--t-anchor)" }}>aligned to “{anchorText}”</span>
            <Btn variant="ghost" size="sm" mono onClick={() => setAnchorPath(null)}>reset</Btn>
          </>
        ) : (
          <span style={{ ...num, opacity: 0.7 }}>click any line to align the overlay there</span>
        )}
      </div>
      <div style={{ position: "relative", cursor: "crosshair", userSelect: "none" }} onClick={onClick}>
        {surface.framed ? (
          // FRAMED (video): paint the dark frame ONCE; both layers render type-only (frameless) and
          // crossfade over it — two opaque frames would occlude each other, not superimpose the type.
          <FrameGround>
            <div ref={aRef} style={{ position: "absolute", inset: 0, opacity: 1 - fade / 100 }}><SourceSurface source={a} frameless /></div>
            <div ref={bRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: fade / 100, transform: shift ? `translateY(${shift}px)` : undefined, transition: "transform 240ms cubic-bezier(0.2,0,0,1)" }}><SourceSurface source={b} frameless /></div>
          </FrameGround>
        ) : (
          <>
            <div ref={aRef}><SourceSurface source={a} opacity={1 - fade / 100} /></div>
            <div ref={bRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: fade / 100, transform: shift ? `translateY(${shift}px)` : undefined, transition: "transform 240ms cubic-bezier(0.2,0,0,1)" }}>
              <SourceSurface source={b} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export type CmpMode = "view" | "tile" | "onion";

// the surface canvas — pure render driven by the dock's selections. `showKey`/`vsKey` name
// which SOURCE (stack / base / dir:<id>) renders + overlays. Kept deliberately bare — the
// surface IS the content; chrome lives in the dock + one quiet line above (no big header).
export function SurfaceCanvas({ surface, mode, showKey, vsKey, fade, edit }: { surface: SurfaceReg; mode: CmpMode; showKey: string; vsKey: string; fade: number; edit: "font" | "text" }) {
  const { all, byKey } = useSources();
  const show = byKey(showKey);
  const b = all.find((s) => s.key === vsKey && s.key !== show.key) ?? all.find((s) => s.key !== show.key);
  return (
    <SurfaceCtx.Provider value={surface}>
      {/* key on mode → the wrapper remounts on each switch, replaying the quick fade/rise so the
          View ↔ Side-by-side ↔ Onion layout swap reads buttery instead of as a hard jolt. */}
      <div key={mode} className="cmp-mode-in">
        {mode === "view" && <ViewSource source={show} edit={edit} />}
        {mode === "tile" && <TileSources sources={all} />}
        {mode === "onion" && <Onion key={b?.key ?? "none"} a={show} b={b} fade={fade} />}
      </div>
    </SurfaceCtx.Provider>
  );
}
