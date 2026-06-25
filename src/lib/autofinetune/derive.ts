// Auto-fine-tune engine — derivation + free-base recompute + override merge.
// Per docs/type-tool/04-autofinetune-engine.md §2–§4. Pure functions; the same
// math the harness baked into DERIVED_TUNES, now live.

import type { DeriveResult, RawMetrics, RoleConfig, Tune } from "./types";
import { IDENTITY_TUNE } from "./types";

const round3 = (n: number) => Math.round(n * 1000) / 1000;

// base + candidate → tune. Display = cap-anchor; text = 0.6·cap + 0.4·x blend (§2.1).
export function deriveTune(role: RoleConfig, base: RawMetrics, cand: RawMetrics): DeriveResult {
  const capScale = base.cap / cand.cap; // >1 ⇒ cand caps smaller ⇒ size up
  const xScale = cand.xHeight > 0 ? base.xHeight / cand.xHeight : capScale;

  // All-caps / no-lowercase faces: ignore the x term (§5).
  const allCaps = cand.xHeight > 0 && cand.xHeight / cand.cap > 0.92;
  const noLowercase = !(cand.xHeight > 0);
  const forceCap = allCaps || noLowercase;

  const capWeight = role.capWeight ?? 0.6;
  let size: number;
  if (role.anchor === "cap" || forceCap) {
    size = capScale;
  } else {
    size = capWeight * capScale + (1 - capWeight) * xScale;
  }

  const lh = 1 / size; // preserve line-box mass / vertical rhythm
  let track = 0;
  let wrapsPlusLine = false;

  // Wrap parity + tier-integrity budget (§2.3), only when asked + we have a string.
  if (role.respectWrap && role.measureString) {
    const advAtMatch = (cand.advance * size) / base.advance;
    if (Math.abs(advAtMatch - 1) > 0.02) {
      const sizeForWrap = (base.advance / cand.advance) * 1; // size that equalizes advance
      const dev = Math.abs(sizeForWrap - size) / size;
      const budget = role.tierBudget ?? 0.05;
      if (dev <= budget) size = sizeForWrap;
      else wrapsPlusLine = true;
    }
  }

  return {
    size: round3(size),
    lh: round3(1 / size === lh ? lh : 1 / size),
    track,
    capScale: round3(capScale),
    xScale: round3(xScale),
    wrapsPlusLine,
    noLowercase,
    allCaps,
  };
}

// §3 — free base: whose metrics are the denominator. Recompute the affected role only.
export function recomputeRole(
  role: RoleConfig,
  baseId: string,
  candidates: { id: string }[],
  metrics: Map<string, RawMetrics>,
): Record<string, DeriveResult> {
  const base = metrics.get(baseId);
  const out: Record<string, DeriveResult> = {};
  for (const cand of candidates) {
    if (cand.id === baseId) {
      out[cand.id] = { ...IDENTITY_TUNE, capScale: 1, xScale: 1 };
      continue;
    }
    const cm = metrics.get(cand.id);
    out[cand.id] =
      base && cm
        ? deriveTune(role, base, cm)
        : { ...IDENTITY_TUNE, capScale: 1, xScale: 1, metricsUnavailable: true };
  }
  return out;
}

// §4 — effective tune = auto ⊕ override, field-by-field (untouched fields track auto).
export function effectiveTune(auto: Tune, override?: Partial<Tune>): Tune {
  if (!override) return auto;
  return {
    size: override.size ?? auto.size,
    lh: override.lh ?? auto.lh,
    track: override.track ?? auto.track,
    wght: override.wght ?? auto.wght,
    axes: { ...auto.axes, ...override.axes },
  };
}
