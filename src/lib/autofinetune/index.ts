// Auto-fine-tune engine — public surface. The tool product's differentiator,
// extracted from the audition lab's hand-baked tunes. See docs/type-tool/
// 04-autofinetune-engine.md (rule engine) + 07-smart-layer.md (the ML on top).

export * from "./types";
export { measureGlyphMetrics, ensureFontLoaded, measureFont, cachedMetrics } from "./measure";
export { deriveTune, recomputeRole, effectiveTune } from "./derive";
export { verifyCapMatch, type VerifyResult } from "./verify";
export {
  logTuneExample,
  buildExample,
  exportJsonl,
  exampleCount,
  clearExamples,
  type TuneExample,
} from "./smart";
// the trained correction on top of the rule (identity until a model is baked from collected data)
export { applyCorrection, featureVector, hasCorrectionModel, correctionInfo, FEATURES } from "./correction";
