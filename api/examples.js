// /api/examples?key=ADMIN — dump every collected calibration example as JSONL, so you can train:
//   curl "https://<app>/api/examples?key=$KEY" > datasets/tune-examples.jsonl
//   node scripts/train-finetune.mjs    # → bakes the updated correction model
// Guarded by COTEJO_ADMIN_KEY so the corpus isn't public. This is the bridge from "users calibrate"
// to "the model retrains on real data" — the real loop, not localStorage.
export default async function handler(req, res) {
  if (req.query.key !== process.env.COTEJO_ADMIN_KEY || !process.env.COTEJO_ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(200).send("");
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["LRANGE", "cotejo:examples", "0", "-1"]),
    });
    const j = await r.json();
    const rows = Array.isArray(j.result) ? j.result : [];
    res.setHeader("Content-Type", "application/x-ndjson");
    return res.status(200).send(rows.join("\n"));
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
