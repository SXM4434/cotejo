// THE FONT-PAIRING RULE ENGINE — explainable, NOT machine learning (we have no usage data; calling
// this "ML" would be a fabrication). As you build the stack it scores the catalog for each role given
// what you've already picked, and surfaces the best with a plain-English reason.
//
// Spine (converged across Fontjoy's open-source mechanism, Google Fonts, Adobe/Tim Brown, Monotype,
// and Pimp my Type's Font Matrix): a good pairing SHARES the harmony axes (x-height) and DIVERGES on
// the contrast axes (classification), avoiding the near-miss "conflict band" ("too close for comfort"
// — Lupton). Superfamily is a strong override; a one-display-one-body role gate keeps hierarchy.
// v1 ships the structural, computable, well-corroborated signals only; era/mood are deferred (soft).
import { FACES, KIND_STEP, type Face, type Role, type RoleKind } from "../state/SessionContext";
import { cachedMetrics } from "./autofinetune";
import { gfId, type GFCategory } from "../data/googleFonts";
import { GOOGLE_FONT_META } from "../data/googleFontMeta";

export type FontMeta = {
  category: "sans" | "serif" | "slab" | "mono" | "script";
  display: boolean;   // a personality/display face rather than a text workhorse
  bodyFit: number;    // 0..1 fitness as running text (x-height, moderate contrast, italic+bold present)
  xRatio: number;     // x-height ÷ cap-height — MEASURED (tools/lab-screenshots/measure.cjs), not guessed
  width: "condensed" | "normal" | "wide";
  contrast: number;   // 0..1 stroke modulation (low = grotesque, high = modern serif)
  family?: string;    // shared-skeleton / superfamily group — designed to pair (the safest signal)
  mood?: string[];    // stored for a future (deferred) soft signal — not scored in v1
};

// ── meta for ANY font, not just the 5 built-ins (the bug Sebs was furious about) ────────────────
// Built-ins keep their curated, hand-tagged meta. Every Google/uploaded font derives a usable meta
// from its category (the harmony/contrast classification the engine actually scores) + its MEASURED
// x-height ratio when we have it (the cache fills as fonts are auditioned), else a category-typical
// xRatio. So the ◎ + reason now fires for the exact fonts users bring, instead of silently scoring 0.
const CAT_META: Record<GFCategory, Omit<FontMeta, "xRatio">> = {
  sans:        { category: "sans",   display: false, bodyFit: 0.75, width: "normal", contrast: 0.10 },
  serif:       { category: "serif",  display: false, bodyFit: 0.78, width: "normal", contrast: 0.45 },
  monospace:   { category: "mono",   display: false, bodyFit: 0.55, width: "normal", contrast: 0.10 },
  display:     { category: "sans",   display: true,  bodyFit: 0.22, width: "normal", contrast: 0.25 },
  handwriting: { category: "script", display: true,  bodyFit: 0.18, width: "normal", contrast: 0.30 },
};
const DEFAULT_XRATIO: Record<GFCategory, number> = { sans: 0.72, serif: 0.66, monospace: 0.74, display: 0.70, handwriting: 0.64 };

export function metaFor(face: Face): FontMeta {
  const builtin = FONT_META[face.id];
  if (builtin) return builtin;
  const base = CAT_META[face.cat] ?? CAT_META.sans;
  const m = cachedMetrics(face.measureFamily);
  const xRatio = m && m.cap > 0 ? m.xHeight / m.cap : DEFAULT_XRATIO[face.cat] ?? 0.72;
  return { ...base, xRatio };
}
const metaById = (id: string): FontMeta | undefined => {
  const f = FACES.find((x) => x.id === id);
  return f ? metaFor(f) : undefined;
};

// Curated for the small catalog (xRatio is measured; the rest hand-tagged — cheap + high-quality at
// this size, and the model scales when BYO-fonts lands). Mona + Hubot are GitHub's sibling sans.
export const FONT_META: Record<string, FontMeta> = {
  unbounded:  { category: "sans",  display: true,  bodyFit: 0.20, xRatio: 0.758, width: "wide",   contrast: 0.15, mood: ["geometric", "kinetic"] },
  anybody:    { category: "sans",  display: true,  bodyFit: 0.40, xRatio: 0.878, width: "normal", contrast: 0.10, mood: ["variable", "playful"] },
  hubot:      { category: "sans",  display: false, bodyFit: 0.70, xRatio: 0.726, width: "normal", contrast: 0.12, family: "github", mood: ["clean", "expressive"] },
  mona:       { category: "sans",  display: false, bodyFit: 0.85, xRatio: 0.725, width: "normal", contrast: 0.10, family: "github", mood: ["neutral", "workhorse"] },
  newsreader: { category: "serif", display: false, bodyFit: 0.80, xRatio: 0.652, width: "normal", contrast: 0.50, mood: ["literary", "warm"] },
};

// big/display registers (display, heading, subheading) want personality; the rest are text.
const isBigRole = (kind: RoleKind) => KIND_STEP[kind] >= 2;

export type Rec = { fontId: string; score: number; reason: string; gf?: { family: string; category: GFCategory } };

// FontMeta.category (skeleton) → the Google directory category (drives the load fallback + record).
const GF_CAT: Record<FontMeta["category"], GFCategory> = { sans: "sans", serif: "serif", slab: "serif", mono: "monospace", script: "handwriting" };

type RecCand = { id: string; label: string; meta: FontMeta; gf?: { family: string; category: GFCategory } };
// the scoring pool = every LOADED face + the curated Google pairing set (those not already loaded).
// Google candidates carry {family, category} so a consumer can load them on demand when picked — this
// is what lets the recommender suggest a real Google partner, not just "a font from what's there".
function candidatePool(): RecCand[] {
  const loaded = new Set(FACES.map((f) => f.id));
  const pool: RecCand[] = FACES.map((f) => ({ id: f.id, label: f.label, meta: metaFor(f) }));
  for (const family in GOOGLE_FONT_META) {
    const id = gfId(family);
    if (loaded.has(id)) continue; // already a live FACE → scored above with its measured meta
    const meta = GOOGLE_FONT_META[family];
    pool.push({ id, label: family, meta, gf: { family, category: GF_CAT[meta.category] } });
  }
  return pool;
}

// score the whole catalog for `role`, given the rest of the stack (roleId → fontId). best first.
export function recommendForRole(role: Role, roles: Role[], picks: Record<string, string>): Rec[] {
  const big = isBigRole(role.kind);
  // pair against the OPPOSITE anchor — big roles vs the BODY pick, text roles vs the DISPLAY pick.
  const anchorKind: RoleKind = big ? "body" : "display";
  const anchorRole = roles.find((r) => r.kind === anchorKind);
  const anchorId = anchorRole ? (picks[anchorRole.id] ?? anchorRole.fontId) : undefined;
  const a = anchorId ? metaById(anchorId) : undefined;
  // reference the anchor by its ROLE ("your body" / "your display"), not the font name — clearer to the
  // user AND removes the "Mona Sans" confusion (the built-in body font shares the chrome font's name).
  const anchorLabel = anchorRole ? `your ${anchorRole.name.toLowerCase()}` : "";

  return candidatePool().map((cand) => {
    const m = cand.meta;
    let score = 0;
    const pos: { w: number; text: string }[] = [];
    // 1) ROLE FIT (the display/body gate — never suggest a workhorse for display or vice-versa)
    if (big) {
      score += m.display ? 0.5 : 0.18;
      if (m.display) pos.push({ w: 0.5, text: "a display face — built for personality at large sizes" });
    } else {
      score += m.bodyFit * 0.6;
      if (m.bodyFit >= 0.7) pos.push({ w: 0.45, text: `reads cleanly at ${role.name.toLowerCase()} size` });
    }
    // 2) PAIRING vs the anchor (the spine)
    if (a && anchorId && anchorId !== cand.id) {
      if (m.family && m.family === a.family) {
        score += 0.85; pos.push({ w: 0.95, text: `same family as ${anchorLabel} — designed to sit together` });   // superfamily override
      } else if (m.category !== a.category) {
        score += 0.5; pos.push({ w: 0.6, text: `${m.category} contrast to ${anchorLabel} — a clear hierarchy` }); // classification contrast
      } else {
        // same category → "too close for comfort" penalty when they're nearly the same face
        const dx = Math.abs(m.xRatio - a.xRatio);
        if (dx < 0.03 && m.width === a.width && m.display === a.display) score -= 0.6;
      }
      // x-height harmony (soft tiebreaker)
      const dx = Math.abs(m.xRatio - a.xRatio);
      if (dx < 0.02) { score += 0.15; pos.push({ w: 0.3, text: `x-height within ${dx.toFixed(3)} of ${anchorLabel} — they feel balanced at any size` }); }
    }
    const best = pos.filter((r) => r.w > 0).sort((x, y) => y.w - x.w)[0];
    return { fontId: cand.id, score, reason: best?.text ?? "", gf: cand.gf };
  }).sort((x, y) => y.score - x.score);
}

// the few worth MARKING for a role — above a confidence floor, with a reason, not the current pick.
export function topRecs(role: Role, roles: Role[], picks: Record<string, string>, n = 2): Rec[] {
  const current = picks[role.id];
  return recommendForRole(role, roles, picks)
    .filter((r) => r.score >= 0.5 && r.reason && r.fontId !== current)
    .slice(0, n);
}
