// Auto-fine-tune engine — types. Per docs/type-tool/04-autofinetune-engine.md §6.
// Framework-agnostic core; the tool product's differentiator (fair cap-match).
// The hand-baked AuditionContext.DERIVED_TUNES become live-computed here.

export type RoleKey = "display" | "editorial" | "body" | string;

export interface Tune {
  size: number; // multiplier on the base/locked px
  lh: number; // multiplier on locked line-height (= 1/size by default)
  track: number; // em delta added to locked tracking
  wght?: number; // optional weight delta
  axes?: Record<string, number>; // variable-axis values the candidate renders at
}

export const IDENTITY_TUNE: Tune = { size: 1, lh: 1, track: 0 };

export interface RoleConfig {
  key: RoleKey;
  anchor: "cap" | "cap-x"; // display ⇒ 'cap'; text/editorial/body ⇒ 'cap-x'
  capWeight?: number; // blend weight on cap for 'cap-x' (default 0.6)
  respectWrap?: boolean; // run the wrap-parity + tier-budget pass
  measureString?: string; // representative line for wrap parity
  xGlyph?: string; // override 'x' (e.g. 'o') for odd faces
  capGlyph?: string; // override 'H'
  tierBudget?: number; // max size deviation for wrap bias (default 0.05)
}

export interface MeasureOpts {
  weight?: number;
  axes?: Record<string, number>;
  capGlyph?: string;
  xGlyph?: string;
}

export interface RawMetrics {
  cap: number;
  xHeight: number;
  advance: number;
  capGlyph: string;
  xGlyph: string;
}

export interface DeriveResult extends Tune {
  capScale: number;
  xScale: number;
  wrapsPlusLine?: boolean; // flagged when outside tier budget
  noLowercase?: boolean;
  allCaps?: boolean;
  metricsUnavailable?: boolean;
}
