// Proofing samples + OpenType feature definitions (BUILD-LIST v2 #11 · #12). The SAMPLE picker
// swaps the test text; the FEATURES toggles drive font-feature-settings on the rendered type.

export type Sample = { id: string; label: string; text: string; kind: "line" | "para" };
export const SAMPLES: Sample[] = [
  { id: "word", label: "Word", text: "Hamburgefonstiv", kind: "line" },
  { id: "pangram", label: "Pangram", text: "Pack my box with five dozen liquor jugs.", kind: "line" },
  { id: "para", label: "Paragraph", text: "The quick brown fox jumps over the lazy dog. Typography is the craft of endowing human language with a durable visual form, and thus with an independent existence. Its heartwood is calligraphy — the dance, on a tiny stage, of the living, speaking hand.", kind: "para" },
  // proofing strings — the spacing/rhythm test (round-round, round-flat, flat-flat)
  { id: "proof", label: "Proof strings", text: "nononono ooooo HHOHOHH adhesion", kind: "line" },
  { id: "figures", label: "Figures", text: "0123456789 · 1/2 3/4 · No. 0 vs O", kind: "line" },
  { id: "caps", label: "All caps", text: "HANDGLOVES OF THE QUICK BROWN FOX", kind: "line" },
  // special: not a text sample — switches each row to the OpenType feature proof (off → on)
  { id: "opentype", label: "OpenType", text: "", kind: "line" },
];

// OpenType features, each with a DEMO string — the characters that actually exercise it. The
// Letterforms OpenType proof renders the demo OFF → ON in the live face, so you SEE the feature
// (and, when off looks identical to on, see that the font doesn't do it). `demo` is chosen so the
// change is visible: digits for figure features, lowercase for small caps, etc.
export type OtFeature = { tag: string; label: string; demo: string };
export const OT_FEATURES: OtFeature[] = [
  { tag: "onum", label: "Old-style figures", demo: "0123456789" },
  { tag: "tnum", label: "Tabular figures", demo: "1111 8888" },
  { tag: "zero", label: "Slashed zero", demo: "0 1080 0.0" },
  { tag: "frac", label: "Fractions", demo: "1/2 3/4 5/8" },
  { tag: "smcp", label: "Small caps", demo: "Hamburger" },
  { tag: "liga", label: "Ligatures", demo: "ffi ffl fi fl" },
  { tag: "ss01", label: "Stylistic set 1", demo: "a g y l & Q" },
];
// explicit per-feature on/off so the proof shows a real contrast even for default-on features
// (e.g. ligatures): OFF forces the tag to 0, ON forces it to 1.
export const featureOn = (tag: string): string => `"${tag}" 1`;
export const featureOff = (tag: string): string => `"${tag}" 0`;
