// /api/errors?key=ADMIN — dump every collected client error report as JSONL, so you can triage crashes:
//   curl "https://<app>/api/errors?key=$KEY" > errors.jsonl
// Reads every blob under errors/ from the shared Vercel Blob store. Guarded by COTEJO_ADMIN_KEY so the
// crash corpus isn't public. Mirrors /api/examples — the read-side counterpart to /api/error.
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
      const { blobs, cursor: next, hasMore } = await list({ prefix: "errors/", cursor, limit: 1000 });
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
