// /api/cron/retrain — VERCEL CRON (see vercel.json). Reads every collected calibration example from the
// Blob store, fits the correction model (ridge regression of the residual human−rule per output), and
// writes the trained model back to the store at model/correction.json. The app fetches that via /api/model
// and applies it. This is what makes "trains on users" HANDS-OFF — no one runs a script. Below the example
// floor it writes an identity model (no fabrication). Same math as scripts/train-finetune.mjs.
import { list, put } from "@vercel/blob";

const FEATURES = ["capScale", "xScale", "candXRatio", "baseXRatio", "advRatio", "sizePx/100", "anchorIsCap"];
const MIN = 24, RIDGE = 1e-3;

function featureVector(ex) {
  const b = ex.base, c = ex.cand;
  const capScale = c.cap > 0 ? b.cap / c.cap : 1;
  const xScale = c.xHeight > 0 ? b.xHeight / c.xHeight : capScale;
  return [capScale, xScale, c.cap > 0 ? c.xHeight / c.cap : 0, b.cap > 0 ? b.xHeight / b.cap : 0, b.advance > 0 ? c.advance / b.advance : 1, ex.sizePx / 100, ex.anchor === "cap" ? 1 : 0];
}
function solve(A, y) {
  const n = A.length, M = A.map((row, i) => [...row, y[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-9;
    for (let r = 0; r < n; r++) { if (r === col) continue; const f = M[r][col] / d; for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k]; }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-9));
}
function fitRidge(X, y) {
  const n = X.length, d = X[0].length, Xb = X.map((row) => [...row, 1]), k = d + 1;
  const A = Array.from({ length: k }, () => new Array(k).fill(0)), Yv = new Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) { Yv[a] += Xb[i][a] * y[i]; for (let bb = 0; bb < k; bb++) A[a][bb] += Xb[i][a] * Xb[i][bb]; }
  for (let a = 0; a < d; a++) A[a][a] += RIDGE * n;
  const sol = solve(A, Yv);
  return { w: sol.slice(0, d), b: sol[d] };
}

export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ ok: false, reason: "store-not-configured" });
  try {
    const urls = [];
    let cursor;
    do { const { blobs, cursor: next, hasMore } = await list({ prefix: "examples/", cursor, limit: 1000 }); urls.push(...blobs.map((b) => b.url)); cursor = hasMore ? next : undefined; } while (cursor);
    const rows = (await Promise.all(urls.map((u) => fetch(u).then((r) => r.json()).catch(() => null)))).filter(Boolean);
    const data = rows
      .filter((ex) => ex && ex.base && ex.cand && ex.tRule && ex.tHuman)
      .map((ex) => ({ x: featureVector(ex), size: ex.tHuman.size - ex.tRule.size, lh: ex.tHuman.lh - ex.tRule.lh, track: ex.tHuman.track - ex.tRule.track }));

    let model;
    if (data.length < MIN) {
      model = { trained: false, n: data.length };
    } else {
      model = { trained: true, n: data.length, features: FEATURES, trainedAt: new Date().toISOString() };
      for (const key of ["size", "lh", "track"]) {
        const fit = fitRidge(data.map((r) => r.x), data.map((r) => r[key]));
        model[key] = { w: fit.w.map((v) => +v.toFixed(6)), b: +fit.b.toFixed(6) };
      }
    }
    await put("model/correction.json", JSON.stringify(model), { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
    return res.status(200).json({ ok: true, ...model });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
