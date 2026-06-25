// DashboardSurface — a SMALL product-UI surface (the fourth built). It owns the stress case
// the other three can't: SMALL-SIZE dense interface text + TABULAR FIGURES lining up in a
// data table at ~12–13px. Pricing tests the BIG numerals (the headline price); this tests
// whether a face even survives small AND whether its numbers form a clean right-aligned
// column. A typeface can sing at a hero and fall apart in a 12px stat row. Same contract:
// presentational, role-tokened, handed already-resolved fonts so the SAME component renders
// both sides of the comparison.
import React from "react";
import { EditableField } from "./EditableField";
import type { SurfaceField, Resolved } from "./resolve";

export const DASHBOARD_FIELDS: SurfaceField[] = [
  { id: "appName", role: "heading", label: "App name", kind: "line" },
  { id: "nav", role: "label", label: "Nav", kind: "line" },
  { id: "statLabel", role: "label", label: "Stat label", kind: "line" },
  { id: "statValue", role: "display", label: "Stat value", kind: "line" },
  { id: "row1Name", role: "caption", label: "Row", kind: "line" },
  { id: "row1Val", role: "mono", label: "Value", kind: "line" },
  { id: "row2Name", role: "caption", label: "Row", kind: "line" },
  { id: "row2Val", role: "mono", label: "Value", kind: "line" },
  { id: "row3Name", role: "caption", label: "Row", kind: "line" },
  { id: "row3Val", role: "mono", label: "Value", kind: "line" },
  { id: "cta", role: "label", label: "Button", kind: "line" },
];

export const DASHBOARD_PLACEHOLDERS: Record<string, string> = {
  appName: "Cotejo",
  nav: "Overview",
  statLabel: "MONTHLY ACTIVE",
  statValue: "48,250",
  row1Name: "Newsreader",
  row1Val: "1,284",
  row2Name: "Unbounded",
  row2Val: "972",
  row3Name: "Söhne",
  row3Val: "640",
  cta: "Export",
};

const MONO = "var(--t-mono)";
// the table renders SMALL — that's the stress this surface owns. Row NAMES are the caption role, so
// they track the scale's small tier at any base (no magic 0.82-of-body that only read ~12px at base
// 16). The mono VALUES borrow that same caption size so name + number sit on one line.

export function DashboardSurface({ fonts, content, editable, onEdit, onFieldClick }: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
}) {
  const val = (id: string) => content[id] ?? DASHBOARD_PLACEHOLDERS[id];
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

  const appNameS: React.CSSProperties = { fontWeight: 600, lineHeight: 1, letterSpacing: "-0.01em", color: "var(--t-ink)", margin: 0 };
  const navS: React.CSSProperties = { fontFamily: MONO, fontWeight: 400, color: "var(--t-ink-3)", margin: 0 };
  const statLabelS: React.CSSProperties = { fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, color: "var(--t-ink-3)", margin: 0 };
  const statValueS: React.CSSProperties = { fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--t-ink)", margin: "6px 0 0", fontVariantNumeric: "lining-nums tabular-nums" };
  const rowNameS: React.CSSProperties = { fontWeight: 400, lineHeight: 1, color: "var(--t-ink-2)", margin: 0 };
  const rowValS: React.CSSProperties = { fontWeight: 500, lineHeight: 1, color: "var(--t-ink)", margin: 0, textAlign: "right", fontVariantNumeric: "lining-nums tabular-nums" };

  const rows = [
    { name: "row1Name", value: "row1Val" },
    { name: "row2Name", value: "row2Val" },
    { name: "row3Name", value: "row3Val" },
  ];
  // the table's small tier = the caption-role size (tracks the scale). Header + the mono values render
  // at this size so the row reads as one line; values keep their mono font, just borrow the size.
  const rowSize = fonts.row1Name.size;
  const valMul = rowSize / fonts.row1Val.size; // caption size ÷ mono(body) size = the scale's step-down

  return (
    <section
      style={{
        maxWidth: 460,
        background: "var(--t-bg-lift)",
        borderRadius: 14,
        boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--t-ink) 8%, transparent)",
        padding: "18px 20px 20px",
      }}
    >
      {/* top bar — wordmark left · nav + compact ink-pill CTA right */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {Field({ id: "appName", style: appNameS })}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {Field({ id: "nav", style: navS })}
          <span
            onClick={onFieldClick && !editable ? (e) => onFieldClick("cta", e) : undefined}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 28, padding: "0 12px",
              borderRadius: 8, background: "var(--t-ink)", color: "var(--t-bg)",
              fontSize: Math.max(11, Math.min(13, fonts.cta.size)), fontWeight: 600, fontFamily: fonts.cta.family,
              cursor: onFieldClick && !editable ? "pointer" : undefined,
            }}
          >
            {editable
              ? <EditableField id="cta" value={val("cta")} font={{ ...fonts.cta, size: Math.max(11, Math.min(13, fonts.cta.size)) }} onEdit={edit} style={{ color: "var(--t-bg)" }} />
              : val("cta")}
          </span>
        </div>
      </div>

      {/* stat block — quiet mono label above one KPI numeral */}
      <div style={{ marginTop: 24 }}>
        {Field({ id: "statLabel", style: statLabelS })}
        {Field({ id: "statValue", style: statValueS })}
      </div>

      {/* table rule — a real tabular grid line (earned for column legibility, not decorative
          separation). The card itself is --t-bg-lift, so a lift-token divider would vanish; this
          faint ink rule reads on the lifted surface. Tokenized off --t-ink. */}
      <div style={{ height: 1, background: "color-mix(in oklab, var(--t-ink) 7%, transparent)", margin: "20px 0 4px" }} />

      {/* data table — names left, tabular values right-aligned into a clean column */}
      <div>
        {/* column headers — same mono treatment as the stat label, aligned over name/value */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            padding: "0 0 8px",
          }}
        >
          <div style={{ ...statLabelS, fontSize: rowSize }}>FACE</div>
          <div style={{ ...statLabelS, fontSize: rowSize, textAlign: "right" }}>USES</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "baseline",
              gap: 16,
              padding: "9px 0",
              borderTop: i === 0 ? "none" : "1px solid color-mix(in oklab, var(--t-ink) 7%, transparent)",
            }}
          >
            {Field({ id: r.name, style: rowNameS })}
            {Field({ id: r.value, style: rowValS, sizeMul: valMul })}
          </div>
        ))}
      </div>
    </section>
  );
}
