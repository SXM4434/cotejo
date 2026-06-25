// GOOGLE FONTS — a CURATED, hand-picked shelf (not the full ~1800 dump). Search filters within it;
// picking one loads it on demand (CSS2 API) and adds it to the catalog. All OFL/Apache → free to
// SHIP (unlike our Klim test faces). Kept lean on purpose — the wedge is the method, not the count.
export type GFCategory = "sans" | "serif" | "monospace" | "display" | "handwriting";
// the open-source license a Google family ships under (from fonts.google.com metadata). All are free
// for commercial use; surfaced so a user never has to re-confirm each font's license themselves.
export type GFLicense = "ofl" | "apache" | "ufl";
export type GFont = { family: string; category: GFCategory; license?: GFLicense };

export const GOOGLE_FONTS: GFont[] = [
  // — sans —
  { family: "Inter", category: "sans" },
  { family: "Roboto", category: "sans" },
  { family: "Open Sans", category: "sans" },
  { family: "Lato", category: "sans" },
  { family: "Montserrat", category: "sans" },
  { family: "Poppins", category: "sans" },
  { family: "Work Sans", category: "sans" },
  { family: "DM Sans", category: "sans" },
  { family: "Manrope", category: "sans" },
  { family: "Sora", category: "sans" },
  { family: "Space Grotesk", category: "sans" },
  { family: "Plus Jakarta Sans", category: "sans" },
  { family: "Figtree", category: "sans" },
  { family: "Outfit", category: "sans" },
  { family: "Archivo", category: "sans" },
  { family: "Hanken Grotesk", category: "sans" },
  { family: "Public Sans", category: "sans" },
  { family: "Rubik", category: "sans" },
  { family: "Karla", category: "sans" },
  { family: "Mulish", category: "sans" },
  { family: "Nunito", category: "sans" },
  { family: "Albert Sans", category: "sans" },
  { family: "Onest", category: "sans" },
  { family: "Schibsted Grotesk", category: "sans" },
  // — serif —
  { family: "Playfair Display", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Lora", category: "serif" },
  { family: "PT Serif", category: "serif" },
  { family: "Source Serif 4", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "Cormorant", category: "serif" },
  { family: "EB Garamond", category: "serif" },
  { family: "Bitter", category: "serif" },
  { family: "Spectral", category: "serif" },
  { family: "Fraunces", category: "serif" },
  { family: "Crimson Pro", category: "serif" },
  { family: "Domine", category: "serif" },
  { family: "Zilla Slab", category: "serif" },
  // — monospace —
  { family: "JetBrains Mono", category: "monospace" },
  { family: "IBM Plex Mono", category: "monospace" },
  { family: "Space Mono", category: "monospace" },
  { family: "Roboto Mono", category: "monospace" },
  { family: "Fira Code", category: "monospace" },
  { family: "DM Mono", category: "monospace" },
  { family: "Source Code Pro", category: "monospace" },
  // — display —
  { family: "Bebas Neue", category: "display" },
  { family: "Anton", category: "display" },
  { family: "Abril Fatface", category: "display" },
  { family: "Archivo Black", category: "display" },
  // — handwriting —
  { family: "Caveat", category: "handwriting" },
];

// slug ↔ family so a session can reference a Google font by a stable id ("gf-inter") and we can
// recover the family + category later (e.g. when a SHARED session references one you don't have).
export const gfId = (family: string) => `gf-${family.toLowerCase().replace(/\s+/g, "-")}`;
export const gfById = (id: string): GFont | undefined => GOOGLE_FONTS.find((g) => gfId(g.family) === id);
export const gfFallback = (c: GFCategory) => (c === "serif" ? "serif" : c === "monospace" ? "monospace" : "sans-serif");
// load a family on demand via the CSS2 API (one <link>; the browser only fetches faces it renders)
export function loadGoogleCss(family: string) {
  if (typeof document === "undefined") return;
  const lid = `gfcss-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(lid)) return;
  const link = document.createElement("link");
  link.id = lid; link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@400;500;700&display=swap`;
  document.head.appendChild(link);
}
