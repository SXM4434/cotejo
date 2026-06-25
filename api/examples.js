// /api/examples?key=ADMIN — dump every collected calibration example as JSONL, so you can train:
//   curl "https://<app>/api/examples?key=$KEY" > datasets/tune-examples.jsonl
//   node scripts/train-finetune.mjs    # → bakes the updated correction model
// Reads every blob under examples/ from the shared Vercel Blob store. Guarded by COTEJO_ADMIN_KEY so the
// corpus isn't public. This is the bridge from "users calibrate" to "the model retrains on real data".
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  if (!process.env.COTEJO_ADMIN_KEY || req.query.key !== process.env.COTEJO_ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).send("");
  try {
    const urls = [];
    let cursor;
    do {
      const { blobs, cursor: next, hasMore } = await list({ prefix: "examples/", cursor, limit: 1000 });
      urls.push(...blobs.map((b) => b.url));
      cursor = hasMore ? next : undefined;
    } while (cursor);
    const lines = await Promise.all(urls.map((u) => fetch(u).then((r) => r.text()).catch(() => "")));
    res.setHeader("Content-Type", "application/x-ndjson");
    return res.status(200).send(lines.filter(Boolean).join("\n"));
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
