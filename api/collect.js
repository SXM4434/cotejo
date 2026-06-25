// /api/collect — receives ONE calibration example and stores it as a blob in the SHARED Vercel Blob
// store, so the auto-fine-tune correction model can train on REAL usage across ALL users (not just one
// browser's localStorage). Best-effort + non-blocking; never throws back at the client. No PII: each
// example is just font metrics + the rule-vs-human tune delta (see lib/autofinetune/smart).
import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  // store not provisioned → succeed quietly so the client never errors (collection just no-ops)
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ ok: true, stored: false, reason: "store-not-configured" });

  try {
    const value = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await put(`examples/${id}.json`, value, { access: "public", contentType: "application/json", addRandomSuffix: true });
    return res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
