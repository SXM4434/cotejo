// Shared chrome for the VIDEO surfaces (Title card · Lower third · Caption). A video editor's
// "real cases" are type in a video FRAME — title card, chyron, caption — so these three render
// inside a 16:9 frame with minimal capture chrome (REC + timecode). The frame is a CLEAR, bordered
// region (not a dark footage fill): the 16:9 box + the chrome + the layout positions say "video"
// without a heavy ground that fights dark mode or forces off-theme ink.
//
// Ink is THEME-tokened, so the type flips with the ground (paper → dark ink · DARK_GROUND → light
// ink) and the frame never paints a second dark rectangle inside the dark canvas.
import React from "react";

export const VID_INK = "var(--t-ink)";
export const VID_INK_2 = "var(--t-ink-2)";
export const VID_INK_3 = "var(--t-ink-3)";
const MONO = "var(--t-mono)";
const FRAME_BORDER = "color-mix(in oklab, var(--t-ink) 16%, transparent)";

export function VideoFrame({
  children, timecode = "00:14:22:09", bare = false,
}: {
  children: React.ReactNode;
  timecode?: string;
  // OVERLAY (onion) mode — render JUST the type, transparent, filling the parent. The frame (border
  // + chrome) is painted ONCE by the parent so two type layers crossfade over one constant frame.
  bare?: boolean;
}) {
  if (bare) return <div style={{ position: "absolute", inset: 0 }}>{children}</div>;
  return (
    <div
      style={{
        position: "relative", width: "100%", maxWidth: 720, aspectRatio: "16 / 9",
        borderRadius: "var(--t-r-block)", overflow: "hidden",
        background: "transparent", border: `1px solid ${FRAME_BORDER}`,
      }}
    >
      {/* capture chrome — REC + timecode, tiny mono in the top corners. Signals "this is video"
          (the whole point of the preview) without competing with the type being judged. */}
      <div aria-hidden style={{ position: "absolute", top: 14, left: 16, display: "inline-flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: "#e0564b" }} />
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: VID_INK_3 }}>REC</span>
      </div>
      <div aria-hidden style={{ position: "absolute", top: 14, right: 16, fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: VID_INK_3 }}>{timecode}</div>
      {children}
    </div>
  );
}
