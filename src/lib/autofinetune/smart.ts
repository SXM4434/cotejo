// Smart layer — data spine. Per docs/type-tool/07-smart-layer.md.
// The cap-match is a RULE ENGINE; this only COLLECTS labeled examples (rule vs
// human) so a REAL model can be trained later. No model here yet — collection ≠
// a trained model. ([[feedback_actual_ml_not_fake]], [[feedback_keep_feeding_smart_ml]])

import type { RawMetrics, RoleKey, Tune } from "./types";

export interface TuneExample {
  ts: number; // stamped by the caller (Date.now is unavailable in some contexts)
  role: RoleKey;
  anchor: "cap" | "cap-x";
  base: { cap: number; xHeight: number; advance: number; weight?: number; axes?: Record<string, number> };
  cand: { cap: number; xHeight: number; advance: number; weight?: number; axes?: Record<string, number> };
  sizePx: number;
  tRule: Tune; // what the rule engine predicted
  tHuman: Tune; // what the user kept after nudging
}

const KEY = "type-tool.tune-examples.v1";

function read(): TuneExample[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(rows: TuneExample[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
}

const metricRow = (m: RawMetrics, weight?: number, axes?: Record<string, number>) => ({
  cap: m.cap,
  xHeight: m.xHeight,
  advance: m.advance,
  weight,
  axes,
});

// Call this whenever a user override diverges from the rule's auto value.
// Logging is best-effort and never throws into the render path.
export function logTuneExample(ex: TuneExample): void {
  try {
    // skip no-ops: if the human kept the rule's value exactly, it's not a label.
    const same =
      ex.tRule.size === ex.tHuman.size &&
      ex.tRule.lh === ex.tHuman.lh &&
      ex.tRule.track === ex.tHuman.track;
    if (same) return;
    const rows = read();
    rows.push(ex);
    write(rows);
    sendExample(ex); // ALSO send to the shared store → the model can train on REAL usage across all users
  } catch {
    /* never break the UI over telemetry */
  }
}

// fire-and-forget POST to the collection backend (/api/collect). Best-effort: with no backend (local dev
// or store not provisioned) it silently no-ops. keepalive so it survives a navigation. This is what makes
// the smart layer train on USERS, not just one browser.
function sendExample(ex: TuneExample): void {
  try {
    if (typeof fetch === "undefined") return;
    fetch("/api/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ex), keepalive: true }).catch(() => {});
  } catch { /* never break the UI over telemetry */ }
}

export function buildExample(args: {
  ts: number;
  role: RoleKey;
  anchor: "cap" | "cap-x";
  base: RawMetrics;
  cand: RawMetrics;
  baseWeight?: number;
  candWeight?: number;
  baseAxes?: Record<string, number>;
  candAxes?: Record<string, number>;
  sizePx: number;
  tRule: Tune;
  tHuman: Tune;
}): TuneExample {
  return {
    ts: args.ts,
    role: args.role,
    anchor: args.anchor,
    base: metricRow(args.base, args.baseWeight, args.baseAxes),
    cand: metricRow(args.cand, args.candWeight, args.candAxes),
    sizePx: args.sizePx,
    tRule: args.tRule,
    tHuman: args.tHuman,
  };
}

export function exportJsonl(): string {
  return read()
    .map((r) => JSON.stringify(r))
    .join("\n");
}

export function exampleCount(): number {
  return read().length;
}

export function clearExamples(): void {
  write([]);
}
