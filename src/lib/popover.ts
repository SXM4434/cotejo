// Popover motion origin (Emil) — a menu should appear to grow OUT OF its trigger, not from centre.
// Derive the transform-origin + the small enter translate from the measured placement: a down-opening
// menu drops from its top edge; an up-opening menu (e.g. the bottom dock) rises from its bottom edge;
// left/right-aligned menus scale from that corner. Spread the result into the popover's inline style;
// `.t-pop` reads `--pop-origin`/`--pop-y` in its keyframe.
import type React from "react";

export const popMotion = (pos: { top?: number; bottom?: number; left?: number; right?: number }): React.CSSProperties => ({
  transformOrigin: `${pos.top != null ? "top" : "bottom"} ${pos.right != null ? "right" : "left"}`,
  ["--pop-y" as keyof React.CSSProperties]: pos.top != null ? "-4px" : "4px",
} as React.CSSProperties);

// modals aren't anchored to a trigger → they scale from CENTRE, with no directional drop (Emil's
// stated exception to the trigger-origin rule).
export const modalMotion = { transformOrigin: "center", ["--pop-y"]: "0px" } as React.CSSProperties;
