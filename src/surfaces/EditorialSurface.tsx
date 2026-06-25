// EditorialSurface — type living WITH an image (the 8th surface · approved 2026-06-23). The
// one place type sits against pictures the way it really ships: a kicker, a serif heading, a
// byline + photo caption, a pulled quote beside the frame, running body, and a mono credit /
// dimension line. It's where the THIN role kinds get a second home — Quote (the pull quote)
// and Mono/numeric (the dimension tag + camera credit). Image is a baked placeholder for now
// (real image-swap = the later Edit-Content feature). Same contract: presentational,
// role-tokened, handed resolved fonts.
import React from "react";
import { EditableField } from "./EditableField";
import { Upload } from "../components/icons";
import { leadingForMeasure } from "./resolve";
import type { SurfaceField, Resolved } from "./resolve";

export const EDITORIAL_FIELDS: SurfaceField[] = [
  { id: "kicker", role: "label", label: "Kicker", kind: "line" },
  { id: "headline", role: "heading", label: "Headline", kind: "line" },
  { id: "byline", role: "caption", label: "Byline", kind: "line" },
  { id: "dim", role: "mono", label: "Dimensions", kind: "line" },
  { id: "caption", role: "caption", label: "Caption", kind: "para" },
  { id: "quote", role: "quote", label: "Pull quote", kind: "para" },
  { id: "body", role: "body", label: "Body", kind: "para" },
  { id: "credit", role: "mono", label: "Credit", kind: "line" },
];

export const EDITORIAL_PLACEHOLDERS: Record<string, string> = {
  kicker: "PHOTO ESSAY",
  headline: "The City at Six in the Morning",
  byline: "Words by Sebastian Moreano · Photographs by Dora Zhang",
  dim: "1600 × 1067",
  caption: "Empty avenues before the first train pulls in. Long Island, just past dawn, 2024.",
  quote: "“You only really notice the typeface once the picture goes quiet.”",
  body: "The light at that hour is the kind editors chase and rarely get — flat, even, forgiving of the type set over it. Captions run small without straining; a pull quote sits large beside the frame without shouting.",
  credit: "Leica M11 · 35mm · f/2 · ISO 200 · 2024",
};

const MONO = "var(--t-mono)";

export function EditorialSurface({ fonts, content, editable, onEdit, onFieldClick, images, onImage, measure }: {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
  images?: Record<string, string>;
  onImage?: (slot: string, file: File) => void;
  measure?: number;
}) {
  const val = (id: string) => content[id] ?? EDITORIAL_PLACEHOLDERS[id];
  const edit = onEdit ?? (() => {});
  // the photo essay is ONE column — the picture, the caption and the running body all share it, so
  // the dock's measure governs the whole column width (a wider measure = a wider column + photo,
  // exactly how it ships). Falls back to the baked ~66ch column. (B-C: settable measure.)
  const colMeasure = measure ? `${measure}ch` : "66ch";
  const bodyLead = leadingForMeasure(measure ?? 66); // leading tracks the measure (running-text rhythm)
  const fileRef = React.useRef<HTMLInputElement>(null);
  const photo = images?.photo;
  const canSwap = editable && !!onImage; // you can drop your own image only while editing the Stack
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f && onImage) onImage("photo", f); e.target.value = ""; };

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

  const kickerS: React.CSSProperties = { fontFamily: MONO, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--t-ink-3)", fontWeight: 500, margin: 0 };
  const headlineS: React.CSSProperties = { fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--t-ink)", margin: "16px 0 0", maxWidth: "20ch", textWrap: "balance" as React.CSSProperties["textWrap"], overflowWrap: "break-word" };
  const bylineS: React.CSSProperties = { fontWeight: 400, color: "var(--t-ink-2)", margin: "16px 0 0", letterSpacing: "0.01em" };
  const captionS: React.CSSProperties = { fontWeight: 400, lineHeight: 1.5, color: "var(--t-ink-2)", margin: "12px 0 0", maxWidth: "48ch", textWrap: "pretty" as React.CSSProperties["textWrap"] };
  const quoteS: React.CSSProperties = { fontStyle: "italic", fontWeight: 400, lineHeight: 1.28, letterSpacing: "-0.01em", color: "var(--t-ink)", margin: 0, textWrap: "pretty" as React.CSSProperties["textWrap"], hangingPunctuation: "first" as React.CSSProperties["hangingPunctuation"] };
  const bodyS: React.CSSProperties = { fontWeight: 400, lineHeight: bodyLead, color: "var(--t-ink-2)", margin: 0, maxWidth: colMeasure, textWrap: "pretty" as React.CSSProperties["textWrap"] };

  return (
    <article style={{ maxWidth: colMeasure, paddingBlock: 8 }}>
      {Field({ id: "kicker", style: kickerS })}
      {Field({ id: "headline", style: headlineS })}
      {Field({ id: "byline", style: bylineS })}

      {/* the picture — your uploaded image, else a baked placeholder. On the editable Stack you
          can drop your own (click to replace). The type around it is what's under test. */}
      <figure style={{ margin: "24px 0 0" }}>
        <div
          onClick={canSwap ? () => fileRef.current?.click() : undefined}
          style={{
            position: "relative", aspectRatio: "16 / 9", borderRadius: 11, overflow: "hidden",
            background: photo ? `center / cover no-repeat url(${photo})` : "linear-gradient(135deg, var(--t-bg-lift), var(--t-surface-2))",
            boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--t-ink) 6%, transparent)",
            cursor: canSwap ? "pointer" : undefined,
          }}
        >
          {!photo && (
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--t-ink-3)" strokeWidth="1.4" width="34" height="34"
              style={{ position: "absolute", inset: 0, margin: "auto", opacity: 0.4 }}>
              <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" />
            </svg>
          )}
          {/* on the editable Stack: a quiet "add / replace photo" affordance bottom-left. A real
              <button> (not a span on the parent div) — so it's keyboard-reachable and carries the
              tool's hover seat + focus-visible ring + press states. In-face Upload icon (the old
              ↑ glyph fell through to the emoji font and ignored currentColor). */}
          {canSwap && (
            <button
              type="button"
              className="t-playfield"
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              aria-label={photo ? "Replace photo" : "Add photo"}
              style={{ position: "absolute", left: 10, bottom: 9, display: "inline-flex", alignItems: "center", gap: 6, background: "color-mix(in oklab, var(--t-bg) 82%, transparent)", border: "none", borderRadius: 999, padding: "4px 11px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.04em", color: "var(--t-ink-2)", cursor: "pointer" }}
            >
              <Upload size={12} /> {photo ? "replace" : "add"} photo
            </button>
          )}
          {/* dimension tag — exercises the mono / numeric role, overlaid on the frame */}
          <div style={{ position: "absolute", right: 11, bottom: 9, background: "color-mix(in oklab, var(--t-bg) 78%, transparent)", borderRadius: 5, padding: "2px 7px" }}>
            {Field({ id: "dim", style: { color: "var(--t-ink-3)", letterSpacing: "0.04em", margin: 0 } })}
          </div>
        </div>
        {Field({ id: "caption", style: captionS })}
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} aria-label="Upload a photo" />
      </figure>

      {/* pulled quote — the Quote role's second home. No colored left-rule (that stripe is an
          AI-design tell); the large italic serif + hanging punctuation carry it. Type does the
          work, not chrome — the right move for a type tool. */}
      <div style={{ margin: "32px 0 0" }}>
        {Field({ id: "quote", style: quoteS })}
      </div>

      <div style={{ margin: "24px 0 0" }}>{Field({ id: "body", style: bodyS })}</div>

      {/* camera credit line — mono / numeric again. Set off by spacing, not a rule (Cotejo). */}
      <div style={{ marginTop: 32 }}>
        {Field({ id: "credit", style: { color: "var(--t-ink-3)", letterSpacing: "0.05em", margin: 0 } })}
      </div>
    </article>
  );
}
