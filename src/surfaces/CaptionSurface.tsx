// CaptionSurface — a VIDEO surface (the subtitle/caption a video editor burns in at the bottom of
// the frame). It owns the readability stress case the display surfaces never do: BODY type that has
// to stay legible, centered, light on moving footage, at a glance. This is where a face's body
// proportions and weight get judged the way a viewer actually meets them. Same contract:
// presentational, role-tokened, handed already-resolved fonts so the SAME component renders both
// sides of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";
import { VideoFrame, VID_INK } from "./videoChrome";

export const CAPTION_FIELDS: SurfaceField[] = [
  { id: "caption", role: "body", label: "Caption", kind: "para" },
];

export const CAPTION_PLACEHOLDERS: Record<string, string> = {
  caption: "We didn't know it yet, but the water had already started to move.",
};

export function CaptionSurface({
  fonts, content, editable, onEdit, onFieldClick, frameless,
}: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
  frameless?: boolean;
}) {
  const val = (id: string) => content[id] ?? CAPTION_PLACEHOLDERS[id];
  const edit = onEdit ?? (() => {});

  // a centered caption line, set low in the frame the way burned-in subtitles sit — the body face
  // judged the way a viewer actually meets it.
  const captionS: React.CSSProperties = {
    fontWeight: 500, lineHeight: 1.34, color: VID_INK, margin: 0, textAlign: "center",
    maxWidth: "32ch", textWrap: "balance" as React.CSSProperties["textWrap"],
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
    <VideoFrame timecode="00:23:09:15" bare={frameless}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "10%", display: "flex", justifyContent: "center", padding: "0 8%" }}>
        {Field({ id: "caption", style: captionS })}
      </div>
    </VideoFrame>
  );
}
