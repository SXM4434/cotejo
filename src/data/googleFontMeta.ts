import type { FontMeta } from "../lib/recommend";
// Curated pairing meta for the strongest Google Fonts — hand-tagged from each face's KNOWN
// characteristics (not fabricated precision; xRatio is category-typical, refined later by measurement).
// Keyed by the EXACT Google family name (casing/spacing as on fonts.google.com). Powers Google-font
// recommendations in recommend.ts so the engine can suggest genuinely-good partners, not "any sans."
//
// Tagging notes:
// - `category` = what the face structurally IS (Google's "display" category mostly maps to a sans or
//   serif skeleton with display:true). "slab"/"mono"/"script" used where structurally true.
// - `display` = personality/headline face vs text workhorse.
// - `bodyFit` = honest body-text fitness (0.85–0.95 excellent, 0.15–0.35 display-only).
// - `contrast` = stroke modulation (≈0.08 monoline grotesque, 0.3–0.5 humanist/text serif, 0.8+ didone).
// - `xRatio` = category-typical APPROXIMATION (sans ~0.70–0.75, serif ~0.62–0.70, mono ~0.73) — measured later.
// - `family` = ONLY for true designed superfamilies (IBM Plex, Noto, Fira, Source, Roboto, DM, etc.).
export const GOOGLE_FONT_META: Record<string, FontMeta> = {
  // ── WORKHORSE SANS ──────────────────────────────────────────────────────────────────────────
  "Inter": { category: "sans", display: false, bodyFit: 0.92, xRatio: 0.73, width: "normal", contrast: 0.08, mood: ["neutral", "ui"] },
  "Roboto": { category: "sans", display: false, bodyFit: 0.90, xRatio: 0.71, width: "normal", contrast: 0.10, family: "roboto", mood: ["neutral", "workhorse"] },
  "Open Sans": { category: "sans", display: false, bodyFit: 0.90, xRatio: 0.72, width: "normal", contrast: 0.12, mood: ["humanist", "friendly"] },
  "Lato": { category: "sans", display: false, bodyFit: 0.88, xRatio: 0.72, width: "normal", contrast: 0.12, mood: ["humanist", "warm"] },
  "Work Sans": { category: "sans", display: false, bodyFit: 0.86, xRatio: 0.72, width: "normal", contrast: 0.10, mood: ["grotesque", "clean"] },
  "DM Sans": { category: "sans", display: false, bodyFit: 0.88, xRatio: 0.74, width: "normal", contrast: 0.09, family: "dm", mood: ["geometric", "low-contrast"] },
  "Source Sans 3": { category: "sans", display: false, bodyFit: 0.90, xRatio: 0.70, width: "normal", contrast: 0.12, family: "source", mood: ["humanist", "neutral"] },
  "Manrope": { category: "sans", display: false, bodyFit: 0.88, xRatio: 0.73, width: "normal", contrast: 0.08, mood: ["geometric", "modern"] },
  "Plus Jakarta Sans": { category: "sans", display: false, bodyFit: 0.86, xRatio: 0.72, width: "normal", contrast: 0.10, mood: ["geometric", "friendly"] },
  "Figtree": { category: "sans", display: false, bodyFit: 0.87, xRatio: 0.73, width: "normal", contrast: 0.08, mood: ["geometric", "clean"] },
  "Public Sans": { category: "sans", display: false, bodyFit: 0.89, xRatio: 0.72, width: "normal", contrast: 0.10, mood: ["neutral", "government"] },
  "Karla": { category: "sans", display: false, bodyFit: 0.84, xRatio: 0.72, width: "normal", contrast: 0.10, mood: ["grotesque", "quirky"] },
  "Mulish": { category: "sans", display: false, bodyFit: 0.86, xRatio: 0.72, width: "normal", contrast: 0.09, mood: ["minimal", "clean"] },
  "Hanken Grotesk": { category: "sans", display: false, bodyFit: 0.88, xRatio: 0.73, width: "normal", contrast: 0.09, mood: ["grotesque", "neutral"] },
  "Schibsted Grotesk": { category: "sans", display: false, bodyFit: 0.85, xRatio: 0.72, width: "normal", contrast: 0.10, mood: ["grotesque", "editorial"] },
  "Archivo": { category: "sans", display: false, bodyFit: 0.84, xRatio: 0.73, width: "normal", contrast: 0.10, family: "archivo", mood: ["grotesque", "sturdy"] },
  "Albert Sans": { category: "sans", display: false, bodyFit: 0.86, xRatio: 0.73, width: "normal", contrast: 0.09, mood: ["geometric", "clean"] },
  "Nunito Sans": { category: "sans", display: false, bodyFit: 0.87, xRatio: 0.73, width: "normal", contrast: 0.09, mood: ["rounded", "friendly"] },
  "Nunito": { category: "sans", display: false, bodyFit: 0.85, xRatio: 0.73, width: "normal", contrast: 0.08, mood: ["rounded", "soft"] },
  "Libre Franklin": { category: "sans", display: false, bodyFit: 0.87, xRatio: 0.71, width: "normal", contrast: 0.11, mood: ["grotesque", "american"] },
  "Be Vietnam Pro": { category: "sans", display: false, bodyFit: 0.86, xRatio: 0.72, width: "normal", contrast: 0.10, mood: ["geometric", "clean"] },
  "Onest": { category: "sans", display: false, bodyFit: 0.86, xRatio: 0.73, width: "normal", contrast: 0.09, mood: ["neutral", "modern"] },
  "Rubik": { category: "sans", display: false, bodyFit: 0.84, xRatio: 0.73, width: "normal", contrast: 0.08, mood: ["rounded", "geometric"] },
  "IBM Plex Sans": { category: "sans", display: false, bodyFit: 0.88, xRatio: 0.72, width: "normal", contrast: 0.10, family: "ibm-plex", mood: ["grotesque", "technical"] },
  "Noto Sans": { category: "sans", display: false, bodyFit: 0.88, xRatio: 0.72, width: "normal", contrast: 0.10, family: "noto", mood: ["neutral", "universal"] },
  "Fira Sans": { category: "sans", display: false, bodyFit: 0.87, xRatio: 0.72, width: "normal", contrast: 0.11, family: "fira", mood: ["humanist", "technical"] },

  // ── GEOMETRIC / DISPLAY SANS ────────────────────────────────────────────────────────────────
  "Poppins": { category: "sans", display: false, bodyFit: 0.78, xRatio: 0.69, width: "normal", contrast: 0.05, mood: ["geometric", "round"] },
  "Montserrat": { category: "sans", display: false, bodyFit: 0.76, xRatio: 0.70, width: "normal", contrast: 0.08, mood: ["geometric", "urban"] },
  "Space Grotesk": { category: "sans", display: true, bodyFit: 0.58, xRatio: 0.71, width: "normal", contrast: 0.10, mood: ["geometric", "technical"] },
  "Sora": { category: "sans", display: true, bodyFit: 0.62, xRatio: 0.72, width: "normal", contrast: 0.08, mood: ["geometric", "modern"] },
  "Outfit": { category: "sans", display: false, bodyFit: 0.74, xRatio: 0.71, width: "normal", contrast: 0.05, mood: ["geometric", "minimal"] },
  "Lexend": { category: "sans", display: false, bodyFit: 0.83, xRatio: 0.72, width: "normal", contrast: 0.07, mood: ["geometric", "readable"] },
  "Unbounded": { category: "sans", display: true, bodyFit: 0.18, xRatio: 0.76, width: "wide", contrast: 0.15, mood: ["geometric", "kinetic"] },
  "Bricolage Grotesque": { category: "sans", display: true, bodyFit: 0.55, xRatio: 0.72, width: "normal", contrast: 0.18, mood: ["grotesque", "editorial"] },
  "Bebas Neue": { category: "sans", display: true, bodyFit: 0.15, xRatio: 0.92, width: "condensed", contrast: 0.10, mood: ["condensed", "poster"] },
  "Anton": { category: "sans", display: true, bodyFit: 0.16, xRatio: 0.78, width: "condensed", contrast: 0.12, mood: ["condensed", "heavy"] },
  "Archivo Black": { category: "sans", display: true, bodyFit: 0.22, xRatio: 0.73, width: "normal", contrast: 0.10, family: "archivo", mood: ["heavy", "grotesque"] },
  "Syne": { category: "sans", display: true, bodyFit: 0.30, xRatio: 0.71, width: "normal", contrast: 0.18, mood: ["experimental", "editorial"] },

  // ── TEXT SERIFS ─────────────────────────────────────────────────────────────────────────────
  "Lora": { category: "serif", display: false, bodyFit: 0.90, xRatio: 0.68, width: "normal", contrast: 0.40, mood: ["literary", "warm"] },
  "Merriweather": { category: "serif", display: false, bodyFit: 0.90, xRatio: 0.69, width: "normal", contrast: 0.42, mood: ["literary", "sturdy"] },
  "Source Serif 4": { category: "serif", display: false, bodyFit: 0.90, xRatio: 0.66, width: "normal", contrast: 0.45, family: "source", mood: ["literary", "neutral"] },
  "PT Serif": { category: "serif", display: false, bodyFit: 0.88, xRatio: 0.67, width: "normal", contrast: 0.40, mood: ["literary", "transitional"] },
  "Libre Baskerville": { category: "serif", display: false, bodyFit: 0.85, xRatio: 0.66, width: "normal", contrast: 0.55, mood: ["literary", "classic"] },
  "Bitter": { category: "slab", display: false, bodyFit: 0.86, xRatio: 0.67, width: "normal", contrast: 0.25, mood: ["slab", "screen"] },
  "Spectral": { category: "serif", display: false, bodyFit: 0.88, xRatio: 0.64, width: "normal", contrast: 0.48, mood: ["literary", "elegant"] },
  "Crimson Pro": { category: "serif", display: false, bodyFit: 0.86, xRatio: 0.63, width: "normal", contrast: 0.50, mood: ["literary", "oldstyle"] },
  "Domine": { category: "serif", display: false, bodyFit: 0.84, xRatio: 0.67, width: "normal", contrast: 0.45, mood: ["literary", "robust"] },
  "Newsreader": { category: "serif", display: false, bodyFit: 0.88, xRatio: 0.65, width: "normal", contrast: 0.50, mood: ["literary", "editorial"] },
  "EB Garamond": { category: "serif", display: false, bodyFit: 0.85, xRatio: 0.62, width: "normal", contrast: 0.50, mood: ["oldstyle", "classic"] },
  "Cormorant": { category: "serif", display: true, bodyFit: 0.45, xRatio: 0.60, width: "normal", contrast: 0.70, mood: ["elegant", "high-contrast"] },
  "Cardo": { category: "serif", display: false, bodyFit: 0.83, xRatio: 0.63, width: "normal", contrast: 0.48, mood: ["oldstyle", "scholarly"] },
  "IBM Plex Serif": { category: "serif", display: false, bodyFit: 0.86, xRatio: 0.66, width: "normal", contrast: 0.35, family: "ibm-plex", mood: ["slab-ish", "technical"] },
  "Noto Serif": { category: "serif", display: false, bodyFit: 0.88, xRatio: 0.67, width: "normal", contrast: 0.42, family: "noto", mood: ["literary", "universal"] },
  "Frank Ruhl Libre": { category: "serif", display: false, bodyFit: 0.84, xRatio: 0.65, width: "normal", contrast: 0.55, mood: ["literary", "editorial"] },

  // ── DISPLAY SERIFS ──────────────────────────────────────────────────────────────────────────
  "Playfair Display": { category: "serif", display: true, bodyFit: 0.30, xRatio: 0.71, width: "normal", contrast: 0.85, mood: ["editorial", "high-contrast"] },
  "Fraunces": { category: "serif", display: true, bodyFit: 0.55, xRatio: 0.66, width: "normal", contrast: 0.55, mood: ["editorial", "characterful"] },
  "DM Serif Display": { category: "serif", display: true, bodyFit: 0.28, xRatio: 0.68, width: "normal", contrast: 0.75, family: "dm", mood: ["editorial", "high-contrast"] },
  "Abril Fatface": { category: "serif", display: true, bodyFit: 0.18, xRatio: 0.70, width: "normal", contrast: 0.88, mood: ["poster", "didone"] },
  "Bodoni Moda": { category: "serif", display: true, bodyFit: 0.32, xRatio: 0.66, width: "normal", contrast: 0.90, mood: ["didone", "high-contrast"] },
  "Marcellus": { category: "serif", display: true, bodyFit: 0.35, xRatio: 0.62, width: "normal", contrast: 0.45, mood: ["roman", "elegant"] },

  // ── SLABS ───────────────────────────────────────────────────────────────────────────────────
  "Roboto Slab": { category: "slab", display: false, bodyFit: 0.84, xRatio: 0.71, width: "normal", contrast: 0.18, family: "roboto", mood: ["slab", "sturdy"] },
  "Zilla Slab": { category: "slab", display: false, bodyFit: 0.83, xRatio: 0.69, width: "normal", contrast: 0.20, mood: ["slab", "editorial"] },
  "Josefin Slab": { category: "slab", display: true, bodyFit: 0.40, xRatio: 0.50, width: "normal", contrast: 0.25, mood: ["slab", "geometric"] },
  "Arvo": { category: "slab", display: false, bodyFit: 0.80, xRatio: 0.70, width: "normal", contrast: 0.15, mood: ["slab", "geometric"] },
  "Aleo": { category: "slab", display: false, bodyFit: 0.82, xRatio: 0.68, width: "normal", contrast: 0.20, mood: ["slab", "humanist"] },

  // ── MONOSPACE ───────────────────────────────────────────────────────────────────────────────
  "JetBrains Mono": { category: "mono", display: false, bodyFit: 0.55, xRatio: 0.73, width: "normal", contrast: 0.10, mood: ["mono", "code"] },
  "IBM Plex Mono": { category: "mono", display: false, bodyFit: 0.55, xRatio: 0.72, width: "normal", contrast: 0.10, family: "ibm-plex", mood: ["mono", "technical"] },
  "Space Mono": { category: "mono", display: true, bodyFit: 0.40, xRatio: 0.70, width: "normal", contrast: 0.12, mood: ["mono", "retro"] },
  "Roboto Mono": { category: "mono", display: false, bodyFit: 0.55, xRatio: 0.72, width: "normal", contrast: 0.08, family: "roboto", mood: ["mono", "neutral"] },
  "Fira Code": { category: "mono", display: false, bodyFit: 0.55, xRatio: 0.72, width: "normal", contrast: 0.10, family: "fira", mood: ["mono", "code"] },
  "DM Mono": { category: "mono", display: false, bodyFit: 0.50, xRatio: 0.71, width: "normal", contrast: 0.09, family: "dm", mood: ["mono", "clean"] },
  "Source Code Pro": { category: "mono", display: false, bodyFit: 0.55, xRatio: 0.71, width: "normal", contrast: 0.10, family: "source", mood: ["mono", "code"] },

  // ── SCRIPT / HANDWRITING ────────────────────────────────────────────────────────────────────
  "Caveat": { category: "script", display: true, bodyFit: 0.15, xRatio: 0.55, width: "normal", contrast: 0.30, mood: ["handwriting", "casual"] },
  "Dancing Script": { category: "script", display: true, bodyFit: 0.12, xRatio: 0.50, width: "normal", contrast: 0.45, mood: ["handwriting", "formal"] },
  "Pacifico": { category: "script", display: true, bodyFit: 0.10, xRatio: 0.58, width: "normal", contrast: 0.30, mood: ["handwriting", "retro"] },
};
