// glassMap — procedural, optics-accurate displacement map for liquid glass (the
// Aave approach): a rounded-rect "lens" where light bends at the curved RIM and
// passes straight through the flat center. Encodes per-pixel displacement in R/G
// (r = 128 + dx*127, g = 128 + dy*127; b = 128 neutral), like real glass refraction.
//
// The bezel cross-section is a quarter-ellipse (convex glass edge); the sampling
// displacement follows the surface SLOPE (steepest at the very edge → strongest
// bend, zero at the inner bezel). Direction = the inward surface normal.
// Returns a PNG data URL sized to the element. Regenerate on resize.

export function generateDisplacementMap(
  w: number, h: number, radius: number,
  bezel = Math.min(w, h) * 0.28, // how far in the curved rim reaches
): string {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const hx = W / 2, hy = H / 2;
  const r = Math.min(radius, hx, hy);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - hx;
      const py = y + 0.5 - hy;
      // rounded-rect signed distance (negative inside)
      const qx = Math.abs(px) - (hx - r);
      const qy = Math.abs(py) - (hy - r);
      const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
      const outside = Math.hypot(ax, ay);
      const sd = Math.min(Math.max(qx, qy), 0) + outside - r;
      const dist = -sd; // distance from the edge, inward

      let dx = 0, dy = 0;
      if (dist >= 0 && dist < bezel) {
        // inward surface normal
        let nx: number, ny: number;
        if (qx > 0 && qy > 0) {            // corner — radial normal
          nx = ax * Math.sign(px); ny = ay * Math.sign(py);
        } else if (qx > qy) {              // left/right straight edge
          nx = Math.sign(px); ny = 0;
        } else {                           // top/bottom straight edge
          nx = 0; ny = Math.sign(py);
        }
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        // quarter-ellipse slope: t=0 at edge → slope 1; t=1 at inner → slope 0
        const t = dist / bezel;
        const slope = Math.sqrt(Math.max(0, 1 - t * t)); // convex glass profile
        // refraction pulls edge content inward (toward center) → -normal
        dx = -nx * slope;
        dy = -ny * slope;
      }
      const i = (y * W + x) * 4;
      d[i] = Math.max(0, Math.min(255, 128 + dx * 127));
      d[i + 1] = Math.max(0, Math.min(255, 128 + dy * 127));
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}
