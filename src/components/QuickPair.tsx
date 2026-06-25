// QuickPair (100-run #1 lever) — the "I already have my font" fast path. People arrive with a font
// and don't want the 8-role setup. This declares their font, finds a cap-matched PARTNER, and drops
// them into Compare — export live, the full role system one level deeper.
//
// The fork only needs ONE bit (does the font lock to display or body → cap vs x-height anchor + which
// partner to hunt), but the labels were jargon and the binary didn't fit "logo / both / dunno". So:
// the tool READS the font (its measured metrics) and pre-decides; plain words; and a "not sure" that
// just trusts that read. We never force a wrong classification — and we don't rebuild the role system.
import React from "react";
import ReactDOM from "react-dom";
import { useSession, FACES, type Preset, type Role } from "../state/SessionContext";
import { metaFor, topRecs } from "../lib/recommend";
import { useMode } from "../state/ModeContext";
import { FontPicker } from "./FontPicker";
import { Segmented } from "./Segmented";
import { Btn } from "./Btn";
import { modalMotion } from "../lib/popover";
import { tactileSuccess } from "../lib/feedback";
import { Close, ArrowRight } from "./icons";

type Pick = "display" | "body" | "auto";

export function QuickPair({ onClose }: { onClose: () => void }) {
  const { applyPreset, addGoogleFont, fontsVersion } = useSession();
  void fontsVersion; // re-render when a font is added from the picker
  const { setMode } = useMode();
  const [fontId, setFontId] = React.useState<string>(FACES[0].id);
  const [pick, setPick] = React.useState<Pick>("auto"); // default: let the tool read the font
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const face = FACES.find((f) => f.id === fontId) ?? FACES[0];
  // the tool's read of the font — small x-height + heavy = display; balanced workhorse = body.
  const inferred: "display" | "body" = metaFor(face).display ? "display" : "body";
  const role: "display" | "body" = pick === "auto" ? inferred : pick;
  const partner = role === "body" ? "display" : "body";

  const startPair = () => {
    tactileSuccess();
    // the role you'll AUDITION goes first → applyPreset focuses it, so you land in Compare picking a
    // partner FOR the font you already have (it's the locked anchor; the partner is the open slot).
    const auditionDisplay = role === "body";
    // FIND the partner via the rule engine across loaded faces + the curated Google set (not a fixed
    // built-in), so "find a partner" can land on a real Google pairing. Load it if it's a Google font.
    const anchorRole = { id: "anchor", name: role, kind: role, step: 0, fontId } as unknown as Role;
    const partnerRole = { id: "partner", name: partner, kind: partner, step: partner === "display" ? 5 : 0, fontId: "" } as unknown as Role;
    const top = topRecs(partnerRole, [anchorRole, partnerRole], { anchor: fontId })[0];
    if (top?.gf) addGoogleFont(top.gf.family, top.gf.category);
    const partnerId = top?.fontId ?? (partner === "display" ? "unbounded" : "mona"); // fallback = a built-in
    const preset: Preset = {
      id: "quick", name: "Quick pair", blurb: "", scale: { base: 16, ratio: 1.333 },
      roles: auditionDisplay
        ? [{ name: "Display", kind: "display", step: 5, fontId: partnerId }, { name: "Body", kind: "body", step: 0, fontId }]
        : [{ name: "Body", kind: "body", step: 0, fontId: partnerId }, { name: "Display", kind: "display", step: 5, fontId }],
    };
    applyPreset(preset);
    setMode("compare");
    onClose();
  };

  const arrow = <ArrowRight size={15} style={{ marginLeft: 2 }} />;
  return ReactDOM.createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(var(--t-scrim),0.30)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div className="t-pop" style={{ width: "min(540px, 100%)", background: "var(--t-bg-lift)", borderRadius: "var(--t-r-panel)", padding: "22px 24px 24px", boxShadow: "0 24px 64px -22px rgba(var(--t-scrim),0.42)", ...modalMotion }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--t-sans)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>Quick start</span>
          <button className="t-iconbtn" onClick={onClose} aria-label="Close" style={{ marginLeft: "auto" }}>
            <Close size={15} />
          </button>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--t-ink)", margin: "0 0 4px" }}>Already have a font?</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--t-ink-2)", margin: "0 0 18px" }}>Tell us the one you’ve got and we’ll find a partner for it — no setup. You can build the full system later.</p>

        <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap", marginBottom: 10 }}>
          <FontPicker value={fontId} onPick={setFontId} label="font" roleLabel="your font" />
          <span style={{ fontSize: 13, color: "var(--t-ink-3)" }}>is for</span>
          <Segmented
            options={[{ id: "display", label: "headlines" }, { id: "body", label: "body text" }, { id: "auto", label: "not sure" }]}
            value={pick} onChange={(v) => setPick(v as Pick)} ariaLabel="What's your font for?" compact
          />
        </div>
        {/* when "not sure", say what the tool read — honest, and shows it's not guessing blindly */}
        <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--t-ink-3)", margin: "0 0 16px", minHeight: 17 }}>
          {pick === "auto"
            ? <>Looks like a <strong style={{ fontWeight: 600, color: "var(--t-ink-2)" }}>{role === "display" ? "display" : "body"}</strong> face — we’ll find a {partner} partner. Pick above if that’s off. A logo or brand font is usually “headlines”.</>
            : <>We’ll find a cap-matched {partner} partner for your {role === "display" ? "headline" : "body"} font.</>}
        </p>

        {/* live preview of the chosen font, at its read role */}
        <div style={{ background: "var(--t-surface-2)", borderRadius: "var(--t-r-menu)", padding: "18px 20px", marginBottom: 18 }}>
          <div style={{ fontFamily: face.family, fontSize: role === "display" ? 34 : 22, fontWeight: role === "display" ? 600 : 400, lineHeight: 1.15, color: "var(--t-ink)", letterSpacing: role === "display" ? "-0.02em" : 0 }}>
            {role === "display" ? "Bright ideas, set in type" : "Good typography is mostly good defaults — a confident, readable voice, line after line."}
          </div>
        </div>

        {/* footer — helper on the left, primary action on the RIGHT (was stranded on the left) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--t-ink-3)" }}>opens Compare · cap-matched · export ready</span>
          <Btn variant="primary" size="md" onClick={startPair}>Find a {partner} partner{arrow}</Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}
