// MarketingSurface — a BIG landing-page marketing section (the fourth built surface). It owns
// the stress the hero + article + pricing can't: an OVERSIZED, PUNCHY display headline that has
// to carry personality at scale AND a 3-column feature triad that forces the same face's body +
// caption to hold up in NARROW columns. A face can land a hero line and still fall apart when
// its body has to work at column width — this is where "does it SELL, big AND small" gets tested.
// Distinct from Hero (one headline+sub+cta): a full sectional block with a feature grid. Same
// contract: presentational, role-tokened, handed already-resolved fonts so the SAME component
// renders every side of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";

export const MARKETING_FIELDS: SurfaceField[] = [
  { id: "eyebrow", role: "label", label: "Eyebrow", kind: "line" },
  { id: "headline", role: "display", label: "Headline", kind: "line" },
  { id: "subhead", role: "subheading", label: "Subhead", kind: "para" },
  { id: "feat1Title", role: "body", label: "Feature title", kind: "line" },
  { id: "feat1Body", role: "caption", label: "Feature blurb", kind: "para" },
  { id: "feat2Title", role: "body", label: "Feature title", kind: "line" },
  { id: "feat2Body", role: "caption", label: "Feature blurb", kind: "para" },
  { id: "feat3Title", role: "body", label: "Feature title", kind: "line" },
  { id: "feat3Body", role: "caption", label: "Feature blurb", kind: "para" },
  { id: "cta", role: "label", label: "Button", kind: "line" },
];

export const MARKETING_PLACEHOLDERS: Record<string, string> = {
  eyebrow: "WHY COTEJO",
  headline: "A font that nails the headline can fall apart at 14px.",
  subhead: "A specimen page is a flattering photo. Cotejo runs each candidate through the places type usually cracks — small body, a wall of numerals, a label squeezed into a button.",
  feat1Title: "Tested where it breaks",
  feat1Body: "Big numerals, a dense feature list, a 16px reading column — the registers a one-line specimen quietly skips.",
  feat2Title: "Honest by default",
  feat2Body: "Cap heights matched before you look, so a face can’t win just by rendering a few pixels taller than the rest.",
  feat3Title: "Leaves with you",
  feat3Body: "Settle on a winner and lift the exact stack, weights, and sizes straight into your system.",
  cta: "See it on your surfaces",
};

const MONO = "var(--t-mono)";

export function MarketingSurface({ fonts, content, editable, onEdit, onFieldClick }: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? MARKETING_PLACEHOLDERS[id];
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

  const eyebrowS: React.CSSProperties = { fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 600, margin: 0 };
  const headlineS: React.CSSProperties = { fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--t-ink)", margin: "18px 0 0", maxWidth: "20ch", overflowWrap: "break-word", textWrap: "balance" as React.CSSProperties["textWrap"] };
  const subheadS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.5, color: "var(--t-ink-2)", margin: "20px 0 0", maxWidth: "52ch", textWrap: "pretty" as React.CSSProperties["textWrap"] };
  const featTitleS: React.CSSProperties = { fontWeight: 600, lineHeight: 1.25, color: "var(--t-ink)", margin: 0 };
  const featBodyS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.45, color: "var(--t-ink-3)", margin: "8px 0 0", textWrap: "pretty" as React.CSSProperties["textWrap"] };
  // the LEAD feature renders larger (the differentiator) — boldness spent in one place
  const featLeadTitleS: React.CSSProperties = { fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em", color: "var(--t-ink)", margin: 0 };

  return (
    <section style={{ maxWidth: 680, paddingBlock: 8 }}>
      {Field({ id: "eyebrow", style: eyebrowS })}
      {/* the headline is the moment — oversized, punchy, can wrap to 2 lines */}
      {Field({ id: "headline", style: headlineS })}
      {Field({ id: "subhead", style: subheadS })}
      {/* feature block — ASYMMETRIC (1 lead + 2 supporting), NOT an even 3-up grid. The even
          triad is an AI-landing tell; here the cap-match differentiator LEADS at a larger size
          and the other two recede as a quiet pair (boldness in one place). The 2-up pair still
          stresses body + caption at narrow column width — this surface's whole job. */}
      <div style={{ marginTop: 48 }}>
        <div style={{ maxWidth: "44ch" }}>
          {Field({ id: "feat1Title", style: featLeadTitleS, sizeMul: 1.4 })}
          {Field({ id: "feat1Body", style: { ...featBodyS, color: "var(--t-ink-2)" } })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 32 }}>
          {[{ title: "feat2Title", body: "feat2Body" }, { title: "feat3Title", body: "feat3Body" }].map(({ title, body }) => (
            <div key={title} style={{ display: "flex", flexDirection: "column" }}>
              {Field({ id: title, style: featTitleS })}
              {Field({ id: body, style: featBodyS })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 36 }}>
        <span
          onClick={onFieldClick && !editable ? (e) => onFieldClick("cta", e) : undefined}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, minHeight: 46, padding: "0 24px",
            borderRadius: 999, background: "var(--t-ink)", color: "var(--t-bg)",
            fontSize: Math.max(13, Math.min(17, fonts.cta.size)), fontWeight: 600, fontFamily: fonts.cta.family,
            cursor: onFieldClick && !editable ? "pointer" : undefined,
          }}
        >
          {editable ? <EditableField id="cta" value={val("cta")} font={{ ...fonts.cta, size: Math.max(13, Math.min(17, fonts.cta.size)) }} onEdit={edit} style={{ color: "var(--t-bg)" }} /> : val("cta")}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="var(--t-bg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>
    </section>
  );
}
