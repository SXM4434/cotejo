// Auto-fine-tune engine — in-browser metric measurement. Ports the proven
// harness (tools/lab-screenshots/measure-type-metrics.js + measure-scrapbook-faces.js):
// canvas actualBoundingBoxAscent at 1000px → size-independent per-em ratios.
// Per docs/type-tool/04-autofinetune-engine.md §1.

import type { MeasureOpts, RawMetrics } from "./types";

// ── synchronous metrics cache ────────────────────────────────────────────────────────────────────
// measureFont is async (it waits for the face to load), but the recommendation engine is synchronous
// and needs a face's x-height ratio NOW. So every successful measure is cached here, keyed by the
// REGISTERED family + weight + axes, and the recommender reads it via cachedMetrics(). The cache fills
// as the user auditions fonts (Compare measures every candidate); until a font is measured the
// recommender falls back to a category-typical xRatio. Only real (loaded-face) metrics are cached —
// never a system fallback.
const METRICS = new Map<string, RawMetrics>();
const cacheKey = (family: string, opts: MeasureOpts) => `${family}|${opts.weight ?? 400}|${opts.axes ? JSON.stringify(opts.axes) : ""}`;
export function cachedMetrics(family: string, weight = 400): RawMetrics | undefined {
  // weight-agnostic-ish: try the exact key, then any key for this family (xRatio barely moves by weight).
  const exact = METRICS.get(`${family}|${weight}|`);
  if (exact) return exact;
  for (const [k, v] of METRICS) if (k.startsWith(`${family}|`)) return v;
  return undefined;
}

function cssEscape(family: string): string {
  // family is wrapped in quotes by the caller; escape any embedded quotes.
  return family.replace(/'/g, "\\'");
}

function variationSettingsString(axes?: Record<string, number>): string {
  if (!axes) return "";
  // wght goes via font-weight; everything else here.
  return Object.entries(axes)
    .filter(([tag]) => tag !== "wght")
    .map(([tag, v]) => `'${tag}' ${v}`)
    .join(", ");
}

// Returns metrics as ratios of the em (1000px reference). null on failure.
export function measureGlyphMetrics(family: string, opts: MeasureOpts = {}): RawMetrics | null {
  const { weight = 400, axes, capGlyph = "H", xGlyph = "x" } = opts;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.textBaseline = "alphabetic";

  // font-variation-settings is NOT expressible in ctx.font — set it on the
  // canvas element so the 2D context inherits it (per §1.1).
  const vs = variationSettingsString(axes);
  if (vs) canvas.style.fontVariationSettings = vs;
  ctx.font = `${weight} 1000px '${cssEscape(family)}'`;

  const H = ctx.measureText(capGlyph);
  const X = ctx.measureText(xGlyph);
  const cap = H.actualBoundingBoxAscent / 1000;
  const xHeight = X.actualBoundingBoxAscent / 1000;
  const advance = ctx.measureText("Handgloves").width / 1000;

  // Sanity gate: a real Latin face has cap in ~[0.6,0.82]. Reject tofu/icon fonts.
  if (!isFinite(cap) || !isFinite(xHeight) || cap <= 0.01 || cap > 1.0) return null;
  return { cap, xHeight, advance, capGlyph, xGlyph };
}

// check() is authoritative; load()'s return can lie for variable css2 faces (§1.2).
export async function ensureFontLoaded(family: string, weight = 400): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const spec = `${weight} 100px '${cssEscape(family)}'`;
  try {
    await (document as Document).fonts.load(spec, "Hx");
  } catch {
    /* keep going */
  }
  return (document as Document).fonts.check(spec, "Hx");
}

// DOM fallback when canvas metrics are blocked (§1.4 step 2).
function domMeasure(family: string, opts: MeasureOpts): RawMetrics | null {
  if (typeof document === "undefined") return null;
  const { weight = 400, axes, capGlyph = "H", xGlyph = "x" } = opts;
  const span = document.createElement("span");
  span.style.cssText = `position:absolute;visibility:hidden;font-size:1000px;font-weight:${weight};font-family:'${cssEscape(family)}';`;
  if (axes) span.style.fontVariationSettings = variationSettingsString(axes);
  document.body.appendChild(span);
  span.textContent = capGlyph;
  const cap = span.getBoundingClientRect().height / 1000;
  span.textContent = xGlyph;
  const xHeight = span.getBoundingClientRect().height / 1000;
  span.textContent = "Handgloves";
  const advance = span.getBoundingClientRect().width / 1000;
  document.body.removeChild(span);
  if (!isFinite(cap) || cap <= 0.01 || cap > 1.5) return null;
  return { cap, xHeight, advance, capGlyph, xGlyph };
}

// ensure FIRST → measure → DOM fallback → null (§1.4). Ensuring before the first
// measure matters: a not-yet-loaded face makes canvas silently fall back to a
// system font whose metrics PASS the sanity gate — so we'd cache wrong numbers
// without ever retrying. Wait for the real face, then measure.
export async function measureFont(family: string, opts: MeasureOpts = {}): Promise<RawMetrics | null> {
  const ck = cacheKey(family, opts);
  const hit = METRICS.get(ck);
  if (hit) return hit;
  if (typeof document !== "undefined") {
    try {
      await (document as Document).fonts.ready;
    } catch {
      /* keep going */
    }
  }
  // HONOR the load check (the old code discarded it and measured a fallback anyway → the cap-match
  // lied for any not-yet-loaded face). If the face isn't loaded, give it one more beat (a just-added
  // Google <link> or a decoding upload), then bail to null rather than caching system-font metrics.
  let ok = await ensureFontLoaded(family, opts.weight);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 140));
    ok = await ensureFontLoaded(family, opts.weight);
    if (!ok) return null;
  }
  const m = measureGlyphMetrics(family, opts) ?? domMeasure(family, opts);
  if (m) METRICS.set(ck, m);
  return m;
}
