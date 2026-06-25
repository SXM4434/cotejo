// /api/model — returns the latest correction model (retrained nightly by /api/cron/retrain from real
// usage). The app fetches this on load (lib/autofinetune/correction.ts) and applies it on top of the
// cap-match rule. Returns {trained:false} when there's no store / no model yet → the rule runs alone.
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ trained: false });
  try {
    const { blobs } = await list({ prefix: "model/correction.json", limit: 1 });
    if (!blobs.length) return res.status(200).json({ trained: false });
    const m = await fetch(blobs[0].url).then((r) => r.json());
    res.setHeader("Cache-Control", "public, max-age=300"); // 5-min CDN cache; nightly retrain is plenty fresh
    return res.status(200).json(m);
  } catch {
    return res.status(200).json({ trained: false });
  }
}
