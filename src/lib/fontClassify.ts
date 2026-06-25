// Font classifier — RUNTIME inference. Measures an uploaded font's rendered glyphs (the same 6
// features the model trained on: extract-font-features.mjs) and predicts its category with the baked
// softmax model (fontClassifierModel.ts, ~67% held-out). So an upload gets a REAL category instead of
// defaulting to "sans" — which then feeds metaFor → better pairing recommendations. ([[feedback_actual_ml_not_fake]])
import { FONT_CLASSIFIER } from "./fontClassifierModel";
import type { GFCategory } from "../data/googleFonts";

// canvas measurement — MUST match scripts/extract-font-features.mjs page_measure (feature order too).
function measureClassifierFeatures(family: string): number[] | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = 900; c.height = 400;
  const ctx = c.getContext("2d"); if (!ctx) return null;
  const EM = 200;
  ctx.font = `${EM}px '${family}'`;
  const asc = (s: string) => { const t = ctx.measureText(s); return (t.actualBoundingBoxAscent || 0) / EM; };
  const adv = (s: string) => ctx.measureText(s).width / EM;
  const cap = asc("H"), xHeight = asc("x");
  if (!cap || cap < 0.3 || cap > 1.0) return null; // tofu / not loaded
  const mI = ctx.measureText("I");
  const inkWidthI = ((mI.actualBoundingBoxLeft || 0) + (mI.actualBoundingBoxRight || 0)) / EM;
  ctx.clearRect(0, 0, 900, 400); ctx.fillStyle = "#000"; ctx.textBaseline = "alphabetic";
  ctx.fillText("Hamburg", 20, 280);
  const mm = ctx.measureText("Hamburg");
  const w = Math.min(860, Math.ceil(mm.width)), top = Math.max(0, 280 - Math.ceil(mm.actualBoundingBoxAscent || 150));
  const h = Math.min(380 - top, Math.ceil((mm.actualBoundingBoxAscent || 150) + (mm.actualBoundingBoxDescent || 40)));
  let dark = 0, tot = 0;
  if (w > 0 && h > 0) { const d = ctx.getImageData(20, top, w, h).data; for (let p = 3; p < d.length; p += 4) { tot++; if (d[p] > 40) dark++; } }
  return [
    xHeight / cap,            // xRatio
    adv("i") / adv("m"),      // monoRatio (≈1 ⇒ monospace)
    adv("n") / cap,           // widthRatio
    adv("H") / cap,           // capStretch
    inkWidthI / cap,          // serifProxy (serif 'I' is wide)
    tot ? dark / tot : 0,     // inkDensity (weight)
  ];
}

const softmax = (z: number[]): number[] => { const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((a, c) => a + c, 0); return e.map((v) => v / s); };

// predict a font's category from how it RENDERS. Returns null if it can't measure or isn't confident.
export function classifyCategory(family: string, minConfidence = 0.35): { category: GFCategory; confidence: number } | null {
  const M = FONT_CLASSIFIER;
  if (!M.W || !M.W.length) return null;
  const feats = measureClassifierFeatures(family);
  if (!feats) return null;
  const x = feats.map((v, j) => (v - M.mean[j]) / (M.std[j] || 1));
  const logits = M.W.map((wk, k) => wk.reduce((s, wi, j) => s + wi * x[j], M.b[k]));
  const p = softmax(logits);
  const k = p.indexOf(Math.max(...p));
  if (p[k] < minConfidence) return null;
  return { category: M.classes[k] as GFCategory, confidence: p[k] };
}
