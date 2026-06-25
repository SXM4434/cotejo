// /api/error — receives ONE client-side error report (from src/lib/errorReporter) and stores it as a
// blob under errors/ in the shared Vercel Blob store, so the bug-watch can surface real-world crashes
// across all users (not just one browser's console). Best-effort + non-blocking; never throws back at
// the client. Mirrors /api/collect: CORS + OPTIONS, POST only, no-op (200) when the store isn't
// provisioned, and always answers 200 so a broken page can't get a second error from the reporter.
import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  // store not provisioned → succeed quietly so the client never errors (reporting just no-ops)
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ ok: true, stored: false, reason: "store-not-configured" });

  try {
    const value = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await put(`errors/${id}.json`, value, { access: "public", contentType: "application/json", addRandomSuffix: true });
    return res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
