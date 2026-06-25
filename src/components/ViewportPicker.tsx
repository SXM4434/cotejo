// ViewportPicker — the global preview lens (Auto / Mobile / Tablet / Desktop) as a compact
// `viewport ▾` DROPDOWN, not a top-chrome segmented. It's a preview/render control, so it
// lives in the instrument dock (Compare) and Set Up's controls — near the thing it affects,
// not in the global bar. Only meaningful when the scale is FLUID (nothing to preview else).
import { PillSelect } from "./PillSelect";
import { useSession } from "../state/SessionContext";
import { useViewport, LENS_OPTS, type Lens } from "../state/ViewportContext";

export function ViewportPicker() {
  const { scale } = useSession();
  const { lens, setLens, vw } = useViewport();
  if (!scale.fluid) return null;
  return (
    // full pill (NOT compact) so it matches its dock siblings — same 40px height + a visible
    // "VIEWPORT" label like SURFACE/ROLE (interface-style-details: consistent bounding shape +
    // treatment across siblings). Width sizes to content — equal width isn't the goal.
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <PillSelect label="viewport" value={lens} options={LENS_OPTS.map((o) => ({ value: o.id, label: o.label }))} onChange={(v) => setLens(v as Lens)} />
      {/* the resolved width teaches the clamp anchors (390↔1280); Auto = live screen width */}
      <span className="tabular" style={{ fontFamily: "var(--t-sans)", fontSize: 11, color: "var(--t-ink-3)" }}>{Math.round(vw)}px</span>
    </span>
  );
}
