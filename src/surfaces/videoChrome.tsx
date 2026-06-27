// Shared chrome for the VIDEO surfaces (Title card · Lower third · Caption). A video editor's
// "real cases" are type laid over FOOTAGE, not paper — so these three render inside a 16:9 frame
// with a neutral cinematic gradient (no real image, so what you read is the TYPE, never a photo)
// plus minimal capture chrome (REC + timecode) so it reads as video, not a dark poster.
//
// Text on the frame is LIGHT and HARDCODED — never page-direction tokens — because the ground is
// fixed-dark regardless of the app's light/dark theme (same rule as marks on fixed media:
// [[feedback_media_overlay_ink_doesnt_flip]]). The one reserved accent (cobalt --t-match) is NOT
// used here; broadcast overlays read on a neutral light bar, and cobalt stays for picked state.
import React from "react";

export const VID_INK = "#ffffff";
export const VID_INK_2 = "rgba(255,255,255,0.74)";
export const VID_INK_3 = "rgba(255,255,255,0.5)";
const MONO = "var(--t-mono)";

export function VideoFrame({
  children, timecode = "00:14:22:09", scrim = "none",
}: {
  children: React.ReactNode;
  timecode?: string;
  // a bottom gradient that lifts caption legibility off busy footage (real captions sit on one).
  scrim?: "bottom" | "none";
}) {
  return (
    <div
      style={{
        position: "relative", width: "100%", maxWidth: 720, aspectRatio: "16 / 9",
        borderRadius: "var(--t-r-block)", overflow: "hidden",
        // a cinematic ground: warm key light upper-left falling to near-black — enough tonal range
        // that the empty footage doesn't read as a flat swatch, neutral enough not to tint the type.
        background: "radial-gradient(125% 125% at 28% 18%, #343a45 0%, #1b1e24 52%, #0c0d11 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {/* vignette — pulls the corners down so centered/lower type always has contrast under it */}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(150% 110% at 50% 125%, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
      {scrim === "bottom" && (
        <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "46%", background: "linear-gradient(to top, rgba(0,0,0,0.62), transparent)" }} />
      )}
      {/* capture chrome — REC + timecode, tiny mono in the top corners. Signals "this is video"
          (which is the whole point of the preview) without competing with the type being judged. */}
      <div aria-hidden style={{ position: "absolute", top: 14, left: 16, display: "inline-flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: "rgba(255,90,77,0.9)" }} />
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: VID_INK_3 }}>REC</span>
      </div>
      <div aria-hidden style={{ position: "absolute", top: 14, right: 16, fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: VID_INK_3 }}>{timecode}</div>
      {children}
    </div>
  );
}
