// GLYPH COVERAGE / TOFU detection (BUILD-LIST v2 #10) — does a font actually HAVE the characters in
// your sample? Client-side, no font parsing (real cmap parsing would need a ~1MB woff2/brotli decoder
// since every face here is woff2 — disproportionate for this). Instead, the PIXEL-AVAILABILITY test,
// which is script-agnostic and weightless:
//
//   A glyph is PRESENT in the target ⟺ prepending the target to a generic fallback CHANGES what gets
//   rendered. Render the char as `'Target', monospace` and as `monospace` alone: if the target has the
//   glyph it draws its own (different pixels); if it lacks it, both fall to monospace (identical pixels).
//
// This catches more than width-comparison: Cyrillic / Greek / symbols / Latin-extended gaps where the
// fallback PIXELS differ even when the widths happen to match.
//
// HONEST LIMIT (verified): CJK is still NOT reliable. The browser resolves a missing 中 to a different
// CJK fallback depending on the PRIMARY family, so `'LatinFont', monospace` and `monospace` can render
// 中 differently — making an absent glyph read as "present". No rendering trick escapes this; truly
// bulletproof coverage needs font-table (cmap) parsing + a woff2/brotli decoder (~heavy), deliberately
// not shipped. So: reliable + zero-false-positive for the common scripts; blind to CJK.
//
// Two guards keep it honest (the original bug was flagging every char on a not-yet-loaded font):
//   1. CONTROL-CHAR GUARD — measure "n o H 0" first; if the target can't draw THOSE it isn't loaded
//      yet, so we bail and flag NOTHING (an un-loaded font never reads as "all missing").
//   2. READY TICK (useGlyphReady) — re-runs the check once webfonts finish loading.
import React from "react";

const PX = 40, W = 72, H = 52;
let _ctx: CanvasRenderingContext2D | null = null;
const ctx = (): CanvasRenderingContext2D | null => {
  if (_ctx) return _ctx;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  _ctx = c.getContext("2d", { willReadFrequently: true });
  return _ctx;
};

// the bare family name (strip the quotes + fallbacks the Face carries: "'Newsreader', serif")
const firstFamily = (family: string) => family.split(",")[0].trim().replace(/^['"]|['"]$/g, "");

const bitmap = (c: CanvasRenderingContext2D, font: string, ch: string): Uint8ClampedArray => {
  c.clearRect(0, 0, W, H);
  c.font = `${PX}px ${font}`;
  c.textBaseline = "top";
  c.fillText(ch, 4, 4);
  return c.getImageData(0, 0, W, H).data;
};
const same = (a: Uint8ClampedArray, b: Uint8ClampedArray): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

// present ⟺ prepending the target changes the pixels vs the fallback alone. Checked against TWO
// generics (monospace + serif) so a coincidental pixel-match with one generic can't read as missing.
const renders = (c: CanvasRenderingContext2D, fam: string, ch: string): boolean => {
  if (!same(bitmap(c, `'${fam}', monospace`, ch), bitmap(c, `monospace`, ch))) return true;
  return !same(bitmap(c, `'${fam}', serif`, ch), bitmap(c, `serif`, ch));
};

const CONTROL = "noH0"; // chars every real Latin font ships — our litmus that it's actually loaded

// the UNIQUE printable characters in `text` that `family` genuinely can't render. Returns [] when
// uncertain (font not measurable yet) so it NEVER false-flags a covered font.
export function missingGlyphs(family: string, text: string): string[] {
  const c = ctx();
  if (!c) return []; // SSR / no canvas → assume coverage
  const fam = firstFamily(family);
  for (const ch of CONTROL) if (!renders(c, fam, ch)) return []; // not loaded → trust nothing
  const seen = new Set<string>();
  const missing: string[] = [];
  for (const ch of text) {
    if (ch.trim() === "" || seen.has(ch)) continue;
    seen.add(ch);
    if (!renders(c, fam, ch)) missing.push(ch);
  }
  return missing;
}

// re-render trigger: bumps once webfonts are ready (and again shortly after, for on-demand Google
// faces that resolve just after document.fonts.ready). Use as a useMemo dep so the check re-runs when
// a font finishes loading rather than sticking on a too-early verdict.
export function useGlyphReady(family: string): number {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let live = true;
    const bump = () => { if (live) setTick((t) => t + 1); };
    if (typeof document !== "undefined" && document.fonts) document.fonts.ready.then(bump);
    const t = window.setTimeout(bump, 700);
    return () => { live = false; window.clearTimeout(t); };
  }, [family]);
  return tick;
}
