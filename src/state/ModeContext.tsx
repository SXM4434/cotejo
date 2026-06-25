// Mode state — the 6-mode product (03-ia-and-modes.md), foundation laid here as
// the Global-bar mode tabs. Compare is the gravitational center; the rest scaffold
// in as honest "planned" modes until built. URL param `mode` drives it (shareable).
import React from "react";

export type Mode = "compare" | "directions" | "tune" | "setup";

export const MODES: { id: Mode; label: string; built: boolean }[] = [
  { id: "setup", label: "Set Up", built: true },
  { id: "compare", label: "Compare", built: true },
  { id: "directions", label: "Directions", built: true },
  { id: "tune", label: "Tune", built: true },
];

type Ctx = { mode: Mode; setMode: (m: Mode) => void };
const ModeCtx = React.createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const init = new URLSearchParams(window.location.search).get("mode") as Mode | null;
  const valid = MODES.some((m) => m.id === init);
  // first paint lands on SET UP — you build the system before you compare (a ?mode= param still wins).
  const [mode, setMode] = React.useState<Mode>(valid ? (init as Mode) : "setup");
  return <ModeCtx.Provider value={{ mode, setMode }}>{children}</ModeCtx.Provider>;
}

export function useMode(): Ctx {
  const v = React.useContext(ModeCtx);
  if (!v) throw new Error("useMode must be used inside ModeProvider");
  return v;
}
