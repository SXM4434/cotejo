// PNG export (BUILD-LIST v2 #14) — rasterize the comparison canvas to a downloadable image so a
// comparison can leave the tool. Uses html-to-image (proven DOM→PNG) rather than hand-rolled canvas
// serialization. It clones the node into an SVG <foreignObject> and embeds fonts it can fetch:
//   · built-in (self-hosted, same-origin) + BYO (base64) faces embed cleanly.
//   · Google faces are served CORS-open by gstatic, so they embed too in the common case; if a
//     cross-origin stylesheet blocks reading the @font-face rule, that one face falls back in the
//     PNG only (the on-screen render is unaffected). We surface a soft note rather than fail.
import { toPng } from "html-to-image";

const PAPER_FALLBACK = "#eef0ed"; // matches --t-bg (the live page ground), only used if the node bg reads empty

// nodes marked data-export-skip (e.g. the "+ add a font" control) are dropped from the capture so
// the image is the comparison, not the chrome.
const keep = (node: HTMLElement) => !(node instanceof HTMLElement && node.dataset && node.dataset.exportSkip != null);

const MARGIN = 56; // breathing room around the content so it never crops to the edge (poster margin)

export async function exportComparisonPng(filename = "cotejo-comparison.png"): Promise<{ ok: boolean; reason?: string }> {
  const node = document.getElementById("cotejo-canvas");
  if (!node) return { ok: false, reason: "Open a comparison first." };
  // ALWAYS sit the capture on the page ground (paper). The content keeps its own background — so a
  // dark-ground card renders as a dark rounded card ON the paper margin (its corners show), and a
  // paper comparison gets a clean paper border. A `margin` (not padding) gives the breathing room
  // without reflowing the node's own layout.
  const pageBg = getComputedStyle(document.body).backgroundColor || PAPER_FALLBACK;
  const w = node.offsetWidth, h = node.offsetHeight;
  try {
    const dataUrl = await toPng(node, {
      pixelRatio: 2, cacheBust: true, backgroundColor: pageBg, filter: keep,
      width: w + MARGIN * 2, height: h + MARGIN * 2,
      style: { margin: `${MARGIN}px` },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
