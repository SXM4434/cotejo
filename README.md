# Cotejo

A focused tool for **choosing and pairing type**. It cap-matches every candidate to the face you're
already using — so you judge *letterforms, not size* — recommends partners across your own fonts **and
the full Google Fonts library**, and exports the result as real CSS / Tailwind / design tokens.

> *cotejo* (Spanish) — a careful side-by-side comparison.

## Why

I reopened my portfolio to rework the type. I loved the **space** it took up — the rhythm, the air —
but I wasn't feeling the typeface I'd actually picked, and nothing made it easy to *audition* a
replacement against what I already had. Josh Puckett's work on **Pica** and **Locale** was the north
star for the craft: quiet, instrument-grade, gets out of the way so the type is the thing. This is the
little lab I wished existed.

## What it does

- **Cap-match** — candidates are resized to share one cap height with your base, so you compare shapes, not scale.
- **Pairing recommendations** — an explainable rule engine (shared x-height + diverging classification + superfamily) scores loaded faces *and* a curated Google-Fonts set; Google picks load on demand.
- **Tune** — a tracing-paper overlay to calibrate size / leading / tracking / weight per pairing; every applied calibration is logged as a labeled example that trains a small correction model on top of the rule.
- **A font classifier** — a softmax model over rendered-glyph features (trained on the Google directory's category labels) predicts a font's character.
- **Real export** — CSS custom properties, Tailwind config, or DTCG tokens. Plus a license layer so you never ship a font you haven't cleared.

The ML is honest: the pairing engine is a *rule engine* (not ML), the correction model trains only once
enough real calibration data is collected, and no model is ever claimed without the data behind it. See
`scripts/` and `datasets/`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5190
npm run build    # production build
```

## Fonts & licenses

All bundled faces are open-source (OFL / Apache, via `@fontsource`): Mona Sans, Hubot Sans, Unbounded,
Newsreader, Spline Sans Mono. Google Fonts load on demand from Google's CDN. Uploaded fonts stay on your
device — Cotejo records *your own* license determination and never asserts one for you.

## Stack

Vite · React · TypeScript. No backend — everything runs in the browser.

---

Built by [Sebastián Moreano](https://github.com/SXM4434). Craft heavily indebted to Josh Puckett's Pica & Locale.
