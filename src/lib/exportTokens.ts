// STRUCTURED EXPORT — the deliverable leaves the tool as real, paste-and-SHIP code, not a screenshot.
// The 100-user run's #1 most-wanted: a COMPLETE, verifiable export. So every format now carries the
// whole resolved system — font, size (clamp() when fluid), per-role OpenType, AND the Tune-resolved
// line-height / tracking / weight when you've applied a tune — plus, for CSS, the @import that makes
// the Google fonts actually load, and a per-font license header so you know what's free to ship.
//   · CSS custom properties — @import + license header + a :root block, one set of vars per role.
//   · DTCG token JSON — Design Tokens Community Group composite `typography` tokens (Style Dictionary /
//     Tokens Studio consume these). fontFamily/fontSize/fontWeight/lineHeight/letterSpacing are real
//     DTCG slots; feature-settings ride $extensions (DTCG has no slot for them — we don't fake one).
//   · Plain spec — human-readable handoff (font · role · px · weight · link) for a doc/Canva.
import {
  FACES, roleClampCss, roleRange, sizeAtViewport, pxToRem, VP_MAX,
  type Role, type Scale,
} from "../state/SessionContext";
import { gfFallback } from "../data/googleFonts";

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "role";
const faceOf = (fontId: string) => FACES.find((f) => f.id === fontId);
// uploads export under their REAL name (their label), not the internal CotejoUserN token — paired with
// a self-host @font-face stub so the exported CSS is coherent (the role references a family the stub defines).
const familyOf = (fontId: string) => {
  const f = faceOf(fontId);
  if (f && fontId.startsWith("user-")) return `'${f.label}', ${gfFallback(f.cat)}`;
  return f?.family ?? fontId;
};
// commented @font-face stubs for uploaded fonts (we can't embed the binary) — so the handoff isn't a
// silent broken render (100-run #3). The user drops in their woff2 path.
function uploadStubs(roles: Role[]): string[] {
  const seen = new Set<string>(), out: string[] = [];
  for (const r of roles) {
    const f = faceOf(r.fontId);
    if (f && r.fontId.startsWith("user-") && !seen.has(f.label)) {
      seen.add(f.label);
      out.push(`/* Self-host '${f.label}' — set the path to your woff2:\n@font-face { font-family: '${f.label}'; src: url('/fonts/${slug(f.label)}.woff2') format('woff2'); font-display: swap; } */`);
    }
  }
  return out;
}
const familyList = (family: string) => family.split(",").map((p) => p.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
const featuresOf = (role: Role) =>
  role.features && role.features.length ? role.features.map((t) => `"${t}" 1`).join(", ") : "";
const sizeToken = (role: Role, scale: Scale, unit: "rem" | "px") => roleClampCss(role, scale, unit);
const trackEm = (role: Role) => (role.tracking != null ? `${role.tracking}em` : "");

export type ExportUnit = "rem" | "px";

// the Google-fonts the system uses → @import lines so the exported CSS actually loads them. Built-ins
// (self-hosted in the tool) + uploads can't be @import-ed; we note them so the export is honest.
function fontProvenance(roles: Role[]) {
  const ids = Array.from(new Set(roles.map((r) => r.fontId)));
  // uploads split 3 ways: `upload` = still needs verification · `uploadCleared` = the user attested it
  // (dated + who + note → a defensible manifest) · `uploadTrial` = trial/eval, must NOT ship (hard warn).
  const google: string[] = [], builtin: string[] = [], upload: string[] = [], uploadCleared: string[] = [], uploadTrial: string[] = [];
  // group Google families by their REAL license (from the bundled directory) so the export names it
  // instead of hedging "confirm at fonts.google.com". `unknown` = the few families not in the repo data.
  const googleByLic: Record<string, string[]> = { ofl: [], apache: [], ufl: [], unknown: [] };
  for (const id of ids) {
    const f = faceOf(id); if (!f) continue;
    if (id.startsWith("gf-")) { google.push(f.measureFamily); googleByLic[f.gfLicense ?? "unknown"].push(f.measureFamily); }
    else if (id.startsWith("user-")) {
      if (f.licStatus === "cleared") {
        const bits = [f.clearedAt ? `cleared ${f.clearedAt.slice(0, 10)}` : "cleared", f.licBy ? `by ${f.licBy}` : "", f.licNote ? `— ${f.licNote}` : ""].filter(Boolean).join(" ");
        uploadCleared.push(`${f.label} (${bits})`);
      } else if (f.licStatus === "trial") {
        uploadTrial.push(f.label);
      } else upload.push(f.label);
    }
    else builtin.push(f.label);
  }
  return { google, googleByLic, builtin, upload, uploadCleared, uploadTrial };
}
const LIC_NAME: Record<string, string> = { ofl: "SIL Open Font License (OFL)", apache: "Apache License 2.0", ufl: "Ubuntu Font License (UFL)" };
function cssImports(roles: Role[]): string[] {
  const { google } = fontProvenance(roles);
  if (!google.length) return [];
  // the @import is the QUICK path but it's render-blocking + hits Google's CDN (a CSP/GDPR/perf concern
  // for a lot of teams). So we ship it WITH a note + a self-host alternative right below (100-run #1/#2).
  const out = ["/* QUICK START (dev) — works on paste, but loads from Google's CDN and is render-blocking.\n   For production, delete these two lines and use the self-host @font-face above instead. */"];
  for (const fam of google) out.push(`@import url('https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, "+")}:wght@400;500;700&display=swap');`);
  return out;
}
// self-host alternative for Google families (no render-block, CSP/GDPR-friendly) — download from
// fonts.google.com and point src at your own copy.
function googleStubs(roles: Role[]): string[] {
  const { google } = fontProvenance(roles);
  return google.map((fam) => `/* ★ RECOMMENDED for production — self-host '${fam}' (faster, no Google CDN call, CSP/GDPR-safe).\n   Download the woff2 from https://fonts.google.com/specimen/${fam.replace(/ /g, "+")}, set the path, uncomment:\n@font-face { font-family: '${fam}'; src: url('/fonts/${slug(fam)}-400.woff2') format('woff2'); font-weight: 400; font-display: swap; } */`);
}
function licenseHeaderLines(roles: Role[]): string[] {
  const { googleByLic, builtin, upload, uploadCleared, uploadTrial } = fontProvenance(roles);
  const out: string[] = [];
  if (uploadTrial.length) out.push(` * ⚠ TRIAL / EVAL FONTS — NOT LICENSED FOR PRODUCTION. Do NOT ship: ${uploadTrial.join(", ")}`);
  // one line per real license — free for commercial use, named (no "confirm it yourself" hedge).
  for (const k of ["ofl", "apache", "ufl"] as const) if (googleByLic[k].length) out.push(` * ${LIC_NAME[k]} — free for commercial use: ${googleByLic[k].join(", ")}`);
  if (googleByLic.unknown.length) out.push(` * Open-source — free for commercial use (confirm the license at fonts.google.com): ${googleByLic.unknown.join(", ")}`);
  if (upload.length) out.push(` * VERIFY THE LICENSE before shipping (your uploads): ${upload.join(", ")}`);
  if (uploadCleared.length) out.push(` * License cleared by you (your uploads): ${uploadCleared.join(", ")}`);
  if (builtin.length) out.push(` * Open-source, free for commercial use — self-host via your own @font-face: ${builtin.join(", ")}`);
  return out;
}

// ── CSS custom properties ──────────────────────────────────────────────────────────────────────
export function toCssVars(roles: Role[], scale: Scale, unit: ExportUnit = "rem"): string {
  const u = (px: number) => (unit === "rem" ? `${pxToRem(px)}rem` : `${px}px`);
  const lines: string[] = [];
  // recommended (self-host) FIRST, the quick @import after — with clear guidance so it's not a co-equal
  // choice the user has to adjudicate (100-run #2: decision paralysis).
  for (const stub of googleStubs(roles)) { lines.push(stub); lines.push(""); }
  for (const stub of uploadStubs(roles)) { lines.push(stub); lines.push(""); }
  const imps = cssImports(roles);
  for (const imp of imps) lines.push(imp);
  if (imps.length) lines.push("");
  const lic = licenseHeaderLines(roles);
  lines.push("/*");
  lines.push(` * Cotejo type system — base ${u(scale.base)} · ratio ${scale.ratio}${scale.fluid ? " · fluid" : ""}`);
  for (const l of lic) lines.push(l);
  lines.push(" */");
  lines.push(":root {");
  lines.push(`  --type-scale-ratio: ${scale.ratio};`);
  lines.push(`  --type-scale-base: ${u(scale.base)};`);
  for (const r of roles) {
    const k = slug(r.name);
    const feat = featuresOf(r), track = trackEm(r);
    lines.push("");
    lines.push(`  /* ${r.name} */`);
    lines.push(`  --type-${k}-font: ${familyOf(r.fontId)};`);
    lines.push(`  --type-${k}-size: ${sizeToken(r, scale, unit)};`);
    if (r.weight != null) lines.push(`  --type-${k}-weight: ${r.weight};`);
    if (r.lineHeight != null) lines.push(`  --type-${k}-line-height: ${r.lineHeight};`);
    if (track) lines.push(`  --type-${k}-letter-spacing: ${track};`);
    if (feat) lines.push(`  --type-${k}-features: ${feat};`);
  }
  lines.push("}");
  return lines.join("\n");
}

// ── DTCG token JSON ────────────────────────────────────────────────────────────────────────────
// Pipeline-safe (100-run #1, the design-systems-lead blocker): clamp() is NOT a valid DTCG `dimension`,
// so fontSize is always a plain dimension (the desktop value when fluid); the fluid envelope (min/max
// viewport + the clamp() string) rides a documented $extension instead. $type sits on every LEAF token
// (not just the group). OpenType features are a documented extension (DTCG typography has no slot).
type DtcgTypeValue = { fontFamily: string[]; fontSize: string; fontWeight?: number; lineHeight?: number; letterSpacing?: string };
type DtcgTypography = { $type: "typography"; $value: DtcgTypeValue; $extensions?: Record<string, unknown> };
export function toTokensJson(roles: Role[], scale: Scale, unit: ExportUnit = "rem"): string {
  const u = (px: number) => (unit === "rem" ? `${pxToRem(px)}rem` : `${px}px`);
  const type: Record<string, DtcgTypography> = {};
  for (const r of roles) {
    const feat = featuresOf(r), track = trackEm(r);
    const rng = roleRange(r, scale);
    // valid DTCG dimension: the fixed value, or the DESKTOP end when fluid (the clamp lives in $ext).
    const fontSize = rng ? u(sizeAtViewport(r, scale, VP_MAX)) : sizeToken(r, scale, unit);
    const v: DtcgTypeValue = { fontFamily: familyList(familyOf(r.fontId)), fontSize };
    if (r.weight != null) v.fontWeight = r.weight;
    if (r.lineHeight != null) v.lineHeight = r.lineHeight;
    if (track) v.letterSpacing = track;
    const ext: Record<string, unknown> = {};
    if (feat) ext.fontFeatureSettings = feat;
    if (rng) ext.fluid = { min: u(rng.min), max: u(rng.max), minViewport: "390px", maxViewport: "1280px", clamp: roleClampCss(r, scale, unit) };
    type[slug(r.name)] = { $type: "typography", $value: v, ...(Object.keys(ext).length ? { $extensions: { "com.cotejo": ext } } : {}) };
  }
  const { upload, uploadTrial } = fontProvenance(roles);
  const doc = {
    $description: `Cotejo type system — base ${u(scale.base)}, ratio ${scale.ratio}${scale.fluid ? ", fluid" : ""}. DTCG-format composite typography tokens, validated for Style Dictionary 4.x / Tokens Studio. fontSize is a plain dimension; fluid clamp() rides $extensions.com.cotejo.fluid.${uploadTrial.length ? " ⚠ Includes TRIAL/EVAL fonts NOT licensed for production — do not ship." : upload.length ? " Verify licenses for uploaded fonts before shipping." : ""}`,
    scale: {
      base: { $type: "dimension" as const, $value: u(scale.base) },
      ratio: { $type: "number" as const, $value: scale.ratio },
    },
    type,
  };
  return JSON.stringify(doc, null, 2);
}

// ── Plain spec (non-designer / Canva handoff) — true prose: font · role · px · weight · link. ──
export function toPlainSpec(roles: Role[], scale: Scale): string {
  const lines: string[] = [];
  lines.push(`Type system — base ${scale.base}px · ratio ${scale.ratio}${scale.fluid ? " (fluid)" : ""}`);
  lines.push("");
  for (const r of roles) {
    const f = faceOf(r.fontId);
    const fam = f?.label ?? r.fontId;
    const rng = roleRange(r, scale);
    const size = rng ? `${rng.min}–${rng.max}px` : `${sizeAtViewport(r, scale, VP_MAX)}px`;
    const wt = r.weight != null ? ` · ${r.weight}` : "";
    lines.push(`${r.name} — ${fam} · ${size}${wt}`);
  }
  // the links + license at the bottom so a founder can grab the fonts + know what's safe.
  const { google, upload, uploadCleared, uploadTrial, builtin } = fontProvenance(roles);
  if (google.length || upload.length || uploadCleared.length || uploadTrial.length || builtin.length) lines.push("");
  if (uploadTrial.length) lines.push(`⚠ TRIAL / EVAL — NOT LICENSED FOR PRODUCTION, do not ship: ${uploadTrial.join(", ")}`);
  for (const fam of google) lines.push(`${fam}: https://fonts.google.com/specimen/${fam.replace(/ /g, "+")} (free to use)`);
  if (builtin.length) lines.push(`Built-in faces (self-host): ${builtin.join(", ")}`);
  if (upload.length) lines.push(`Your uploads — verify the license before shipping: ${upload.join(", ")}`);
  if (uploadCleared.length) lines.push(`Your uploads — license cleared by you: ${uploadCleared.join(", ")}`);
  return lines.join("\n");
}

// ── Tailwind theme.extend (100-run: a lot of the dev/founder segment lives in Tailwind) ──────────
export function toTailwind(roles: Role[], scale: Scale, unit: ExportUnit = "rem"): string {
  const fam: string[] = [], sizes: string[] = [];
  for (const r of roles) {
    const k = slug(r.name);
    fam.push(`        ${JSON.stringify(k)}: ${JSON.stringify(familyList(familyOf(r.fontId)))},`);
    const opts: string[] = [];
    if (r.lineHeight != null) opts.push(`lineHeight: '${r.lineHeight}'`);
    if (r.tracking != null) opts.push(`letterSpacing: '${r.tracking}em'`);
    if (r.weight != null) opts.push(`fontWeight: '${r.weight}'`);
    const sz = JSON.stringify(sizeToken(r, scale, unit)); // clamp() is a valid arbitrary fontSize value
    sizes.push(opts.length ? `        ${JSON.stringify(k)}: [${sz}, { ${opts.join(", ")} }],` : `        ${JSON.stringify(k)}: ${sz},`);
  }
  return [
    "// tailwind.config.js — merge into theme.extend (use as font-{role} + text-{role})",
    "/** @type {import('tailwindcss').Config} */",
    "export default {",
    "  theme: {",
    "    extend: {",
    "      fontFamily: {",
    ...fam,
    "      },",
    "      fontSize: {",
    ...sizes,
    "      },",
    "    },",
    "  },",
    "};",
  ].join("\n");
}

export type ExportFormat = "css" | "json" | "spec" | "tailwind";
export function buildExport(fmt: ExportFormat, roles: Role[], scale: Scale, unit: ExportUnit = "rem"): { text: string; filename: string; mime: string } {
  switch (fmt) {
    case "css": return { text: toCssVars(roles, scale, unit), filename: "cotejo-type.css", mime: "text/css" };
    case "json": return { text: toTokensJson(roles, scale, unit), filename: "cotejo-tokens.json", mime: "application/json" };
    case "tailwind": return { text: toTailwind(roles, scale, unit), filename: "cotejo-tailwind.config.js", mime: "text/javascript" };
    case "spec": return { text: toPlainSpec(roles, scale), filename: "cotejo-type-spec.txt", mime: "text/plain" };
  }
}
