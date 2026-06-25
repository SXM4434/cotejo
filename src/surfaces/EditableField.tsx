// Caret-safe inline field — uncontrolled, seeded once (never re-bound from state), so React
// re-renders never jump the caret. Shared by every surface (Hero, Article, …) for Edit
// Content. Read-only surfaces don't use it.
import React from "react";
import type { Resolved } from "./resolve";

export function EditableField({
  id, value, font, onEdit, style,
}: { id: string; value: string; font: Resolved; onEdit: (id: string, v: string) => void; style: React.CSSProperties }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => { if (ref.current) ref.current.textContent = value; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // a focus ring on the contentEditable (it has no native one) + a min size so a CLEARED field
  // stays a clickable target instead of collapsing to a zero-width sliver.
  return (
    <div
      ref={ref}
      contentEditable suppressContentEditableWarning spellCheck={false}
      role="textbox" aria-label={id}
      onInput={(e) => onEdit(id, e.currentTarget.textContent || "")}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...style, fontFamily: font.family, fontSize: font.size, fontFeatureSettings: font.featureSettings,
        outline: "none", cursor: "text", minWidth: 24, minHeight: "1em", borderRadius: 4,
        boxShadow: focused ? "0 0 0 2px var(--t-bg), 0 0 0 4px color-mix(in oklab, var(--t-ink) 26%, transparent)" : "none",
      }}
    />
  );
}
