// Plain-language glosses for the tool's vocabulary (AIRTIGHT-PASS F5). Vocabulary was the #1 source of
// confusion in testing — these power the InfoDot explainers + tooltips so a non-typographer isn't
// stranded on "cap-match" / "x-height" / "tabular". One definition, used everywhere a term appears.
// plain-language role descriptions (100-run #4 friction: the 8-role taxonomy is unglossed, so
// non-experts guess wrong or only touch one role). Keyed by role KIND.
export const ROLE_DESC: Record<string, string> = {
  display: "Your biggest text — hero headlines.",
  heading: "Section headings.",
  subheading: "Smaller headings, under a heading.",
  body: "Running paragraph text — the main read.",
  caption: "Small text — under images, metadata.",
  label: "UI labels, buttons, tags.",
  quote: "Pull quotes.",
  mono: "Code, or tabular numbers that need to line up.",
};

export const GLOSSARY: Record<string, string> = {
  "cap-match": "Cap-match resizes each candidate so its capital letters share ONE height with your base font — so you're judging the letterforms, not size differences. It's the whole point of the tool.",
  "x-height": "The height of a lowercase “x”. A bigger x-height reads larger and more open at the same point size — which is why body text is matched on x-height, not caps.",
  "cap-height": "The height of the capital letters, from the baseline up. Display type is matched on this.",
  "opentype": "Extra features built into a font — small caps, alternate figures, ligatures, stylistic sets — that you switch on. If a font doesn't include one, turning it on does nothing.",
  "ligatures": "Two or three letters drawn as one shape (like fi, ffl) so they don't collide.",
  "tabular figures": "Numbers that all take the same width, so columns of figures line up. The opposite (proportional) looks better in running text.",
  "old-style figures": "Numbers with ascenders and descenders (like lowercase letters) that sit better inside text than all-caps-height “lining” figures.",
  "clamp": "A CSS size that scales smoothly between a mobile and a desktop value — what “fluid” type exports as.",
  "tracking": "The overall letter-spacing across a line.",
  "blind a/b": "Hides the font names (Font A / Font B, shuffled) so you judge the type without brand bias. Click a label to reveal it.",
};
