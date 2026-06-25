// SpecimenSurface — a BIG surface: a proper single-face TYPE SPECIMEN sheet, the kind a
// foundry publishes. It owns the classic specimen read — a HUGE glyph pair (the face's
// portrait), a pangram, a size WATERFALL (the SAME phrase at descending role sizes, which
// literally draws the stack's role ladder), and a character-set row. DISTINCT from the app's
// Letterforms grid (many faces, one role, one size): a Specimen shows ONE stack as a full
// specimen ACROSS all roles, so base-vs-candidate specimens sit side by side and you read the
// whole personality of each face. Same contract as the other surfaces: presentational,
// role-tokened, handed already-resolved fonts per field so the SAME component renders both sides.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";

export const SPECIMEN_FIELDS: SurfaceField[] = [
  { id: "glyph", role: "display", label: "Glyph", kind: "line" },
  { id: "pangram", role: "body", label: "Pangram", kind: "line" },
  { id: "water1", role: "display", label: "Waterfall", kind: "line" },
  { id: "water2", role: "body", label: "Waterfall", kind: "line" },
  { id: "water3", role: "caption", label: "Waterfall", kind: "line" },
  { id: "charset", role: "caption", label: "Character set", kind: "line" },
];

export const SPECIMEN_PLACEHOLDERS: Record<string, string> = {
  glyph: "Aa",
  pangram: "The quick brown fox jumps over the lazy dog",
  water1: "Handgloves",
  water2: "Reading at body size, the rhythm shows",
  water3: "At caption size every flaw in the spacing finally surfaces and the eye starts to tire.",
  charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 & . , ? ! ‘ ’ “ ” – —",
};

const MONO = "var(--t-mono)";

export function SpecimenSurface({ fonts, content, editable, onEdit, onFieldClick }: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? SPECIMEN_PLACEHOLDERS[id];
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

  // the face's portrait — render VERY large via sizeMul; lineHeight 1 keeps it tight to the cap.
  const glyphS: React.CSSProperties = { fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--t-ink)", margin: 0 };
  const pangramS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.2, color: "var(--t-ink)", margin: 0, maxWidth: "34ch", textWrap: "pretty" as React.CSSProperties["textWrap"] };
  // the waterfall — same phrase at the three role sizes, descending; tight, so the ladder reads.
  const waterS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.01em", color: "var(--t-ink-2)", margin: 0, overflowWrap: "break-word" };
  const charsetS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.6, letterSpacing: "0.02em", color: "var(--t-ink-3)", margin: 0, overflowWrap: "break-word", textWrap: "pretty" as React.CSSProperties["textWrap"] };

  // static mono size-rank label — hangs in the LEFT MARGIN so the specimen TYPE starts at the
  // section's master left edge (x=0), aligning with the PANGRAM / WATERFALL / CHARACTER SET labels.
  const rankS: React.CSSProperties = { position: "absolute", left: -22, top: 6, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 600, lineHeight: 1 };
  const labelS: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 600, margin: 0 };

  return (
    <article style={{ maxWidth: 640, paddingBlock: 8 }}>
      {/* the portrait — the glyph pair is the hero of the sheet */}
      {Field({ id: "glyph", style: glyphS, sizeMul: 2.4 })}

      {/* pangram — every letter, once, as a single readable line. Blocks are set apart by
          whitespace alone (Cotejo: separation is spacing, never a rule). */}
      <div style={{ marginTop: 40 }}>
        <p style={labelS}>Pangram</p>
        {Field({ id: "pangram", style: { ...pangramS, marginTop: 8 } })}
      </div>

      {/* the waterfall — same phrase down the role ladder (display → body → caption) */}
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={labelS}>Waterfall</p>
        {([["water1", "L"], ["water2", "M"], ["water3", "S"]] as const).map(([id, rank]) => (
          <div key={id} style={{ position: "relative" }}>
            <span style={rankS}>{rank}</span>
            {Field({ id: id, style: waterS })}
          </div>
        ))}
      </div>

      {/* character set — the full kit at a glance */}
      <div style={{ marginTop: 40 }}>
        <p style={labelS}>Character set</p>
        {Field({ id: "charset", style: { ...charsetS, marginTop: 10 } })}
      </div>
    </article>
  );
}
