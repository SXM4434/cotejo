// REAL OpenType-feature support detection (AIRTIGHT-PASS B3/M2/F6). The OT proof renders each feature
// off → on; if the font doesn't implement the tag, off looks identical to on — which read as "broken"
// rather than "unsupported." This module answers "does THIS font actually do this feature?" by drawing
// the feature's demo string with the tag forced OFF vs ON into a canvas and comparing the pixels:
// identical pixels = the font has no glyphs for it. Cached per (family|tag), recomputed once the font
// loads. Powers the "not in this font" badge in the proof + the Inspect-font support flags.
import { OT_FEATURES } from "../data/proofStrings";

const SUPPORT = new Map<string, boolean>();
const k = (family: string, tag: string) => `${family}|${tag}`;
const esc = (f: string) => f.replace(/'/g, "\\'");

// draw the demo with the feature forced to `on` (0/1) and return the pixel buffer. The canvas is
// DOM-attached (offscreen) so the inline font-feature-settings is honored by the 2D context's font
// resolution — the same mechanism the metric harness uses for variation settings.
function renderPixels(family: string, tag: string, demo: string, on: 0 | 1): Uint8ClampedArray | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 260; c.height = 56;
  c.style.cssText = `position:absolute;left:-9999px;top:0;font-feature-settings:"${tag}" ${on};`;
  // liga needs font-variant-ligatures too — font-feature-settings alone doesn't reliably toggle the
  // default common ligatures (the M3 fix), so OFF really means off and the proof contrast is faithful.
  if (tag === "liga") c.style.fontVariantLigatures = on ? "normal" : "none";
  document.body.appendChild(c);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  let data: Uint8ClampedArray | null = null;
  if (ctx) {
    ctx.font = `34px '${esc(family)}'`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillText(demo.slice(0, 14), 2, 8);
    try { data = ctx.getImageData(0, 0, c.width, c.height).data; } catch { data = null; }
  }
  document.body.removeChild(c);
  return data;
}

function equal(a: Uint8ClampedArray, b: Uint8ClampedArray): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 4) if (a[i + 3] !== b[i + 3] || a[i] !== b[i]) return false; // alpha + R is enough for black text
  return true;
}

// undefined = couldn't determine (font not ready / canvas blocked). true/false = a real answer.
export function featureSupported(family: string, tag: string): boolean | undefined {
  const key = k(family, tag);
  if (SUPPORT.has(key)) return SUPPORT.get(key);
  const f = OT_FEATURES.find((x) => x.tag === tag);
  if (!f) return undefined;
  // don't measure (or cache) until the real face is loaded — otherwise we'd detect support on the
  // system fallback and cache a wrong answer forever. check() is false while a registered face loads.
  if (typeof document !== "undefined") {
    try { if (!document.fonts.check(`34px '${esc(family)}'`)) return undefined; } catch { /* keep going */ }
  }
  const off = renderPixels(family, tag, f.demo, 0);
  const on = renderPixels(family, tag, f.demo, 1);
  if (!off || !on) return undefined;
  const supported = !equal(off, on);
  SUPPORT.set(key, supported);
  return supported;
}

// every feature's support for a font, for the Inspect-font flags (only definitive answers).
export function supportedFeatures(family: string): { tag: string; label: string; supported: boolean }[] {
  return OT_FEATURES.map((f) => ({ tag: f.tag, label: f.label, supported: featureSupported(family, f.tag) === true }));
}
