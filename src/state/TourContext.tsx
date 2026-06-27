// Walkthrough state — the guided tour shows ONCE on first visit (the video-editor ask: "a
// walkthrough so I can see how it works"), then stays re-openable from the bar's ? button forever.
// Just open/close + the one-time gate; the modal itself lives in components/Walkthrough.
import React from "react";

const KEY = "cotejo.tour.seen.v1";

type Ctx = { open: boolean; openTour: () => void; close: () => void };
const TourCtx = React.createContext<Ctx | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  // first-ever visit → opens itself; afterwards it's opt-in via the bar button.
  const [open, setOpen] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem(KEY) !== "1"; } catch { return false; }
  });
  const openTour = React.useCallback(() => setOpen(true), []);
  const close = React.useCallback(() => {
    try { window.localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
    setOpen(false);
  }, []);
  return <TourCtx.Provider value={{ open, openTour, close }}>{children}</TourCtx.Provider>;
}

export function useTour(): Ctx {
  const v = React.useContext(TourCtx);
  if (!v) throw new Error("useTour must be used inside TourProvider");
  return v;
}
