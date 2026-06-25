// ArticleSurface — a BIG editorial surface (the second built surface). Long-form reading is
// where BODY type actually earns or loses: real paragraphs, at the size you ship, in a real
// measure. It owns the "even color / rhythm over many lines" stress case (the hero can't show
// it). Same contract as Hero: presentational, role-tokened, handed already-resolved fonts so
// the SAME component renders every side of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import { leadingForMeasure } from "./resolve";
import type { SurfaceField, Resolved } from "./resolve";

export const ARTICLE_FIELDS: SurfaceField[] = [
  { id: "kicker", role: "label", label: "Kicker", kind: "line" },
  { id: "headline", role: "heading", label: "Headline", kind: "line" },
  { id: "byline", role: "caption", label: "Byline", kind: "line" },
  { id: "lede", role: "body", label: "Lede", kind: "para" },
  { id: "body1", role: "body", label: "Body", kind: "para" },
  { id: "pullquote", role: "quote", label: "Pull quote", kind: "para" },
  { id: "body2", role: "body", label: "Body", kind: "para" },
];

export const ARTICLE_PLACEHOLDERS: Record<string, string> = {
  kicker: "ON TYPOGRAPHY",
  headline: "The quiet craft of choosing a typeface",
  byline: "By the Cotejo team · 6 min read",
  lede: "Picking type is rarely one heroic decision. It’s a hundred small judgments — cap heights, rhythm, the way a comma sits — that add up to a page you trust.",
  body1: "Most tools let you preview a font on a line of placeholder text and call it a comparison. But a typeface doesn’t live on a single line; it lives in paragraphs, at the size you actually ship, beside the other faces in your system. That’s where its real character — or its weakness — shows.",
  pullquote: "The right one tends to get quieter the longer you look.",
  body2: "So compare it where it works for a living. Set the body at sixteen pixels in a real column, cap-match every candidate so the read is honest, and let the letterforms argue their own case. The face that wins is rarely the one that shouts on the first line.",
};

const MONO = "var(--t-mono)";

export function ArticleSurface({ fonts, content, editable, onEdit, onFieldClick, measure }: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
  measure?: number;
}) {
  const val = (id: string) => content[id] ?? ARTICLE_PLACEHOLDERS[id];
  const edit = onEdit ?? (() => {});
  // running-body measure (chars/line) from the dock — falls back to the baked default. `ch` is the
  // font's own 0-glyph width, so the line length is honest per candidate (the point of "measure").
  const bodyMeasure = measure ? `${measure}ch` : "62ch";
  // leading follows the measure (longer line ⇒ more line-space) — the other half of running text.
  const bodyLead = leadingForMeasure(measure ?? 62);

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
  const headlineS: React.CSSProperties = { fontWeight: 500, lineHeight: 1.06, letterSpacing: "-0.02em", color: "var(--t-ink)", margin: "16px 0 0", maxWidth: "18ch", textWrap: "balance" as React.CSSProperties["textWrap"], overflowWrap: "break-word" };
  const bylineS: React.CSSProperties = { fontWeight: 400, color: "var(--t-ink-2)", margin: "16px 0 0" };
  const ledeS: React.CSSProperties = { fontWeight: 500, lineHeight: 1.5, color: "var(--t-ink)", margin: "28px 0 0", maxWidth: bodyMeasure, textWrap: "pretty" as React.CSSProperties["textWrap"] };
  const bodyS: React.CSSProperties = { fontWeight: 400, lineHeight: bodyLead, color: "var(--t-ink-2)", margin: "18px 0 0", maxWidth: bodyMeasure, textWrap: "pretty" as React.CSSProperties["textWrap"] };
  const quoteS: React.CSSProperties = { fontStyle: "italic", fontWeight: 500, lineHeight: 1.32, color: "var(--t-ink)", margin: "32px 0 32px", maxWidth: "26ch", textWrap: "balance" as React.CSSProperties["textWrap"] };

  // no wrapper measure cap — every field self-caps (headline 18ch · quote 26ch · body = the
  // measure), so the running column is governed by the dock's measure in the body's OWN font.
  return (
    <article style={{ maxWidth: "100%", paddingBlock: 8 }}>
      {Field({ id: "kicker", style: kickerS })}
      {Field({ id: "headline", style: headlineS })}
      {Field({ id: "byline", style: bylineS })}
      {Field({ id: "lede", style: ledeS })}
      {Field({ id: "body1", style: bodyS })}
      {Field({ id: "pullquote", style: quoteS, sizeMul: 1.7 })}
      {Field({ id: "body2", style: bodyS })}
    </article>
  );
}
