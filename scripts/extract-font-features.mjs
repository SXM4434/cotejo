#!/usr/bin/env node
// Feature extraction for the FONT CLASSIFIER (the "ML layer" that predicts a font's meta from how it
// actually renders). Loads Google Fonts in a real browser, measures category-DISCRIMINATING features
// from the rendered glyphs (NOT the category itself — that's the label), and writes a labeled dataset.
// The 1,936 Google families each carry a category label (real data), so this is genuine supervised ML.
//
//   node scripts/extract-font-features.mjs [perCategory=60]
//   → datasets/font-features.jsonl  (one {family, category, features...} per line, written incrementally)
//
// Features (all category-agnostic measurements): xRatio, monoRatio (i/m advance ≈1 ⇒ monospace),
// widthRatio (n width ÷ cap), capStretch (H width ÷ cap), inkDensity (weight/darkness), serifProxy
// (ink-width of 'I' ÷ cap — serif 'I' is wide from its serifs, sans 'I' is a narrow stem).
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
// playwright is installed in the repo's lab-screenshots tooling, not in this app
const require = createRequire("/Users/sebs/Desktop/Projects/portfolio/tools/lab-screenshots/");
const { chromium } = require("playwright");

const __dirname = dirname(fileURLToPath(import.meta.url));
const PER = Number(process.argv[2] || 60);
const OUT = resolve(__dirname, "../datasets/font-features.jsonl");
mkdirSync(resolve(__dirname, "../datasets"), { recursive: true });

// --- read the full Google directory from the app's bundled data ---
const src = readFileSync(resolve(__dirname, "../src/data/googleFontsAll.ts"), "utf8");
const m = src.match(/GOOGLE_FONTS_ALL[^=]*=\s*JSON\.parse\((".*?")\)\s*;/s);
if (!m) { console.error("could not parse googleFontsAll.ts"); process.exit(1); }
const fonts = JSON.parse(eval(m[1])); // m[1] is a JS string literal → the JSON array string

// stratified sample: up to PER per category
const byCat = {};
for (const f of fonts) (byCat[f.category] ||= []).push(f);
const sample = [];
for (const cat of Object.keys(byCat)) sample.push(...byCat[cat].slice(0, PER));
console.log(`Sampling ${sample.length} fonts (${PER}/category) across ${Object.keys(byCat).join(", ")}`);

writeFileSync(OUT, ""); // fresh

const page_measure = (family) => {
  const c = document.createElement("canvas"); c.width = 900; c.height = 400;
  const ctx = c.getContext("2d");
  const EM = 200;
  ctx.font = `${EM}px '${family}'`;
  const asc = (s) => { const t = ctx.measureText(s); return (t.actualBoundingBoxAscent || 0) / EM; };
  const adv = (s) => ctx.measureText(s).width / EM;
  const cap = asc("H"), xHeight = asc("x");
  if (!cap || cap < 0.3 || cap > 1.0) return null; // tofu / failed load
  const mI = ctx.measureText("I");
  const inkWidthI = ((mI.actualBoundingBoxLeft || 0) + (mI.actualBoundingBoxRight || 0)) / EM;
  // ink density of "Hamburg" — dark-pixel fraction of its bbox (a weight/darkness proxy)
  ctx.clearRect(0, 0, 900, 400); ctx.fillStyle = "#000"; ctx.textBaseline = "alphabetic";
  ctx.fillText("Hamburg", 20, 280);
  const mm = ctx.measureText("Hamburg");
  const w = Math.min(860, Math.ceil(mm.width)), top = Math.max(0, 280 - Math.ceil(mm.actualBoundingBoxAscent || 150));
  const h = Math.min(380 - top, Math.ceil((mm.actualBoundingBoxAscent || 150) + (mm.actualBoundingBoxDescent || 40)));
  let dark = 0, tot = 0;
  if (w > 0 && h > 0) { const d = ctx.getImageData(20, top, w, h).data; for (let p = 3; p < d.length; p += 4) { tot++; if (d[p] > 40) dark++; } }
  return {
    cap: +cap.toFixed(4), xHeight: +xHeight.toFixed(4),
    xRatio: +(xHeight / cap).toFixed(4),
    monoRatio: +(adv("i") / adv("m")).toFixed(4),
    widthRatio: +(adv("n") / cap).toFixed(4),
    capStretch: +(adv("H") / cap).toFixed(4),
    serifProxy: +(inkWidthI / cap).toFixed(4),
    inkDensity: +(tot ? dark / tot : 0).toFixed(4),
  };
};

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.setContent("<!doctype html><meta charset=utf8><body></body>");
  let ok = 0, fail = 0;
  for (const f of sample) {
    try {
      // addStyleTag AWAITS the stylesheet load (the manual link-inject raced the fetch → fallback font)
      await page.addStyleTag({ url: `https://fonts.googleapis.com/css2?family=${f.family.replace(/ /g, "+")}&display=block` });
      await page.evaluate((fam) => document.fonts.load(`200px '${fam}'`).then(() => document.fonts.load(`700 200px '${fam}'`)), f.family);
      await page.waitForTimeout(140);
      const feat = await page.evaluate(page_measure, f.family);
      if (feat) { appendFileSync(OUT, JSON.stringify({ family: f.family, category: f.category, ...feat }) + "\n"); ok++; }
      else fail++;
    } catch { fail++; }
    if ((ok + fail) % 25 === 0) console.log(`  ${ok + fail}/${sample.length}  (ok ${ok}, skip ${fail})`);
  }
  await b.close();
  console.log(`\nDone. ${ok} fonts measured → ${OUT}  (${fail} skipped: failed load / tofu)`);
})();
