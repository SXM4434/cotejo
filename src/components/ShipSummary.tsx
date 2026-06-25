// ShipSummary — "what actually ships". The export panel's confirmation: every role resolved to one
// line (font · px · line-height · tracking · weight · license), read straight from the role + scale +
// licence the same way the export does. Answers the recurring "did Tune actually bake in? what do I
// actually get?" anxiety BEFORE you copy — and surfaces the license per role right next to it.
import React from "react";
import { FACES, sizeAtViewport, roleRange, VP_MAX, type Role, type Scale } from "../state/SessionContext";
import { licenseOf } from "../lib/license";

const MONO = "var(--t-sans)";

export function ShipSummary({ roles, scale }: { roles: Role[]; scale: Scale }) {
  const cell: React.CSSProperties = { fontFamily: MONO, fontSize: 11, color: "var(--t-ink-2)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", padding: "2.5px 0", lineHeight: 1.3 };
  const head: React.CSSProperties = { ...cell, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t-ink-3)", paddingBottom: 4 };
  const r = (s: React.CSSProperties): React.CSSProperties => ({ ...s, textAlign: "right" });
  const dash = "·"; // an em-less placeholder for "default / not set" (in-face, not a stray glyph)
  return (
    <div style={{ marginBottom: 14, boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--t-ink) 8%, transparent)", borderRadius: "var(--t-r-block)", padding: "10px 13px 11px", background: "var(--t-surface-2)" }}>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)", marginBottom: 8 }}>
        What ships
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(48px,auto) minmax(0,1fr) auto auto auto auto auto", columnGap: 13, alignItems: "baseline" }}>
        <span style={head}>role</span><span style={head}>font</span>
        <span style={r(head)}>px</span><span style={r(head)}>lh</span><span style={r(head)}>track</span><span style={r(head)}>wt</span><span style={head}>license</span>
        {roles.map((role) => {
          const face = FACES.find((f) => f.id === role.fontId);
          const rng = roleRange(role, scale);
          const size = rng ? `${rng.min}–${rng.max}` : `${sizeAtViewport(role, scale, VP_MAX)}`;
          const lic = face ? licenseOf(face) : null;
          return (
            <React.Fragment key={role.id}>
              <span style={{ ...cell, color: "var(--t-ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{role.name}</span>
              <span style={{ ...cell, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{face?.label ?? "—"}</span>
              <span style={r(cell)}>{size}</span>
              <span style={r(cell)}>{role.lineHeight ?? dash}</span>
              <span style={r(cell)}>{role.tracking != null ? `${role.tracking}` : dash}</span>
              <span style={r(cell)}>{role.weight ?? dash}</span>
              <span style={{ ...cell, color: lic && !lic.ship ? "var(--t-ink)" : "var(--t-ink-3)", overflow: "hidden", textOverflow: "ellipsis" }} title={lic?.label}>{lic?.short ?? "—"}</span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
