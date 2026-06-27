// TitleCardSurface — a VIDEO surface (the intro/title card a video editor cuts over the opening
// shot). It owns a stress case the paper surfaces don't: a big DISPLAY title holding centered over
// footage, light on dark, with a fine kicker above and a subheading below. Same contract as every
// surface — presentational, role-tokened, handed already-resolved fonts so the SAME component
// renders both sides of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";
import { VideoFrame, VID_INK, VID_INK_2, VID_INK_3 } from "./videoChrome";

export const TITLECARD_FIELDS: SurfaceField[] = [
  { id: "kicker", role: "label", label: "Kicker", kind: "line" },
  { id: "title", role: "display", label: "Title", kind: "line" },
  { id: "subtitle", role: "subheading", label: "Subtitle", kind: "line" },
];

export const TITLECARD_PLACEHOLDERS: Record<string, string> = {
  kicker: "A FILM BY EZRA HALE",
  title: "After the Tide",
  subtitle: "Three towns, one disappearing coast",
};

const MONO = "var(--t-mono)";

export function TitleCardSurface({
  fonts, content, editable, onEdit, onFieldClick,
}: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? TITLECARD_PLACEHOLDERS[id];
  const edit = onEdit ?? (() => {});

  const kickerS: React.CSSProperties = {
    fontFamily: MONO, letterSpacing: "0.24em", textTransform: "uppercase",
    color: VID_INK_3, fontWeight: 600, margin: "0 0 18px",
  };
  const titleS: React.CSSProperties = {
    fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.02em", color: VID_INK,
    margin: 0, maxWidth: "16ch", textWrap: "balance" as React.CSSProperties["textWrap"],
    overflowWrap: "break-word",
  };
  const subtitleS: React.CSSProperties = {
    fontWeight: 400, lineHeight: 1.35, color: VID_INK_2, margin: "18px 0 0",
    maxWidth: "34ch", textWrap: "pretty" as React.CSSProperties["textWrap"],
  };

  // Field is CALLED (not <Field/>) so it inlines — a JSX <Field/> would remount the caret-safe
  // EditableField on the first keystroke (same reason as HeroSurface).
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
    <VideoFrame timecode="00:02:17:04">
      <div
        style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 9%",
        }}
      >
        {Field({ id: "kicker", style: kickerS })}
        {Field({ id: "title", style: titleS })}
        {Field({ id: "subtitle", style: subtitleS })}
      </div>
    </VideoFrame>
  );
}
