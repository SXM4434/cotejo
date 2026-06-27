// Cotejo — app shell. Global bar (wordmark + mode tabs) persists; the active mode
// renders below, inside #cotejo-stage — the real backdrop the liquid glass refracts
// IN PLACE via backdrop-filter (no clone). Chrome (bar, dock) is marked
// data-no-refract as a stable hook for tooling that needs the chrome boxes.
import { ModeProvider, useMode } from "./state/ModeContext";
import { WorkspaceProvider } from "./state/WorkspaceContext";
import { ViewportProvider } from "./state/ViewportContext";
import { TourProvider } from "./state/TourContext";
import { Walkthrough } from "./components/Walkthrough";
import { GlobalBar } from "./components/GlobalBar";
import { CompareProvider } from "./modes/compare/CompareContext";
import { CompareBar } from "./modes/compare/CompareBar";
import { CompareContent } from "./modes/compare/CompareContent";
import { SetUpMode } from "./modes/setup/SetUpMode";
import { TuneMode } from "./modes/tune/TuneMode";
import { DirectionsMode } from "./modes/directions/DirectionsMode";
import { STAGE_ID } from "./components/LiquidGlass";
import { UndoToast } from "./components/UndoToast";
import type { CSSProperties } from "react";

const page: CSSProperties = { minHeight: "100vh", padding: "16px clamp(10px,2vw,22px) 140px" };
// overflow-x: clip contains very large specimens (extreme scale) so they clip at the
// edge instead of scrolling the whole page. `clip` (not `hidden`) so it never creates
// a scroll container that would break the sticky GlobalBar.
const stage: CSSProperties = { position: "relative", overflowX: "clip" };

function Shell() {
  const { mode } = useMode();
  // the undo toast lives at the shell root so a bulk-replace recourse shows in ANY mode.
  return (
    <>
      {mode === "compare" ? (
        <CompareProvider>
          <div style={page}>
            <GlobalBar right={<CompareBar />} />
            <div id={STAGE_ID} style={stage}><CompareContent /></div>
          </div>
        </CompareProvider>
      ) : mode === "tune" ? (
        <div style={page}>
          <GlobalBar />
          <div id={STAGE_ID} style={stage}><TuneMode /></div>
        </div>
      ) : mode === "directions" ? (
        <div style={page}>
          <GlobalBar />
          <div id={STAGE_ID} style={stage}><DirectionsMode /></div>
        </div>
      ) : (
        // setup (and any fallback) — the entry mode
        <div style={page}>
          <GlobalBar />
          <div id={STAGE_ID} style={stage}><SetUpMode /></div>
        </div>
      )}
      <UndoToast />
      <Walkthrough />
    </>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <ViewportProvider>
        <ModeProvider>
          <TourProvider>
            <Shell />
          </TourProvider>
        </ModeProvider>
      </ViewportProvider>
    </WorkspaceProvider>
  );
}
