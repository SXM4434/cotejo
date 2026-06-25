// Per-font commercial-license signal (AIRTIGHT-PASS F4 + license layer). Client studios need to know
// what's safe to ship. Built-ins are OFL; Google families carry their real OFL/Apache/UFL id (from
// Google's metadata) so you never re-confirm each one. An uploaded file is the user's own — we can't
// know its license, so it stays the user's OWN determination: unverified (verify) · cleared-to-ship ·
// or trial/eval-only (must NOT ship). Surfaced in the pickers, fonts manager, and export.
import type { Face } from "../state/SessionContext";

export type License = { kind: "ofl" | "byo" | "cleared" | "trial"; label: string; short: string; ship: boolean };

const GF_LICENSE_NAME: Record<string, string> = {
  ofl: "SIL Open Font License (OFL)",
  apache: "Apache License 2.0",
  ufl: "Ubuntu Font License (UFL)",
};

export function licenseOf(face: Face): License {
  if (face.id.startsWith("user-")) {
    // an upload — the user's own determination, never ours.
    if (face.licStatus === "cleared") {
      return { kind: "cleared", label: "Your upload — you’ve marked this license as cleared to ship", short: "license cleared", ship: true };
    }
    if (face.licStatus === "trial") {
      return { kind: "trial", label: "Your upload — marked TRIAL / EVAL only: not licensed to ship to production", short: "trial · not for production", ship: false };
    }
    return { kind: "byo", label: "Your upload — verify its license before shipping", short: "verify license", ship: false };
  }
  // Google families (+ built-ins) carry their specific open-source license id when known; else generic.
  if (face.gfLicense) {
    const name = GF_LICENSE_NAME[face.gfLicense] ?? "open-source";
    return { kind: "ofl", label: `${name} — free for commercial use`, short: face.gfLicense, ship: true };
  }
  return { kind: "ofl", label: "Open-source — free for commercial use (OFL/Apache/UFL; confirm at fonts.google.com)", short: "free · commercial", ship: true };
}
