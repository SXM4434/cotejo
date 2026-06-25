// Compare top-bar slot (in the GlobalBar) — the GLOBAL "what am I comparing" controls:
// the base font, and cap-match (the fairness normalization that applies to EVERY role +
// surface — global, not a per-view render dial; doc 08 two-zone model). Surface · mode ·
// onion settings · role live in the dock (the instrument panel). The base picker is
// role-aware: its "in your directions" pins reflect the directions that use a font FOR THE
// FOCUS ROLE'S tier (doc §6).
import { FontPicker } from "../../components/FontPicker";
import { InfoDot } from "../../components/InfoDot";
import { GLOSSARY } from "../../lib/glossary";
import { useCompare } from "./CompareContext";
import { useSession, dirTagFor, dirAnyTagFor } from "../../state/SessionContext";

export function CompareBar() {
  const { baseId, setBaseId, focusRoleId, autoTune, setAutoTune } = useCompare();
  const { roles, directions } = useSession();
  const focusRole = roles.find((r) => r.id === focusRoleId) ?? roles[0];
  const tagFor = dirTagFor(directions, focusRole);
  const tagForAny = dirAnyTagFor(directions);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <FontPicker label="base" value={baseId} onPick={setBaseId} tagFor={tagFor} tagForAny={tagForAny} roleLabel={focusRole.name} />
      {/* cap-match is a toggle but ON is the normal state → it shares the EXACT pill language of its
          neighbors (base / My setup): the `.t-pill` seat at the standard height, so the bar reads as
          one set of controls. A small state dot carries on/off; OFF flattens to a quiet outline. */}
      <button
        className="t-pill"
        onClick={() => setAutoTune(!autoTune)} aria-pressed={autoTune}
        title={autoTune ? "Cap-matched — candidates resized to share one cap height. Click for raw, unmatched sizes." : "Raw sizes — not cap-matched. Click to cap-match."}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7, minHeight: "var(--t-h-pill)", padding: "0 13px",
          borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
          color: autoTune ? "var(--t-ink)" : "var(--t-ink-2)",
          // ON = the standard .t-pill seat (matches the neighbors). OFF = flatten to a quiet outline.
          ...(autoTune ? {} : { background: "transparent", boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--t-ink) 12%, transparent)" }),
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "var(--t-r-chip)", flexShrink: 0, background: autoTune ? "var(--t-ink-2)" : "transparent", boxShadow: autoTune ? "none" : "inset 0 0 0 1.5px var(--t-ink-3)" }} />
        cap-match
      </button>
      <InfoDot label="cap-match" text={GLOSSARY["cap-match"]} align="right" />
    </div>
  );
}
