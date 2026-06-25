#!/usr/bin/env node
// Trainer for the auto-fine-tune CORRECTION model (the "smart layer" on top of the cap-match rule).
//
//   1. In Cotejo's Tune mode, calibrate pairings and hit "apply" — each divergence from the rule's
//      cap-match default is logged to localStorage (smart.ts). Export the JSONL (the app exposes
//      window.cotejoTuneData.export(), or the "export calibration data" affordance in Tune).
//   2. Save it to  datasets/tune-examples.jsonl  (append over time; the set grows through real use).
//   3. Run:  node scripts/train-finetune.mjs [path/to/data.jsonl]
//
// It fits a small ridge regression of the residual (human − rule) per output (size / lh / track),
// holds out 20% to report honest RMSE, and — only if there are enough examples — bakes the weights
// into src/lib/autofinetune/correctionModel.ts. Below the threshold it reports how many more it needs
// and writes nothing. No fabrication: with no data, the rule keeps running alone.
//
// Pure Node, no dependencies. Real train/eval/inference — the model that ships is the model that fit.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = process.argv[2] || resolve(__dirname, "../datasets/tune-examples.jsonl");
const OUT = resolve(__dirname, "../src/lib/autofinetune/correctionModel.ts");
const MIN_EXAMPLES = 24;     // below this we don't trust a fit — keep the rule alone
const RIDGE = 1e-3;          // L2 — keeps the small-sample solve stable
const TEST_FRAC = 0.2;

const FEATURES = ["capScale", "xScale", "candXRatio", "baseXRatio", "advRatio", "sizePx/100", "anchorIsCap"];

// MUST match src/lib/autofinetune/correction.ts featureVector()
function featureVector(ex) {
  const b = ex.base, c = ex.cand;
  const capScale = c.cap > 0 ? b.cap / c.cap : 1;
  const xScale = c.xHeight > 0 ? b.xHeight / c.xHeight : capScale;
  return [
    capScale,
    xScale,
    c.cap > 0 ? c.xHeight / c.cap : 0,
    b.cap > 0 ? b.xHeight / b.cap : 0,
    b.advance > 0 ? c.advance / b.advance : 1,
    ex.sizePx / 100,
    ex.anchor === "cap" ? 1 : 0,
  ];
}

// solve (A)x = y for small symmetric A via Gaussian elimination w/ partial pivot
function solve(A, y) {
  const n = A.length;
  const M = A.map((row, i) => [...row, y[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-9;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-9));
}

// ridge regression with a (non-penalised) bias term → { w:[...], b }
function fitRidge(X, y) {
  const n = X.length, d = X[0].length;
  const Xb = X.map((row) => [...row, 1]); // bias column
  const k = d + 1;
  const A = Array.from({ length: k }, () => new Array(k).fill(0));
  const Yv = new Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < k; a++) {
      Yv[a] += Xb[i][a] * y[i];
      for (let b = 0; b < k; b++) A[a][b] += Xb[i][a] * Xb[i][b];
    }
  }
  for (let a = 0; a < d; a++) A[a][a] += RIDGE * n; // penalise weights, not the bias (index d)
  const sol = solve(A, Yv);
  return { w: sol.slice(0, d), b: sol[d] };
}

const rmse = (rows, key, model) => {
  if (!rows.length) return 0;
  const se = rows.reduce((s, r) => { const p = model ? model.w.reduce((a, wi, i) => a + wi * r.x[i], model.b) : 0; const e = r[key] - p; return s + e * e; }, 0);
  return Math.sqrt(se / rows.length);
};

function main() {
  if (!existsSync(DATA)) {
    console.error(`No dataset at ${DATA}\nExport calibration data from Cotejo's Tune mode first, then save it there.`);
    process.exit(1);
  }
  const rows = readFileSync(DATA, "utf8").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
  const data = rows
    .filter((ex) => ex && ex.base && ex.cand && ex.tRule && ex.tHuman)
    .map((ex) => ({
      x: featureVector(ex),
      size: ex.tHuman.size - ex.tRule.size,
      lh: ex.tHuman.lh - ex.tRule.lh,
      track: ex.tHuman.track - ex.tRule.track,
    }));

  console.log(`Loaded ${data.length} usable examples (from ${rows.length} rows) · features: ${FEATURES.join(", ")}`);

  if (data.length < MIN_EXAMPLES) {
    const model = { trained: false, n: data.length };
    writeModel(model);
    console.log(`\nNeed ${MIN_EXAMPLES - data.length} more before training a model (have ${data.length}/${MIN_EXAMPLES}).`);
    console.log(`Wrote correctionModel.ts as identity passthrough — the cap-match rule keeps running alone. Honest: no model claimed without data.`);
    return;
  }

  // deterministic-ish shuffle (seeded LCG) so reruns are reproducible
  let seed = 1337;
  const rng = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const shuffled = [...data].sort(() => rng() - 0.5);
  const cut = Math.max(1, Math.floor(shuffled.length * TEST_FRAC));
  const test = shuffled.slice(0, cut), train = shuffled.slice(cut);

  const model = { trained: true, n: data.length, features: FEATURES, trainedAt: new Date().toISOString(), rmseBefore: {}, rmseAfter: {} };
  for (const key of ["size", "lh", "track"]) {
    const fit = fitRidge(train.map((r) => r.x), train.map((r) => r[key]));
    model[key] = { w: fit.w.map((v) => +v.toFixed(6)), b: +fit.b.toFixed(6) };
    model.rmseBefore[key] = +rmse(test, key, null).toFixed(5);   // rule alone (residual spread)
    model.rmseAfter[key] = +rmse(test, key, fit).toFixed(5);     // after the learned correction
  }

  writeModel(model);
  console.log(`\nTrained on ${train.length}, tested on ${test.length}. Held-out RMSE of the residual (lower = the model explains more of the human nudge):`);
  for (const key of ["size", "lh", "track"]) console.log(`  ${key.padEnd(6)} rule-alone ${model.rmseBefore[key]}  →  +correction ${model.rmseAfter[key]}`);
  console.log(`\nBaked → src/lib/autofinetune/correctionModel.ts (trained:true). Rebuild to ship it.`);
}

function writeModel(model) {
  const body = `// Trained correction model — AUTO-GENERATED by scripts/train-finetune.mjs. Do not hand-edit.
// 'trained:false' = no model yet (identity passthrough); the cap-match RULE runs alone until enough
// labeled TuneExamples are collected and the trainer fits a residual. ([[feedback_actual_ml_not_fake]])
export type LinModel = { w: number[]; b: number };
export type CorrectionModelFile = {
  trained: boolean;
  n: number;
  features?: string[];
  size?: LinModel; lh?: LinModel; track?: LinModel;
  rmseBefore?: Record<string, number>;
  rmseAfter?: Record<string, number>;
  trainedAt?: string;
};

export const CORRECTION_MODEL: CorrectionModelFile = ${JSON.stringify(model, null, 2)};
`;
  writeFileSync(OUT, body);
}

main();
