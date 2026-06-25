// ViewportContext — the GLOBAL viewing lens. One control in the chrome sets the
// width every mode renders its (fluid) type at, so you can preview Mobile/Tablet/
// Desktop from anywhere. Default = "auto" → your REAL screen width (Set Up stays
// honest to your actual viewport — the base — until you deliberately simulate one).
// Only meaningful when the scale is fluid; the chrome shows the control then.
import React from "react";
import { VP_MAX } from "./SessionContext";

export type Lens = "auto" | "mobile" | "tablet" | "desktop";
const PRESET_W: Record<Exclude<Lens, "auto">, number> = { mobile: 390, tablet: 768, desktop: 1280 };
export const LENS_OPTS: { id: Lens; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablet" },
  { id: "desktop", label: "Desktop" },
];

type Ctx = { lens: Lens; setLens: (l: Lens) => void; vw: number };
const ViewportCtx = React.createContext<Ctx | null>(null);

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [lens, setLens] = React.useState<Lens>("auto");
  const [winW, setWinW] = React.useState(() => (typeof window !== "undefined" ? window.innerWidth : VP_MAX));
  // track the real width only while in Auto (measure, never estimate)
  React.useEffect(() => {
    if (lens !== "auto") return;
    const on = () => setWinW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [lens]);
  const vw = lens === "auto" ? winW : PRESET_W[lens];
  return <ViewportCtx.Provider value={{ lens, setLens, vw }}>{children}</ViewportCtx.Provider>;
}

export function useViewport(): Ctx {
  const v = React.useContext(ViewportCtx);
  if (!v) throw new Error("useViewport must be used inside ViewportProvider");
  return v;
}
