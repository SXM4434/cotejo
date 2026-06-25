// Tune mode — calibrate one pairing. The lab's tracing-paper apparatus, rebuilt:
// base + candidate specimens OVERLAID (ghost or difference) in the center, with
// the dials in the floating BOTTOM DOCK (the Aave-glass home). Stretchy sliders
// drive live tune deltas; size× seeds from the cap-match engine. Red click-anchor
// = next. Self-contained for now (drill-in from Compare wires later).
import React from "react";
import { PillSelect } from "../../components/PillSelect";
import { FontPicker } from "../../components/FontPicker";
import { Btn } from "../../components/Btn";
import { StretchySlider } from "../../components/StretchySlider";
import { BottomDock } from "../../components/BottomDock";
import { Segmented } from "../../components/Segmented";
import { measureFont, deriveTune, applyCorrection, featureVector, hasCorrectionModel, logTuneExample, buildExample, exampleCount, exportJsonl, type RawMetrics } from "../../lib/autofinetune";
import { Check, RingDot } from "../../components/icons";
import { useSession, dirTagFor, dirAnyTagFor, roleSize, anchorForKind, tuneKey } from "../../state/SessionContext";
import { tactileSuccess, tactileSelect } from "../../lib/feedback";

const BASE_PX = 96;
const MONO = "var(--t-sans)";
const OVERLAY_H = Math.round(BASE_PX * 1.3);
const ANCHOR_HOME = { x: 8, y: Math.round(BASE_PX * 0.74) }; // ~baseline-left
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const SNAP_PX = 6; // soft/magnetic pull radius for the reference-line snap

// Rendered alphabetic baseline of a specimen, in px from its box top. Measured the
// exact way it paints (a zero-height vertical-align:baseline marker rides ON the
// line's baseline) so the snap lines match the real glyphs, not a metric estimate.
function measureBaselinePx(o: { family: string; size: number; weight: number; lh: number; text: string }): number {
  if (typeof document === "undefined") return o.size * 0.8;
  const box = document.createElement("div");
  box.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;margin:0;letter-spacing:-0.02em;font-family:${o.family};font-size:${o.size}px;font-weight:${o.weight};line-height:${o.lh};`;
  box.textContent = o.text || "Hxg";
  const marker = document.createElement("span");
  marker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
  box.appendChild(marker);
  document.body.appendChild(box);
  const bl = marker.getBoundingClientRect().top - box.getBoundingClientRect().top;
  document.body.removeChild(box);
  return bl;
}

function useMetrics(name: string) {
  const [m, setM] = React.useState<RawMetrics | null>(null);
  React.useEffect(() => { let live = true; setM(null); measureFont(name, { weight: 500 }).then((r) => live && setM(r)); return () => { live = false; }; }, [name]);
  return m;
}

type Overlay = "ghost" | "difference";
type SnapName = "baseline" | "cap" | "x-height" | null;
type Snaps = {
  ay: { baseline: number; cap: number; x: number };   // candidate translateY that aligns each line
  refY: { baseline: number; cap: number; x: number };  // base line's y in the overlay (for the lit guide)
};

export function TuneMode() {
  const { baseId, setBaseId, candId, setCandId, text, setText, base, cand, roles, focusRoleId, setFocusRoleId, directions, scale, tunes, setTune, updateRole } = useSession();
  const [overlay, setOverlay] = React.useState<Overlay>("ghost");
  const [applied, setApplied] = React.useState(false);
  // how many calibration examples have been collected (the model's training set). Seeded on mount;
  // bumped on every apply. Exposed on window so the JSONL can be pulled to feed scripts/train-finetune.
  const [logged, setLogged] = React.useState(0);
  React.useEffect(() => {
    setLogged(exampleCount());
    (window as unknown as { cotejoTuneData?: unknown }).cotejoTuneData = {
      count: exampleCount, export: exportJsonl,
      download: () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([exportJsonl()], { type: "application/x-ndjson" })); a.download = "tune-examples.jsonl"; a.click(); },
    };
  }, []);
  const roleSelOpts = roles.map((r) => ({ value: r.id, label: r.name }));
  const focusRole0 = roles.find((r) => r.id === focusRoleId) ?? roles[0];
  // the cap-match anchor follows the role kind (B7): display anchors on caps, body on x-height.
  const matchAnchor = anchorForKind(focusRole0.kind);

  const [sizeMul, setSizeMul] = React.useState(1);
  const [lhMul, setLhMul] = React.useState(1);
  const [track, setTrack] = React.useState(0);   // em ×1000
  const [wght, setWght] = React.useState(500);

  // Red registration anchor — improved over the lab's click-anchor. A draggable
  // handle pinned to the candidate; drag (or arrow-key) to re-register the two
  // specimens at any glyph feature, not just the shared left edge. Live dx/dy
  // readout; double-click or reset returns it home. Cap-match aligns the SIZE,
  // the anchor lets your eye align the POSITION at whatever point you care about.
  const [anchor, setAnchor] = React.useState(ANCHOR_HOME);
  const [dragging, setDragging] = React.useState(false);
  const [snaps, setSnaps] = React.useState<Snaps | null>(null);
  const [snapLabel, setSnapLabel] = React.useState<SnapName>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const ax = anchor.x - ANCHOR_HOME.x, ay = anchor.y - ANCHOR_HOME.y;
  // Unified RELATIVE drag — grab the red dot OR grab the candidate letters directly;
  // either moves the candidate by the cursor delta (no teleport). No position sliders.
  const dragStart = React.useRef<{ px: number; py: number; ax: number; ay: number } | null>(null);
  const beginDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { px: e.clientX, py: e.clientY, ax: anchor.x, ay: anchor.y };
    setDragging(true);
    setSnapLabel(null);
  };
  const moveDrag = (e: React.PointerEvent) => {
    const s = dragStart.current;
    const r = wrapRef.current?.getBoundingClientRect();
    if (!s || !e.buttons || !r) return;
    const nx = clamp(s.ax + (e.clientX - s.px), 0, r.width);
    let ny = clamp(s.ay + (e.clientY - s.py), 0, r.height);
    // soft/magnetic VERTICAL snap to the base's baseline / cap / x-height lines
    let label: SnapName = null;
    if (snaps) {
      const ayFree = ny - ANCHOR_HOME.y;
      let best = SNAP_PX + 1, bestAy = ayFree;
      ([["baseline", "baseline"], ["cap", "cap"], ["x", "x-height"]] as const).forEach(([k, name]) => {
        const d = Math.abs(ayFree - snaps.ay[k]);
        if (d <= SNAP_PX && d < best) { best = d; bestAy = snaps.ay[k]; label = name; }
      });
      ny = ANCHOR_HOME.y + bestAy;
    }
    setAnchor({ x: nx, y: ny });
    setSnapLabel(label);
  };
  const endDrag = () => { dragStart.current = null; setDragging(false); };
  const nudge = (e: React.KeyboardEvent) => {
    setSnapLabel(null); // keyboard = free fine-tune, escapes the snap
    const s = e.shiftKey ? 8 : 1;
    if (e.key === "ArrowLeft") { e.preventDefault(); setAnchor((a) => ({ ...a, x: Math.max(0, a.x - s) })); }
    if (e.key === "ArrowRight") { e.preventDefault(); setAnchor((a) => ({ ...a, x: a.x + s })); }
    if (e.key === "ArrowUp") { e.preventDefault(); setAnchor((a) => ({ ...a, y: Math.max(0, a.y - s) })); }
    if (e.key === "ArrowDown") { e.preventDefault(); setAnchor((a) => ({ ...a, y: a.y + s })); }
  };

  const baseM = useMetrics(base.measureFamily);
  const candM = useMetrics(cand.measureFamily);
  const fit = React.useMemo(() => (baseM && candM ? deriveTune({ key: focusRole0.kind, anchor: matchAnchor }, baseM, candM) : null), [baseM, candM, focusRole0.kind, matchAnchor]);
  const opticalSize = fit ? fit.size : 1;
  // AUTO-TUNE — the full engine derivation: measure both faces (canvas glyph metrics = the "image test"),
  // cap-match, then apply the LEARNED correction (the smart layer; identity until the model trains on real
  // calibrations). One click snaps every dial to the engine's best optical tune. This is the loop's core:
  // the engine proposes, you nudge, your nudge trains the model, the next auto-tune is better.
  const smartFit = React.useMemo(() => {
    if (!baseM || !candM || !fit) return null;
    const feats = featureVector({ key: focusRole0.kind, anchor: matchAnchor }, baseM, candM, roleSize(focusRole0, scale));
    return applyCorrection({ size: fit.size, lh: fit.lh, track: fit.track }, feats);
  }, [baseM, candM, fit, focusRole0, matchAnchor, scale]);
  const autoTune = () => {
    if (!smartFit) return;
    tactileSelect();
    setSizeMul(Number(smartFit.size.toFixed(3)));
    setLhMul(Number(smartFit.lh.toFixed(3)));
    setTrack(Math.round(smartFit.track * 1000));
    setWght(500);
    setSnapLabel(null);
  };
  // SEED the dials when the pairing (or its cap-match default) changes: from the SAVED tune for this
  // base+candidate pairing if one exists, else from the optical cap-match default. This is what makes
  // a calibration survive switching the focus role / leaving Tune / reloading (the dials no longer
  // wipe on every role switch — the founder's "fine-tune has no memory" bug).
  const pairKey = tuneKey(baseId, candId);
  React.useEffect(() => {
    const saved = tunes[pairKey];
    if (saved) { setSizeMul(saved.sizeMul); setLhMul(saved.lhMul); setTrack(saved.track); setWght(saved.wght); }
    else { setSizeMul(Number(opticalSize.toFixed(3))); setLhMul(1); setTrack(0); setWght(500); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairKey, opticalSize]);
  // PERSIST the dials to the pairing whenever they change — but only when they diverge from the
  // optical default (so merely visiting a pairing doesn't mark it "tuned"; reset clears it).
  React.useEffect(() => {
    const isDefault = sizeMul === Number(opticalSize.toFixed(3)) && lhMul === 1 && track === 0 && wght === 500;
    setTune(baseId, candId, isDefault ? null : { sizeMul, lhMul, track, wght, anchor: matchAnchor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeMul, lhMul, track, wght]);

  const candSize = BASE_PX * sizeMul;

  // Compute the three reference-line snap targets whenever the faces/size/lh/text
  // change. ay.* = the candidate translateY that lands its line on the base's;
  // refY.* = where the base's line sits in the overlay (for the lit guide).
  React.useLayoutEffect(() => {
    if (!baseM || !candM) { setSnaps(null); return; }
    const baseBL = measureBaselinePx({ family: base.family, size: BASE_PX, weight: 500, lh: 1, text });
    const candBL = measureBaselinePx({ family: cand.family, size: candSize, weight: wght, lh: lhMul, text });
    const dBL = baseBL - candBL;
    const capBasePx = baseM.cap * BASE_PX, capCandPx = candM.cap * candSize;
    const xBasePx = baseM.xHeight * BASE_PX, xCandPx = candM.xHeight * candSize;
    setSnaps({
      ay: { baseline: dBL, cap: dBL - (capBasePx - capCandPx), x: dBL - (xBasePx - xCandPx) },
      refY: { baseline: baseBL, cap: baseBL - capBasePx, x: baseBL - xBasePx },
    });
  }, [base.family, cand.family, candSize, lhMul, wght, text, baseM, candM]);

  const reset = () => { setSizeMul(Number(opticalSize.toFixed(3))); setLhMul(1); setTrack(0); setWght(500); setAnchor(ANCHOR_HOME); setSnapLabel(null); };
  // role-aware: the base/vs pickers surface directions that use a font for the FOCUS role (doc §6)
  const focusRole = focusRole0;
  // APPLY — write the tuned candidate back onto the focus role: adopt it as the role's font AND bake
  // the resolved absolute values (cap-matched size + line-height + tracking + weight) as overrides, so
  // the calibration leaves the bench, ships on every surface, and flows into the structured export.
  const applyToRole = () => {
    const nominal = roleSize(focusRole, scale);
    updateRole(focusRoleId, {
      fontId: candId,
      sizeOverride: Math.max(1, Math.round(nominal * sizeMul)),
      lineHeight: Number(lhMul.toFixed(3)),
      tracking: Number((track / 1000).toFixed(4)),
      weight: wght,
    });
    // SMART-LAYER DATA SPINE — log the rule-vs-human delta as a labeled training example. The cap-match
    // rule predicted the optical default ({opticalSize, lh 1, track 0, wght 500}); whatever the user
    // KEPT is the human label. logTuneExample skips no-ops (kept == predicted), so only real corrections
    // become data. This is what the correction model (scripts/train-finetune.mjs) trains on.
    if (baseM && candM) {
      logTuneExample(buildExample({
        ts: Date.now(),
        role: focusRole.kind,
        anchor: matchAnchor,
        base: baseM, cand: candM, candWeight: wght,
        sizePx: nominal,
        tRule: { size: Number(opticalSize.toFixed(3)), lh: 1, track: 0, wght: 500 },
        tHuman: { size: sizeMul, lh: lhMul, track: track / 1000, wght },
      }));
      setLogged(exampleCount());
    }
    tactileSuccess();
    setApplied(true);
    window.setTimeout(() => setApplied(false), 1500);
  };
  const fontTag = dirTagFor(directions, focusRole);
  const fontAnyTag = dirAnyTagFor(directions);

  const specimenBase: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, margin: 0,
    fontFamily: base.family, fontSize: BASE_PX, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em",
    color: "var(--t-ink)", whiteSpace: "nowrap",
  };
  const specimenCand: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, margin: 0,
    fontFamily: cand.family, fontSize: candSize, fontWeight: wght, lineHeight: lhMul,
    letterSpacing: `${track / 1000}em`, whiteSpace: "nowrap",
    // difference blend math (out = |a − b|) needs white here to invert the base into a crisp
    // ghost; any other color would only partially subtract. Not a palette color — a blend operand.
    color: overlay === "difference" ? "#fff" : "var(--t-ink)",
    opacity: overlay === "ghost" ? 0.4 : 1,
    mixBlendMode: overlay === "difference" ? "difference" : "normal",
    transform: `translate(${ax}px, ${ay}px)`, // registration nudge from the red anchor
    cursor: dragging ? "grabbing" : "grab", // grab the letters directly to re-register
    userSelect: "none", touchAction: "none",
  };

  return (
    <div style={{ paddingLeft: "clamp(6px,1.6vw,22px)", paddingBottom: 140 }}>
      <input className="t-sample" value={text} onChange={(e) => setText(e.target.value)} aria-label="Sample" placeholder="Type a sample" spellCheck={false}
        style={{ width: "min(420px,100%)", border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontSize: 13, color: "var(--t-ink-3)", padding: "0 0 6px", marginBottom: 40 }} />
      {/* the data spine, made visible — each calibration you apply feeds the correction model. Quiet:
          a count + an export to pull the JSONL for training. Only shown once there's data. */}
      {logged > 0 && (
        <button
          type="button"
          onClick={() => (window as unknown as { cotejoTuneData: { download: () => void } }).cotejoTuneData.download()}
          title="Export the collected calibration examples (JSONL) to train the correction model"
          style={{ position: "absolute", bottom: 120, left: "clamp(6px,1.6vw,22px)", display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "transparent", cursor: "pointer", fontFamily: MONO, fontSize: 11, color: "var(--t-ink-3)" }}
        >
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--t-match)", flexShrink: 0 }} />
          {logged} calibration{logged === 1 ? "" : "s"} feeding the model
          <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>export</span>
        </button>
      )}
      <div ref={wrapRef} style={{ position: "relative", height: OVERLAY_H }}>
        <p style={specimenBase}>{text}</p>
        <p
          style={specimenCand}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onLostPointerCapture={endDrag}
        >{text}</p>

        {/* red registration anchor — guides + draggable handle + live offset */}
        <div aria-hidden style={{ position: "absolute", left: anchor.x, top: 0, bottom: 0, width: 1, background: "var(--t-anchor)", opacity: 0.42, pointerEvents: "none" }} />
        {snapLabel && snaps ? (
          <>
            {/* snapped: light up the matched base reference line + label it */}
            <div aria-hidden style={{ position: "absolute", top: snaps.refY[snapLabel === "x-height" ? "x" : snapLabel], left: 0, right: 0, height: 1, background: "var(--t-anchor)", opacity: 0.95, pointerEvents: "none" }} />
            <span aria-hidden style={{ position: "absolute", top: snaps.refY[snapLabel === "x-height" ? "x" : snapLabel] - 15, right: 2, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-anchor)", pointerEvents: "none" }}>{snapLabel}</span>
          </>
        ) : (
          <div aria-hidden style={{ position: "absolute", top: anchor.y, left: 0, right: 0, height: 1, background: "var(--t-anchor)", opacity: 0.28, pointerEvents: "none" }} />
        )}
        <div
          className="t-anchor"
          data-snap={snapLabel || ""}
          tabIndex={0}
          aria-label="Drag to line the two fonts up at any point (e.g. their baselines)"
          aria-valuetext={`offset ${ax >= 0 ? "+" : ""}${ax}px, ${ay >= 0 ? "+" : ""}${ay}px`}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onLostPointerCapture={endDrag}
          onDoubleClick={() => setAnchor(ANCHOR_HOME)}
          onKeyDown={nudge}
          title="Drag to line the two fonts up at any point · double-click to reset"
          style={{
            position: "absolute", left: anchor.x, top: anchor.y, width: 16, height: 16,
            transform: "translate(-50%,-50%)", borderRadius: 999,
            border: "2px solid var(--t-anchor)", background: "var(--t-bg)",
            cursor: dragging ? "grabbing" : "grab", touchAction: "none",
            boxShadow: "0 1px 5px rgba(27,24,21,0.28)",
            scale: dragging ? "1.18" : "1", transition: "scale var(--t-dur) var(--t-ease)",
          }}
        />
        {(ax !== 0 || ay !== 0) && (
          <span aria-hidden style={{ position: "absolute", left: anchor.x + 14, top: anchor.y - 24, fontFamily: MONO, fontSize: 10, color: "var(--t-anchor)", whiteSpace: "nowrap", pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}>
            {`${ax >= 0 ? "+" : ""}${ax} · ${ay >= 0 ? "+" : ""}${ay}`}
          </span>
        )}
      </div>

      <BottomDock>
        {roleSelOpts.length > 1 && (
          <PillSelect value={focusRoleId} options={roleSelOpts} onChange={setFocusRoleId} />
        )}
        <FontPicker value={baseId} onPick={setBaseId} tagFor={fontTag} tagForAny={fontAnyTag} roleLabel={focusRole.name} />
        <FontPicker label="vs" value={candId} onPick={setCandId} tagFor={fontTag} tagForAny={fontAnyTag} roleLabel={focusRole.name} />
        <Segmented
          options={[{ id: "ghost", label: "ghost" }, { id: "difference", label: "difference" }]}
          value={overlay} onChange={setOverlay} ariaLabel="How to overlay the two fonts — faint ghost, or a difference blend that highlights where they don't line up" compact
        />
        {/* separate the role/font/overlay group from the dials with SPACING, not a rule
            (8pt grid): the dock's 20px column-gap + this 16px = a deliberate group break */}
        <span style={{ marginLeft: 16, display: "inline-flex" }}>
          {/* show the RESOLVED px the role will ship at, not a bare ×multiplier (100-run #8) */}
          <StretchySlider label="size" value={sizeMul} min={0.6} max={1.4} step={0.001} onChange={setSizeMul} format={(v) => `${Math.round(roleSize(focusRole0, scale) * v)}px`} width={140} />
        </span>
        <StretchySlider label="line height" value={lhMul} min={0.8} max={1.4} step={0.01} onChange={setLhMul} format={(v) => `×${v.toFixed(2)}`} width={130} />
        <StretchySlider label="spacing" value={track} min={-60} max={60} step={1} onChange={setTrack} format={(v) => `${(v / 1000).toFixed(3)}em`} width={130} />
        <StretchySlider label="weight" value={wght} min={100} max={900} step={10} onChange={setWght} format={(v) => `${v}`} width={130} />
        <span style={{ marginLeft: 16, display: "inline-flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" mono onClick={autoTune}
            title={hasCorrectionModel() ? "Auto-tune — measures both faces + applies the learned optical match" : "Auto-tune — measures both faces and snaps every dial to the cap-matched optical default (learns from real calibrations over time)"}>
            <RingDot size={13} /> auto-tune
          </Btn>
          <Btn variant="ghost" size="sm" mono onClick={reset}>reset</Btn>
          <Btn variant={applied ? "accent" : "primary"} size="sm" mono onClick={applyToRole}
            title={`Adopt ${cand.label} for ${focusRole.name} at this calibration`}>
            {applied ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={13} /> applied</span> : `apply to ${focusRole.name.toLowerCase()}`}
          </Btn>
        </span>
      </BottomDock>
    </div>
  );
}
