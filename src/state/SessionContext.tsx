// Shared comparison SESSION — the fixed comparison FRAME (per docs/type-tool/
// 03-ia-and-modes §1). The frame = a user-defined set of ROLES (Display / Body /
// Caption / Mono …), each with a base font + a size on a modular SCALE, plus the
// sample text. Set Up defines this frame.
//
// Compare and Tune today audition ONE pairing — the FOCUS role's base font vs a
// candidate. So this context also exposes a derived single-pairing view
// (base/cand/baseId/candId/setBaseId/setCandId) so those modes keep working
// unchanged while the frame underneath is now roles-based.
import React from "react";
import { gfId, gfById, gfFallback, loadGoogleCss, type GFCategory, type GFLicense } from "../data/googleFonts";
import { classifyCategory } from "../lib/fontClassify";
import { gfLicenseFor } from "../data/googleFontsAll";
import { GOOGLE_FONTS_ALL } from "../data/googleFontsAll";

// recover a Google font from its `gf-…` id across the FULL directory (not just the curated 50), so a
// shared/loaded session that references any of the 1,936 browsable families restores instead of
// silently falling back to Unbounded (A-H6). The id encodes the family slug.
const gfByIdAny = (id: string) => gfById(id) ?? GOOGLE_FONTS_ALL.find((g) => gfId(g.family) === id);

// A Face carries FOUR name-like things that the 5 built-ins happened to make agree — which hid a
// whole class of bugs for every Google/uploaded font. They are now explicit:
//   · label        — what the human reads ("Mona Sans")
//   · family       — the CSS font stack to RENDER ("'Mona Sans Variable', sans-serif")
//   · measureFamily — the bare registered-family token to MEASURE ("Mona Sans Variable" / "CotejoUser1").
//                     Measuring the label instead silently fell back to a system font (cap-match lied).
//   · cat          — the font CLASS, so the recommender + fallbacks can reason about it.
// `name` is retained as an alias of the measure token for back-compat with old call sites.
// LICENSE (uploads only) — the user's OWN determination, recorded as an attributable, dated record;
// Cotejo never asserts an upload's license. `cleared` = they confirm it ships · `trial` = an eval/
// trial font that must NOT go to production (so a date can't launder it). `licBy` (who attested) +
// `licNote` (foundry / license / order # / seat) make the clearance defensible at a client handoff.
export type LicStatus = "cleared" | "trial"; // undefined = unverified (the default "verify" nag)
export type Face = { id: string; name: string; family: string; label: string; cat: GFCategory; measureFamily: string; user?: boolean;
  licStatus?: LicStatus; clearedAt?: string; licBy?: string; licNote?: string;
  // Google fonts carry their open-source license id (OFL/Apache/UFL) from Google's metadata, so a
  // user never has to re-confirm each one themselves. Built-ins are OFL. Undefined for uploads.
  gfLicense?: GFLicense };

// the registered-family token used to MEASURE + ensure-load a face. Built-ins/Google measure by their
// real family; uploads measure by their CotejoUserN token (never the label). One helper, used everywhere
// metrics are taken, so the name/family conflation can never come back.
export const measureFamilyOf = (f: Face) => f.measureFamily;

const BUILTIN_FACES: Face[] = [
  // all five are SIL OFL (GitHub's Mona/Hubot, Unbounded, Anybody, Newsreader) → free for commercial use.
  { id: "unbounded", name: "Unbounded Variable", measureFamily: "Unbounded Variable", cat: "display", family: "'Unbounded Variable', sans-serif", label: "Unbounded", gfLicense: "ofl" },
  { id: "anybody", name: "Anybody Variable", measureFamily: "Anybody Variable", cat: "sans", family: "'Anybody Variable', sans-serif", label: "Anybody", gfLicense: "ofl" },
  { id: "hubot", name: "Hubot Sans Variable", measureFamily: "Hubot Sans Variable", cat: "sans", family: "'Hubot Sans Variable', sans-serif", label: "Hubot Sans", gfLicense: "ofl" },
  { id: "mona", name: "Mona Sans Variable", measureFamily: "Mona Sans Variable", cat: "sans", family: "'Mona Sans Variable', sans-serif", label: "Mona Sans", gfLicense: "ofl" },
  { id: "newsreader", name: "Newsreader", measureFamily: "Newsreader", cat: "serif", family: "'Newsreader', serif", label: "Newsreader", gfLicense: "ofl" },
];
// FACES is a LIVE registry (BYO fonts §8 append to it). Named imports are live bindings, so every
// importer sees new faces on its next render; a fontsVersion bump in the session forces that render.
export let FACES: Face[] = [...BUILTIN_FACES];

// ── BYO FONTS — upload woff2/otf/ttf, registered via FontFace + persisted (base64) as a GLOBAL
// catalog (not per-session). Built-ins + user fonts share one registry. ──
const FONTS_KEY = "cotejo.fonts.v1";
type StoredFont = { id: string; family: string; label: string; b64: string; cat?: GFCategory;
  licStatus?: LicStatus; clearedAt?: string; licBy?: string; licNote?: string;
  cleared?: boolean /* legacy — migrated to licStatus on load */ };
type LicRec = { licStatus?: LicStatus; clearedAt?: string; licBy?: string; licNote?: string };
let _uface = 0;
// live FontFace handles per user-font id, so removeUserFont can actually evict them from document.fonts
// (otherwise they leak for the session). Keyed by Face id.
const USER_FONTFACES = new Map<string, FontFace>();
const abToB64 = (buf: ArrayBuffer) => { const bytes = new Uint8Array(buf); let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); };
const b64ToAb = (b64: string) => { const s = atob(b64); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.buffer; };
// MEASURE token = the registered `family` (CotejoUserN), NEVER the label; render fallback follows the
// font's real class (`cat`), not a hardcoded sans-serif (a serif upload used to fall back to sans).
const userFace = (id: string, family: string, label: string, cat: GFCategory = "sans", lic: LicRec = {}): Face => ({ id, name: family, measureFamily: family, cat, family: `'${family}', ${gfFallback(cat)}`, label, user: true, ...lic });
const loadStoredFonts = (): StoredFont[] => {
  if (typeof window === "undefined") return [];
  try { const raw = window.localStorage.getItem(FONTS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
// at module load: register persisted user fonts (sync FACES entry; the binary loads async)
(() => {
  if (typeof window === "undefined") return;
  for (const u of loadStoredFonts()) {
    // migrate legacy `cleared:true` → licStatus:'cleared'; carry the record fields forward
    const lic: LicRec = { licStatus: u.licStatus ?? (u.cleared ? "cleared" : undefined), clearedAt: u.clearedAt, licBy: u.licBy, licNote: u.licNote };
    FACES = [...FACES, userFace(u.id, u.family, u.label, u.cat, lic)];
    _uface = Math.max(_uface, Number((u.id.match(/(\d+)$/) || [])[1] || 0));
    try { const ff = new FontFace(u.family, b64ToAb(u.b64)); USER_FONTFACES.set(u.id, ff); ff.load().then(() => document.fonts.add(ff)).catch(() => {}); } catch { /* bad data */ }
  }
})();

// ── GOOGLE FONTS (catalog source) — added families persist by NAME (cheap); re-registered on load
// by injecting the CSS2 link. They join the same FACES registry as built-ins + BYO. ──
const GF_KEY = "cotejo.gfonts.v1";
type StoredGFont = { id: string; family: string; category: GFCategory; license?: GFLicense };
const loadStoredGFonts = (): StoredGFont[] => {
  if (typeof window === "undefined") return [];
  try { const raw = window.localStorage.getItem(GF_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const gFace = (id: string, family: string, category: GFCategory, license?: GFLicense): Face => ({ id, name: family, measureFamily: family, cat: category, family: `'${family}', ${gfFallback(category)}`, label: family, user: true, gfLicense: license });
(() => {
  if (typeof window === "undefined") return;
  for (const g of loadStoredGFonts()) {
    if (FACES.some((f) => f.id === g.id)) continue;
    FACES = [...FACES, gFace(g.id, g.family, g.category, g.license)];
    loadGoogleCss(g.family);
  }
})();

// ── ROLE KINDS — the canonical role taxonomy ──
// A role = a slot in the type system; its KIND is its canonical identity. SURFACES target a
// kind (a field asks for "caption"/"quote"/…); the user's role of that kind fills it. Step =
// size position on the modular scale. Same step can be two kinds (Caption vs Label at -1;
// Body vs Mono at 0) — so KIND, not step, is the key. Mirrors ROLE_PRESETS.
export type RoleKind = "display" | "heading" | "subheading" | "body" | "caption" | "label" | "quote" | "mono";
// canonical step per kind — the nearest-SIZE fallback when a role of that kind isn't defined.
export const KIND_STEP: Record<RoleKind, number> = {
  display: 5, heading: 3, subheading: 2, quote: 1, body: 0, mono: 0, caption: -1, label: -1,
};
// cap-match ANCHOR per role kind (B7). Big/display registers are read by their CAPS → anchor on
// cap-height. Running-text registers (body/caption/label/mono/quote) are read by their x-height →
// anchor on the cap+x blend, or a low-x serif body matched purely on cap reads too small to compare fairly.
export const anchorForKind = (kind: RoleKind): "cap" | "cap-x" => (KIND_STEP[kind] >= 2 ? "cap" : "cap-x");

// A DIRECTION is a saved whole-system bundle: a font for EVERY role (keyed by kind). `fonts`
// always defines the two anchors (display + body); any other kind it sets overrides per-kind,
// and kinds it omits fall back to the nearest anchor. So a 6-role stack saves all 6 — no more
// "display + text only". Library lives in the SESSION so Directions (shelf) + Compare (bench)
// share ONE source of truth (docs/type-tool/09 §3).
export type DirFonts = Partial<Record<RoleKind, string>> & { display: string; body: string };
export type Dir = { id: string; name: string; vibe: string; fonts: DirFonts; custom?: boolean };
export const DIR_STARTERS: Dir[] = [
  { id: "Builder",    name: "Builder",    vibe: "geometric · kinetic", fonts: { display: "unbounded", heading: "unbounded", subheading: "mona", body: "mona", caption: "mona", label: "hubot", quote: "anybody", mono: "hubot" } },
  { id: "Editorial",  name: "Editorial",  vibe: "literary · warm",     fonts: { display: "newsreader", heading: "newsreader", subheading: "hubot", body: "hubot", caption: "hubot", label: "mona", quote: "newsreader", mono: "mona" } },
  { id: "Expressive", name: "Expressive", vibe: "variable · playful",  fonts: { display: "anybody", heading: "anybody", subheading: "mona", body: "mona", caption: "mona", label: "unbounded", quote: "newsreader", mono: "hubot" } },
  { id: "Workhorse",  name: "Workhorse",  vibe: "clean · neutral",     fonts: { display: "hubot", heading: "hubot", subheading: "mona", body: "mona", caption: "mona", label: "mona", quote: "hubot", mono: "mona" } },
];
// which font a direction assigns to a role: its exact kind if set, else the nearest anchor
// (big roles → display · the rest → body). Mirrors the resolve.ts fallback.
export const dirFontForRole = (d: Dir, role: { kind: RoleKind; step: number }) =>
  d.fonts[role.kind] ?? (role.step >= 2 ? d.fonts.display : d.fonts.body);

// ROLE-AWARE font-picker tag (doc §6): when picking a font for a role, surface the directions
// that use a font FOR THIS ROLE, tagged by direction name ("Newsreader · Editorial") — so the
// stack tray's per-role picker offers one-click mix-and-match from any direction. Returns
// undefined for fonts no direction uses for this role.
export function dirTagFor(directions: Dir[], role: { kind: RoleKind; step: number }): (fontId: string) => string | undefined {
  return (fontId: string) => {
    const using = directions.filter((d) => dirFontForRole(d, role) === fontId);
    if (!using.length) return undefined;
    return using.length === 1 ? using[0].name : `${using.length} directions`;
  };
}

// the SECOND tier of a role-specific picker: a font a direction uses for SOME OTHER role (not
// the one you're picking for). Tier 1 = dirTagFor (this role's font from each direction); tier
// 2 = dirAnyTagFor (the rest of those directions' fonts); tier 3 = everything else. Returns the
// direction name(s) any of whose stacks include this font for any role.
export function dirAnyTagFor(directions: Dir[]): (fontId: string) => string | undefined {
  return (fontId: string) => {
    const using = directions.filter((d) => Object.values(d.fonts).includes(fontId));
    if (!using.length) return undefined;
    return using.length === 1 ? using[0].name : `${using.length} directions`;
  };
}

// `features` = OpenType tags this role ships in production (font-feature-settings), set in Set Up;
// every surface that uses the role renders them. Empty/undefined = the font's defaults.
// lineHeight (unitless) · tracking (em) · weight (numeric) are OPTIONAL resolved values Tune writes
// back into the role ("apply tune to role") so the calibration leaves the bench and ships — they flow
// into the structured export (lib/exportTokens) and any surface that honors them. Unset = system default.
export type Role = { id: string; name: string; fontId: string; step: number; kind: RoleKind; sizeOverride?: number; lineHeight?: number; tracking?: number; weight?: number; custom?: boolean; features?: string[] };
// a saved Tune calibration (deltas the user dialed in Tune mode), persisted per base+candidate pairing.
export type TuneDelta = { sizeMul: number; lhMul: number; track: number; wght: number; anchor: "cap" | "cap-x" };
export const tuneKey = (baseId: string, candId: string) => `${baseId}:${candId}`;

// A scale is FIXED by default (one `base` px). When `fluid`, the base becomes a RANGE —
// `baseMobile` px at the mobile viewport → `base` px at the desktop viewport — and every
// scale-driven role interpolates between the two (a clamp()). Hand-set roles (sizeOverride)
// stay fixed even when the scale is fluid.
export type Scale = { base: number; ratio: number; fluid?: boolean; baseMobile?: number };

// The two clamp anchors — the viewports the fluid ends are pinned to.
export const VP_MIN = 390;   // mobile end
export const VP_MAX = 1280;  // desktop end
export const VIEWPORTS: { id: string; label: string; w: number }[] = [
  { id: "mobile", label: "Mobile", w: 390 },
  { id: "tablet", label: "Tablet", w: 768 },
  { id: "desktop", label: "Desktop", w: 1280 },
];

const clampSize = (n: number) => Math.max(8, Math.min(400, Math.round(n)));

// the scale's base size AT a viewport width — fluid → linear interp clamped to the ends.
export function baseAt(s: Scale, vw: number): number {
  if (!s.fluid || s.baseMobile == null) return s.base;
  const t = (vw - VP_MIN) / (VP_MAX - VP_MIN);
  const v = s.baseMobile + (s.base - s.baseMobile) * t;
  const lo = Math.min(s.baseMobile, s.base), hi = Math.max(s.baseMobile, s.base);
  return Math.min(hi, Math.max(lo, v));
}

// Typical roles offered as one-click adds; users can rename any to a custom role.
// step = position on the modular scale relative to Body (0).
export const ROLE_PRESETS: { name: string; step: number; kind: RoleKind }[] = [
  { name: "Display", step: 5, kind: "display" },
  { name: "Heading", step: 3, kind: "heading" },
  { name: "Subheading", step: 2, kind: "subheading" },
  { name: "Body", step: 0, kind: "body" },
  { name: "Caption", step: -1, kind: "caption" },
  { name: "Label", step: -1, kind: "label" },
  { name: "Mono", step: 0, kind: "mono" },
  { name: "Quote", step: 1, kind: "quote" },
];
// the registers you can add, in order — one ROLE per KIND (the kind IS the role). Derived from
// the presets so there's a single source of truth.
export const KIND_ORDER: RoleKind[] = ROLE_PRESETS.map((p) => p.kind);

// one role per KIND is the contract — kind maps roles → surfaces (pickRoleFor) → direction
// fonts (dirFontForRole); two roles of one kind are ambiguous (first-match wins, dupes in the
// tray). Keep the FIRST of each kind, drop later repeats. Used on hydrate to heal old sessions.
export const dedupeRolesByKind = (rs: Role[]): Role[] => {
  const seen = new Set<RoleKind>();
  return rs.filter((r) => (seen.has(r.kind) ? false : (seen.add(r.kind), true)));
};

// ONBOARDING PRESETS — start a whole setup in ONE click (roles + each role's font + a scale tuned
// to the use-case). A preset SEEDS Set Up; you tweak from there. Fonts drawn from the catalog; each
// role's kind is unique (the one-per-kind contract). <90s from blank to a real type system.
export type Preset = { id: string; name: string; blurb: string; scale: Scale; roles: { name: string; kind: RoleKind; step: number; fontId: string }[] };
export const PRESETS: Preset[] = [
  { id: "marketing", name: "Marketing", blurb: "Bold display, clean body", scale: { base: 16, ratio: 1.333 }, roles: [
    { name: "Display", kind: "display", step: 5, fontId: "unbounded" },
    { name: "Heading", kind: "heading", step: 3, fontId: "hubot" },
    { name: "Body", kind: "body", step: 0, fontId: "mona" },
    { name: "Caption", kind: "caption", step: -1, fontId: "mona" },
  ] },
  { id: "product", name: "Product UI", blurb: "Tight, legible, functional", scale: { base: 15, ratio: 1.25 }, roles: [
    { name: "Heading", kind: "heading", step: 3, fontId: "hubot" },
    { name: "Subheading", kind: "subheading", step: 2, fontId: "hubot" },
    { name: "Body", kind: "body", step: 0, fontId: "mona" },
    { name: "Label", kind: "label", step: -1, fontId: "mona" },
    { name: "Caption", kind: "caption", step: -1, fontId: "mona" },
  ] },
  { id: "editorial", name: "Editorial", blurb: "Serif voice, long-form", scale: { base: 18, ratio: 1.414 }, roles: [
    { name: "Display", kind: "display", step: 5, fontId: "newsreader" },
    { name: "Heading", kind: "heading", step: 3, fontId: "newsreader" },
    { name: "Body", kind: "body", step: 0, fontId: "hubot" },
    { name: "Quote", kind: "quote", step: 1, fontId: "newsreader" },
    { name: "Caption", kind: "caption", step: -1, fontId: "hubot" },
  ] },
  { id: "portfolio", name: "Portfolio", blurb: "Expressive display + mono", scale: { base: 16, ratio: 1.5 }, roles: [
    { name: "Display", kind: "display", step: 5, fontId: "anybody" },
    { name: "Body", kind: "body", step: 0, fontId: "mona" },
    { name: "Caption", kind: "caption", step: -1, fontId: "mona" },
    { name: "Mono", kind: "mono", step: 0, fontId: "hubot" },
  ] },
  { id: "blank", name: "Blank", blurb: "Just display + body", scale: { base: 16, ratio: 1.333 }, roles: [
    { name: "Display", kind: "display", step: 5, fontId: "unbounded" },
    { name: "Body", kind: "body", step: 0, fontId: "mona" },
  ] },
];

export function roleSize(r: Role, s: Scale): number {
  // clamp so an extreme scale (big base × golden ratio at a high step) can't explode
  // the layout, and a tiny base can't collapse it. This is the DESKTOP/max size
  // (fluid scales pin `base` to the desktop end), so it stays the stable reference.
  return clampSize(r.sizeOverride ?? s.base * Math.pow(s.ratio, r.step));
}

// a role's size AT a given viewport. Hand-set override → always fixed; otherwise it
// follows the (possibly fluid) scale. This is the honest "what px is it right here".
export function sizeAtViewport(r: Role, s: Scale, vw: number): number {
  if (r.sizeOverride != null) return clampSize(r.sizeOverride);
  return clampSize(baseAt(s, vw) * Math.pow(s.ratio, r.step));
}

// a role's fluid range (mobile→desktop px), or null if it's fixed (override or non-fluid).
export function roleRange(r: Role, s: Scale): { min: number; max: number } | null {
  if (r.sizeOverride != null || !s.fluid || s.baseMobile == null) return null;
  return { min: sizeAtViewport(r, s, VP_MIN), max: sizeAtViewport(r, s, VP_MAX) };
}

// rem helpers — root assumed 16px (browser default). rem is the accessible unit for
// the COPYABLE deliverable (respects the user's font-size); px is what actually renders,
// so the UI shows both.
export const REM_ROOT = 16;
export const pxToRem = (px: number) => +(px / REM_ROOT).toFixed(3);

// the copyable CSS for a role: a clamp() when fluid, a plain size when fixed. The output
// IS the deliverable. Defaults to REM (accessible best practice); pass "px" for px.
export function roleClampCss(r: Role, s: Scale, unit: "rem" | "px" = "rem"): string {
  const rng = roleRange(r, s);
  const u = (px: number) => (unit === "rem" ? `${pxToRem(px)}rem` : `${px}px`);
  if (!rng) return u(sizeAtViewport(r, s, VP_MAX));
  const slope = (rng.max - rng.min) / (VP_MAX - VP_MIN);
  const yPx = rng.min - slope * VP_MIN;
  const yUnit = unit === "rem" ? `${pxToRem(yPx)}rem` : `${yPx.toFixed(2)}px`;
  return `clamp(${u(rng.min)}, ${yUnit} + ${(slope * 100).toFixed(3)}vw, ${u(rng.max)})`;
}

let _rid = 0;
const rid = () => `role-${++_rid}`;
let _did = 0;
const did = () => `dir-${++_did}`;

// ── PERSISTENCE (localStorage) — protect the work across refreshes (BUILD-LIST §2,
// foundational). Stores only the WORK (roles · scale · text · candidate pool · picks ·
// user directions · focus role); ephemeral UI state stays in memory. No backend. ──
// PER-SESSION keys (Workspace · BUILD-LIST §3) — each named session's WORK + IMAGES live under
// their own key, so the workspace can hold many. "v1" stays the default → the original single-key
// behaviour is preserved for any standalone use. Images kept SEPARATE (big) so a quota fail can't
// break the work persist.
export const workKeyFor = (id: string) => `cotejo.session.${id}`;
export const imgKeyFor = (id: string) => `cotejo.images.${id}`;
function loadImages(key: string): Record<string, Record<string, string>> {
  if (typeof window === "undefined") return {};
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
type Persisted = {
  roles: Role[]; scale: Scale; text: string; candidateIds: string[];
  winners: Record<string, string>; userDirs: Dir[]; focusRoleId: string;
  surfaceContent: Record<string, Record<string, string>>;
  tunes: Record<string, TuneDelta>; measure: number;
};
function loadPersisted(key: string): Partial<Persisted> | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as Partial<Persisted>) : null; } catch { return null; }
}
// seed an id counter past the max numeric suffix already in use, so freshly-minted ids
// (role-N / dir-N) never collide with hydrated ones.
function seedCounter(ids: string[], prefix: string): number {
  let max = 0;
  for (const id of ids) { const m = id.match(new RegExp(`^${prefix}(\\d+)$`)); if (m) max = Math.max(max, Number(m[1])); }
  return max;
}

// migrate persisted state from the pre-taxonomy shape (roles without `kind`, directions with
// displayId/textId) up to the role-kind model — so existing localStorage doesn't break.
function inferKind(step: number): RoleKind {
  if (step >= 5) return "display";
  if (step >= 3) return "heading";
  if (step >= 2) return "subheading";
  if (step >= 1) return "quote";
  if (step <= -1) return "caption";
  return "body";
}
function migrateRole(r: Role & { kind?: RoleKind }): Role {
  return r.kind ? r : { ...r, kind: inferKind(r.step) };
}
function migrateDir(d: Dir & { displayId?: string; textId?: string }): Dir {
  if (d.fonts) return d;
  return { id: d.id, name: d.name, vibe: d.vibe ?? "", fonts: { display: d.displayId ?? "unbounded", body: d.textId ?? "mona" }, custom: d.custom };
}

type Ctx = {
  // the frame
  roles: Role[]; scale: Scale; text: string; candidateId: string; focusRoleId: string;
  // the candidate POOL — every font being auditioned (Compare renders them all,
  // cap-matched). candidateId stays = the primary (candidateIds[0]) for Tune's single pairing.
  candidateIds: string[]; addCandidate: (id: string) => void; removeCandidate: (id: string) => void;
  replaceCandidate: (oldId: string, newId: string) => void;
  // the DECISION = your STACK — the chosen font per role (the loop's final "decide" step).
  // roleId → fontId. setWinner TOGGLES (Letterforms "use for {role}": click the picked one to clear).
  // pickWinner SETS (replace — the stack tray + in-surface swap, mix-and-match any role).
  // clearWinner drops a role back to base; loadStack forks a whole direction into the stack.
  winners: Record<string, string>; setWinner: (roleId: string, fontId: string) => void;
  pickWinner: (roleId: string, fontId: string) => void; clearWinner: (roleId: string) => void;
  loadStack: (map: Record<string, string>) => void;
  // EDIT CONTENT (#5) — YOUR words per surface field, keyed surfaceId → fieldId → text. Unset
  // fields fall back to the surface's placeholder. Shown on every render; editable only on the
  // Stack. Persisted with the rest of the work. contentNonce bumps on reset → remounts fields.
  surfaceContent: Record<string, Record<string, string>>;
  setSurfaceField: (surfaceId: string, fieldId: string, value: string) => void;
  resetSurfaceContent: (surfaceId: string) => void; contentNonce: number;
  // EDIT CONTENT · images — your uploaded image per surface slot (surfaceId → slotId → dataURL,
  // downscaled). Persisted in a SEPARATE localStorage key (big), so a quota fail can't clobber the work.
  surfaceImages: Record<string, Record<string, string>>;
  setSurfaceImage: (surfaceId: string, slot: string, dataUrl: string) => void;
  clearSurfaceImage: (surfaceId: string, slot: string) => void;
  setScale: (s: Scale) => void; setText: (v: string) => void;
  // MEASURE — characters per line for running body on the reading surfaces (Article / Editorial).
  measure: number; setMeasure: (n: number) => void;
  setCandidateId: (v: string) => void; setFocusRoleId: (id: string) => void;
  addRole: (preset?: { name: string; step: number; kind: RoleKind }) => void;
  removeRole: (id: string) => void;
  updateRole: (id: string, patch: Partial<Role>) => void;
  // apply a whole direction to the base roles: each role gets the direction's font for its kind
  applyDirection: (d: Dir) => void;
  applyPreset: (p: Preset) => void;
  // undo for the destructive bulk applies (preset / direction). undo = the snapshot to offer, or null.
  undo: { label: string } | null; undoBulk: () => void; clearUndo: () => void;
  fontsVersion: number;
  addUserFont: (file: File, cat?: GFCategory) => Promise<{ ok: boolean; reason?: string; id?: string }>;
  addGoogleFont: (family: string, category: GFCategory) => void;
  removeUserFont: (id: string) => void;
  // LICENSE — mark/un-mark an upload as cleared-to-ship (the user's own determination; persisted).
  markFontCleared: (id: string, cleared: boolean) => void;
  // LICENSE (richer) — set status (cleared / trial-eval / unverified) + optional attribution (who + note).
  setFontLicense: (id: string, patch: { status?: LicStatus | null; by?: string; note?: string }) => void;
  // TUNE persistence — a calibration belongs to a base+candidate PAIRING, so switching the focus role
  // (or mode, or reloading) no longer wipes the dials. `tuneKey(baseId,candId)` is the key.
  tunes: Record<string, TuneDelta>; setTune: (baseId: string, candId: string, delta: TuneDelta | null) => void;
  // the saved-direction LIBRARY (starters + user). Directions mode (shelf) + Compare
  // (bench) share it; Compare pulls a direction in to judge it on a surface (doc §3).
  directions: Dir[];
  addDirection: (d: Omit<Dir, "id">) => string;
  updateDirection: (id: string, patch: Partial<Dir>) => void;
  removeDirection: (id: string) => void;
  // DECIDE → assemble the ★ picks (winners) into a new saved Direction (doc §5).
  assembleDirection: (name: string) => string;
  // derived single-pairing view (keeps Compare + Tune working)
  base: Face; cand: Face; baseId: string; candId: string; baseSize: number;
  setBaseId: (v: string) => void; setCandId: (v: string) => void;
};
const SessionCtx = React.createContext<Ctx | null>(null);

export function SessionProvider({ children, sessionId = "v1" }: { children: React.ReactNode; sessionId?: string }) {
  // this session's own storage keys (Workspace). Keyed remount on sessionId re-runs hydration.
  const workKey = workKeyFor(sessionId);
  const imgKey = imgKeyFor(sessionId);
  // hydrate ONCE from localStorage; seed id counters so new ids don't clash with stored ones
  const initRef = React.useRef<Partial<Persisted> | null | undefined>(undefined);
  if (initRef.current === undefined) {
    initRef.current = loadPersisted(workKey);
    const p = initRef.current;
    if (p?.roles) { p.roles = p.roles.map(migrateRole); _rid = Math.max(_rid, seedCounter(p.roles.map((r) => r.id), "role-")); }
    if (p?.userDirs) { p.userDirs = p.userDirs.map(migrateDir); _did = Math.max(_did, seedCounter(p.userDirs.map((d) => d.id), "dir-")); }
  }
  const init = initRef.current;

  const [scale, setScale] = React.useState<Scale>(() => init?.scale ?? { base: 16, ratio: 1.333 });
  const [roles, setRoles] = React.useState<Role[]>(() => (init?.roles ? dedupeRolesByKind(init.roles) : [
    { id: "role-display", name: "Display", fontId: "unbounded", step: 5, kind: "display" },
    { id: "role-body", name: "Body", fontId: "mona", step: 0, kind: "body" },
    { id: "role-caption", name: "Caption", fontId: "mona", step: -1, kind: "caption" },
  ]));
  const [candidateIds, setCandidateIds] = React.useState<string[]>(() => init?.candidateIds ?? ["newsreader"]);
  const candidateId = candidateIds[0] ?? "newsreader";              // the primary (Tune)
  const setCandidateId = (v: string) => setCandidateIds((ids) => [v, ...ids.slice(1)]); // replace primary
  const addCandidate = (v: string) => setCandidateIds((ids) => (ids.includes(v) ? ids : [...ids, v]));
  const removeCandidate = (v: string) => setCandidateIds((ids) => ids.filter((x) => x !== v)); // can go to 0 (base alone)
  // SWITCH a candidate in place — swap its font for another (keeps its position); if the new
  // font is already in the pool, just drop the old one (no duplicates).
  const replaceCandidate = (oldId: string, newId: string) =>
    setCandidateIds((ids) => (ids.includes(newId) ? ids.filter((x) => x !== oldId) : ids.map((x) => (x === oldId ? newId : x))));

  const [winners, setWinners] = React.useState<Record<string, string>>(() => init?.winners ?? {});
  const setWinner = (roleId: string, fontId: string) =>
    setWinners((w) => {
      if (w[roleId] === fontId) { const n = { ...w }; delete n[roleId]; return n; } // toggle off
      return { ...w, [roleId]: fontId };
    });
  // SET (no toggle) — the tray + in-surface swap: picking a font for a role REPLACES it.
  const pickWinner = (roleId: string, fontId: string) => setWinners((w) => ({ ...w, [roleId]: fontId }));
  const clearWinner = (roleId: string) => setWinners((w) => { const n = { ...w }; delete n[roleId]; return n; });
  // FORK — load a whole direction's role→font map into the stack as the new draft.
  const loadStack = (map: Record<string, string>) => setWinners(map);

  // EDIT CONTENT — your words per surface field (surfaceId → fieldId → text).
  const [surfaceContent, setSurfaceContent] = React.useState<Record<string, Record<string, string>>>(() => init?.surfaceContent ?? {});
  const [contentNonce, setContentNonce] = React.useState(0);
  const setSurfaceField = (surfaceId: string, fieldId: string, value: string) =>
    setSurfaceContent((c) => ({ ...c, [surfaceId]: { ...(c[surfaceId] ?? {}), [fieldId]: value } }));
  const resetSurfaceContent = (surfaceId: string) => {
    setSurfaceContent((c) => { const n = { ...c }; delete n[surfaceId]; return n; });
    setContentNonce((n) => n + 1); // remount editable fields so they reseed from placeholders
  };
  // EDIT CONTENT · images
  const [surfaceImages, setSurfaceImages] = React.useState<Record<string, Record<string, string>>>(() => loadImages(imgKey));
  const setSurfaceImage = (surfaceId: string, slot: string, dataUrl: string) =>
    setSurfaceImages((c) => ({ ...c, [surfaceId]: { ...(c[surfaceId] ?? {}), [slot]: dataUrl } }));
  const clearSurfaceImage = (surfaceId: string, slot: string) =>
    setSurfaceImages((c) => { const s = { ...(c[surfaceId] ?? {}) }; delete s[slot]; return { ...c, [surfaceId]: s }; });
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(imgKey, JSON.stringify(surfaceImages)); } catch { /* quota — images stay in-session only */ }
  }, [surfaceImages, imgKey]);
  const [focusRoleId, setFocusRoleId] = React.useState(() => init?.focusRoleId ?? "role-display");
  const [text, setText] = React.useState(() => init?.text ?? "Hamburgefonstiv");
  // MEASURE — the column width in CHARACTERS for running body text on the reading surfaces. The
  // single biggest variable in how body type actually reads (the same face reads differently at 45ch
  // vs 90ch), and the one parameter every editorial buyer sets to THEIR column. 66 = Bringhurst's
  // ideal; 45–75 his "comfortable" band. Drives the body `maxWidth` via the native `ch` unit, so the
  // measure is font-relative — exactly what "characters per line" means. Clamped to a sane range.
  const [measure, setMeasureRaw] = React.useState<number>(() => init?.measure ?? 66);
  const setMeasure = (n: number) => setMeasureRaw(Math.max(36, Math.min(96, Math.round(n))));

  // TUNE persistence — keyed by base+candidate pairing so it survives role/mode switch + reload.
  const [tunes, setTunes] = React.useState<Record<string, TuneDelta>>(() => init?.tunes ?? {});
  const setTune = (baseId: string, candId: string, delta: TuneDelta | null) =>
    setTunes((t) => {
      const k = tuneKey(baseId, candId);
      if (delta === null) { const n = { ...t }; delete n[k]; return n; } // reset clears the stored tune
      return { ...t, [k]: delta };
    });

  const updateRole = (id: string, patch: Partial<Role>) =>
    setRoles((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  // ADD a role = claim a still-unused REGISTER (one role per kind). A preset claims its own
  // register (named after it). A CUSTOM add (no preset) claims the next free register but is
  // yours to name → "Custom" (rename inline). All 8 registers taken → no-op.
  const addRole = (preset?: { name: string; step: number; kind: RoleKind }) => {
    setRoles((rs) => {
      const used = new Set(rs.map((r) => r.kind));
      const kind = preset && !used.has(preset.kind) ? preset.kind : KIND_ORDER.find((k) => !used.has(k));
      if (!kind) return rs; // every register already has a role
      const src = ROLE_PRESETS.find((p) => p.kind === kind)!;
      const usePreset = !!preset && preset.kind === kind;
      const name = usePreset ? preset.name : preset ? src.name : "Custom";
      // a custom add (no preset) is flagged so its row exposes the register selector to define it
      return [...rs, { id: rid(), name, fontId: "mona", step: usePreset ? preset.step : src.step, kind, ...(preset ? {} : { custom: true }) }];
    });
  };
  const removeRole = (id: string) =>
    setRoles((rs) => {
      if (rs.length <= 1) return rs;
      const next = rs.filter((r) => r.id !== id);
      if (focusRoleId === id) setFocusRoleId(next[0].id);
      return next;
    });

  // UNDO snapshot — ONLY for applyPreset, the one genuinely destructive "start over" that replaces ALL
  // roles + scale on a single click (a misclick after building a setup would otherwise wipe it, and the
  // persist effect writes the new state immediately → reload couldn't recover). Applying a direction is
  // NOT undo-toasted: it only swaps fonts, it's called live from the Directions editor on every edit,
  // and it's reversible by picking another direction — a toast there was just noise (Sebs flagged it).
  // Stable callbacks + a memoized view so the toast's auto-dismiss timer fires instead of churning.
  const [undo, setUndo] = React.useState<{ roles: Role[]; scale: Scale; focusRoleId: string; winners: Record<string, string>; label: string } | null>(null);
  const undoBulk = React.useCallback(() => {
    setUndo((u) => { if (u) { setRoles(u.roles); setScale(u.scale); setFocusRoleId(u.focusRoleId); setWinners(u.winners); } return null; });
  }, []);
  const clearUndo = React.useCallback(() => setUndo(null), []);
  const undoView = React.useMemo(() => (undo ? { label: undo.label } : null), [undo]);

  // apply a whole direction to the base roles — each role gets the direction's font for ITS
  // kind (nearest-anchor fallback), so the full role set carries over, not just display/text.
  const applyDirection = (d: Dir) =>
    setRoles((rs) => rs.map((r) => ({ ...r, fontId: dirFontForRole(d, r) })));

  // ONBOARDING — seed the whole setup from a preset (its roles + fonts + scale). A deliberate
  // "start from" that REPLACES the current roles + scale and focuses the first role (undoable).
  const applyPreset = (p: Preset) => {
    setUndo({ roles, scale, focusRoleId, winners, label: p.name });
    const seeded = p.roles.map((r) => ({ id: rid(), ...r }));
    setRoles(seeded);
    setScale(p.scale);
    setFocusRoleId(seeded[0].id);
  };

  // BYO FONTS — bump on any catalog change so every FACES reader re-renders with the new faces.
  const [fontsVersion, setFontsVersion] = React.useState(0);
  // returns a STATUS instead of swallowing failures silently — a corrupt/unsupported upload now
  // reports a reason the UI can show, rather than "clicked, nothing happened" (A-M1). `cat` lets the
  // uploader declare the font's class so its fallback + recommendation are right (a serif no longer
  // silently falls back to sans).
  const addUserFont = async (file: File, cat: GFCategory = "sans"): Promise<{ ok: boolean; reason?: string; id?: string }> => {
    let buf: ArrayBuffer;
    try { buf = await file.arrayBuffer(); } catch { return { ok: false, reason: "Couldn't read that file." }; }
    const n = ++_uface;
    const id = `user-${n}`, family = `CotejoUser${n}`;
    const label = file.name.replace(/\.(woff2?|otf|ttf)$/i, "").slice(0, 40) || `Font ${n}`;
    try {
      const ff = new FontFace(family, buf);
      await ff.load(); document.fonts.add(ff); USER_FONTFACES.set(id, ff);
    } catch {
      return { ok: false, reason: "That file isn’t a font we can read (woff2/otf/ttf)." };
    }
    // AUTO-CLASSIFY the upload from how it RENDERS (the trained font classifier) instead of defaulting to
    // "sans" — a confident prediction sets the real category, which feeds metaFor → better pairing recs.
    const detected = classifyCategory(family);
    const finalCat = detected ? detected.category : cat;
    FACES = [...FACES, userFace(id, family, label, finalCat)];
    const stored = loadStoredFonts(); stored.push({ id, family, label, b64: abToB64(buf), cat: finalCat });
    try { window.localStorage.setItem(FONTS_KEY, JSON.stringify(stored)); } catch { /* quota — stays this session only */ }
    setFontsVersion((v) => v + 1);
    return { ok: true, id };
  };
  // set an upload's LICENSE record — the user's OWN determination (cleared-to-ship / trial-eval-only /
  // back to unverified) plus optional attribution (who + a foundry/license/order# note). We never
  // assert an upload's license. Stamps the date on a status change → an attributable, dated record that
  // flows into the FACES registry + the export. (real lever · #1, 22)
  const setFontLicense = (id: string, patch: { status?: LicStatus | null; by?: string; note?: string }) => {
    if (!id.startsWith("user-")) return; // only uploads carry a license record
    const apply = <T extends LicRec>(f: T): T => {
      const next: LicRec = { licStatus: f.licStatus, clearedAt: f.clearedAt, licBy: f.licBy, licNote: f.licNote };
      if (patch.status !== undefined) { next.licStatus = patch.status ?? undefined; next.clearedAt = patch.status ? new Date().toISOString() : undefined; }
      if (patch.by !== undefined) next.licBy = patch.by.trim() || undefined;
      if (patch.note !== undefined) next.licNote = patch.note.trim() || undefined;
      return { ...f, ...next };
    };
    FACES = FACES.map((f) => (f.id === id ? apply(f) : f));
    try { window.localStorage.setItem(FONTS_KEY, JSON.stringify(loadStoredFonts().map((u) => (u.id === id ? apply(u) : u)))); } catch { /* non-fatal */ }
    setFontsVersion((v) => v + 1);
  };
  // thin back-compat wrapper — a plain cleared/uncleared toggle (used by the export-panel chips)
  const markFontCleared = (id: string, cleared: boolean) => setFontLicense(id, { status: cleared ? "cleared" : null });
  // WARM the face before anyone measures it: loadGoogleCss only injects the <link>, so a just-added
  // font raced measurement and cap-matched against a system fallback. document.fonts.load forces the
  // fetch + parse so the first Compare view measures the real face (A-H2).
  const addGoogleFont = (family: string, category: GFCategory) => {
    const id = gfId(family);
    if (FACES.some((f) => f.id === id)) return; // already in the catalog
    loadGoogleCss(family);
    if (typeof document !== "undefined") { document.fonts.load(`500 1em '${family}'`).catch(() => {}); }
    const license = gfById(id)?.license ?? gfLicenseFor(family); // OFL/Apache/UFL from the catalog/directory
    FACES = [...FACES, gFace(id, family, category, license)];
    const stored = loadStoredGFonts(); stored.push({ id, family, category, license });
    try { window.localStorage.setItem(GF_KEY, JSON.stringify(stored)); } catch { /* quota */ }
    setFontsVersion((v) => v + 1);
  };
  const removeUserFont = (id: string) => {
    FACES = FACES.filter((f) => f.id !== id);
    // evict the live FontFace so it doesn't leak in document.fonts for the rest of the session (A-H4)
    const ff = USER_FONTFACES.get(id);
    if (ff && typeof document !== "undefined") { try { document.fonts.delete(ff); } catch { /* already gone */ } USER_FONTFACES.delete(id); }
    if (id.startsWith("user-")) { try { window.localStorage.setItem(FONTS_KEY, JSON.stringify(loadStoredFonts().filter((u) => u.id !== id))); } catch { /* non-fatal */ } }
    else { try { window.localStorage.setItem(GF_KEY, JSON.stringify(loadStoredGFonts().filter((g) => g.id !== id))); } catch { /* non-fatal */ } }
    setFontsVersion((v) => v + 1);
  };

  // the saved-direction library (starters are fixed; user dirs are mutable + persisted)
  const [userDirs, setUserDirs] = React.useState<Dir[]>(() => init?.userDirs ?? []);
  const directions = React.useMemo(() => [...DIR_STARTERS, ...userDirs], [userDirs]);
  const addDirection = (d: Omit<Dir, "id">) => { const id = did(); setUserDirs((u) => [...u, { ...d, id }]); return id; };
  const updateDirection = (id: string, patch: Partial<Dir>) => setUserDirs((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeDirection = (id: string) => setUserDirs((u) => u.filter((x) => x.id !== id));

  // a loaded/shared session may reference a Google font that isn't in YOUR catalog yet → restore it
  // by name (we can: the id encodes the family). BYO uploads can't be restored (binary isn't shared).
  React.useEffect(() => {
    const want = new Set<string>();
    roles.forEach((r) => want.add(r.fontId));
    userDirs.forEach((d) => Object.values(d.fonts).forEach((id) => id && want.add(id)));
    want.forEach((id) => {
      if (id.startsWith("gf-") && !FACES.some((f) => f.id === id)) { const g = gfByIdAny(id); if (g) addGoogleFont(g.family, g.category); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, userDirs]);

  // derived focus pairing
  const focusRole = roles.find((r) => r.id === focusRoleId) ?? roles[0];
  const baseId = focusRole.fontId;
  const base = FACES.find((f) => f.id === baseId) ?? FACES[0];
  const cand = FACES.find((f) => f.id === candidateId) ?? FACES[0];
  const baseSize = roleSize(focusRole, scale);
  const setBaseId = (v: string) => updateRole(focusRole.id, { fontId: v });

  // DECIDE → assemble the STACK into a new Direction. Per role, take the picked font (else its
  // current base font), keyed by KIND — so the WHOLE role set is saved, not display/text only.
  // The two anchors (display + body) are guaranteed so any kind still resolves. Never mutates
  // the base — pick ≠ apply (doc §5).
  const assembleDirection = (name: string) => {
    const pickFor = (r: Role) => winners[r.id] ?? r.fontId;
    const fonts = {} as DirFonts;
    for (const r of roles) (fonts as Record<RoleKind, string>)[r.kind] = pickFor(r);
    const big = roles.find((r) => r.step >= 2) ?? focusRole;
    const small = [...roles].reverse().find((r) => r.step < 2) ?? roles[roles.length - 1];
    if (!fonts.display) fonts.display = pickFor(big);
    if (!fonts.body) fonts.body = pickFor(small);
    return addDirection({ name, vibe: "assembled stack", fonts, custom: true });
  };

  // persist the WORK on every change (survives refresh — BUILD-LIST §2)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(workKey, JSON.stringify({ roles, scale, text, candidateIds, winners, userDirs, focusRoleId, surfaceContent, tunes, measure }));
    } catch { /* quota / private-mode — non-fatal */ }
  }, [roles, scale, text, candidateIds, winners, userDirs, focusRoleId, surfaceContent, tunes, measure, workKey]);

  return (
    <SessionCtx.Provider
      value={{
        roles, scale, text, candidateId, focusRoleId,
        candidateIds, addCandidate, removeCandidate, replaceCandidate, winners, setWinner, pickWinner, clearWinner, loadStack,
        surfaceContent, setSurfaceField, resetSurfaceContent, contentNonce,
        surfaceImages, setSurfaceImage, clearSurfaceImage,
        setScale, setText, measure, setMeasure, setCandidateId, setFocusRoleId, addRole, removeRole, updateRole, applyDirection, applyPreset,
        undo: undoView, undoBulk, clearUndo,
        fontsVersion, addUserFont, addGoogleFont, removeUserFont, markFontCleared, setFontLicense,
        tunes, setTune,
        directions, addDirection, updateDirection, removeDirection, assembleDirection,
        base, cand, baseId, candId: candidateId, baseSize, setBaseId, setCandId: setCandidateId,
      }}
    >
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession(): Ctx {
  const v = React.useContext(SessionCtx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
