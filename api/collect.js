// /api/collect — receives ONE calibration example and appends it to a SHARED store (Vercel KV / Upstash
// Redis over REST), so the auto-fine-tune correction model can train on REAL usage across ALL users —
// not just one browser's localStorage. Best-effort + non-blocking; never throws back at the client.
// No PII: each example is just font metrics + the rule-vs-human tune delta (see lib/autofinetune/smart).
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  // store not provisioned yet → succeed quietly so the client never errors (collection just no-ops)
  if (!url || !token) return res.status(200).json({ ok: true, stored: false, reason: "store-not-configured" });

  try {
    const value = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["RPUSH", "cotejo:examples", value]),
    });
    const j = await r.json().catch(() => ({}));
    return res.status(200).json({ ok: true, stored: true, total: j.result ?? null });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
