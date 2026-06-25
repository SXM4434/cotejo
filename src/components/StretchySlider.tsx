// StretchySlider — the elastic/rubber-band slider primitive (Sebs's non-negotiable).
// Technique researched from BuildUI's Elastic Slider (Selikoff/Toronto): drag past
// the ends and the rail rubber-bands via a sigmoid decay() (diminishing returns,
// capped at MAX_OVERFLOW), squashing scaleY, then springs back (bounce 0.5 — the
// one justified bounce, it IS the feature). Subtle tick on step, thunk on the end.
// Reusable across Tune (deltas) + Set Up (scale). Controlled.
import React from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { armAudio, playTick, playBound } from "../lib/sound";
import { haptic } from "../lib/haptics";

const MAX_OVERFLOW = 50;
// sigmoid diminishing-returns: asymptotes to `max` instead of growing linearly
function decay(value: number, max: number) {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

export function StretchySlider({
  value, min, max, step = 1, onChange, label, format, width = 190,
}: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
  label?: string;
  format?: (v: number) => string;
  width?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const overflow = useMotionValue(0);          // signed, decayed px past an end
  const [originRight, setOriginRight] = React.useState(false);
  const lastStep = React.useRef(value);
  const wasOver = React.useRef(false);

  const scaleX = useTransform(overflow, (o) => 1 + Math.abs(o) / Math.max(width, 1));
  const scaleY = useTransform(overflow, (o) => 1 - Math.min(Math.abs(o), MAX_OVERFLOW) / MAX_OVERFLOW * 0.28);

  const pct = (value - min) / (max - min || 1);

  const snap = (raw: number) => {
    const v = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, v));
  };

  const handle = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;

    const v = snap(min + (Math.max(0, Math.min(rect.width, x)) / rect.width) * (max - min));
    if (v !== value) {
      onChange(v);
      if (v !== lastStep.current) { lastStep.current = v; playTick(); }
    }

    // overflow + rubber-band
    let over = 0;
    if (x < 0) over = x;
    else if (x > rect.width) over = x - rect.width;
    const isOver = over !== 0;
    if (isOver && !wasOver.current) { playBound(); haptic.soft(); } // the elastic end — a soft physical bump
    wasOver.current = isOver;
    setOriginRight(over < 0);
    overflow.set(Math.sign(over) * decay(Math.abs(over), MAX_OVERFLOW));
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    armAudio();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handle(e.clientX);
  };
  const onMove = (e: React.PointerEvent) => { if (e.buttons) handle(e.clientX); };
  const onUp = () => { wasOver.current = false; animate(overflow, 0, { type: "spring", bounce: 0.5, duration: 0.6 }); };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 7, width }}>
      {(label || format) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {label && <span style={{ fontFamily: "var(--t-sans)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t-ink-3)" }}>{label}</span>}
          {format && <span style={{ fontFamily: "var(--t-sans)", fontSize: 12, color: "var(--t-ink-2)", fontVariantNumeric: "tabular-nums" }}>{format(value)}</span>}
        </div>
      )}
      <div
        ref={ref}
        className="t-slider"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onLostPointerCapture={onUp}
        role="slider"
        aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          // preventDefault on the arrows too — otherwise ArrowUp/Down scroll the page out from under
          // you while you're nudging the tool's signature slider (D-H5).
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(snap(value - step)); playTick(); }
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(snap(value + step)); playTick(); }
          if (e.key === "Home") { e.preventDefault(); onChange(min); playTick(); }
          if (e.key === "End") { e.preventDefault(); onChange(max); playTick(); }
        }}
        style={{ position: "relative", height: 36, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}
      >
        <motion.div
          style={{
            position: "relative", width: "100%", height: 6,
            scaleX, scaleY, transformOrigin: originRight ? "right center" : "left center",
          }}
        >
          {/* track + fill only — no protruding thumb (the fill's leading edge is the
              position, like Locale/Lisse). The whole bar is the hit area. */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "rgba(var(--t-scrim), 0.10)" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${pct * 100}%`, borderRadius: 999, background: "var(--t-ink)" }} />
        </motion.div>
      </div>
    </div>
  );
}
