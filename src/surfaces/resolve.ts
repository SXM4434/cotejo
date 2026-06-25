// Shared surface resolution. Every surface declares FIELDS, each tagged with a role KIND;
// this maps kind → the user's role of that kind and resolves {family,size} at the lens
// viewport. The SAME mapping for every surface — so a candidate swap, a whole-direction
// override, and viewport preview all work identically everywhere. A surface only uses the
// kinds it needs; across all surfaces every kind has a home (docs/type-tool/09 · 2026-06-23).
import type { Role, Scale, RoleKind } from "../state/SessionContext";
import { sizeAtViewport, KIND_STEP } from "../state/SessionContext";
import { featureSupported } from "../lib/otSupport";

export type Resolved = { family: string; size: number; featureSettings?: string };

// LEADING scales with MEASURE: a longer line needs more line-space for the eye to track back to the
// start of the next line (Bringhurst §2.2.2; Butterick ~120–145%). Body-range model anchored so the
// default measure (66) lands ~1.60, widening toward 1.8 and tightening toward 1.42. The reading
// surfaces use it for running body, and the dock shows the suggested value beside the measure.
export function leadingForMeasure(measure: number): number {
  const lh = 1.46 + 0.0065 * (measure - 45);
  return Math.round(Math.max(1.42, Math.min(1.8, lh)) * 100) / 100;
}

// the role's OpenType features → a font-feature-settings string (or undefined for defaults). When the
// rendered font's measure-family is known, features the font DOESN'T implement are dropped (B-C2) so a
// surface never silently emits a no-op tag — only definitively-unsupported tags are filtered (an
// unknown/still-loading answer is kept).
export const roleFeatureSettings = (role: Role, measureFamily?: string): string | undefined => {
  const feats = role.features ?? [];
  if (!feats.length) return undefined;
  const kept = measureFamily ? feats.filter((t) => featureSupported(measureFamily, t) !== false) : feats;
  return kept.length ? kept.map((t) => `"${t}" 1`).join(", ") : undefined;
};
// `role` = which role KIND this field wants; `kind` = line vs paragraph (layout, unchanged).
export type SurfaceField = { id: string; role: RoleKind; label: string; kind: "line" | "para" };

// map a target role KIND → the user's role of that kind. If they didn't define that kind, fall
// back to the nearest role by SIZE (canonical step), so a sparse role set still renders — that
// collapse is honest signal, not an error (a 3-role setup shows heading→display, label→caption).
export function pickRoleFor(roles: Role[], target: RoleKind): Role {
  const exact = roles.find((r) => r.kind === target);
  if (exact) return exact;
  const ts = KIND_STEP[target];
  return [...roles].sort((a, b) => Math.abs(a.step - ts) - Math.abs(b.step - ts))[0];
}

// resolve every field to {family,size} from the frame AT viewport `vw`. `swap` overrides one
// role (focus role → candidate at its cap-matched size); `fontForRole` overrides every role
// (a whole DIRECTION / the live stack). Else the base stack.
//   · capMatch(role, fontId) → a size multiplier that cap-matches the rendered font to the role's
//     BASE font at the role's anchor (display=cap, body=x-height). Without it the surfaces rendered
//     every swapped font at the role's RAW size — contradicting the tool's "one cap height" promise
//     on the very surfaces you compare on (B-C1/B7/H4). Defaults to 1 (no-op) until metrics are known.
//   · measureOf(fontId) → the rendered font's measure-family, so unsupported OpenType tags are dropped.
export function resolveFieldsFonts(
  fields: SurfaceField[], roles: Role[], scale: Scale, vw: number, famOf: (fontId: string) => string,
  swap?: { roleId: string; family: string; sizeMul: number },
  fontForRole?: (role: Role) => string,
  opts?: { capMatch?: (role: Role, fontId: string) => number; measureOf?: (fontId: string) => string },
): Record<string, Resolved> {
  const out: Record<string, Resolved> = {};
  for (const f of fields) {
    const role = pickRoleFor(roles, f.role);
    const size = sizeAtViewport(role, scale, vw);
    if (swap && role.id === swap.roleId) {
      out[f.id] = { family: swap.family, size: Math.round(size * swap.sizeMul), featureSettings: roleFeatureSettings(role) };
    } else {
      const fontId = fontForRole ? fontForRole(role) : role.fontId;
      const mul = opts?.capMatch ? opts.capMatch(role, fontId) : 1;
      const featureSettings = roleFeatureSettings(role, opts?.measureOf?.(fontId)); // production OT, support-filtered
      out[f.id] = { family: famOf(fontId), size: Math.max(1, Math.round(size * mul)), featureSettings };
    }
  }
  return out;
}
