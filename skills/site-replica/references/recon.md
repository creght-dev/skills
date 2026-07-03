# Phase 1 — Recon: measure the source site

Everything here happens in a real browser (Playwright MCP or equivalent).
Output of this phase: a written spec — page list, layout numbers, design
tokens, breakpoint behavior — plus reference screenshots for later diffing.

## Browser hygiene (read first, saves 20 minutes)

- **Stale browser locks**: if the Playwright MCP errors with "Browser is
  already in use", kill the cached instance
  (`pkill -f "ms-playwright-mcp/mcp-chrome"`), wait 2s, retry.
- **Disable smooth scroll before any scripted scrolling**:
  `document.documentElement.style.scrollBehavior = 'auto'`. Sites with
  `scroll-behavior: smooth` make `window.scrollTo` asynchronous and your
  screenshots land mid-flight (fixed headers can even vanish from captures).
- **Lazy content**: full-page screenshots miss lazy-loaded images and
  below-fold sections. After the full-page capture, also step through the
  page viewport by viewport (~850px steps, 600–800ms settle per step) and
  screenshot each stop. Blank bands in a full-page capture usually mean lazy
  content, not empty space — verify with a viewport shot at that offset.
- Screenshot **viewport width ≠ window width**: a visible scrollbar steals
  ~15px. Measure layout via `getBoundingClientRect` in the page, never by
  reading pixel positions off screenshots alone.

## 1. Page discovery

- Collect `document.querySelectorAll('a[href]')` on every page you visit;
  keep same-origin paths. This finds detail routes (e.g. `/works/<slug>`)
  that never appear in the nav.
- Crawl each discovered page: full capture + note its distinct sections.
- Collection pages (blog/work lists) imply detail templates — open at least
  two different entries to see what varies.

## 2. Design tokens

Run once on the homepage:

```js
() => {
  const fonts = new Set(), colors = new Set();
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (el.innerText?.trim())
      fonts.add(`${cs.fontFamily.split(',')[0]}|${cs.fontWeight}|${cs.fontSize}`);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(cs.backgroundColor);
  });
  return {
    fonts: [...fonts].slice(0, 40),
    bg: [...colors].slice(0, 30),
    faces: [...document.fonts].map(f => `${f.family} ${f.weight}`)
      .filter((v, i, a) => a.indexOf(v) === i),
  };
}
```

Record: display font + weights, body font + weights, accent color(s),
background tints, dark-section colors, divider opacities. Key type styles to
capture precisely (font-size, letter-spacing, line-height, weight): the hero
title and each section heading.

## 3. Layout measurement — do this at multiple widths

The single most common replication error is content width. Measure the same
elements at ~1440 **and** ~1920 (and note the difference):

```js
const r = el => { const b = el.getBoundingClientRect();
  return { left: b.left, right: b.right, width: b.width }; };
// measure: header inner content, hero content, a section's content box
```

- If content edges hug the viewport minus a fixed padding at 1440 but sit
  centered with large margins at 1920 → there is a **max content width**
  (compute it: right − left at 1920). Backgrounds usually stay full-bleed
  while content is capped. Record: max width, page side padding.
- Also record: header height, grid column counts and gaps, image aspect
  ratios (from rendered boxes), section vertical paddings.
- Framer sources annotate structure via `data-framer-name` attributes — dump
  the distinct names once; they reveal the section inventory and element
  roles ("Hero Image Container", "Ticker", "Dark Card"…). Webflow uses
  readable class names similarly.

## 4. Mobile audit (~390×844) — separate pass, not an afterthought

Reload the site at mobile size and walk the whole page again. Specifically
record:

- **Header**: almost always logo + hamburger. Open the menu and capture it —
  note whether it's a dropdown panel or a full-screen overlay, item order,
  and what the toggle icon morphs into.
- Hero: does the title wrap? What size (measure computed font-size)? Element
  order often changes (title → image → meta).
- Section headings: measure mobile font-size and whether wrapping is allowed
  (`white-space` computed value).
- Each list/grid: how many columns survive? Some items hide entirely on
  mobile (e.g. 3-up image rows becoming 2-up); some desktop hover-only
  elements become always-visible inline elements.
- Footer: stacking order commonly differs from desktop DOM order (socials
  above copyright, nav links one-per-line).

## 5. Deliverable of this phase

A spec note containing: page list with routes; token table; per-section
layout numbers at 1440/1920/390; the reference screenshot set. Only then move
to the motion audit.
