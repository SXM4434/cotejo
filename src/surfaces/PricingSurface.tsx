// PricingSurface — a SMALL UI surface (the third built). It owns the stress case the hero +
// article can't: big NUMERALS (the price), tight UI labels, a tabular feature list, a button.
// Type for numbers + dense interface text is its own thing — a face can sing at a headline
// and fall apart at $24/mo. Same contract: presentational, role-tokened, handed resolved fonts.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";

export const PRICING_FIELDS: SurfaceField[] = [
  { id: "plan", role: "label", label: "Plan", kind: "line" },
  { id: "price", role: "display", label: "Price", kind: "line" },
  { id: "period", role: "caption", label: "Period", kind: "line" },
  { id: "tagline", role: "body", label: "Tagline", kind: "line" },
  { id: "feat1", role: "body", label: "Feature", kind: "line" },
  { id: "feat2", role: "body", label: "Feature", kind: "line" },
  { id: "feat3", role: "body", label: "Feature", kind: "line" },
  { id: "cta", role: "label", label: "Button", kind: "line" },
];

export const PRICING_PLACEHOLDERS: Record<string, string> = {
  plan: "PRO",
  price: "$24",
  period: "per month, billed yearly",
  tagline: "For teams settling a typeface for good — bring as many candidates as the shortlist needs.",
  feat1: "Unlimited candidates and directions",
  feat2: "Share a live comparison by link",
  feat3: "Export the winning stack as CSS or tokens",
  cta: "Choose Pro",
};

const MONO = "var(--t-mono)";

export function PricingSurface({ fonts, content, editable, onEdit, onFieldClick }: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? PRICING_PLACEHOLDERS[id];
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

  const planS: React.CSSProperties = { fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 600, margin: 0 };
  const priceS: React.CSSProperties = { fontWeight: 500, lineHeight: 1, letterSpacing: "-0.03em", color: "var(--t-ink)", margin: 0, fontVariantNumeric: "lining-nums tabular-nums" };
  const periodS: React.CSSProperties = { fontWeight: 400, color: "var(--t-ink-3)", margin: 0 };
  const taglineS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.45, color: "var(--t-ink-2)", margin: "16px 0 0", maxWidth: "30ch", textWrap: "pretty" as React.CSSProperties["textWrap"] };
  const featS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.3, color: "var(--t-ink-2)", margin: 0 };

  return (
    <article style={{ maxWidth: 440, paddingBlock: 8 }}>
      {Field({ id: "plan", style: planS })}
      {/* the price moment — big numerals + a quiet period at the price's optical center */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 0", flexWrap: "wrap" }}>
        {Field({ id: "price", style: priceS })}
        {Field({ id: "period", style: periodS })}
      </div>
      {Field({ id: "tagline", style: taglineS })}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "24px 0 0" }}>
        {["feat1", "feat2", "feat3"].map((id) => (
          <div key={id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            {/* a small drawn dot — not a raw middot glyph (those read as a different font's mark) */}
            <span style={{ width: 3, height: 3, borderRadius: 9, background: "var(--t-ink-3)", display: "inline-block", flexShrink: 0, marginTop: "0.6em" }} />
            {Field({ id: id, style: featS })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28 }}>
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
        </span>
      </div>
    </article>
  );
}
