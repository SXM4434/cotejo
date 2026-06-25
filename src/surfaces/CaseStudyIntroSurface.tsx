// CaseStudyIntroSurface — a BIG editorial surface (the fourth built). The editorial OPENER of a
// portfolio case study. It owns a stress case neither Hero (headline + CTA) nor Article (reading
// body) exercises: a MONUMENTAL display title holding its own against fine caption-tier meta
// labels — the "big title + structured meta grid" editorial tension, all in generous whitespace.
// Same contract: presentational, role-tokened, handed already-resolved fonts so the SAME
// component renders every side of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";

export const CASESTUDY_FIELDS: SurfaceField[] = [
  { id: "kicker", role: "label", label: "Kicker", kind: "line" },
  { id: "title", role: "display", label: "Title", kind: "line" },
  { id: "lede", role: "body", label: "Lede", kind: "para" },
  { id: "roleLabel", role: "label", label: "Role label", kind: "line" },
  { id: "roleVal", role: "caption", label: "Role", kind: "line" },
  { id: "timelineLabel", role: "label", label: "Timeline label", kind: "line" },
  { id: "timelineVal", role: "caption", label: "Timeline", kind: "line" },
  { id: "teamLabel", role: "label", label: "Team label", kind: "line" },
  { id: "teamVal", role: "caption", label: "Team", kind: "line" },
];

export const CASESTUDY_PLACEHOLDERS: Record<string, string> = {
  kicker: "PRODUCT DESIGN · 12 WEEKS",
  title: "Rebuilding trust in AI-assisted design",
  lede: "How a thought-partner model — precise control without one-shot generation — turned a skeptical research group into daily users.",
  roleLabel: "ROLE",
  roleVal: "Lead Product Designer",
  timelineLabel: "TIMELINE",
  timelineVal: "YC W24 · 4 months",
  teamLabel: "TEAM",
  teamVal: "1 founder · 2 engineers",
};

const MONO = "var(--t-mono)";

export function CaseStudyIntroSurface({ fonts, content, editable, onEdit, onFieldClick }: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? CASESTUDY_PLACEHOLDERS[id];
  const edit = onEdit ?? (() => {});

  const Field = ({ id, style, sizeMul = 1 }: { id: string; style: React.CSSProperties; sizeMul?: number }) => {
    const font = fonts[id];
    const f: Resolved = { family: font.family, size: Math.round(font.size * sizeMul), featureSettings: font.featureSettings };
    const merged = { ...style, fontFamily: f.family, fontSize: f.size, fontFeatureSettings: f.featureSettings };
    if (editable) return <EditableField id={id} value={val(id)} font={f} onEdit={edit} style={style} />;
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

  const kickerS: React.CSSProperties = { fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 600, margin: 0 };
  const titleS: React.CSSProperties = { fontWeight: 500, lineHeight: 1.04, letterSpacing: "-0.03em", color: "var(--t-ink)", margin: "20px 0 0", overflowWrap: "break-word", textWrap: "balance" as React.CSSProperties["textWrap"] };
  const ledeS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.5, color: "var(--t-ink-2)", margin: "24px 0 0", maxWidth: "46ch", textWrap: "pretty" as React.CSSProperties["textWrap"] };

  // meta grid — caption Label stacked above its body Value, one column per meta pair
  const metaLabelS: React.CSSProperties = { fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 500, margin: 0 };
  const metaValS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.3, color: "var(--t-ink)", margin: "6px 0 0" };

  const META = [
    { label: "roleLabel", value: "roleVal" },
    { label: "timelineLabel", value: "timelineVal" },
    { label: "teamLabel", value: "teamVal" },
  ];

  return (
    <article style={{ maxWidth: 620, paddingBlock: 8 }}>
      {Field({ id: "kicker", style: kickerS })}
      {/* the title is the moment — it holds the whole opener */}
      {Field({ id: "title", style: titleS })}
      {Field({ id: "lede", style: ledeS })}
      {/* structured meta grid — fine caption labels over body values. Set apart by GENEROUS
          whitespace, never a rule (Cotejo: separation is spacing, not lines). */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 24,
          marginTop: 40,
        }}
      >
        {META.map(({ label, value }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            {Field({ id: label, style: metaLabelS })}
            {Field({ id: value, style: metaValS })}
          </div>
        ))}
      </div>
    </article>
  );
}
