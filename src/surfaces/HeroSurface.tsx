// HeroSurface — the first real, editable preset surface (docs/type-tool/05 §1.2 #1).
// A credible marketing/portfolio hero whose typography is wired to the user's ROLE
// frame (not hardcoded families): eyebrow · big display headline · lede · body · CTA.
// It owns the "long + tight display headline, wrap balance" stress case. Layout is
// authored + fixed (the craft is ours); the user only pours content into declared
// slots — never a builder (05 §3). Presentational: it's handed already-resolved fonts
// per field (base OR cap-matched-candidate), so the SAME component renders both sides
// of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";

// the hero's declared content slots, each tagged with the role TIER it renders in
// (05 §2.1 — "the user picks the words; the role picks the type").
export const HERO_FIELDS: SurfaceField[] = [
  { id: "eyebrow", role: "label", label: "Eyebrow", kind: "line" },
  { id: "headline", role: "display", label: "Headline", kind: "line" },
  { id: "lede", role: "subheading", label: "Lede", kind: "line" },
  { id: "body", role: "body", label: "Body", kind: "para" },
  { id: "cta", role: "label", label: "Button", kind: "line" },
];

// realistic defaults — an untouched hero still reads as a finished page, never lorem (05 §1.3).
export const HERO_PLACEHOLDERS: Record<string, string> = {
  eyebrow: "FONT AUDITION",
  headline: "Pick the face, not the size.",
  lede: "Drop in a candidate and watch your whole page re-set around it — headline, body, captions, the lot — live.",
  body: "Two faces never line up at the same nominal size; one always looks bigger. Cotejo holds every candidate to one cap height first, so what you’re actually weighing is the shape of the letters.",
  cta: "Start comparing",
};

const WEIGHT = 500;
const MONO = "var(--t-mono)";

export function HeroSurface({
  fonts, content, editable, onEdit, onFieldClick,
}: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  // PLAY mode (doc §4c): click a field → parent opens the per-role swap popover at the
  // click. Mutually exclusive with `editable` (play swaps fonts, doesn't edit words).
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? HERO_PLACEHOLDERS[id];
  const edit = onEdit ?? (() => {});

  // shared field styles (the layout/rhythm is OURS, fixed — only the type swaps)
  const eyebrowS: React.CSSProperties = {
    fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase",
    color: "var(--t-ink-3)", fontWeight: 600, margin: 0,
  };
  const headlineS: React.CSSProperties = {
    fontWeight: WEIGHT, lineHeight: 1.02, letterSpacing: "-0.025em",
    color: "var(--t-ink)", margin: "18px 0 0", textWrap: "balance" as React.CSSProperties["textWrap"],
    maxWidth: "20ch", overflowWrap: "break-word",
  };
  const ledeS: React.CSSProperties = {
    fontWeight: 400, lineHeight: 1.45, color: "var(--t-ink-2)", margin: "20px 0 0", maxWidth: "44ch",
    textWrap: "pretty" as React.CSSProperties["textWrap"],
  };
  const bodyS: React.CSSProperties = {
    fontWeight: 400, lineHeight: 1.55, color: "var(--t-ink-2)", margin: "16px 0 0", maxWidth: "52ch",
    textWrap: "pretty" as React.CSSProperties["textWrap"],
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
    <article style={{ paddingBlock: 8 }}>
      {/* Field is CALLED (not <Field/>) so it inlines — a JSX <Field/> would be a new component
          identity each render and remount the caret-safe EditableField on the first keystroke. */}
      {Field({ id: "eyebrow", style: eyebrowS })}
      {Field({ id: "headline", style: headlineS })}
      {Field({ id: "lede", style: ledeS })}
      {Field({ id: "body", style: bodyS })}
      {/* CTA — an ink pill; the label is the editable field, the pill is fixed chrome */}
      <div style={{ marginTop: 28 }}>
        <span
          onClick={onFieldClick && !editable ? (e) => onFieldClick("cta", e) : undefined}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, minHeight: 46, padding: "0 22px",
            borderRadius: 999, background: "var(--t-ink)", color: "var(--t-bg)",
            fontSize: Math.max(13, Math.min(17, fonts.cta.size)), fontWeight: 600, fontFamily: fonts.cta.family,
            cursor: onFieldClick && !editable ? "pointer" : undefined,
          }}
        >
          {editable ? <EditableField id="cta" value={val("cta")} font={{ ...fonts.cta, size: Math.max(13, Math.min(17, fonts.cta.size)) }} onEdit={edit} style={{ color: "var(--t-bg)" }} /> : val("cta")}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="var(--t-bg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>
    </article>
  );
}
