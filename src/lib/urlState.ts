// Shareable VIEW state in the URL. The comparison view — mode, which surface, View/Side-by-side/
// Onion, the two onioned systems, cap-match, ground — lives in the query string (like ?mode= always
// has). So a refresh keeps your view, AND the Share link reproduces the exact comparison, not just
// the setup (the setup rides in the #share= blob; the view rides here). Defaults are omitted by the
// callers so a plain session stays a clean URL.
export function readParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

// patch the query string in place (replaceState → no history spam, no reload). null/"" deletes a key.
export function writeParams(patch: Record<string, string | null | undefined>): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") p.delete(k);
    else p.set(k, v);
  }
  const qs = p.toString();
  window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
}
