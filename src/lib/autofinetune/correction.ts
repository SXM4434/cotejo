// Smart correction layer — the LEARNED residual on top of the cap-match RULE engine.
//
// The rule (deriveTune) predicts an optical tune from font metrics. Humans then nudge it in Tune mode;
// each divergence is logged as a labeled TuneExample (smart.ts). Once enough are collected, the trainer
// (scripts/train-finetune.mjs) fits a small ridge-regression of the residual `human − rule` per output
// and bakes the weights into correctionModel.ts. THIS file applies that residual at inference time.
//
// Until a model is trained it is a pure IDENTITY passthrough — the rule runs alone, and we never claim
// a model that doesn't exist ([[feedback_actual_ml_not_fake]]). The feature vector here MUST stay in
// lockstep with the trainer's featureVector(); they share the same order + definitions.
import type { RawMetrics, RoleConfig, Tune } from "./types";
import { CORRECTION_MODEL as M, type LinModel } from "./correctionModel";

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

export const FEATURES = [
  "capScale", "xScale", "candXRatio", "baseXRatio", "advRatio", "sizePx/100", "anchorIsCap",
] as const;

// metrics → feature vector. KEEP IN SYNC with scripts/train-finetune.mjs featureVector().
export function featureVector(role: RoleConfig, base: RawMetrics, cand: RawMetrics, sizePx: number): number[] {
  const capScale = cand.cap > 0 ? base.cap / cand.cap : 1;
  const xScale = cand.xHeight > 0 ? base.xHeight / cand.xHeight : capScale;
  return [
    capScale,
    xScale,
    cand.cap > 0 ? cand.xHeight / cand.cap : 0,
    base.cap > 0 ? base.xHeight / base.cap : 0,
    base.advance > 0 ? cand.advance / base.advance : 1,
    sizePx / 100,
    role.anchor === "cap" ? 1 : 0,
  ];
}

const predict = (m: LinModel | undefined, x: number[]): number =>
  m ? m.w.reduce((s, wi, i) => s + wi * (x[i] ?? 0), m.b) : 0;

export function hasCorrectionModel(): boolean { return M.trained === true; }
export function correctionInfo() { return M; }

// apply the learned residual ON TOP of the rule's tune. Identity when untrained (no model = no change).
export function applyCorrection(rule: Tune, feats: number[]): Tune {
  if (!M.trained) return rule;
  return {
    ...rule,
    size: round3(rule.size + predict(M.size, feats)),
    lh: round3(rule.lh + predict(M.lh, feats)),
    track: round4(rule.track + predict(M.track, feats)),
  };
}
