// SMART LAYER — visual/optical self-check. After the rule engine derives a tune,
// VERIFY it instead of trusting the math: render the candidate AT the tuned size
// and re-measure its cap-height against the base's rendered cap. Per Sebs
// (2026-06-20): "a visual check should happen when auto-tune is clicked."
//
// This is the SMART layer (deterministic self-check) — distinct from the SCRIPTS
// (raw measurement, ./measure) and the ML layer (trained correction, ./smart).
// The ghost/difference overlay is the human-eye version of this check; this is
// the automated one. A failed check is ALSO a labeled signal for the ML layer
// (the rule produced an optically-wrong tune here).

import { measureFont } from "./measure";
import type { RawMetrics, Tune } from "./types";

export interface VerifyResult {
  baseCapPx: number;
  candCapPx: number; // candidate's cap-height as RENDERED at the tuned size
  deltaPct: number; // |cand − base| / base
  pass: boolean; // within tolerance
  tolerance: number;
  // wrap parity is a secondary read (advance can reflow even at a perfect cap match)
  advanceRatio?: number;
}

// Re-measure the candidate at the tuned size; compare rendered cap-heights.
export async function verifyCapMatch(
  candFamily: string,
  base: RawMetrics,
  tune: Tune,
  baseSizePx: number,
  opts: { tolerance?: number; candWeight?: number; candAxes?: Record<string, number> } = {},
): Promise<VerifyResult> {
  const tolerance = opts.tolerance ?? 0.02; // 2% optical tolerance
  const cand = await measureFont(candFamily, { weight: opts.candWeight, axes: opts.candAxes });
  const baseCapPx = base.cap * baseSizePx;
  const candSizePx = baseSizePx * tune.size;
  const candCapPx = cand ? cand.cap * candSizePx : NaN;
  const deltaPct = isFinite(candCapPx) ? Math.abs(candCapPx - baseCapPx) / baseCapPx : Infinity;
  const advanceRatio = cand ? (cand.advance * candSizePx) / (base.advance * baseSizePx) : undefined;
  return { baseCapPx, candCapPx, deltaPct, pass: deltaPct <= tolerance, tolerance, advanceRatio };
}
