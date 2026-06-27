// LowerThirdSurface — a VIDEO surface (the name/role chyron a video editor keys into the lower-left
// of an interview). It owns the workhorse stress case: a prominent NAME over a fine uppercase ROLE
// label, light on dark, anchored bottom-left behind a clean broadcast accent bar. This is the
// caption-tier-meets-subheading tension that runs through every talking-head cut. Same contract:
// presentational, role-tokened, handed already-resolved fonts so the SAME component renders both
// sides of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";
import { VideoFrame, VID_INK, VID_INK_2 } from "./videoChrome";

export const LOWERTHIRD_FIELDS: SurfaceField[] = [
  { id: "name", role: "subheading", label: "Name", kind: "line" },
  { id: "role", role: "label", label: "Role", kind: "line" },
];

export const LOWERTHIRD_PLACEHOLDERS: Record<string, string> = {
  name: "Dr. Maya Okonkwo",
  role: "MARINE BIOLOGIST · WOODS HOLE",
};

const MONO = "var(--t-mono)";

export function LowerThirdSurface({
  fonts, content, editable, onEdit, onFieldClick,
}: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? LOWERTHIRD_PLACEHOLDERS[id];
  const edit = onEdit ?? (() => {});

  const nameS: React.CSSProperties = {
    fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.01em", color: VID_INK, margin: 0,
  };
  const roleS: React.CSSProperties = {
    fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase",
    color: VID_INK_2, fontWeight: 500, margin: "7px 0 0",
  };

  const Field = ({ id, style }: { id: string; style: React.CSSProperties }) => {
    const font = fonts[id];
    const merged = { ...style, fontFamily: font.family, fontSize: font.size, fontFeatureSettings: font.featureSettings };
    if (editable) return <EditableField id={id} value={val(id)} font={font} onEdit={edit} style={style} />;
    if (onFieldClick)
      return (
        <div
          role="button" tabIndex={0} className="t-playfield"
          onClick={(e) => onFieldClick(id, e)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFieldClick(id, e as unknown as React.MouseEvent); } }}
          style={{ ...merged, cursor: "pointer", borderRadius: 6 }}
        >{val(id)}</div>
      );
    return <div style={merged}>{val(id)}</div>;
  };

  return (
    <VideoFrame timecode="00:11:48:20">
      <div style={{ position: "absolute", left: "7%", right: "7%", bottom: "13%", display: "flex", alignItems: "stretch", gap: 14 }}>
        {/* the bar — a neutral light accent (NOT cobalt, which Cotejo reserves for picked state) */}
        <div style={{ width: 4, borderRadius: 2, background: VID_INK, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          {Field({ id: "name", style: nameS })}
          {Field({ id: "role", style: roleS })}
        </div>
      </div>
    </VideoFrame>
  );
}
